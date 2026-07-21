import { sanitizeNullableText } from '../lib/sanitizeInput.js';
import { serializeMatch } from '../lib/serializers.js';

const integerFields = [
  'goals',
  'assists',
  'ballRecoveries',
  'shots',
  'accuratePasses',
  'tackles',
  'interceptions',
  'yellowCards',
  'redCards',
  'minutesPlayed',
];

const fieldAliases = {
  ballRecoveries: ['ballRecoveries', 'recoveries'],
  accuratePasses: ['accuratePasses', 'passes'],
  yellowCards: ['yellowCards', 'yellow'],
  redCards: ['redCards', 'red'],
  minutesPlayed: ['minutesPlayed', 'minutes'],
};

function readBodyValue(body, field) {
  const aliases = fieldAliases[field] || [field];
  return aliases.map((key) => body[key]).find((value) => value !== undefined);
}

function parseNonNegativeInteger(value, field, errors) {
  if (value === undefined || value === null || value === '') return 0;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    errors.push(`${field} precisa ser um inteiro nao negativo.`);
    return 0;
  }
  return number;
}

function parseRating(value, errors) {
  if (value === undefined || value === null || value === '') return 0;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 10) {
    errors.push('Nota precisa estar entre 0 e 10.');
    return 0;
  }
  return Math.round(number * 10) / 10;
}

export function makePerformanceData(body, createdBy) {
  const errors = [];
  const data = {};

  for (const field of integerFields) {
    data[field] = parseNonNegativeInteger(readBodyValue(body, field), field, errors);
  }

  data.rating = parseRating(body.rating, errors);
  data.notes = sanitizeNullableText(body.notes, { maxLength: 700 });
  data.updatedAt = new Date();

  if (createdBy !== undefined) {
    data.createdBy = createdBy;
  }

  return { data, errors };
}

function matchOutcome(match) {
  if (match.homeScore === null || match.awayScore === null) {
    return null;
  }

  if (match.homeScore > match.awayScore) return 'win';
  if (match.homeScore < match.awayScore) return 'loss';
  return 'draw';
}

export async function recalculatePlayerStats(tx, playerId) {
  const performances = await tx.playerMatchPerformance.findMany({
    where: { playerId },
    include: { match: true },
  });

  const totals = {
    goals: 0,
    assists: 0,
    ballRecoveries: 0,
    shots: 0,
    accuratePasses: 0,
    tackles: 0,
    interceptions: 0,
    matches: performances.length,
    wins: 0,
    draws: 0,
    losses: 0,
    yellowCards: 0,
    redCards: 0,
    averageRating: 0,
  };

  let ratingTotal = 0;
  let ratingCount = 0;

  for (const item of performances) {
    totals.goals += item.goals;
    totals.assists += item.assists;
    totals.ballRecoveries += item.ballRecoveries;
    totals.shots += item.shots;
    totals.accuratePasses += item.accuratePasses;
    totals.tackles += item.tackles;
    totals.interceptions += item.interceptions;
    totals.yellowCards += item.yellowCards;
    totals.redCards += item.redCards;

    const rating = Number(item.rating || 0);
    if (rating > 0) {
      ratingTotal += rating;
      ratingCount += 1;
    }

    const outcome = matchOutcome(item.match);
    if (outcome === 'win') totals.wins += 1;
    if (outcome === 'draw') totals.draws += 1;
    if (outcome === 'loss') totals.losses += 1;
  }

  totals.averageRating = ratingCount ? Math.round((ratingTotal / ratingCount) * 10) / 10 : 0;

  return tx.playerStats.upsert({
    where: { playerId },
    update: { ...totals, updatedAt: new Date() },
    create: { playerId, ...totals },
  });
}

export async function findAccessiblePlayer(tx, profile, requestedPlayerId = '') {
  if (profile.role === 'admin' && requestedPlayerId) {
    return tx.playerProfile.findUnique({
      where: { id: requestedPlayerId },
      include: { stats: true, user: true },
    });
  }

  return tx.playerProfile.findUnique({
    where: { userId: profile.id },
    include: { stats: true, user: true },
  });
}

export function serializePerformance(item) {
  return {
    id: item.id,
    playerId: item.playerId,
    matchId: item.matchId,
    goals: item.goals,
    assists: item.assists,
    recoveries: item.ballRecoveries,
    ballRecoveries: item.ballRecoveries,
    shots: item.shots,
    passes: item.accuratePasses,
    accuratePasses: item.accuratePasses,
    tackles: item.tackles,
    interceptions: item.interceptions,
    yellow: item.yellowCards,
    yellowCards: item.yellowCards,
    red: item.redCards,
    redCards: item.redCards,
    minutes: item.minutesPlayed,
    minutesPlayed: item.minutesPlayed,
    rating: Number(item.rating || 0),
    notes: item.notes || '',
    createdBy: item.createdBy || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    match: item.match ? serializeMatch(item.match) : null,
  };
}
