function formatDate(value) {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

function formatTime(value) {
  if (!value) return '';
  return value.toISOString().slice(11, 16);
}

export function serializeMatch(match) {
  const dateKey = formatDate(match.matchDate);
  const championshipName = match.championship?.name || match.championshipName || 'Agenda';

  return {
    id: match.id,
    home: match.homeTeam,
    homeLogo: '/assets/logo-torrino.png',
    away: match.awayTeam,
    opponentLogo: match.opponentLogoUrl || '',
    whatsappUrl: match.whatsappUrl || '',
    date: dateKey,
    dateKey,
    time: formatTime(match.matchTime),
    place: match.location || 'A definir',
    championshipId: match.championshipId || '',
    championship: championshipName,
    status: match.status,
    score: match.homeScore !== null && match.awayScore !== null ? `${match.homeScore} x ${match.awayScore}` : '-',
    observations: match.observations || '',
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
  };
}

export function serializeChampionship(championship) {
  return {
    id: championship.id,
    teamName: championship.teamName,
    name: championship.name,
    imageUrl: championship.imageUrl || '',
    season: championship.season || '',
    startDate: formatDate(championship.startDate),
    endDate: formatDate(championship.endDate),
    format: championship.format || '',
    status: championship.status,
    officialUrl: championship.officialUrl || '',
    description: championship.description || '',
    createdAt: championship.createdAt,
    updatedAt: championship.updatedAt,
  };
}

export function serializeUserProfile(profile) {
  return {
    id: profile.id,
    name: profile.name,
    nickname: profile.nickname || profile.name,
    email: profile.email || '',
    role: profile.role,
    staffRole: profile.staffRole || (profile.role === 'admin' ? 'Admin' : 'Membro'),
    accountStatus: profile.accountStatus,
    avatarUrl: profile.avatarUrl || '',
    joinedAt: profile.joinedAt,
    playerId: profile.playerProfile?.id || '',
    hasPlayerProfile: Boolean(profile.playerProfile?.id),
  };
}

export function serializePlayer(player) {
  const stats = player.stats || {};

  return {
    id: player.id,
    userId: player.userId || '',
    fullName: player.fullName,
    nickname: player.nickname,
    position: player.position,
    shirt: player.shirtNumber,
    foot: player.dominantFoot || '',
    status: player.status,
    role: player.status === 'Ativo' ? 'Jogador' : player.status,
    avatar: player.avatarUrl || '',
    photo: player.photoUrl || '',
    bio: player.bio || '',
    instagram: player.instagram || '',
    createdAt: player.createdAt,
    updatedAt: player.updatedAt,
    stats: {
      goals: stats.goals || 0,
      assists: stats.assists || 0,
      recoveries: stats.ballRecoveries || 0,
      shots: stats.shots || 0,
      passes: stats.accuratePasses || 0,
      tackles: stats.tackles || 0,
      interceptions: stats.interceptions || 0,
      matches: stats.matches || 0,
      wins: stats.wins || 0,
      draws: stats.draws || 0,
      losses: stats.losses || 0,
      yellow: stats.yellowCards || 0,
      red: stats.redCards || 0,
      rating: Number(stats.averageRating || 0),
      notes: stats.notes || '',
    },
  };
}

export function serializeTryout(tryout) {
  return {
    id: tryout.id,
    teamName: tryout.teamName || 'Torinno FC',
    fullName: tryout.title,
    title: tryout.title,
    age: tryout.overall || '',
    overall: tryout.overall || '',
    position: tryout.category || 'Geral',
    contact: tryout.contact || '',
    date: formatDate(tryout.tryoutDate),
    time: formatTime(tryout.tryoutTime),
    place: tryout.location || 'EA FC 26 | Clubs',
    notes: tryout.observations || '',
    status: tryout.status,
    createdBy: tryout.createdBy || '',
    createdAt: tryout.createdAt,
    updatedAt: tryout.updatedAt,
  };
}
