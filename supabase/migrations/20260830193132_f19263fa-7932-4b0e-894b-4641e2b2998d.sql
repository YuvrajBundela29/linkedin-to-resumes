
CREATE OR REPLACE FUNCTION public.get_credits(_user_id uuid)
 RETURNS TABLE(credits integer, daily_allowance integer, resets_at timestamp with time zone, purchased integer)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  period_start date := date_trunc('month', (now() AT TIME ZONE 'utc'))::date;
  row_credits integer; row_cycle date; row_purchased integer;
BEGIN
  SELECT c.credits, c.cycle_date, c.purchased_credits
    INTO row_credits, row_cycle, row_purchased
  FROM public.user_credits c WHERE c.user_id = _user_id;

  IF NOT FOUND THEN
    row_credits := 20; row_purchased := 0;
  ELSIF row_cycle < period_start THEN
    row_credits := 20;
  END IF;

  RETURN QUERY SELECT row_credits, 20, (((period_start + interval '1 month')::timestamp) AT TIME ZONE 'utc'), COALESCE(row_purchased, 0);
END; $function$;

CREATE OR REPLACE FUNCTION public.spend_credits(_user_id uuid, _cost integer)
 RETURNS integer
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  period_start date := date_trunc('month', (now() AT TIME ZONE 'utc'))::date;
  daily integer; purchased integer; from_daily integer; from_purchased integer;
BEGIN
  INSERT INTO public.user_credits (user_id, credits, cycle_date)
  VALUES (_user_id, 20, period_start)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_credits
    SET credits = CASE WHEN cycle_date < period_start THEN 20 ELSE credits END,
        cycle_date = period_start
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
END; $function$;

CREATE OR REPLACE FUNCTION public.add_purchased_credits(_user_id uuid, _credits integer)
 RETURNS integer
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  period_start date := date_trunc('month', (now() AT TIME ZONE 'utc'))::date;
  total integer;
BEGIN
  INSERT INTO public.user_credits (user_id, credits, cycle_date, purchased_credits)
  VALUES (_user_id, 20, period_start, _credits)
  ON CONFLICT (user_id) DO UPDATE
    SET purchased_credits = public.user_credits.purchased_credits + _credits,
        updated_at = now()
  RETURNING credits + purchased_credits INTO total;
  RETURN total;
END; $function$;
