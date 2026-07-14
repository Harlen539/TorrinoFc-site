ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS observations TEXT;

CREATE TABLE IF NOT EXISTS public.tryouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  tryout_date DATE NOT NULL,
  tryout_time TIME,
  location TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  requirements TEXT,
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'Agendada' CHECK (status IN ('Agendada', 'Confirmada', 'Encerrada', 'Cancelada')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  destination TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped', 'manual_required')),
  message_body TEXT NOT NULL,
  api_response JSONB,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_type, entity_id, channel, destination)
);

CREATE INDEX IF NOT EXISTS notification_logs_lookup_idx
ON public.notification_logs (event_type, entity_id, channel, destination);

CREATE INDEX IF NOT EXISTS notification_logs_status_idx
ON public.notification_logs (status, created_at);

ALTER TABLE public.tryouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.matches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO service_role;

GRANT SELECT ON public.tryouts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tryouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tryouts TO service_role;

GRANT SELECT ON public.notification_logs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.notification_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_logs TO service_role;

CREATE POLICY "Authenticated users can view tryouts"
ON public.tryouts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage tryouts"
ON public.tryouts FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins view notification logs"
ON public.notification_logs FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins manage notification logs"
ON public.notification_logs FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
