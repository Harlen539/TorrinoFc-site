import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { adminMatchesRouter } from './routes/adminMatches.js';
import { adminTryoutsRouter } from './routes/adminTryouts.js';

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_request, response) => {
  response.json({ ok: true, service: 'torinnofc-back-end' });
});

app.use(adminMatchesRouter);
app.use(adminTryoutsRouter);

app.use((error, _request, response, _next) => {
  console.error('[server] Erro inesperado:', error);
  response.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(env.port, () => {
  console.info(`TorinnoFC back-end rodando na porta ${env.port}`);
});
