import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { adminEmailRouter } from './routes/adminEmail.js';
import { adminMatchesRouter } from './routes/adminMatches.js';
import { adminTryoutsRouter } from './routes/adminTryouts.js';
import { championshipsRouter } from './routes/championships.js';
import { matchesRouter } from './routes/matches.js';
import { notificationsRouter } from './routes/notifications.js';
import { performanceRouter } from './routes/performance.js';
import { playersRouter } from './routes/players.js';
import { settingsRouter } from './routes/settings.js';
import { tryoutsRouter } from './routes/tryouts.js';
import { usersRouter } from './routes/users.js';
import { startReminderScheduler } from './services/reminderScheduler.js';

const app = express();

app.disable('x-powered-by');

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origem nao autorizada pelo CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'x-admin-api-key', 'x-user-email'],
  maxAge: 600,
  optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: '64kb', strict: true }));

app.get('/health', (_request, response) => {
  response.json({ ok: true, service: 'torinnofc-back-end' });
});

app.use(adminMatchesRouter);
app.use(adminTryoutsRouter);
app.use(adminEmailRouter);
app.use(matchesRouter);
app.use(championshipsRouter);
app.use(usersRouter);
app.use(notificationsRouter);
app.use(performanceRouter);
app.use(tryoutsRouter);
app.use(playersRouter);
app.use(settingsRouter);

app.use((error, _request, response, _next) => {
  console.error('[server] Erro inesperado:', error);
  response.status(error.statusCode || 500).json({ error: error.message || 'Erro interno do servidor.' });
});

app.listen(env.port, () => {
  console.info(`TorinnoFC back-end rodando na porta ${env.port}`);
});

if (env.notifications.reminderSchedulerEnabled) {
  startReminderScheduler();
} else {
  console.info('Agendador de lembretes desativado. Configure ENABLE_REMINDER_SCHEDULER=true para ativar.');
}
