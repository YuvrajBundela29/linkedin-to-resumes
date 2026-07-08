
-- 1. Roles infrastructure
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. Unlimited entitlements for everyone
ALTER TABLE public.entitlements
  ALTER COLUMN max_resumes SET DEFAULT 999999,
  ALTER COLUMN allowed_templates SET DEFAULT ARRAY['classic','modern','compact','technical','executive','elegant','creative']::text[],
  ALTER COLUMN version_history_enabled SET DEFAULT true,
  ALTER COLUMN tailor_enabled SET DEFAULT true;

UPDATE public.entitlements
SET max_resumes = 999999,
    allowed_templates = ARRAY['classic','modern','compact','technical','executive','elegant','creative']::text[],
    version_history_enabled = true,
    tailor_enabled = true;

-- 3. Auto-grant admin to designated super-admin email on signup / confirmation
CREATE OR REPLACE FUNCTION public.grant_superadmin_if_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND lower(NEW.email) = 'bundelayuvraj29@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_grant_superadmin ON auth.users;
CREATE TRIGGER on_auth_user_grant_superadmin
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_superadmin_if_match();

-- Backfill for existing user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = 'bundelayuvraj29@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Admin visibility policies on existing tables
CREATE POLICY "admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins read all resumes" ON public.resumes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins read all usage" ON public.usage_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins read all versions" ON public.resume_versions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins read all entitlements" ON public.entitlements FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
