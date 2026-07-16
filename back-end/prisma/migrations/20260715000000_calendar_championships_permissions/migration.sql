ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS opponent_logo_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_url TEXT,
ADD COLUMN IF NOT EXISTS championship_name TEXT;

CREATE INDEX IF NOT EXISTS matches_match_date_idx
ON public.matches (match_date);

CREATE INDEX IF NOT EXISTS matches_championship_id_idx
ON public.matches (championship_id);

ALTER TABLE public.championships
ADD COLUMN IF NOT EXISTS team_name TEXT NOT NULL DEFAULT 'Torinno FC',
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS season TEXT,
ADD COLUMN IF NOT EXISTS format TEXT,
ADD COLUMN IF NOT EXISTS official_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.championships
ALTER COLUMN type DROP NOT NULL;

ALTER TABLE public.championships
DROP CONSTRAINT IF EXISTS championships_status_check;

ALTER TABLE public.championships
ADD CONSTRAINT championships_status_check
CHECK (status IN ('futuro', 'em_andamento', 'encerrado', 'Preparacao', 'Em andamento', 'Encerrado'));

CREATE INDEX IF NOT EXISTS championships_team_status_idx
ON public.championships (team_name, status);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS staff_role TEXT,
ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.profiles
ALTER COLUMN id SET DEFAULT gen_random_uuid();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx
ON public.profiles (lower(email))
WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_role_idx
ON public.profiles (role);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  target_id UUID,
  action TEXT NOT NULL,
  before_value JSONB,
  after_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_target_idx
ON public.admin_audit_logs (target_id, created_at);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_audit_logs TO service_role;

DROP POLICY IF EXISTS "Admins view admin audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins view admin audit logs"
ON public.admin_audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins insert admin audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins insert admin audit logs"
ON public.admin_audit_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  team_name TEXT NOT NULL DEFAULT 'Torinno FC',
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'scheduled', 'cancelled', 'skipped')),
  match_id UUID,
  reminder_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedupe_idx
ON public.notifications (user_email, type, related_entity_type, related_entity_id, COALESCE(reminder_type, ''))
WHERE user_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_user_read_idx
ON public.notifications (user_email, is_read, created_at);

CREATE INDEX IF NOT EXISTS notifications_scheduled_idx
ON public.notifications (status, scheduled_for);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT NOT NULL UNIQUE,
  match_created BOOLEAN NOT NULL DEFAULT true,
  match_updated BOOLEAN NOT NULL DEFAULT true,
  match_reminder_24h BOOLEAN NOT NULL DEFAULT true,
  match_reminder_1h BOOLEAN NOT NULL DEFAULT true,
  championships BOOLEAN NOT NULL DEFAULT true,
  new_members BOOLEAN NOT NULL DEFAULT true,
  statistics BOOLEAN NOT NULL DEFAULT true,
  administration BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO service_role;

DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_email = (select email from auth.users where id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_email = (select email from auth.users where id = auth.uid()) OR public.is_admin())
WITH CHECK (user_email = (select email from auth.users where id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Users manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users manage own notification preferences"
ON public.notification_preferences FOR ALL
TO authenticated
USING (user_email = (select email from auth.users where id = auth.uid()) OR public.is_admin())
WITH CHECK (user_email = (select email from auth.users where id = auth.uid()) OR public.is_admin());

CREATE TABLE IF NOT EXISTS public.player_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  team_name TEXT NOT NULL DEFAULT 'Torinno FC',
  full_name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  position TEXT NOT NULL,
  shirt_number INT NOT NULL DEFAULT 0 CHECK (shirt_number >= 0 AND shirt_number <= 999),
  dominant_foot TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo',
  instagram TEXT,
  avatar_url TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.player_profiles
ADD COLUMN IF NOT EXISTS team_name TEXT NOT NULL DEFAULT 'Torinno FC',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE public.player_profiles
ALTER COLUMN user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS player_profiles_team_status_idx
ON public.player_profiles (team_name, status);

CREATE TABLE IF NOT EXISTS public.player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL UNIQUE REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  goals INT NOT NULL DEFAULT 0,
  assists INT NOT NULL DEFAULT 0,
  ball_recoveries INT NOT NULL DEFAULT 0,
  shots INT NOT NULL DEFAULT 0,
  accurate_passes INT NOT NULL DEFAULT 0,
  matches INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  draws INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  yellow_cards INT NOT NULL DEFAULT 0,
  red_cards INT NOT NULL DEFAULT 0,
  average_rating NUMERIC(3,1) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.player_stats
ADD COLUMN IF NOT EXISTS draws INT NOT NULL DEFAULT 0;

ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_stats TO service_role;

DROP POLICY IF EXISTS "Authenticated users can view real players" ON public.player_profiles;
CREATE POLICY "Authenticated users can view real players"
ON public.player_profiles FOR SELECT
TO authenticated
USING (team_name = 'Torinno FC' AND status <> 'Removido');

DROP POLICY IF EXISTS "Admins manage real players" ON public.player_profiles;
CREATE POLICY "Admins manage real players"
ON public.player_profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can view real player stats" ON public.player_stats;
CREATE POLICY "Authenticated users can view real player stats"
ON public.player_stats FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins manage real player stats" ON public.player_stats;
CREATE POLICY "Admins manage real player stats"
ON public.player_stats FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
