import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { adminMatchesRouter } from './routes/adminMatches.js';
import { adminTryoutsRouter } from './routes/adminTryouts.js';

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
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-api-key'],
  maxAge: 600,
  optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: '64kb', strict: true }));

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
