import { prisma } from '../lib/prisma.js';
import { createNotificationsForRecipients } from './notificationService.js';
import { recordActivity } from './activityService.js';

const achievementDefinitions = [
  { key: 'first_goal', name: 'Primeiro gol', description: 'Marcou o primeiro gol pelo Torinno FC.', icon: 'target', category: 'performance' },
  { key: 'first_assist', name: 'Primeira assistencia', description: 'Deu a primeira assistencia pelo Torinno FC.', icon: 'sparkles', category: 'performance' },
  { key: 'ten_matches', name: '10 partidas', description: 'Registrou desempenho em 10 partidas.', icon: 'flag', category: 'milestone' },
  { key: 'twenty_five_matches', name: '25 partidas', description: 'Registrou desempenho em 25 partidas.', icon: 'crown', category: 'milestone' },
  { key: 'hat_trick', name: 'Hat-trick', description: 'Marcou tres ou mais gols em uma partida.', icon: 'trophy', category: 'performance' },
  { key: 'high_rating', name: 'Nota acima de 9', description: 'Recebeu nota maior ou igual a 9 em uma partida.', icon: 'star', category: 'performance' },
  { key: 'five_wins', name: '5 vitorias', description: 'Acumulou 5 vitorias registradas.', icon: 'shield', category: 'milestone' },
  { key: 'defensive_wall', name: 'Muralha defensiva', description: 'Somou 25 roubadas, desarmes e interceptacoes.', icon: 'shield', category: 'performance' },
  { key: 'founder', name: 'Fundador', description: 'Perfil marcado como fundador do clube.', icon: 'crown', category: 'role' },
  { key: 'captain', name: 'Capitao', description: 'Foi escolhido como capitao em uma escalacao.', icon: 'badge', category: 'role' },
];

export function calculateOverall(player) {
  const stats = player?.stats || {};
  const rating = Number(stats.averageRating ?? stats.rating ?? 0);
  const matches = Number(stats.matches || 0);
  const goals = Number(stats.goals || 0);
  const assists = Number(stats.assists || 0);
  const recoveries = Number(stats.ballRecoveries ?? stats.recoveries ?? 0);
  const wins = Number(stats.wins || 0);
  const consistency = matches ? Math.min((matches / 25) * 14, 14) : 0;
  const production = Math.min((goals + assists) * 1.6, 20);
  const defense = Math.min(recoveries * 0.6, 12);
  const winImpact = matches ? Math.min((wins / matches) * 10, 10) : 0;
  const ratingScore = Math.min(rating * 4.3, 43);
  const overall = Math.round(1 + ratingScore + consistency + production + defense + winImpact);

  return Math.max(1, Math.min(overall, 99));
}

export async function ensureDefaultAchievements(tx = prisma) {
  for (const item of achievementDefinitions) {
    await tx.achievement.upsert({
      where: { key: item.key },
      update: item,
      create: item,
    });
  }
}

async function unlock(tx, player, key, metadata = {}) {
  const achievement = await tx.achievement.findUnique({ where: { key } });
  if (!achievement) return null;

  const unlocked = await tx.playerAchievement.upsert({
    where: {
      playerId_achievementId: {
        playerId: player.id,
        achievementId: achievement.id,
      },
    },
    update: {},
    create: {
      playerId: player.id,
      achievementId: achievement.id,
      metadata,
    },
    include: { achievement: true },
  });

  if (unlocked.unlockedAt && unlocked.createdAt) return unlocked;
  return unlocked;
}

export async function evaluatePlayerAchievements(playerId, { latestPerformance = null, captain = false } = {}) {
  await ensureDefaultAchievements();

  const player = await prisma.playerProfile.findUnique({
    where: { id: playerId },
    include: { stats: true, user: true },
  });
  if (!player) return [];

  const pending = [];
  const stats = player.stats || {};
  const defensiveTotal = Number(stats.ballRecoveries || 0) + Number(stats.tackles || 0) + Number(stats.interceptions || 0);

  if (Number(stats.goals || 0) >= 1) pending.push('first_goal');
  if (Number(stats.assists || 0) >= 1) pending.push('first_assist');
  if (Number(stats.matches || 0) >= 10) pending.push('ten_matches');
  if (Number(stats.matches || 0) >= 25) pending.push('twenty_five_matches');
  if (Number(stats.wins || 0) >= 5) pending.push('five_wins');
  if (defensiveTotal >= 25) pending.push('defensive_wall');
  if (latestPerformance?.goals >= 3) pending.push('hat_trick');
  if (Number(latestPerformance?.rating || 0) >= 9) pending.push('high_rating');
  if (player.user?.staffRole === 'Fundador') pending.push('founder');
  if (captain) pending.push('captain');

  const unlocked = [];
  for (const key of pending) {
    const before = await prisma.playerAchievement.findFirst({
      where: { playerId, achievement: { key } },
    });
    if (before) continue;

    const item = await prisma.$transaction((tx) => unlock(tx, player, key, {
      latestPerformanceId: latestPerformance?.id || null,
      overall: calculateOverall(player),
    }));
    if (item) unlocked.push(item);
  }

  for (const item of unlocked) {
    if (player.user?.email) {
      await createNotificationsForRecipients([player.user], {
        type: 'achievement_unlocked',
        title: 'Conquista desbloqueada',
        message: `${player.nickname} desbloqueou: ${item.achievement.name}.`,
        relatedEntityType: 'achievement',
        relatedEntityId: item.achievement.id,
        actionUrl: '/profile',
        metadata: { achievementKey: item.achievement.key, playerId },
        sentAt: new Date(),
        status: 'sent',
      });
    }

    await recordActivity({
      type: 'achievement_unlocked',
      actorId: player.userId,
      actorName: player.nickname,
      message: `${player.nickname} desbloqueou a conquista ${item.achievement.name}.`,
      relatedEntityType: 'achievement',
      relatedEntityId: item.achievement.id,
      actionUrl: '/profile',
      metadata: { playerId },
    });
  }

  return unlocked;
}
