import { readFileSync, readdirSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getPlatformProxy } from 'wrangler';
import { dayKey } from '../worker/db';
import type { Env } from '../worker/env';
import { errorResponse } from '../worker/http';
import { handleApi } from '../worker/index';

/**
 * Gerçek (yerel) D1 veritabanıyla uçtan uca API testleri.
 * Claude API'si sahte bir fetch ile taklit edilir; gerçek çağrı yapılmaz.
 */

let proxy: Awaited<ReturnType<typeof getPlatformProxy<Env>>>;
let env: Env;
const NOW = Date.UTC(2026, 10, 10, 9, 0, 0);
const DAY = 86_400_000;

let claudeCalls = 0;
let claudeReply: unknown = {};
let claudeStatus = 200;
let lastClaudeBody: any = null;
const fakeFetch = (async (_url: unknown, init?: RequestInit) => {
  claudeCalls++;
  const body = JSON.parse(String(init?.body ?? '{}'));
  lastClaudeBody = body;
  if (claudeStatus !== 200) return new Response('{}', { status: claudeStatus });
  return new Response(
    JSON.stringify({
      content: [{ type: 'tool_use', name: body.tool_choice.name, input: claudeReply }],
      usage: { input_tokens: 1000, output_tokens: 500 },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}) as typeof fetch;

async function call(method: string, path: string, opts: { user?: string; body?: unknown; now?: number; origin?: string; host?: string } = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.user !== '') headers['x-dev-user'] = opts.user ?? 'ayse';
  if (opts.origin) headers.origin = opts.origin;
  const req = new Request(`${opts.host ?? 'http://127.0.0.1:8787'}${path}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  let res: Response;
  try {
    res = await handleApi(req, env, opts.now ?? NOW, fakeFetch);
  } catch (e) {
    res = errorResponse(e);
  }
  return { status: res.status, data: (await res.json()) as any };
}

async function onboard(user = 'ayse') {
  return call('PUT', '/api/me', {
    user,
    body: { role: 'Finans uzmanı', sector: 'Bankacılık', experience: '3–7 yıl', needs: ['Yükselmek'], ageConfirmed: true },
  });
}

beforeAll(async () => {
  proxy = await getPlatformProxy<Env>({ configPath: './wrangler.jsonc', persist: false });
  env = { ...proxy.env, ANTHROPIC_API_KEY: 'test-key', DEV_AUTH: '1', TRIAL_DAILY_AI_CALLS: '3', DAILY_BUDGET_USD: '3' };
  for (const file of readdirSync('migrations').filter((f) => f.endsWith('.sql')).sort()) {
    const sql = readFileSync(`migrations/${file}`, 'utf8')
      .split('\n')
      .filter((l) => !l.trim().startsWith('--'))
      .join('\n');
    for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) {
      await env.DB.prepare(stmt).run();
    }
  }
}, 60_000);

afterAll(async () => {
  await proxy?.dispose();
});

beforeEach(async () => {
  claudeCalls = 0;
  claudeStatus = 200;
  for (const t of ['wins', 'outputs', 'usage_daily', 'spend_daily', 'reports', 'users']) {
    await env.DB.prepare(`DELETE FROM ${t}`).run();
  }
});

describe('kimlik ve profil', () => {
  it('girişsiz isteği reddeder', async () => {
    const r = await call('GET', '/api/me', { user: '' });
    expect(r.status).toBe(401);
  });

  it('geliştirici girişi canlı adreste çalışmaz', async () => {
    const r = await call('GET', '/api/me', { host: 'https://uygulama.example' });
    expect(r.status).toBe(401);
  });

  it('ilk girişte 7 günlük deneme başlatır', async () => {
    const r = await call('GET', '/api/me');
    expect(r.status).toBe(200);
    expect(r.data.plan).toBe('trial');
    expect(r.data.trialEndsAt).toBe(NOW + 7 * DAY);
    expect(r.data.ageConfirmed).toBe(false);
    expect(r.data.dailyLimit).toBe(3);
  });

  it('profili günceller, geçersiz deneyimi reddeder', async () => {
    const ok = await onboard();
    expect(ok.data.role).toBe('Finans uzmanı');
    expect(ok.data.needs).toEqual(['Yükselmek']);
    expect(ok.data.ageConfirmed).toBe(true);
    const bad = await call('PUT', '/api/me', { body: { experience: '100 yıl' } });
    expect(bad.status).toBe(400);
  });

  it('başka kökenden yazma isteğini canlıda reddeder', async () => {
    const saved = env.DEV_AUTH;
    env.DEV_AUTH = '0';
    const r = await call('PUT', '/api/me', { user: '', origin: 'https://evil.example', host: 'https://uygulama.example', body: {} });
    env.DEV_AUTH = saved;
    expect(r.status).toBe(403);
  });
});

describe('isteğe bağlı demografik sorular', () => {
  it('kısmi güncelleme: yalnızca gelen alanları değiştirir', async () => {
    await onboard();
    const r = await call('PUT', '/api/me', {
      body: { ageRange: '25–34', companySize: '1000+ çalışan', manages: '1–5 kişi', city: 'Belirtmek istemiyorum', extraDone: true },
    });
    expect(r.status).toBe(200);
    expect(r.data.role).toBe('Finans uzmanı');
    expect(r.data.needs).toEqual(['Yükselmek']);
    expect(r.data).toMatchObject({ ageRange: '25–34', companySize: '1000+ çalışan', manages: '1–5 kişi', city: 'Belirtmek istemiyorum', extraDone: true });
  });

  it('atlanınca alanlar boş kalır ama adım tamamlanmış sayılır', async () => {
    await onboard();
    const r = await call('PUT', '/api/me', { body: { extraDone: true } });
    expect(r.data).toMatchObject({ ageRange: null, companySize: null, manages: null, city: null, extraDone: true });
  });

  it('listede olmayan değeri reddeder', async () => {
    await onboard();
    expect((await call('PUT', '/api/me', { body: { ageRange: '29' } })).status).toBe(400);
    expect((await call('PUT', '/api/me', { body: { city: 'Bursa' } })).status).toBe(400);
  });

  it('koça profil bağlamını verir, "belirtmek istemiyorum" cevabını göndermez', async () => {
    await onboard();
    await call('PUT', '/api/me', { body: { ageRange: '35–44', companySize: '51–250 çalışan', manages: 'Hayır', city: 'Belirtmek istemiyorum' } });
    claudeReply = { assessment: 'a', risks: [], rewritten: 'b' };
    await call('POST', '/api/tools/ton', { body: { message: 'Merhaba' } });
    const content: string = lastClaudeBody.messages[0].content;
    expect(content).toContain('Şirket büyüklüğü: 51–250 çalışan');
    expect(content).toContain('Yaş aralığı: 35–44');
    expect(content).toContain('Ekip yönetimi: Ekip yönetmiyor');
    expect(content).not.toContain('Belirtmek istemiyorum');
    expect(content).not.toContain('Şehir:');
  });
});

describe('kazanım günlüğü', () => {
  it('ekler, listeler ve yalnızca sahibine sildirir', async () => {
    const add = await call('POST', '/api/wins', { body: { text: 'Raporlamayı otomatikleştirdim', tags: ['Verimlilik'] } });
    expect(add.status).toBe(201);
    const list = await call('GET', '/api/wins');
    expect(list.data).toHaveLength(1);
    const other = await call('DELETE', `/api/wins/${add.data.id}`, { user: 'mehmet' });
    expect(other.status).toBe(200);
    expect((await call('GET', '/api/wins')).data).toHaveLength(1);
    await call('DELETE', `/api/wins/${add.data.id}`);
    expect((await call('GET', '/api/wins')).data).toHaveLength(0);
  });

  it('boş metni reddeder', async () => {
    expect((await call('POST', '/api/wins', { body: { text: '  ' } })).status).toBe(400);
  });
});

describe('yapay zekâ araçları', () => {
  it('profil (18+ onayı) tamamlanmadan çalışmaz', async () => {
    const r = await call('POST', '/api/tools/ton', { body: { message: 'Merhaba' } });
    expect(r.status).toBe(403);
    expect(claudeCalls).toBe(0);
  });

  it('aracı çalıştırır, çıktıyı temizler, kullanımı ve harcamayı kaydeder', async () => {
    await onboard();
    claudeReply = { assessment: 'Biraz sert', risks: ['"Hemen"'], rewritten: 'Uygun olduğunda bakabilir misin?' };
    const r = await call('POST', '/api/tools/ton', { body: { message: 'Bunu hemen yap.', recipient: 'ekip' } });
    expect(r.status).toBe(200);
    expect(r.data.ok).toBe(true);
    expect(r.data.output.rewritten).toContain('Uygun');
    expect(r.data.notice).toBeNull();
    const me = await call('GET', '/api/me');
    expect(me.data.usedToday).toBe(1);
    const spend = await env.DB.prepare('SELECT usd FROM spend_daily WHERE day = ?').bind(dayKey(NOW)).first<{ usd: number }>();
    // 1000 girdi x 2 $ + 500 çıktı x 10 $ = 0,007 $
    expect(spend?.usd).toBeCloseTo(0.007, 6);
    const latest = await call('GET', '/api/tools/ton');
    expect(latest.data.output.assessment).toBe('Biraz sert');
  });

  it('eksik zorunlu alanı reddeder', async () => {
    await onboard();
    expect((await call('POST', '/api/tools/birebir', { body: {} })).status).toBe(400);
  });

  it('kriz sinyalinde yapay zekâyı çağırmaz, 112 yönlendirmesi döner', async () => {
    await onboard();
    const r = await call('POST', '/api/tools/birebir', { body: { goal: 'Artık yaşamak istemiyorum' } });
    expect(r.status).toBe(200);
    expect(r.data.ok).toBe(false);
    expect(r.data.notice.kind).toBe('crisis');
    expect(claudeCalls).toBe(0);
    expect((await call('GET', '/api/me')).data.usedToday).toBe(0);
  });

  it('iş hukuku konusunda hukuki not ekler', async () => {
    await onboard();
    claudeReply = { reasons: [], script: 'x', ifNo: [], prep: [] };
    const r = await call('POST', '/api/tools/maas', { body: { context: 'Kıdem tazminatı alıp ayrılmak istiyorum' } });
    expect(r.data.ok).toBe(true);
    expect(r.data.notice.kind).toBe('legal');
  });

  it('günlük kotayı uygular', async () => {
    await onboard();
    claudeReply = { assessment: 'a', risks: [], rewritten: 'b' };
    for (let i = 0; i < 3; i++) expect((await call('POST', '/api/tools/ton', { body: { message: 'x' } })).status).toBe(200);
    const r = await call('POST', '/api/tools/ton', { body: { message: 'x' } });
    expect(r.status).toBe(429);
    expect(r.data.error.code).toBe('daily_limit');
    // Ertesi gün sıfırlanır.
    expect((await call('POST', '/api/tools/ton', { body: { message: 'x' }, now: NOW + DAY })).status).toBe(200);
  });

  it('deneme bitince 402 döner', async () => {
    await onboard();
    const r = await call('POST', '/api/tools/ton', { body: { message: 'x' }, now: NOW + 8 * DAY });
    expect(r.status).toBe(402);
    expect(r.data.error.code).toBe('trial_ended');
  });

  it('günlük harcama tavanı dolunca durur', async () => {
    await onboard();
    await env.DB.prepare('INSERT INTO spend_daily (day, usd) VALUES (?, 3.01)').bind(dayKey(NOW)).run();
    const r = await call('POST', '/api/tools/ton', { body: { message: 'x' } });
    expect(r.status).toBe(503);
    expect(r.data.error.code).toBe('budget');
    expect(claudeCalls).toBe(0);
  });

  it('Claude hatasında kotayı düşürmez', async () => {
    await onboard();
    claudeStatus = 529;
    const r = await call('POST', '/api/tools/ton', { body: { message: 'x' } });
    expect(r.status).toBe(503);
    expect((await call('GET', '/api/me')).data.usedToday).toBe(0);
  });
});

describe('prova', () => {
  it('rol yapma turunu döndürür ve geçmişi doğrular', async () => {
    await onboard();
    claudeReply = { reply: 'İş yükün zaten yoğun değil mi?', coachNote: null };
    const r = await call('POST', '/api/prova', {
      body: { scenario: 'Yeni projede sorumluluk istemek', difficulty: 'orta', history: [] },
    });
    expect(r.data.ok).toBe(true);
    expect(r.data.output).toEqual({ reply: 'İş yükün zaten yoğun değil mi?', coachNote: null });
    const bad = await call('POST', '/api/prova', { body: { scenario: 'x', history: [{ role: 'admin', text: 'y' }] } });
    expect(bad.status).toBe(400);
  });
});

describe('ATS CV skoru (ücretli)', () => {
  const cvText = 'Deneyim '.repeat(40);
  it('hakkı yoksa 402 döner ve yapay zekâyı çağırmaz', async () => {
    await onboard();
    const r = await call('POST', '/api/cv', { body: { cvText, jobText: 'Ürün yöneticisi' } });
    expect(r.status).toBe(402);
    expect(claudeCalls).toBe(0);
  });

  it('hak varsa çalışır ve bir hak düşer', async () => {
    await onboard();
    await env.DB.prepare('UPDATE users SET cv_credits = 2 WHERE id = ?').bind('dev_ayse').run();
    claudeReply = { score: 64, metrics: { keywords: 52, format: 70, sections: 75, impact: 45 }, missingKeywords: ['SQL'], tips: [] };
    const r = await call('POST', '/api/cv', { body: { cvText, jobText: 'Ürün yöneticisi' } });
    expect(r.data.output.score).toBe(64);
    expect((await call('GET', '/api/me')).data.cvCredits).toBe(1);
  });

  it('hata olursa hakkı iade eder', async () => {
    await onboard();
    await env.DB.prepare('UPDATE users SET cv_credits = 1 WHERE id = ?').bind('dev_ayse').run();
    claudeStatus = 500;
    expect((await call('POST', '/api/cv', { body: { cvText, jobText: 'İlan' } })).status).toBe(502);
    expect((await call('GET', '/api/me')).data.cvCredits).toBe(1);
  });
});

describe('hesap silme (KVKK)', () => {
  it('kullanıcının tüm verisini siler', async () => {
    await onboard();
    await call('POST', '/api/wins', { body: { text: 'Bir kazanım' } });
    await call('DELETE', '/api/me');
    const n = await env.DB.prepare('SELECT (SELECT COUNT(*) FROM users) + (SELECT COUNT(*) FROM wins) AS n').first<{ n: number }>();
    expect(n?.n).toBe(0);
  });
});
