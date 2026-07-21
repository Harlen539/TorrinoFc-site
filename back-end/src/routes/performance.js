import PDFDocument from 'pdfkit';
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { serializePlayer } from '../lib/serializers.js';
import { requireAdminUser, requireAuthenticatedUser, requirePermission } from '../middleware/requireAdminApiKey.js';
import { hasPermission } from '../services/settingsService.js';
import { evaluatePlayerAchievements } from '../services/achievementService.js';
import { recordActivity } from '../services/activityService.js';
import {
  findAccessiblePlayer,
  makePerformanceData,
  recalculatePlayerStats,
  serializePerformance,
} from '../services/performanceService.js';
import { notifyStatisticsUpdated } from '../services/notificationService.js';

export const performanceRouter = Router();

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

function csvEscape(value) {
  const text = String(value ?? '');
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function reportFilename(player, format) {
  const nickname = String(player.nickname || player.fullName || 'jogador')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'jogador';
  const date = new Date().toISOString().slice(0, 10);
  return `relatorio-desempenho-${nickname}-${date}.${format}`;
}

async function loadPerformance(playerId) {
  return prisma.playerMatchPerformance.findMany({
    where: { playerId },
    include: { match: { include: { championship: true } } },
    orderBy: [{ match: { matchDate: 'desc' } }, { createdAt: 'desc' }],
  });
}

async function getPlayerOr404(response, playerId) {
  const player = await prisma.playerProfile.findUnique({
    where: { id: playerId },
    include: { stats: true, user: true },
  });

  if (!player) {
    response.status(404).json({ error: 'Jogador nao encontrado.' });
    return null;
  }

  return player;
}

async function createOrUpdatePerformance(request, response, playerId, performanceId = '') {
  const player = await getPlayerOr404(response, playerId);
  if (!player) return;

  if (performanceId) {
    const existing = await prisma.playerMatchPerformance.findFirst({
      where: { id: performanceId, playerId },
    });

    if (!existing) {
      response.status(404).json({ error: 'Desempenho nao encontrado para este jogador.' });
      return;
    }
  }

  const matchId = request.body.matchId || request.body.match_id;
  const match = matchId ? await prisma.match.findUnique({ where: { id: matchId } }) : null;
  if (!match && !performanceId) {
    response.status(400).json({ error: 'Partida obrigatoria ou inexistente.' });
    return;
  }

  const { data, errors } = makePerformanceData(request.body, request.userProfile?.id || null);
  if (errors.length) {
    response.status(400).json({ errors });
    return;
  }

  const beforePerformance = performanceId
    ? await prisma.playerMatchPerformance.findUnique({ where: { id: performanceId } })
    : null;

  const result = await prisma.$transaction(async (tx) => {
    const performance = performanceId
      ? await tx.playerMatchPerformance.update({
        where: { id: performanceId },
        data,
        include: { match: { include: { championship: true } } },
      })
      : await tx.playerMatchPerformance.upsert({
        where: {
          playerId_matchId: {
            playerId,
            matchId: match.id,
          },
        },
        update: data,
        create: {
          ...data,
          playerId,
          matchId: match.id,
        },
        include: { match: { include: { championship: true } } },
      });

    await recalculatePlayerStats(tx, playerId);
    if (request.userProfile?.role === 'admin') {
      await tx.adminAuditLog.create({
        data: {
          actorId: request.userProfile.id,
          targetId: playerId,
          action: performanceId ? 'edit_player_performance' : 'create_player_performance',
          beforeValue: beforePerformance ? {
            goals: beforePerformance.goals,
            assists: beforePerformance.assists,
            ballRecoveries: beforePerformance.ballRecoveries,
            rating: Number(beforePerformance.rating || 0),
          } : null,
          afterValue: {
            performanceId: performance.id,
            goals: performance.goals,
            assists: performance.assists,
            ballRecoveries: performance.ballRecoveries,
            rating: Number(performance.rating || 0),
          },
        },
      });
    }
    const updatedPlayer = await tx.playerProfile.findUnique({
      where: { id: playerId },
      include: { stats: true, user: true },
    });
    return { performance, player: updatedPlayer };
  });

  if (player.user?.email) {
    await notifyStatisticsUpdated(player.user, `${result.player.stats?.goals || 0} gols, ${result.player.stats?.assists || 0} assistencias e ${result.player.stats?.ballRecoveries || 0} roubadas`);
  }
  const unlockedAchievements = await evaluatePlayerAchievements(playerId, { latestPerformance: result.performance });

  await recordActivity({
    type: performanceId ? 'performance_updated' : 'performance_created',
    actorId: request.userProfile?.id || null,
    actorName: request.userProfile?.nickname || request.userProfile?.name || player.nickname,
    message: `${player.nickname} registrou desempenho contra ${result.performance.match?.awayTeam || 'adversario'}.`,
    relatedEntityType: 'player',
    relatedEntityId: playerId,
    actionUrl: '/performance',
    metadata: {
      performanceId: result.performance.id,
      matchId: result.performance.matchId,
      achievements: unlockedAchievements.map((item) => item.achievement.key),
    },
  });

  response.status(performanceId ? 200 : 201).json({
    performance: serializePerformance(result.performance),
    player: serializePlayer(result.player),
    achievements: unlockedAchievements.map((item) => item.achievement),
  });
}

async function deletePerformance(request, response, playerId, performanceId) {
  const existing = await prisma.playerMatchPerformance.findFirst({
    where: { id: performanceId, playerId },
    include: { match: true, player: true },
  });

  if (!existing) {
    response.status(404).json({ error: 'Desempenho nao encontrado.' });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.playerMatchPerformance.delete({ where: { id: performanceId } });
    await recalculatePlayerStats(tx, playerId);
  });

  await recordActivity({
    type: 'performance_removed',
    actorId: request.userProfile?.id || null,
    actorName: request.userProfile?.nickname || request.userProfile?.name || existing.player?.nickname || '',
    message: `${existing.player?.nickname || 'Jogador'} removeu desempenho contra ${existing.match?.awayTeam || 'adversario'}.`,
    relatedEntityType: 'player',
    relatedEntityId: playerId,
    actionUrl: '/players',
    metadata: { performanceId, matchId: existing.matchId },
  });

  response.status(204).send();
}

async function ensureOwnPerformancePermission(request, response) {
  if (request.userProfile.role === 'admin') return true;
  const allowed = await hasPermission(prisma, request.userProfile.role, 'editOwnPerformance');
  if (!allowed) {
    response.status(403).json({ error: 'Edicao do proprio desempenho esta desativada.' });
    return false;
  }
  return true;
}

async function sendReport(response, player, performances, format) {
  const filename = reportFilename(player, format);
  const stats = player.stats || {};
  const generatedAt = new Date();

  if (format === 'csv') {
    const lines = [
      ['Campo', 'Valor'],
      ['Nome completo', player.fullName],
      ['Apelido', player.nickname],
      ['Posicao', player.position],
      ['Camisa', player.shirtNumber],
      ['Periodo analisado', performances.length ? `${performances.at(-1).match.matchDate.toISOString().slice(0, 10)} a ${performances[0].match.matchDate.toISOString().slice(0, 10)}` : 'Sem partidas'],
      ['Partidas', stats.matches || 0],
      ['Vitorias', stats.wins || 0],
      ['Empates', stats.draws || 0],
      ['Derrotas', stats.losses || 0],
      ['Gols', stats.goals || 0],
      ['Assistencias', stats.assists || 0],
      ['Participacoes em gols', (stats.goals || 0) + (stats.assists || 0)],
      ['Roubadas', stats.ballRecoveries || 0],
      ['Finalizacoes', stats.shots || 0],
      ['Passes certos', stats.accuratePasses || 0],
      ['Desarmes', stats.tackles || 0],
      ['Interceptacoes', stats.interceptions || 0],
      ['Cartoes amarelos', stats.yellowCards || 0],
      ['Cartoes vermelhos', stats.redCards || 0],
      ['Nota media', Number(stats.averageRating || 0)],
      ['Gerado em', generatedAt.toISOString()],
      [],
      ['Data', 'Adversario', 'Resultado', 'Gols', 'Assistencias', 'Roubadas', 'Nota', 'Observacoes'],
      ...performances.map((item) => [
        item.match.matchDate.toISOString().slice(0, 10),
        item.match.awayTeam,
        item.match.homeScore === null || item.match.awayScore === null ? '-' : `${item.match.homeScore} x ${item.match.awayScore}`,
        item.goals,
        item.assists,
        item.ballRecoveries,
        Number(item.rating || 0),
        item.notes || '',
      ]),
    ];

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    response.send(lines.map((line) => line.map(csvEscape).join(',')).join('\n'));
    return;
  }

  if (format !== 'pdf') {
    response.status(400).json({ error: 'Formato de relatorio invalido.' });
    return;
  }

  response.setHeader('Content-Type', 'application/pdf');
  response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 48, size: 'A4' });
  doc.pipe(response);
  doc.fontSize(18).text('Relatorio de desempenho', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12);
  doc.text(`Nome completo: ${player.fullName}`);
  doc.text(`Apelido: ${player.nickname}`);
  doc.text(`Posicao: ${player.position}`);
  doc.text(`Camisa: ${player.shirtNumber}`);
  doc.text(`Partidas: ${stats.matches || 0}`);
  doc.text(`Vitorias/Empates/Derrotas: ${stats.wins || 0}/${stats.draws || 0}/${stats.losses || 0}`);
  doc.text(`Gols: ${stats.goals || 0}`);
  doc.text(`Assistencias: ${stats.assists || 0}`);
  doc.text(`Participacoes em gols: ${(stats.goals || 0) + (stats.assists || 0)}`);
  doc.text(`Roubadas: ${stats.ballRecoveries || 0}`);
  doc.text(`Finalizacoes: ${stats.shots || 0}`);
  doc.text(`Passes certos: ${stats.accuratePasses || 0}`);
  doc.text(`Desarmes: ${stats.tackles || 0}`);
  doc.text(`Interceptacoes: ${stats.interceptions || 0}`);
  doc.text(`Cartoes: ${stats.yellowCards || 0} amarelos, ${stats.redCards || 0} vermelhos`);
  doc.text(`Nota media: ${Number(stats.averageRating || 0)}`);
  doc.text(`Gerado em: ${generatedAt.toLocaleString('pt-BR')}`);
  doc.moveDown();
  doc.fontSize(14).text('Partida por partida');
  doc.moveDown(0.5);
  doc.fontSize(10);
  if (!performances.length) {
    doc.text('Nenhum desempenho registrado.');
  } else {
    for (const item of performances) {
      const result = item.match.homeScore === null || item.match.awayScore === null ? '-' : `${item.match.homeScore} x ${item.match.awayScore}`;
      doc.text(`${item.match.matchDate.toISOString().slice(0, 10)} | ${item.match.awayTeam} | ${result} | G ${item.goals} | A ${item.assists} | R ${item.ballRecoveries} | Nota ${Number(item.rating || 0)}`);
      if (item.notes) doc.text(`Obs: ${item.notes}`);
      doc.moveDown(0.4);
    }
  }
  doc.end();
}

performanceRouter.get('/api/me/player', requireAuthenticatedUser, asyncRoute(async (request, response) => {
  const player = await findAccessiblePlayer(prisma, request.userProfile);
  response.json({ player: player ? serializePlayer(player) : null, playerId: player?.id || '' });
}));

performanceRouter.get('/api/me/performance', requireAuthenticatedUser, asyncRoute(async (request, response) => {
  const player = await findAccessiblePlayer(prisma, request.userProfile);
  if (!player) {
    response.json({ player: null, performances: [] });
    return;
  }

  const performances = await loadPerformance(player.id);
  response.json({
    player: serializePlayer(player),
    performances: performances.map(serializePerformance),
  });
}));

performanceRouter.post('/api/me/performance', requireAuthenticatedUser, asyncRoute(async (request, response) => {
  if (!await ensureOwnPerformancePermission(request, response)) return;
  const player = await findAccessiblePlayer(prisma, request.userProfile);
  if (!player) {
    response.status(404).json({ error: 'Jogador vinculado nao encontrado.' });
    return;
  }

  await createOrUpdatePerformance(request, response, player.id);
}));

performanceRouter.put('/api/me/performance/:performanceId', requireAuthenticatedUser, asyncRoute(async (request, response) => {
  if (!await ensureOwnPerformancePermission(request, response)) return;
  const player = await findAccessiblePlayer(prisma, request.userProfile);
  if (!player) {
    response.status(404).json({ error: 'Jogador vinculado nao encontrado.' });
    return;
  }

  await deleteOrRejectIfForeign(request, response, player.id, async () => {
    await createOrUpdatePerformance(request, response, player.id, request.params.performanceId);
  });
}));

performanceRouter.delete('/api/me/performance/:performanceId', requireAuthenticatedUser, asyncRoute(async (request, response) => {
  if (!await ensureOwnPerformancePermission(request, response)) return;
  const player = await findAccessiblePlayer(prisma, request.userProfile);
  if (!player) {
    response.status(404).json({ error: 'Jogador vinculado nao encontrado.' });
    return;
  }

  await deletePerformance(request, response, player.id, request.params.performanceId);
}));

async function deleteOrRejectIfForeign(request, response, playerId, handler) {
  const existing = await prisma.playerMatchPerformance.findFirst({
    where: { id: request.params.performanceId, playerId },
  });

  if (!existing) {
    response.status(404).json({ error: 'Desempenho nao encontrado para este jogador.' });
    return;
  }

  await handler();
}

performanceRouter.get('/api/me/performance/report', requireAuthenticatedUser, asyncRoute(async (request, response) => {
  const player = await findAccessiblePlayer(prisma, request.userProfile);
  if (!player) {
    response.status(404).json({ error: 'Jogador vinculado nao encontrado.' });
    return;
  }

  const performances = await loadPerformance(player.id);
  await sendReport(response, player, performances, String(request.query.format || 'pdf').toLowerCase());
}));

performanceRouter.get('/api/players/:playerId/performance', requireAdminUser, asyncRoute(async (request, response) => {
  const player = await getPlayerOr404(response, request.params.playerId);
  if (!player) return;
  const performances = await loadPerformance(player.id);
  response.json({ player: serializePlayer(player), performances: performances.map(serializePerformance) });
}));

performanceRouter.post('/api/players/:playerId/performance', requirePermission('editAnyPerformance'), asyncRoute(async (request, response) => {
  await createOrUpdatePerformance(request, response, request.params.playerId);
}));

performanceRouter.put('/api/players/:playerId/performance/:performanceId', requirePermission('editAnyPerformance'), asyncRoute(async (request, response) => {
  await createOrUpdatePerformance(request, response, request.params.playerId, request.params.performanceId);
}));

performanceRouter.delete('/api/players/:playerId/performance/:performanceId', requirePermission('editAnyPerformance'), asyncRoute(async (request, response) => {
  await deletePerformance(request, response, request.params.playerId, request.params.performanceId);
}));

performanceRouter.get('/api/players/:playerId/performance/report', requireAdminUser, asyncRoute(async (request, response) => {
  const player = await getPlayerOr404(response, request.params.playerId);
  if (!player) return;
  const performances = await loadPerformance(player.id);
  await sendReport(response, player, performances, String(request.query.format || 'pdf').toLowerCase());
}));
