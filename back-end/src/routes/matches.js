import { Router } from 'express';
import { parseDateInput, parseTimeInput } from '../lib/dateInput.js';
import { isValidUrl, sendValidationErrors } from '../lib/httpValidation.js';
import { prisma } from '../lib/prisma.js';
import { sanitizeNullableText, sanitizeStatus, sanitizeText } from '../lib/sanitizeInput.js';
import { serializeMatch } from '../lib/serializers.js';
import { requirePermission } from '../middleware/requireAdminApiKey.js';
import { notifyMatchCancelled, notifyMatchCreated, notifyMatchUpdated } from '../services/notificationService.js';
import { recordActivity } from '../services/activityService.js';

export const matchesRouter = Router();

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

function validateMatchPayload(body) {
  const errors = [];

  if (!sanitizeText(body.away_team || body.away, { maxLength: 80 })) errors.push('Nome do adversario e obrigatorio.');
  if (!parseDateInput(body.match_date || body.dateKey || body.date)) errors.push('Data da partida precisa estar no formato YYYY-MM-DD.');
  if (body.match_time || body.time) {
    if (!parseTimeInput(body.match_time || body.time)) errors.push('Horario da partida precisa estar no formato HH:mm.');
  }
  if (!isValidUrl(body.opponent_logo_url || body.opponentLogo)) errors.push('URL da logo do adversario invalida.');
  if (!isValidUrl(body.whatsapp_url || body.whatsappUrl)) errors.push('Link do WhatsApp invalido.');

  return errors;
}

function makeMatchData(body) {
  const homeScore = body.home_score === '' || body.home_score === undefined ? null : Number(body.home_score);
  const awayScore = body.away_score === '' || body.away_score === undefined ? null : Number(body.away_score);

  return {
    homeTeam: sanitizeText(body.home_team || body.home || 'TorinnoFC', { maxLength: 80, fallback: 'TorinnoFC' }),
    awayTeam: sanitizeText(body.away_team || body.away, { maxLength: 80 }),
    opponentLogoUrl: sanitizeNullableText(body.opponent_logo_url || body.opponentLogo, { maxLength: 60000 }),
    whatsappUrl: sanitizeNullableText(body.whatsapp_url || body.whatsappUrl, { maxLength: 1200 }),
    matchDate: parseDateInput(body.match_date || body.dateKey || body.date),
    matchTime: parseTimeInput(body.match_time || body.time),
    location: sanitizeNullableText(body.location || body.place, { maxLength: 140 }),
    championshipId: sanitizeNullableText(body.championship_id || body.championshipId, { maxLength: 80 }),
    championshipName: sanitizeNullableText(body.championship_name || body.championship, { maxLength: 120 }),
    status: sanitizeStatus(body.status),
    observations: sanitizeNullableText(body.observations, { maxLength: 700 }),
    homeScore: Number.isFinite(homeScore) ? homeScore : null,
    awayScore: Number.isFinite(awayScore) ? awayScore : null,
  };
}

matchesRouter.get('/api/matches', asyncRoute(async (_request, response) => {
  const matches = await prisma.match.findMany({
    include: { championship: true },
    orderBy: [{ matchDate: 'asc' }, { matchTime: 'asc' }],
  });

  response.json({ matches: matches.map(serializeMatch) });
}));

matchesRouter.post('/api/matches', requirePermission('createMatch'), asyncRoute(async (request, response) => {
  const errors = validateMatchPayload(request.body);
  if (errors.length) {
    sendValidationErrors(response, errors);
    return;
  }

  const match = await prisma.match.create({
    data: {
      ...makeMatchData(request.body),
      createdBy: request.userProfile?.id || null,
    },
    include: { championship: true },
  });
  await notifyMatchCreated(match);
  await recordActivity({
    type: 'match_created',
    actorId: request.userProfile?.id || null,
    actorName: request.userProfile?.nickname || request.userProfile?.name || '',
    message: `Partida contra ${match.awayTeam} criada.`,
    relatedEntityType: 'match',
    relatedEntityId: match.id,
    actionUrl: '/matchday',
  });

  response.status(201).json({ match: serializeMatch(match) });
}));

matchesRouter.put('/api/matches/:id', requirePermission('editMatch'), asyncRoute(async (request, response) => {
  const errors = validateMatchPayload(request.body);
  if (errors.length) {
    sendValidationErrors(response, errors);
    return;
  }

  const previous = await prisma.match.findUnique({ where: { id: request.params.id } });
  const match = await prisma.match.update({
    where: { id: request.params.id },
    data: { ...makeMatchData(request.body), updatedAt: new Date() },
    include: { championship: true },
  });
  await notifyMatchUpdated(match, previous || {});
  await recordActivity({
    type: match.status === 'Encerrada' ? 'result_registered' : 'match_updated',
    actorId: request.userProfile?.id || null,
    actorName: request.userProfile?.nickname || request.userProfile?.name || '',
    message: match.status === 'Encerrada'
      ? `Resultado registrado: ${match.homeTeam} ${match.homeScore ?? '-'} x ${match.awayScore ?? '-'} ${match.awayTeam}.`
      : `Partida contra ${match.awayTeam} atualizada.`,
    relatedEntityType: 'match',
    relatedEntityId: match.id,
    actionUrl: '/matchday',
  });

  response.json({ match: serializeMatch(match) });
}));

matchesRouter.delete('/api/matches/:id', requirePermission('deleteMatch'), asyncRoute(async (request, response) => {
  const match = await prisma.match.findUnique({ where: { id: request.params.id } });
  await prisma.match.delete({ where: { id: request.params.id } });
  if (match) {
    await notifyMatchCancelled(match);
    await recordActivity({
      type: 'match_removed',
      actorId: request.userProfile?.id || null,
      actorName: request.userProfile?.nickname || request.userProfile?.name || '',
      message: `Partida contra ${match.awayTeam} removida.`,
      relatedEntityType: 'match',
      relatedEntityId: request.params.id,
      actionUrl: '/matches',
    });
  }
  response.status(204).send();
}));
