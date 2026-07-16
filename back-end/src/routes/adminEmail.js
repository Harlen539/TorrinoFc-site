import { Router } from 'express';
import { isValidEmail } from '../lib/httpValidation.js';
import { requireAdminApiKey } from '../middleware/requireAdminApiKey.js';
import { hasEmailConfig, sendTestEmail } from '../services/emailService.js';

export const adminEmailRouter = Router();

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

adminEmailRouter.get('/api/admin/email/status', requireAdminApiKey, (_request, response) => {
  response.json({
    configured: hasEmailConfig(),
  });
});

adminEmailRouter.post('/api/admin/email/test', requireAdminApiKey, asyncRoute(async (request, response) => {
  const to = String(request.body.to || '').trim().toLowerCase();

  if (!isValidEmail(to)) {
    response.status(400).json({ error: 'Informe um e-mail valido em "to".' });
    return;
  }

  if (!hasEmailConfig()) {
    response.status(500).json({ error: 'SMTP/Gmail nao configurado no backend.' });
    return;
  }

  const result = await sendTestEmail(to);

  response.json({
    ok: true,
    messageId: result.messageId,
  });
}));
