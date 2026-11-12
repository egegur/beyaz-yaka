import type { Me, Plan, Win } from '../shared/types';
import type { Env } from './env';
import { num } from './env';

export interface UserRow {
  id: string;
  created_at: number;
  age_confirmed: number;
  role: string | null;
  sector: string | null;
  experience: string | null;
  needs: string;
  age_range: string | null;
  company_size: string | null;
  manages: string | null;
  city: string | null;
  extra_done: number;
  trial_ends_at: number;
  sub_until: number;
  cv_credits: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Türkiye saatine göre gün anahtarı (YYYY-MM-DD). Kotalar gece yarısı (TSİ) sıfırlanır. */
export function dayKey(now: number): string {
  return new Date(now + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function planOf(u: Pick<UserRow, 'trial_ends_at' | 'sub_until'>, now: number): Plan {
  if (u.sub_until > now) return 'sub';
  if (u.trial_ends_at > now) return 'trial';
  return 'expired';
}

export function dailyLimitOf(env: Env, plan: Plan): number {
  if (plan === 'sub') return num(env.SUB_DAILY_AI_CALLS, 60);
  if (plan === 'trial') return num(env.TRIAL_DAILY_AI_CALLS, 8);
  return 0;
}

export function safeJsonArray(s: string | null | undefined): string[] {
  try {
    const v = JSON.parse(s ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Kullanıcıyı getirir; yoksa deneme süresi başlatarak oluşturur. */
export async function getOrCreateUser(env: Env, id: string, now: number): Promise<UserRow> {
  const existing = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
  if (existing) return existing;
  const trialEnds = now + num(env.TRIAL_DAYS, 7) * DAY_MS;
  await env.DB.prepare(
    'INSERT OR IGNORE INTO users (id, created_at, trial_ends_at) VALUES (?, ?, ?)',
  )
    .bind(id, now, trialEnds)
    .run();
  const created = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
  if (!created) throw new Error('Kullanıcı oluşturulamadı');
  return created;
}

export async function usedToday(env: Env, userId: string, now: number): Promise<number> {
  const r = await env.DB.prepare('SELECT calls FROM usage_daily WHERE user_id = ? AND day = ?')
    .bind(userId, dayKey(now))
    .first<{ calls: number }>();
  return r?.calls ?? 0;
}

export async function toMe(env: Env, u: UserRow, now: number): Promise<Me> {
  const plan = planOf(u, now);
  return {
    id: u.id,
    ageConfirmed: u.age_confirmed === 1,
    role: u.role,
    sector: u.sector,
    experience: u.experience,
    needs: safeJsonArray(u.needs),
    ageRange: u.age_range,
    companySize: u.company_size,
    manages: u.manages,
    city: u.city,
    extraDone: u.extra_done === 1,
    plan,
    trialEndsAt: u.trial_ends_at,
    subUntil: u.sub_until,
    cvCredits: u.cv_credits,
    usedToday: await usedToday(env, u.id, now),
    dailyLimit: dailyLimitOf(env, plan),
  };
}

export function toWin(r: { id: string; text: string; tags: string; created_at: number }): Win {
  return { id: r.id, text: r.text, tags: safeJsonArray(r.tags), createdAt: r.created_at };
}

export async function recentWins(env: Env, userId: string, limit: number): Promise<Win[]> {
  const { results } = await env.DB.prepare(
    'SELECT id, text, tags, created_at FROM wins WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
  )
    .bind(userId, limit)
    .all<{ id: string; text: string; tags: string; created_at: number }>();
  return results.map(toWin);
}
