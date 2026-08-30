-- 1) Daily allowance 50 -> 20 + persistent purchased credits
ALTER TABLE public.user_credits
  ALTER COLUMN credits SET DEFAULT 20,
  ADD COLUMN IF NOT EXISTS purchased_credits integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.get_credits(_user_id uuid)
RETURNS TABLE (credits integer, daily_allowance integer, resets_at timestamptz, purchased integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today date := (now() AT TIME ZONE 'utc')::date;
  row_credits integer;
  row_cycle date;
  row_purchased integer;
BEGIN
  SELECT c.credits, c.cycle_date, c.purchased_credits
    INTO row_credits, row_cycle, row_purchased
  FROM public.user_credits c WHERE c.user_id = _user_id;

  IF NOT FOUND THEN
    row_credits := 20; row_purchased := 0;
  ELSIF row_cycle < today THEN
    row_credits := 20;
  END IF;

  RETURN QUERY SELECT row_credits, 20, ((today + 1)::timestamp AT TIME ZONE 'utc'), COALESCE(row_purchased, 0);
END; $$;

CREATE OR REPLACE FUNCTION public.spend_credits(_user_id uuid, _cost integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today date := (now() AT TIME ZONE 'utc')::date;
  daily integer;
  purchased integer;
  from_daily integer;
  from_purchased integer;
BEGIN
  INSERT INTO public.user_credits (user_id, credits, cycle_date)
  VALUES (_user_id, 20, today)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_credits
    SET credits = CASE WHEN cycle_date < today THEN 20 ELSE credits END,
        cycle_date = today
    WHERE user_id = _user_id
    RETURNING credits, purchased_credits INTO daily, purchased;

  IF daily + purchased < _cost THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  from_daily := LEAST(daily, _cost);
  from_purchased := _cost - from_daily;

  UPDATE public.user_credits
    SET credits = credits - from_daily,
        purchased_credits = purchased_credits - from_purchased,
        updated_at = now()
    WHERE user_id = _user_id
    RETURNING credits + purchased_credits INTO daily;

  RETURN daily;
END; $$;

CREATE OR REPLACE FUNCTION public.add_purchased_credits(_user_id uuid, _credits integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today date := (now() AT TIME ZONE 'utc')::date;
  total integer;
BEGIN
  INSERT INTO public.user_credits (user_id, credits, cycle_date, purchased_credits)
  VALUES (_user_id, 20, today, _credits)
  ON CONFLICT (user_id) DO UPDATE
    SET purchased_credits = public.user_credits.purchased_credits + _credits,
        updated_at = now()
  RETURNING credits + purchased_credits INTO total;
  RETURN total;
END; $$;

REVOKE ALL ON FUNCTION public.spend_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.add_purchased_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_purchased_credits(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_credits(uuid) TO authenticated, service_role;

-- 2) Promo codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  code text PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  percent_off integer NOT NULL CHECK (percent_off BETWEEN 1 AND 90),
  active boolean NOT NULL DEFAULT true,
  max_redemptions integer,
  times_redeemed integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promo read active" ON public.promo_codes;
CREATE POLICY "promo read active" ON public.promo_codes
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "promo admin write" ON public.promo_codes;
CREATE POLICY "promo admin write" ON public.promo_codes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.promo_codes (code, label, percent_off, max_redemptions, expires_at) VALUES
  ('FORGE20', 'Welcome offer — 20% off any pack', 20, NULL, NULL),
  ('LAUNCH40', 'Launch week — 40% off', 40, 500, now() + interval '30 days'),
  ('FIRSTJOB50', 'First job seekers — 50% off', 50, 200, now() + interval '60 days'),
  ('STUDENT30', 'Student discount — 30% off', 30, NULL, NULL),
  ('COMEBACK25', 'Returning user — 25% off', 25, NULL, NULL),
  ('HIREME60', 'Flash sale — 60% off', 60, 100, now() + interval '7 days')
ON CONFLICT (code) DO NOTHING;

-- 3) Credit orders
CREATE TABLE IF NOT EXISTS public.credit_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id text NOT NULL,
  credits integer NOT NULL,
  amount_paise integer NOT NULL,
  discount_paise integer NOT NULL DEFAULT 0,
  promo_code text,
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text,
  status text NOT NULL DEFAULT 'created',
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS credit_orders_user_idx ON public.credit_orders(user_id, created_at DESC);

GRANT SELECT ON public.credit_orders TO authenticated;
GRANT ALL ON public.credit_orders TO service_role;
ALTER TABLE public.credit_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders read self" ON public.credit_orders;
CREATE POLICY "orders read self" ON public.credit_orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "orders admin read" ON public.credit_orders;
CREATE POLICY "orders admin read" ON public.credit_orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));