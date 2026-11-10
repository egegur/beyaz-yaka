import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { verifyFirebaseToken } from '../worker/auth';

const PROJECT = 'beyaz-yaka-test';
let privateKey: CryptoKey;
let jwks: ReturnType<typeof createLocalJWKSet>;

beforeAll(async () => {
  const kp = await generateKeyPair('RS256');
  privateKey = kp.privateKey as CryptoKey;
  const jwk = await exportJWK(kp.publicKey);
  jwks = createLocalJWKSet({ keys: [{ ...jwk, kid: 'k1', alg: 'RS256', use: 'sig' }] });
});

function token(claims: { iss?: string; aud?: string; sub?: string; exp?: string }) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setIssuer(claims.iss ?? `https://securetoken.google.com/${PROJECT}`)
    .setAudience(claims.aud ?? PROJECT)
    .setSubject(claims.sub ?? 'uid123')
    .setIssuedAt()
    .setExpirationTime(claims.exp ?? '1h')
    .sign(privateKey);
}

describe('Firebase jeton doğrulama', () => {
  it('geçerli jetonu kabul eder', async () => {
    expect(await verifyFirebaseToken(await token({}), PROJECT, jwks)).toBe('uid123');
  });
  it('başka projenin jetonunu reddeder', async () => {
    await expect(verifyFirebaseToken(await token({ aud: 'baska-proje' }), PROJECT, jwks)).rejects.toThrow();
  });
  it('yanlış yayıncıyı reddeder', async () => {
    await expect(verifyFirebaseToken(await token({ iss: 'https://evil.example' }), PROJECT, jwks)).rejects.toThrow();
  });
  it('süresi dolmuş jetonu reddeder', async () => {
    await expect(verifyFirebaseToken(await token({ exp: '-1m' }), PROJECT, jwks)).rejects.toThrow();
  });
});
