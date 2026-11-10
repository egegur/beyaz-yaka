import type { Env } from './env';
import { num } from './env';
import { HttpError } from './http';
import { dailyLimitOf, dayKey, planOf, usedToday, type UserRow } from './db';

/**
 * İki katmanlı harcama koruması:
 * 1) Kullanıcı başına günlük çağrı kotası (deneme / abonelik).
 * 2) Tüm uygulama için günlük dolar tavanı (DAILY_BUDGET_USD). Aşılırsa yapay zekâ o gün durur.
 * Üçüncü katman Anthropic konsolundaki aylık harcama limitidir (README'de anlatıldı).
 */
export async function assertCanCallAi(env: Env, user: UserRow, now: number): Promise<void> {
  const plan = planOf(user, now);
  if (plan === 'expired') {
    throw new HttpError(402, 'trial_ended', 'Deneme süren bitti. Devam etmek için abone olabilirsin.');
  }
  const limit = dailyLimitOf(env, plan);
  if ((await usedToday(env, user.id, now)) >= limit) {
    throw new HttpError(429, 'daily_limit', 'Bugünkü kullanım hakkın doldu. Yarın tekrar görüşelim.');
  }
  const spent = await env.DB.prepare('SELECT usd FROM spend_daily WHERE day = ?')
    .bind(dayKey(now))
    .first<{ usd: number }>();
  if ((spent?.usd ?? 0) >= num(env.DAILY_BUDGET_USD, 3)) {
    throw new HttpError(503, 'budget', 'Koç bugün için dinlenmede. Lütfen yarın tekrar dene.');
  }
}

export async function recordAiUsage(env: Env, userId: string, now: number, costUsd: number): Promise<void> {
  const day = dayKey(now);
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO usage_daily (user_id, day, calls) VALUES (?, ?, 1) ON CONFLICT(user_id, day) DO UPDATE SET calls = calls + 1',
    ).bind(userId, day),
    env.DB.prepare(
      'INSERT INTO spend_daily (day, usd) VALUES (?, ?) ON CONFLICT(day) DO UPDATE SET usd = usd + excluded.usd',
    ).bind(day, costUsd),
  ]);
}

/** Yalnızca harcamayı kaydeder (başarısız ama ücretlenmiş çağrılar için; kullanıcı kotasından düşmez). */
export async function recordSpendOnly(env: Env, now: number, costUsd: number): Promise<void> {
  if (costUsd <= 0) return;
  await env.DB.prepare(
    'INSERT INTO spend_daily (day, usd) VALUES (?, ?) ON CONFLICT(day) DO UPDATE SET usd = usd + excluded.usd',
  )
    .bind(dayKey(now), costUsd)
    .run();
}
