import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { sanitizeNullableText, sanitizeText } from '../lib/sanitizeInput.js';
import {
  serializeAchievement,
  serializeActivity,
  serializeAttendance,
  serializeLineup,
  serializeMatch,
} from '../lib/serializers.js';
import { requireAdminUser, requireAuthenticatedUser, requirePermission } from '../middleware/requireAdminApiKey.js';
import { calculateOverall, ensureDefaultAchievements, evaluatePlayerAchievements } from '../services/achievementService.js';
import { recordActivity } from '../services/activityService.js';

export const clubExperienceRouter = Router();

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

const attendanceStatuses = new Set(['confirmed', 'maybe', 'unavailable']);
const lineupRoles = new Set(['starter', 'bench']);

async function getOwnPlayer(profile) {
  return prisma.playerProfile.findUnique({
    where: { userId: profile.id },
    include: { stats: true, user: true },
  });
}

function makeAttendanceData(body) {
  const status = sanitizeText(body.status, { maxLength: 32, fallback: 'maybe' });
  return {
    status: attendanceStatuses.has(status) ? status : 'maybe',
    notes: sanitizeNullableText(body.notes, { maxLength: 280 }),
    respondedAt: new Date(),
    updatedAt: new Date(),
  };
}

async function loadLineup(matchId) {
  return prisma.matchLineup.findUnique({
    where: { matchId },
    include: {
      players: {
        include: { player: { include: { stats: true } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

clubExperienceRouter.get('/api/activities', requireAuthenticatedUser, asyncRoute(async (request, response) => {
  const take = Math.min(Number(request.query.limit || 20), 60);
  const activities = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take,
  });

  response.json({ activities: activities.map(serializeActivity) });
}));

clubExperienceRouter.get('/api/achievements', requireAuthenticatedUser, asyncRoute(async (_request, response) => {
  await ensureDefaultAchievements();
  const achievements = await prisma.achievement.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
  response.json({ achievements: achievements.map(serializeAchievement) });
}));

clubExperienceRouter.get('/api/players/:playerId/achievements', requireAuthenticatedUser, asyncRoute(async (request, response) => {
  const achievements = await prisma.playerAchievement.findMany({
    where: { playerId: request.params.playerId },
    include: { achievement: true },
    orderBy: { unlockedAt: 'desc' },
  });

  response.json({ achievements: achievements.map(serializeAchievement) });
}));

clubExperienceRouter.get('/api/matches/:matchId/attendance', requireAuthenticatedUser, asyncRoute(async (request, response) => {
  const attendances = await prisma.matchAttendance.findMany({
    where: { matchId: request.params.matchId },
    include: { player: { include: { stats: true } } },
    orderBy: [{ status: 'asc' }, { respondedAt: 'desc' }],
  });

  response.json({ attendances: attendances.map(serializeAttendance) });
}));

clubExperienceRouter.put('/api/matches/:matchId/attendance/me', requireAuthenticatedUser, asyncRoute(async (request, response) => {
  const player = await getOwnPlayer(request.userProfile);
  if (!player) {
    response.status(404).json({ error: 'Jogador vinculado nao encontrado.' });
    return;
  }

  const match = await prisma.match.findUnique({ where: { id: request.params.matchId } });
  if (!match) {
    response.status(404).json({ error: 'Partida nao encontrada.' });
    return;
  }

  const attendance = await prisma.matchAttendance.upsert({
    where: {
      matchId_playerId: {
        matchId: match.id,
        playerId: player.id,
      },
    },
    update: makeAttendanceData(request.body),
    create: {
      matchId: match.id,
      playerId: player.id,
      ...makeAttendanceData(request.body),
    },
    include: { player: { include: { stats: true } } },
  });

  await recordActivity({
    type: 'attendance_updated',
    actorId: request.userProfile.id,
    actorName: player.nickname,
    message: `${player.nickname} atualizou presenca para ${attendance.status}.`,
    relatedEntityType: 'match',
    relatedEntityId: match.id,
    actionUrl: '/matchday',
    metadata: { status: attendance.status },
  });

  response.json({ attendance: serializeAttendance(attendance) });
}));

clubExperienceRouter.put('/api/matches/:matchId/attendance/:playerId', requireAdminUser, asyncRoute(async (request, response) => {
  const match = await prisma.match.findUnique({ where: { id: request.params.matchId } });
  const player = await prisma.playerProfile.findUnique({ where: { id: request.params.playerId }, include: { stats: true } });
  if (!match || !player) {
    response.status(404).json({ error: 'Partida ou jogador nao encontrado.' });
    return;
  }

  const attendance = await prisma.matchAttendance.upsert({
    where: {
      matchId_playerId: {
        matchId: match.id,
        playerId: player.id,
      },
    },
    update: makeAttendanceData(request.body),
    create: {
      matchId: match.id,
      playerId: player.id,
      ...makeAttendanceData(request.body),
    },
    include: { player: { include: { stats: true } } },
  });

  response.json({ attendance: serializeAttendance(attendance) });
}));

clubExperienceRouter.get('/api/matches/:matchId/lineup', requireAuthenticatedUser, asyncRoute(async (request, response) => {
  const lineup = await loadLineup(request.params.matchId);
  response.json({ lineup: serializeLineup(lineup) });
}));

clubExperienceRouter.put('/api/matches/:matchId/lineup', requirePermission('manageCalendar'), asyncRoute(async (request, response) => {
  const match = await prisma.match.findUnique({ where: { id: request.params.matchId } });
  if (!match) {
    response.status(404).json({ error: 'Partida nao encontrada.' });
    return;
  }

  const entries = Array.isArray(request.body.players) ? request.body.players : [];
  const captainId = sanitizeNullableText(request.body.captainId, { maxLength: 80 });
  const formation = sanitizeText(request.body.formation, { maxLength: 20, fallback: '4-3-3' });
  const notes = sanitizeNullableText(request.body.notes, { maxLength: 700 });

  const lineup = await prisma.$transaction(async (tx) => {
    const saved = await tx.matchLineup.upsert({
      where: { matchId: match.id },
      update: {
        formation,
        captainId,
        notes,
        updatedAt: new Date(),
      },
      create: {
        matchId: match.id,
        formation,
        captainId,
        notes,
        createdBy: request.userProfile.id,
      },
    });

    await tx.matchLineupPlayer.deleteMany({ where: { lineupId: saved.id } });

    let sortOrder = 0;
    for (const entry of entries) {
      const playerId = sanitizeText(entry.playerId, { maxLength: 80 });
      const role = sanitizeText(entry.role, { maxLength: 20, fallback: 'bench' });
      if (!playerId || !lineupRoles.has(role)) continue;

      await tx.matchLineupPlayer.create({
        data: {
          lineupId: saved.id,
          playerId,
          role,
          position: sanitizeNullableText(entry.position, { maxLength: 40 }),
          sortOrder,
        },
      });
      sortOrder += 1;
    }

    await tx.adminAuditLog.create({
      data: {
        actorId: request.userProfile.id,
        targetId: match.id,
        action: 'update_match_lineup',
        afterValue: { formation, captainId, players: entries.length },
      },
    });

    return tx.matchLineup.findUnique({
      where: { id: saved.id },
      include: { players: { include: { player: { include: { stats: true } } }, orderBy: { sortOrder: 'asc' } } },
    });
  });

  if (captainId) {
    await evaluatePlayerAchievements(captainId, { captain: true });
  }

  await recordActivity({
    type: 'lineup_updated',
    actorId: request.userProfile.id,
    actorName: request.userProfile.nickname || request.userProfile.name,
    message: `Escalacao atualizada para ${match.awayTeam}.`,
    relatedEntityType: 'match',
    relatedEntityId: match.id,
    actionUrl: '/matchday',
    metadata: { formation },
  });

  response.json({ lineup: serializeLineup(lineup) });
}));

clubExperienceRouter.get('/api/matchday', requireAuthenticatedUser, asyncRoute(async (_request, response) => {
  const now = new Date();
  const upcoming = await prisma.match.findFirst({
    where: { status: { in: ['Agendada', 'Em andamento'] } },
    include: { championship: true },
    orderBy: [{ matchDate: 'asc' }, { matchTime: 'asc' }],
  });

  const latest = upcoming || await prisma.match.findFirst({
    include: { championship: true },
    orderBy: [{ matchDate: 'desc' }, { matchTime: 'desc' }],
  });

  if (!latest) {
    response.json({ match: null, attendances: [], lineup: null, now });
    return;
  }

  const [attendances, lineup] = await Promise.all([
    prisma.matchAttendance.findMany({
      where: { matchId: latest.id },
      include: { player: { include: { stats: true } } },
      orderBy: [{ status: 'asc' }, { respondedAt: 'desc' }],
    }),
    loadLineup(latest.id),
  ]);

  response.json({
    match: serializeMatch(latest),
    attendances: attendances.map(serializeAttendance),
    lineup: serializeLineup(lineup),
    now,
  });
}));
