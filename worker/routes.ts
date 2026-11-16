import type { AiResult, AnlatOutput, CvOutput, HistoryItem, ProvaOutput, ProvaTurn, ToolId, ToolOutputs } from '../shared/types';
import { assertCanCallAi, assertCanProvaTurn, recordAiUsage, recordProvaTurn, recordSpendOnly } from './budget';
import { callClaudeTool, costOf } from './claude';
import { dayKey, getOrCreateUser, recentWins, toMe, toWin, type UserRow } from './db';
import type { Env } from './env';
import { num } from './env';
import { HttpError, json, readJson, str } from './http';
import {
  ANLAT_SCHEMA,
  ANLAT_TASK,
  BASE_SYSTEM,
  CV_SCHEMA,
  CV_TASK,
  MULAKAT_TASK,
  PROVA_SCHEMA,
  PROVA_TASK,
  REVIZE_TASK,
  TOOLS,
  dataBlock,
  profileFields,
  winsBlock,
  type ToolDef,
} from './prompts';
import { screen } from './safety';
import {
  AGE_OPTIONS,
  CITY_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  EXPERIENCE_OPTIONS,
  MANAGES_OPTIONS,
  NEED_OPTIONS,
} from '../shared/options';
import { sanitizeAnlat, sanitizeCv, sanitizeProva, sanitizeTool } from './sanitize';

const MAX_WINS = 500;

export interface Ctx {
  env: Env;
  userId: string;
  now: number;
}

function newId(): string {
  return crypto.randomUUID();
}

function requireAge(u: UserRow): void {
  if (u.age_confirmed !== 1) throw new HttpError(403, 'age_required', 'Devam etmek için profilini tamamlamalısın.');
}

/** Başarısız ama ücretlenmiş çağrının maliyetini kaydedip hatayı yeniden fırlatır. */
async function withSpendOnError<T>(ctx: Ctx, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const usage = (e as { usage?: { inputTokens: number; outputTokens: number } }).usage;
    if (usage) {
      await recordSpendOnly(ctx.env, ctx.now, costOf(ctx.env, usage.inputTokens, usage.outputTokens));
    }
    throw e;
  }
}

// ---------- Profil ----------

export async function getMe(ctx: Ctx): Promise<Response> {
  const u = await getOrCreateUser(ctx.env, ctx.userId, ctx.now);
  return json(await toMe(ctx.env, u, ctx.now));
}

/** Yalnızca gövdede gelen alanları günceller (kısmi güncelleme). */
export async function putMe(ctx: Ctx, req: Request): Promise<Response> {
  const body = await readJson(req, 10_000);
  await getOrCreateUser(ctx.env, ctx.userId, ctx.now);
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];
  const set = (col: string, v: string | number | null) => {
    sets.push(`${col} = ?`);
    vals.push(v);
  };
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);

  if (has('role')) set('role', str(body, 'role', 120, false) || null);
  if (has('sector')) set('sector', str(body, 'sector', 80, false) || null);
  const enumField = (key: string, col: string, options: string[]) => {
    if (!has(key)) return;
    const v = str(body, key, 40, false);
    if (v && !options.includes(v)) throw new HttpError(400, 'bad_field', `Geçersiz seçim: ${key}`);
    set(col, v || null);
  };
  enumField('experience', 'experience', EXPERIENCE_OPTIONS);
  enumField('ageRange', 'age_range', AGE_OPTIONS);
  enumField('companySize', 'company_size', COMPANY_SIZE_OPTIONS);
  enumField('manages', 'manages', MANAGES_OPTIONS);
  enumField('city', 'city', CITY_OPTIONS);
  if (has('needs')) {
    const needs = Array.isArray(body.needs)
      ? body.needs.filter((n): n is string => typeof n === 'string' && NEED_OPTIONS.includes(n))
      : [];
    set('needs', JSON.stringify([...new Set(needs)]));
  }
  if (body.ageConfirmed === true) set('age_confirmed', 1);
  if (body.extraDone === true) set('extra_done', 1);

  if (sets.length) {
    await ctx.env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...vals, ctx.userId)
      .run();
  }
  const updated = await getOrCreateUser(ctx.env, ctx.userId, ctx.now);
  return json(await toMe(ctx.env, updated, ctx.now));
}

/** KVKK: hesabın ve tüm kayıtların silinmesi. Firebase hesabı ön yüzde ayrıca silinir. */
export async function deleteMe(ctx: Ctx): Promise<Response> {
  const db = ctx.env.DB;
  await db.batch([
    db.prepare('DELETE FROM wins WHERE user_id = ?').bind(ctx.userId),
    db.prepare('DELETE FROM outputs WHERE user_id = ?').bind(ctx.userId),
    db.prepare('DELETE FROM usage_daily WHERE user_id = ?').bind(ctx.userId),
    db.prepare('DELETE FROM reports WHERE user_id = ?').bind(ctx.userId),
    db.prepare('DELETE FROM feedback WHERE user_id = ?').bind(ctx.userId),
    db.prepare('DELETE FROM users WHERE id = ?').bind(ctx.userId),
  ]);
  return json({ deleted: true });
}

// ---------- Kazanım günlüğü ----------

export async function listWins(ctx: Ctx): Promise<Response> {
  await getOrCreateUser(ctx.env, ctx.userId, ctx.now);
  return json(await recentWins(ctx.env, ctx.userId, 100));
}

export async function addWin(ctx: Ctx, req: Request): Promise<Response> {
  const body = await readJson(req, 10_000);
  const text = str(body, 'text', 1000);
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === 'string').map((t) => t.trim().slice(0, 30)).filter(Boolean).slice(0, 5)
    : [];
  await getOrCreateUser(ctx.env, ctx.userId, ctx.now);
  const count = await ctx.env.DB.prepare('SELECT COUNT(*) AS n FROM wins WHERE user_id = ?').bind(ctx.userId).first<{ n: number }>();
  if ((count?.n ?? 0) >= MAX_WINS) throw new HttpError(400, 'too_many', 'Günlük kayıt sınırına ulaştın. Eski kayıtları silebilirsin.');
  const row = { id: newId(), text, tags: JSON.stringify(tags), created_at: ctx.now };
  await ctx.env.DB.prepare('INSERT INTO wins (id, user_id, text, tags, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(row.id, ctx.userId, row.text, row.tags, row.created_at)
    .run();
  return json(toWin(row), 201);
}

export async function deleteWin(ctx: Ctx, id: string): Promise<Response> {
  await ctx.env.DB.prepare('DELETE FROM wins WHERE id = ? AND user_id = ?').bind(id, ctx.userId).run();
  return json({ deleted: true });
}

// ---------- Araçlar ----------

export function isToolId(id: string): id is ToolId {
  return Object.prototype.hasOwnProperty.call(TOOLS, id);
}

function stripTags(t: string): string {
  return t.replace(/<\/?kullanici_verisi>/gi, '');
}

/** Ortak araç çalıştırma: kota, Claude çağrısı, temizleme, (isteğe bağlı) saklama. */
async function executeTool<K extends ToolId>(
  ctx: Ctx,
  toolId: K,
  user: UserRow,
  fields: Record<string, string>,
  extra: string,
  fetcher: typeof fetch,
): Promise<ToolOutputs[K]> {
  const def: ToolDef = TOOLS[toolId];
  await assertCanCallAi(ctx.env, user, ctx.now);

  let content = `${def.task}\n\n${dataBlock({ ...profileFields(user), ...fields })}`;
  if (def.useWins) {
    const wins = await recentWins(ctx.env, ctx.userId, 30);
    content += `\n\nKazanım günlüğü (veri):\n<kullanici_verisi>\n${stripTags(winsBlock(wins))}\n</kullanici_verisi>`;
  }
  if (extra) content += `\n\n${extra}`;

  const result = await withSpendOnError(ctx, () =>
    callClaudeTool<unknown>(
      ctx.env,
      { system: BASE_SYSTEM, messages: [{ role: 'user', content }], tool: def.schema, maxTokens: def.maxTokens },
      fetcher,
    ),
  );
  await recordAiUsage(ctx.env, ctx.userId, ctx.now, result.costUsd);
  const output = sanitizeTool(toolId, result.data);

  if (def.save !== false) {
    const stored: Record<string, string> = {};
    for (const f of def.fields) stored[f.label] = fields[f.label] ?? '';
    await ctx.env.DB.prepare('INSERT INTO outputs (id, user_id, tool, input, output, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(newId(), ctx.userId, toolId, JSON.stringify(stored), JSON.stringify(output), ctx.now)
      .run();
    // Her araç için yalnızca son 10 çıktı tutulur (veri en aza indirme).
    await ctx.env.DB.prepare(
      'DELETE FROM outputs WHERE user_id = ? AND tool = ? AND id NOT IN (SELECT id FROM outputs WHERE user_id = ? AND tool = ? ORDER BY created_at DESC, rowid DESC LIMIT 10)',
    )
      .bind(ctx.userId, toolId, ctx.userId, toolId)
      .run();
  }
  return output;
}

export async function runTool(
  ctx: Ctx,
  toolId: ToolId,
  req: Request,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  const def = TOOLS[toolId];
  const body = await readJson(req, 80_000);
  const fields: Record<string, string> = {};
  for (const f of def.fields) fields[f.label] = str(body, f.key, f.max, f.required);

  const { block, note } = screen(Object.values(fields));
  if (block) return json({ ok: false, notice: block } satisfies AiResult<never>);

  const user = await getOrCreateUser(ctx.env, ctx.userId, ctx.now);
  requireAge(user);
  const output = await executeTool(ctx, toolId, user, fields, '', fetcher);
  return json({ ok: true, output, notice: note } satisfies AiResult<ToolOutputs[typeof toolId]>);
}

/**
 * Takip isteği: kullanıcı önceki çıktıyı tek cümleyle değiştirtir ("daha kısa", "şu itirazı ekle").
 * Önceki çıktı istemciden gelir ve yeniden temizlenir; aynı yapıda yeni çıktı döner.
 */
export async function reviseTool(
  ctx: Ctx,
  toolId: ToolId,
  req: Request,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  const body = await readJson(req, 40_000);
  const instruction = str(body, 'instruction', 500);
  const previous = sanitizeTool(toolId, body.output);
  const prevJson = JSON.stringify(previous);
  if (prevJson.length > 20_000) throw new HttpError(413, 'too_large', 'Çıktı çok büyük.');

  const { block, note } = screen([instruction]);
  if (block) return json({ ok: false, notice: block } satisfies AiResult<never>);

  const user = await getOrCreateUser(ctx.env, ctx.userId, ctx.now);
  requireAge(user);
  const extra = `${REVIZE_TASK}\n\nÖnceki çıktı (veri):\n<kullanici_verisi>\n${stripTags(prevJson)}\n</kullanici_verisi>\n\nKullanıcının isteği (veri):\n<kullanici_verisi>\n${stripTags(instruction)}\n</kullanici_verisi>`;
  const output = await executeTool(ctx, toolId, user, {}, extra, fetcher);
  return json({ ok: true, output, notice: note } satisfies AiResult<ToolOutputs[typeof toolId]>);
}

export async function latestOutput(ctx: Ctx, toolId: ToolId): Promise<Response> {
  const row = await ctx.env.DB.prepare(
    'SELECT output, created_at FROM outputs WHERE user_id = ? AND tool = ? ORDER BY created_at DESC, rowid DESC LIMIT 1',
  )
    .bind(ctx.userId, toolId)
    .first<{ output: string; created_at: number }>();
  if (!row) return json(null);
  return json({ output: JSON.parse(row.output), createdAt: row.created_at });
}

/** Bir aracın son 10 çıktısı (yeniden eskiye). */
export async function outputHistory(ctx: Ctx, toolId: ToolId): Promise<Response> {
  const { results } = await ctx.env.DB.prepare(
    'SELECT id, output, created_at FROM outputs WHERE user_id = ? AND tool = ? ORDER BY created_at DESC, rowid DESC LIMIT 10',
  )
    .bind(ctx.userId, toolId)
    .all<{ id: string; output: string; created_at: number }>();
  const items: HistoryItem<unknown>[] = results.map((r) => ({ id: r.id, output: JSON.parse(r.output), createdAt: r.created_at }));
  return json(items);
}

// ---------- "Ne oluyor, anlat" ----------

export async function runAnlat(ctx: Ctx, req: Request, fetcher: typeof fetch = fetch): Promise<Response> {
  const body = await readJson(req, 10_000);
  const text = str(body, 'text', 2000);
  const { block, note } = screen([text]);
  if (block) return json({ ok: false, notice: block } satisfies AiResult<never>);

  const user = await getOrCreateUser(ctx.env, ctx.userId, ctx.now);
  requireAge(user);
  await assertCanCallAi(ctx.env, user, ctx.now);
  const content = `${ANLAT_TASK}\n\n${dataBlock({ ...profileFields(user), 'Kullanıcının anlattığı': text })}`;
  const result = await withSpendOnError(ctx, () =>
    callClaudeTool<unknown>(
      ctx.env,
      { system: BASE_SYSTEM, messages: [{ role: 'user', content }], tool: ANLAT_SCHEMA, maxTokens: 1000 },
      fetcher,
    ),
  );
  await recordAiUsage(ctx.env, ctx.userId, ctx.now, result.costUsd);
  // Anlatılan metin sunucuda saklanmaz.
  return json({ ok: true, output: sanitizeAnlat(result.data), notice: note } satisfies AiResult<AnlatOutput>);
}

// ---------- "İşe yaradı mı?" ----------

const FEEDBACK_TOOLS = [...Object.keys(TOOLS), 'anlat', 'prova', 'mulakat', 'cv'];

export async function feedback(ctx: Ctx, req: Request): Promise<Response> {
  const body = await readJson(req, 5_000);
  const tool = str(body, 'tool', 20);
  if (!FEEDBACK_TOOLS.includes(tool)) throw new HttpError(400, 'bad_field', 'Geçersiz araç.');
  if (typeof body.useful !== 'boolean') throw new HttpError(400, 'bad_field', 'Geçersiz geri bildirim.');
  const note = str(body, 'note', 300, false) || null;
  await ctx.env.DB.prepare('INSERT INTO feedback (id, user_id, tool, useful, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(newId(), ctx.userId, tool, body.useful ? 1 : 0, note, ctx.now)
    .run();
  return json({ received: true }, 201);
}

// ---------- Prova (rol yapma) ----------

const DIFFICULTY = ['kolay', 'orta', 'zor'];

export function parseHistory(v: unknown): ProvaTurn[] {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > 30) throw new HttpError(400, 'bad_field', 'Geçersiz konuşma geçmişi.');
  return v.map((t) => {
    const r = t as Record<string, unknown>;
    if ((r.role !== 'user' && r.role !== 'counterpart') || typeof r.text !== 'string' || r.text.length > 1000) {
      throw new HttpError(400, 'bad_field', 'Geçersiz konuşma geçmişi.');
    }
    return { role: r.role, text: r.text.trim() };
  });
}

export async function runProva(ctx: Ctx, req: Request, fetcher: typeof fetch = fetch): Promise<Response> {
  const body = await readJson(req, 60_000);
  const scenario = str(body, 'scenario', 600);
  let counterpart = str(body, 'counterpart', 60, false) || 'Yönetici';
  const difficulty = str(body, 'difficulty', 10, false) || 'orta';
  if (!DIFFICULTY.includes(difficulty)) throw new HttpError(400, 'bad_field', 'Geçersiz zorluk.');
  const mode = str(body, 'mode', 10, false) || 'konusma';
  if (mode !== 'konusma' && mode !== 'mulakat') throw new HttpError(400, 'bad_field', 'Geçersiz prova türü.');
  const jobText = mode === 'mulakat' ? str(body, 'jobText', 4000, false) : '';
  if (mode === 'mulakat') counterpart = 'Mülakatçı';
  const history = parseHistory(body.history);
  const opening = !history.some((t) => t.role === 'user');

  const lastUser = [...history].reverse().find((t) => t.role === 'user')?.text ?? '';
  const { block, note } = screen([scenario, lastUser, jobText]);
  if (block) return json({ ok: false, notice: block } satisfies AiResult<never>);

  const user = await getOrCreateUser(ctx.env, ctx.userId, ctx.now);
  requireAge(user);
  // Oturumun açılışı 1 araç hakkı; devam turları ayrı günlük tur sınırından düşer.
  if (opening) await assertCanCallAi(ctx.env, user, ctx.now);
  else await assertCanProvaTurn(ctx.env, user, ctx.now);

  const transcript = history.length
    ? history.map((t) => `${t.role === 'user' ? 'Kullanıcı' : counterpart}: ${t.text}`).join('\n')
    : '(Konuşma henüz başlamadı.)';
  const ctxFields: Record<string, string> =
    mode === 'mulakat'
      ? { ...profileFields(user), 'Mülakat yapılan rol': scenario, 'İş ilanı': jobText, Zorluk: difficulty }
      : { ...profileFields(user), Senaryo: scenario, 'Karşı taraf': counterpart, Zorluk: difficulty };
  const content = `${dataBlock(ctxFields)}\n\nKonuşma dökümü (veri):\n<kullanici_verisi>\n${transcript.replace(/<\/?kullanici_verisi>/gi, '')}\n</kullanici_verisi>\n\nŞimdi ${counterpart} olarak bir sonraki repliği ver.`;

  const result = await withSpendOnError(ctx, () =>
    callClaudeTool<unknown>(
      ctx.env,
      {
        system: `${BASE_SYSTEM}\n\n${mode === 'mulakat' ? MULAKAT_TASK : PROVA_TASK}`,
        messages: [{ role: 'user', content }],
        tool: PROVA_SCHEMA,
        maxTokens: 700,
      },
      fetcher,
    ),
  );
  if (opening) await recordAiUsage(ctx.env, ctx.userId, ctx.now, result.costUsd);
  else await recordProvaTurn(ctx.env, ctx.userId, ctx.now, result.costUsd);
  // Prova konuşmaları sunucuda saklanmaz.
  return json({ ok: true, output: sanitizeProva(result.data), notice: note } satisfies AiResult<ProvaOutput>);
}

// ---------- ATS CV skoru (ücretli) ----------

export async function runCv(ctx: Ctx, req: Request, fetcher: typeof fetch = fetch): Promise<Response> {
  const body = await readJson(req, 100_000);
  const cvText = str(body, 'cvText', 20_000);
  const jobText = str(body, 'jobText', 8_000);
  if (cvText.length < 200) throw new HttpError(400, 'cv_too_short', 'CV metni çok kısa görünüyor. PDF okunamamış olabilir.');

  const user = await getOrCreateUser(ctx.env, ctx.userId, ctx.now);
  requireAge(user);

  // Global bütçe kontrolü (kullanıcı kotasından bağımsız; araç ayrıca ücretli).
  const spent = await ctx.env.DB.prepare('SELECT usd FROM spend_daily WHERE day = ?').bind(dayKey(ctx.now)).first<{ usd: number }>();
  if ((spent?.usd ?? 0) >= num(ctx.env.DAILY_BUDGET_USD, 3)) {
    throw new HttpError(503, 'budget', 'Araç bugün için dinlenmede. Lütfen yarın tekrar dene; hakkın düşmedi.');
  }

  // Hakkı önce ayır; başarısız olursa iade et.
  const reserved = await ctx.env.DB.prepare('UPDATE users SET cv_credits = cv_credits - 1 WHERE id = ? AND cv_credits > 0')
    .bind(ctx.userId)
    .run();
  if (!reserved.meta.changes) throw new HttpError(402, 'cv_payment', 'ATS CV skoru ücretli bir araçtır. Kullanmak için hak satın almalısın.');

  try {
    const content = `${CV_TASK}\n\n<kullanici_verisi>\nİŞ İLANI:\n${jobText.replace(/<\/?kullanici_verisi>/gi, '')}\n\nCV:\n${cvText.replace(/<\/?kullanici_verisi>/gi, '')}\n</kullanici_verisi>`;
    const result = await withSpendOnError(ctx, () =>
      callClaudeTool<unknown>(
        ctx.env,
        { system: BASE_SYSTEM, messages: [{ role: 'user', content }], tool: CV_SCHEMA, maxTokens: 1500 },
        fetcher,
      ),
    );
    await recordSpendOnly(ctx.env, ctx.now, result.costUsd);
    // CV metni saklanmaz; yalnızca sonuç döner.
    return json({ ok: true, output: sanitizeCv(result.data), notice: null } satisfies AiResult<CvOutput>);
  } catch (e) {
    await ctx.env.DB.prepare('UPDATE users SET cv_credits = cv_credits + 1 WHERE id = ?').bind(ctx.userId).run();
    throw e;
  }
}

// ---------- Çıktı bildirme ----------

export async function report(ctx: Ctx, req: Request): Promise<Response> {
  const body = await readJson(req, 20_000);
  const tool = str(body, 'tool', 20);
  const reason = str(body, 'reason', 300);
  const content = str(body, 'content', 8000);
  await ctx.env.DB.prepare('INSERT INTO reports (id, user_id, tool, reason, content, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(newId(), ctx.userId, tool, reason, content, ctx.now)
    .run();
  return json({ received: true }, 201);
}
