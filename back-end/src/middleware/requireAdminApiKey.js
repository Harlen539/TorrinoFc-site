import { env } from '../config/env.js';

export function requireAdminApiKey(request, response, next) {
  if (!env.adminApiKey) {
    response.status(500).json({ error: 'ADMIN_API_KEY nao configurada no servidor.' });
    return;
  }

  const apiKey = request.get('x-admin-api-key');

  if (apiKey !== env.adminApiKey) {
    response.status(401).json({ error: 'Chave administrativa invalida.' });
    return;
  }

  next();
}
