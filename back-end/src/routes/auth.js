import { Router } from 'express';
import { env, getMissingSupabaseConfig } from '../config/env.js';
import { isValidEmail, sendValidationErrors } from '../lib/httpValidation.js';
import { prisma } from '../lib/prisma.js';
import { sanitizeNullableText, sanitizeText } from '../lib/sanitizeInput.js';
import { serializePlayer, serializeUserProfile } from '../lib/serializers.js';
import { ensurePlayerForUser } from '../services/playerSyncService.js';

export const authRouter = Router();

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function supabaseErrorMessage(payload) {
  return payload?.msg || payload?.error_description || payload?.error || payload?.message || '';
}

function isExistingAuthUserError(message) {
  return /already|exists|registered|cadastrado/i.test(String(message || ''));
}

async function createSupabaseAuthUser({ email, password, name, nickname, position, shirt }) {
  const missing = getMissingSupabaseConfig();
  if (!env.supabase.publishableKey) missing.push('SUPABASE_PUBLISHABLE_KEY');
  if (missing.length) {
    throw httpError(503, `Cadastro indisponivel: configure ${missing.join(', ')} no backend.`);
  }

  const baseUrl = env.supabase.url.replace(/\/$/, '');
  let response;
  try {
    response = await fetch(`${baseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        apikey: env.supabase.publishableKey,
        Authorization: `Bearer ${env.supabase.publishableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        data: { name, nickname, position, shirt },
      }),
    });
  } catch {
    throw httpError(503, 'Nao foi possivel conectar ao Supabase Auth. Tente novamente.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = supabaseErrorMessage(payload) || 'Nao foi possivel criar a conta no Supabase Auth.';
    if (isExistingAuthUserError(message)) {
      throw httpError(409, 'Este e-mail ja esta cadastrado. Faca login ou recupere a senha.');
    }
    throw httpError(response.status >= 500 ? 503 : 400, message);
  }

  return payload.user || payload;
}

async function deleteSupabaseAuthUser(userId) {
  if (!userId || !env.supabase.secretKey) return;
  const baseUrl = env.supabase.url.replace(/\/$/, '');
  const rollbackResponse = await fetch(`${baseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      apikey: env.supabase.secretKey,
      Authorization: `Bearer ${env.supabase.secretKey}`,
    },
  });
  if (!rollbackResponse.ok && rollbackResponse.status !== 404) {
    throw new Error('Falha ao remover do Supabase Auth a conta criada durante o rollback.');
  }
}

function makePublicAuthUser(user) {
  if (!user) return null;
  return {
    id: user.id || '',
    email: String(user.email || '').trim().toLowerCase(),
  };
}

authRouter.post('/api/auth/register', asyncRoute(async (request, response) => {
  const email = String(request.body.email || '').trim().toLowerCase();
  const password = String(request.body.password || '');
  const name = sanitizeText(request.body.name, { maxLength: 120 });
  const nickname = sanitizeText(request.body.nickname || request.body.name, { maxLength: 80 });
  const position = sanitizeText(request.body.position, { maxLength: 60, fallback: 'Meio-campo' });
  const shirt = sanitizeText(request.body.shirt || request.body.shirtNumber || '10', { maxLength: 8, fallback: '10' });
  const errors = [];

  if (!name) errors.push('Nome e obrigatorio.');
  if (!nickname) errors.push('Apelido e obrigatorio.');
  if (!isValidEmail(email)) errors.push('E-mail invalido.');
  if (password.length < 6) errors.push('A senha precisa ter pelo menos 6 caracteres.');
  if (password.length > 128) errors.push('A senha deve ter no maximo 128 caracteres.');

  if (errors.length) {
    sendValidationErrors(response, errors);
    return;
  }

  const authUser = await createSupabaseAuthUser({ email, password, name, nickname, position, shirt });
  let result;

  try {
    result = await prisma.$transaction(async (tx) => {
      const existing = await tx.userProfile.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        include: { playerProfile: true },
      });
      const data = {
        name,
        nickname,
        accountStatus: existing?.accountStatus || 'pending_email',
        updatedAt: new Date(),
        ...(request.body.avatarUrl || request.body.photo
          ? { avatarUrl: sanitizeNullableText(request.body.avatarUrl || request.body.photo, { maxLength: 1200 }) }
          : {}),
      };
      const profile = existing
        ? await tx.userProfile.update({
          where: { id: existing.id },
          data,
          include: { playerProfile: true },
        })
        : await tx.userProfile.create({
          data: {
            ...(isUuid(authUser?.id) ? { id: authUser.id } : {}),
            ...data,
            email,
            role: 'player',
            staffRole: 'Jogador',
          },
          include: { playerProfile: true },
        });

      const shouldHavePlayer = Boolean(profile.playerProfile);
      const player = shouldHavePlayer
        ? await ensurePlayerForUser(tx, profile, {
          name,
          nickname,
          position,
          shirt,
          avatarUrl: request.body.avatarUrl,
          photo: request.body.photo || request.body.photoUrl,
          bio: request.body.bio,
        })
        : null;
      const syncedProfile = await tx.userProfile.findUnique({
        where: { id: profile.id },
        include: { playerProfile: true },
      });

      return { profile: syncedProfile, player };
    });
  } catch (error) {
    try {
      await deleteSupabaseAuthUser(authUser?.id);
    } catch (rollbackError) {
      console.error('[auth/register] Rollback do Supabase Auth falhou:', rollbackError);
    }
    throw httpError(500, 'Nao foi possivel criar o perfil. A criacao da conta foi revertida; tente novamente.');
  }

  response.status(202).json({
    user: serializeUserProfile(result.profile),
    player: result.player ? serializePlayer(result.player) : null,
    playerId: result.player?.id || '',
    role: result.profile.role,
    staffRole: result.profile.staffRole || (result.profile.role === 'admin' ? 'Admin' : 'Jogador'),
    authUser: makePublicAuthUser(authUser),
    requiresEmailConfirmation: true,
  });
}));
