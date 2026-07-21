import { sanitizeNullableText, sanitizeText } from '../lib/sanitizeInput.js';

function normalizeShirtNumber(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) return 0;
  return Math.min(number, 999);
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export async function ensurePlayerForUser(tx, profile, payload = {}) {
  if (!profile || profile.accountStatus === 'removed') {
    return null;
  }

  const existing = await tx.playerProfile.findFirst({
    where: { userId: profile.id },
    include: { stats: true },
    orderBy: { createdAt: 'asc' },
  });

  const baseData = {
    teamName: 'Torinno FC',
    fullName: sanitizeText(payload.name || payload.fullName || profile.name, { maxLength: 120 }),
    nickname: sanitizeText(payload.nickname || profile.nickname || profile.name, { maxLength: 80 }),
    status: 'Ativo',
    avatarUrl: sanitizeNullableText(payload.avatarUrl || profile.avatarUrl, { maxLength: 1200 }),
    updatedAt: new Date(),
  };

  const createData = {
    ...baseData,
    position: sanitizeText(payload.position || profile.position, { maxLength: 60, fallback: 'Sem posicao' }),
    shirtNumber: normalizeShirtNumber(payload.shirt || payload.shirtNumber || profile.shirt),
    photoUrl: sanitizeNullableText(payload.photoUrl || payload.photo, { maxLength: 1200 }),
    bio: sanitizeNullableText(payload.bio, { maxLength: 700 }),
  };

  const updateData = {
    ...baseData,
    ...(hasValue(payload.position) ? { position: sanitizeText(payload.position, { maxLength: 60 }) } : {}),
    ...(hasValue(payload.shirt || payload.shirtNumber) ? { shirtNumber: normalizeShirtNumber(payload.shirt || payload.shirtNumber) } : {}),
    ...(hasValue(payload.photoUrl || payload.photo) ? { photoUrl: sanitizeNullableText(payload.photoUrl || payload.photo, { maxLength: 1200 }) } : {}),
    ...(hasValue(payload.bio) ? { bio: sanitizeNullableText(payload.bio, { maxLength: 700 }) } : {}),
  };

  const player = existing
    ? await tx.playerProfile.update({
      where: { id: existing.id },
      data: updateData,
      include: { stats: true },
    })
    : await tx.playerProfile.create({
      data: {
        ...createData,
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

export async function ensurePlayersForExistingUsers(prisma) {
  const profiles = await prisma.userProfile.findMany({
    where: {
      accountStatus: { not: 'removed' },
      role: { not: 'admin' },
    },
    include: { playerProfile: true },
    orderBy: { joinedAt: 'asc' },
  });

  const synced = [];

  for (const profile of profiles) {
    if (profile.playerProfile) continue;

    const player = await prisma.$transaction((tx) => ensurePlayerForUser(tx, profile));
    if (player) synced.push(player);
  }

  return synced;
}

export async function ensureStatsForExistingPlayers(prisma) {
  const players = await prisma.playerProfile.findMany({
    where: {
      teamName: 'Torinno FC',
      status: { not: 'Removido' },
      stats: null,
    },
    select: { id: true },
  });

  for (const player of players) {
    await prisma.playerStats.create({ data: { playerId: player.id } }).catch(() => null);
  }

  return players.length;
}
