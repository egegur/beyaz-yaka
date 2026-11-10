import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import type { Env } from './env';
import { HttpError } from './http';

/**
 * Firebase Authentication kimlik jetonunu (ID token) doğrular.
 * Firebase Auth'un ücretsiz (Spark) paketi kullanılır; sunucuda ek ücretli servis yok.
 */
const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let jwks: JWTVerifyGetKey | null = null;
function getJwks(): JWTVerifyGetKey {
  if (!jwks) jwks = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));
  return jwks;
}

export async function verifyFirebaseToken(
  token: string,
  projectId: string,
  keys: JWTVerifyGetKey = getJwks(),
): Promise<string> {
  const { payload } = await jwtVerify(token, keys, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ['RS256'],
  });
  if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128) {
    throw new HttpError(401, 'unauthorized', 'Oturum geçersiz.');
  }
  return payload.sub;
}

/** İstekteki kullanıcıyı döndürür. Geçersizse 401. */
export async function requireUser(req: Request, env: Env): Promise<string> {
  if (env.DEV_AUTH === '1') {
    const dev = req.headers.get('x-dev-user');
    if (dev && /^[a-zA-Z0-9_-]{3,64}$/.test(dev)) return `dev_${dev}`;
  }
  const h = req.headers.get('authorization') ?? '';
  const m = /^Bearer (.+)$/.exec(h);
  if (!m) throw new HttpError(401, 'unauthorized', 'Giriş yapmalısın.');
  if (!env.FIREBASE_PROJECT_ID) throw new HttpError(500, 'config', 'Sunucu yapılandırması eksik.');
  try {
    return await verifyFirebaseToken(m[1], env.FIREBASE_PROJECT_ID);
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(401, 'unauthorized', 'Oturum geçersiz veya süresi dolmuş.');
  }
}
