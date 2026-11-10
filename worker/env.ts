export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ANTHROPIC_API_KEY: string;
  FIREBASE_PROJECT_ID: string;
  CLAUDE_MODEL: string;
  PRICE_IN_PER_MTOK: string;
  PRICE_OUT_PER_MTOK: string;
  DAILY_BUDGET_USD: string;
  TRIAL_DAYS: string;
  TRIAL_DAILY_AI_CALLS: string;
  SUB_DAILY_AI_CALLS: string;
  /** İsteğe bağlı: Claude API adresi (yerel testte sahte sunucu için). Boşsa api.anthropic.com. */
  ANTHROPIC_BASE_URL?: string;
  /** Yalnızca yerel geliştirme. "1" ise X-Dev-User başlığı kabul edilir. */
  DEV_AUTH?: string;
}

export function num(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
