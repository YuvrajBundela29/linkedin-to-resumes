
REVOKE ALL ON FUNCTION public.spend_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.add_purchased_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_credits(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_credits(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_purchased_credits(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_credits(uuid) TO service_role;
