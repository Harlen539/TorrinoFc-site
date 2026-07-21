import { prisma } from '../lib/prisma.js';

export async function recordActivity({
  type,
  actorId = null,
  actorName = '',
  message,
  relatedEntityType = '',
  relatedEntityId = null,
  actionUrl = '',
  metadata = {},
}) {
  if (!type || !message) return null;

  return prisma.activityLog.create({
    data: {
      type,
      actorId,
      actorName: actorName || null,
      message,
      relatedEntityType: relatedEntityType || null,
      relatedEntityId,
      actionUrl: actionUrl || null,
      metadata,
    },
  });
}
