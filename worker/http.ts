export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

const SECURITY_HEADERS: Record<string, string> = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: SECURITY_HEADERS });
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return json({ error: { code: err.code, message: err.message } }, err.status);
  }
  console.error('Beklenmeyen hata', err);
  return json({ error: { code: 'internal', message: 'Bir hata oluştu. Lütfen tekrar deneyin.' } }, 500);
}

export async function readJson(req: Request, maxBytes = 120_000): Promise<Record<string, unknown>> {
  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > maxBytes) throw new HttpError(413, 'too_large', 'İstek çok büyük.');
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, 'too_large', 'İstek çok büyük.');
  try {
    const data = JSON.parse(text);
    if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
  } catch {
    /* aşağıda hata */
  }
  throw new HttpError(400, 'bad_json', 'Geçersiz istek.');
}

/** Zorunlu/opsiyonel metin alanı: kırpar, uzunluk sınırı uygular. */
export function str(body: Record<string, unknown>, key: string, max: number, required = true): string {
  const v = body[key];
  if (v === undefined || v === null || v === '') {
    if (required) throw new HttpError(400, 'missing_field', `Eksik alan: ${key}`);
    return '';
  }
  if (typeof v !== 'string') throw new HttpError(400, 'bad_field', `Geçersiz alan: ${key}`);
  const t = v.trim();
  if (required && !t) throw new HttpError(400, 'missing_field', `Eksik alan: ${key}`);
  if (t.length > max) throw new HttpError(400, 'field_too_long', `${key} en fazla ${max} karakter olabilir.`);
  return t;
}
