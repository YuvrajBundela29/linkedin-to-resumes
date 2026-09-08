CREATE TABLE IF NOT EXISTS public.admin_portal_unlocks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  unlocked_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_portal_unlocks TO service_role;
ALTER TABLE public.admin_portal_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read own unlock" ON public.admin_portal_unlocks FOR SELECT TO authenticated USING (auth.uid() = user_id);