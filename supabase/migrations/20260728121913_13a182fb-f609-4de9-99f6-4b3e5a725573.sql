CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id uuid PRIMARY KEY,
  credits integer NOT NULL DEFAULT 50,
  cycle_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_credits TO authenticated;
GRANT ALL ON public.user_credits TO service_role;

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credits read self" ON public.user_credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all credits" ON public.user_credits
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.get_credits(_user_id uuid)
RETURNS TABLE (credits integer, daily_allowance integer, resets_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today date := (now() AT TIME ZONE 'utc')::date;
  row_credits integer;
  row_cycle date;
BEGIN
  SELECT c.credits, c.cycle_date INTO row_credits, row_cycle
  FROM public.user_credits c WHERE c.user_id = _user_id;

  IF NOT FOUND OR row_cycle < today THEN
    row_credits := 50;
  END IF;

  RETURN QUERY SELECT row_credits, 50, ((today + 1)::timestamp AT TIME ZONE 'utc');
END; $$;

CREATE OR REPLACE FUNCTION public.spend_credits(_user_id uuid, _cost integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today date := (now() AT TIME ZONE 'utc')::date;
  remaining integer;
BEGIN
  INSERT INTO public.user_credits (user_id, credits, cycle_date)
  VALUES (_user_id, 50, today)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_credits
    SET credits = CASE WHEN cycle_date < today THEN 50 ELSE credits END,
        cycle_date = today
    WHERE user_id = _user_id;

  UPDATE public.user_credits
    SET credits = credits - _cost, updated_at = now()
    WHERE user_id = _user_id AND credits >= _cost
    RETURNING credits INTO remaining;

  IF remaining IS NULL THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  RETURN remaining;
END; $$;

REVOKE ALL ON FUNCTION public.get_credits(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.spend_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_credits(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, integer) TO service_role;