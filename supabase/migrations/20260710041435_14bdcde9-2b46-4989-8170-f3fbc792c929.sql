-- Lock down SECURITY DEFINER functions so they aren't callable via the API.
-- Trigger-only functions: revoke from everyone (triggers run regardless of EXECUTE grants).
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trim_resume_versions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_superadmin_if_match() FROM PUBLIC, anon, authenticated;

-- has_role is used inside RLS policies for signed-in users; keep authenticated EXECUTE
-- (required so policies can evaluate it) but revoke from anon and PUBLIC.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;