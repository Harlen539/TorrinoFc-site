ALTER TABLE public.notification_logs
DROP CONSTRAINT IF EXISTS notification_logs_status_check;

ALTER TABLE public.notification_logs
ADD CONSTRAINT notification_logs_status_check
CHECK (status IN ('pending', 'sent', 'failed', 'skipped', 'manual_required'));
