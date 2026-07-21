import { sanitizeNullableText, sanitizeText } from '../lib/sanitizeInput.js';

function normalizeShirtNumber(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) return 0;
  return Math.min(number, 999);
}

export async function ensurePlayerForUser(tx, profile, payload = {}) {
  if (!profile || profile.role !== 'player') {
    return null;
  }

  const playerData = {
    teamName: 'Torinno FC',
    fullName: sanitizeText(payload.name || payload.fullName || profile.name, { maxLength: 120 }),
    nickname: sanitizeText(payload.nickname || profile.nickname || profile.name, { maxLength: 80 }),
    position: sanitizeText(payload.position, { maxLength: 60, fallback: 'Sem posicao' }),
    shirtNumber: normalizeShirtNumber(payload.shirt || payload.shirtNumber),
    status: 'Ativo',
    avatarUrl: sanitizeNullableText(payload.avatarUrl || profile.avatarUrl, { maxLength: 1200 }),
    updatedAt: new Date(),
  };

  const existing = await tx.playerProfile.findUnique({
    where: { userId: profile.id },
    include: { stats: true },
  });

  const player = existing
    ? await tx.playerProfile.update({
      where: { id: existing.id },
      data: playerData,
      include: { stats: true },
    })
    : await tx.playerProfile.create({
      data: {
        ...playerData,
        userId: profile.id,
        stats: { create: {} },
      },
      include: { stats: true },
    });

  if (!player.stats) {
    await tx.playerStats.create({ data: { playerId: player.id } });
    return tx.playerProfile.findUnique({
      where: { id: player.id },
      include: { stats: true },
    });
  }

  return player;
}
