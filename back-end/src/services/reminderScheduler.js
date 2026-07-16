import { dispatchDueReminders } from './notificationService.js';

export function startReminderScheduler() {
  const run = async () => {
    try {
      await dispatchDueReminders();
    } catch (error) {
      console.error('[notifications] Falha ao processar lembretes:', error.message);
    }
  };

  const timer = setInterval(run, 60 * 1000);
  run();
  return timer;
}
