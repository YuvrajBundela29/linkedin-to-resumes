REVOKE ALL ON FUNCTION public.get_credits(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_credits(uuid) TO service_role;