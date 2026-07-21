import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { createPublicKey, createVerify } from 'node:crypto';
import { hasPermission } from '../services/settingsService.js';

const jwksCache = {
  keys: null,
  fetchedAt: 0,
};

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getBearerToken(request) {
  const authorization = request.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : '';
}

function parseBase64UrlJson(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

async function getSupabaseJwks() {
  const cacheTtlMs = 10 * 60 * 1000;
  if (jwksCache.keys && Date.now() - jwksCache.fetchedAt < cacheTtlMs) {
    return jwksCache.keys;
  }

  const response = await fetch(env.supabase.jwksUrl);
  if (!response.ok) {
    throw httpError(401, 'Nao foi possivel validar a sessao do usuario.');
  }

  const payload = await response.json();
  jwksCache.keys = payload.keys || [];
  jwksCache.fetchedAt = Date.now();
  return jwksCache.keys;
}

async function verifySupabaseJwt(token) {
  if (!env.supabase.url || !env.supabase.jwksUrl) {
    throw httpError(503, 'Autenticacao Supabase incompleta no servidor. Configure SUPABASE_URL e SUPABASE_JWKS_URL.');
  }
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw httpError(401, 'Sessao invalida.');
  }

  const header = parseBase64UrlJson(encodedHeader);
  const payload = parseBase64UrlJson(encodedPayload);
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    throw httpError(401, 'Sessao expirada.');
  }
  if (payload.nbf && payload.nbf > now) {
    throw httpError(401, 'Sessao ainda nao esta valida.');
  }

  if (!['RS256', 'ES256'].includes(header.alg) || !header.kid) {
    throw httpError(401, 'Sessao invalida.');
  }

  const keys = await getSupabaseJwks();
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) {
    throw httpError(401, 'Chave de sessao desconhecida.');
  }

  const verifier = createVerify('SHA256');
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  const publicKey = createPublicKey({ key: jwk, format: 'jwk' });
  const signature = Buffer.from(encodedSignature, 'base64url');
  const isValid = header.alg === 'ES256'
    ? verifier.verify({ key: publicKey, dsaEncoding: 'ieee-p1363' }, signature)
    : verifier.verify(publicKey, signature);

  if (!isValid) {
    throw httpError(401, 'Assinatura da sessao invalida.');
  }

  if (env.supabase.url) {
    const expectedIssuer = `${env.supabase.url.replace(/\/$/, '')}/auth/v1`;
    if (payload.iss && payload.iss !== expectedIssuer) {
      throw httpError(401, 'Emissor da sessao invalido.');
    }
  }

  return payload;
}

async function findProfileFromTokenPayload(payload, fallbackEmail = '') {
  const email = String(payload.email || fallbackEmail || '').trim().toLowerCase();
  const filters = [];

  if (isUuid(payload.sub)) {
    filters.push({ id: payload.sub });
  }
  if (email) {
    filters.push({ email: { equals: email, mode: 'insensitive' } });
  }

  if (!filters.length) {
    return null;
  }

  return prisma.userProfile.findFirst({ where: { OR: filters } });
}

export function requireAdminApiKey(request, response, next) {
  if (!env.adminApiKey) {
    response.status(500).json({ error: 'ADMIN_API_KEY nao configurada no servidor.' });
    return;
  }

  const apiKey = request.get('x-admin-api-key');

  if (apiKey !== env.adminApiKey) {
    response.status(401).json({ error: 'Chave administrativa invalida.' });
    return;
  }

  next();
}

export async function resolveAuthenticatedProfile(request) {
  const token = getBearerToken(request);
  const headerEmail = String(request.get('x-user-email') || '').trim().toLowerCase();

  if (token) {
    const payload = await verifySupabaseJwt(token);
    const profile = await findProfileFromTokenPayload(payload, headerEmail);

    if (!profile) {
      throw httpError(401, 'Perfil autenticado nao encontrado.');
    }

    request.auth = {
      userId: payload.sub || profile.id,
      email: profile.email || payload.email || headerEmail,
      profile,
    };
    request.userProfile = profile;
    return profile;
  }

  const apiKey = request.get('x-admin-api-key');
  if (env.adminApiKey && apiKey === env.adminApiKey && headerEmail) {
    const profile = await prisma.userProfile.findUnique({ where: { email: headerEmail } });
    if (profile) {
      request.auth = { userId: profile.id, email: profile.email, profile };
      request.userProfile = profile;
      return profile;
    }
  }

  throw httpError(401, 'Usuario autenticado obrigatorio.');
}

export function requireAdminUser(request, response, next) {
  resolveAuthenticatedProfile(request)
    .then((profile) => {
      if (profile.accountStatus !== 'active') {
        response.status(403).json({ error: 'Usuario inativo.' });
        return;
      }

      if (profile.role !== 'admin') {
        response.status(403).json({ error: 'Apenas administradores podem realizar esta acao.' });
        return;
      }

      next();
    })
    .catch((error) => {
      response.status(error.statusCode || 401).json({ error: error.message || 'Usuario autenticado obrigatorio.' });
    });
}

export function requireAuthenticatedUser(request, response, next) {
  resolveAuthenticatedProfile(request)
    .then((profile) => {
      if (profile.accountStatus !== 'active') {
        response.status(403).json({ error: 'Usuario inativo.' });
        return;
      }

      next();
    })
    .catch((error) => {
      response.status(error.statusCode || 401).json({ error: error.message || 'Usuario autenticado obrigatorio.' });
    });
}

export function requirePermission(permissionKey) {
  return (request, response, next) => {
    resolveAuthenticatedProfile(request)
      .then(async (profile) => {
        if (profile.accountStatus !== 'active') {
          response.status(403).json({ error: 'Usuario inativo.' });
          return;
        }

        const allowed = await hasPermission(prisma, profile.role, permissionKey);
        if (!allowed) {
          response.status(403).json({ error: 'Permissao insuficiente para realizar esta acao.' });
          return;
        }

        next();
      })
      .catch((error) => {
        response.status(error.statusCode || 401).json({ error: error.message || 'Usuario autenticado obrigatorio.' });
      });
  };
}
