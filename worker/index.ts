import { requireUser } from './auth';
import type { Env } from './env';
import { HttpError, errorResponse, json } from './http';
import {
  addWin,
  deleteMe,
  deleteWin,
  getMe,
  feedback,
  isToolId,
  latestOutput,
  outputHistory,
  listWins,
  putMe,
  report,
  reviseTool,
  runAnlat,
  runCv,
  runProva,
  runTool,
  type Ctx,
} from './routes';

function originHost(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

export async function handleApi(
  req: Request,
  env: Env,
  now = Date.now(),
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, '');
  const method = req.method;

  if (path === '/api/health') return json({ ok: true });

  // Tarayıcıdan gelen yazma isteklerinde köken (origin) kontrolü.
  if (method !== 'GET') {
    const origin = req.headers.get('origin');
    if (origin && env.DEV_AUTH !== '1' && originHost(origin) !== url.host) {
      throw new HttpError(403, 'forbidden', 'İzin verilmeyen köken.');
    }
  }

  const userId = await requireUser(req, env);
  const ctx: Ctx = { env, userId, now };

  if (path === '/api/me') {
    if (method === 'GET') return getMe(ctx);
    if (method === 'PUT') return putMe(ctx, req);
    if (method === 'DELETE') return deleteMe(ctx);
  }
  if (path === '/api/wins') {
    if (method === 'GET') return listWins(ctx);
    if (method === 'POST') return addWin(ctx, req);
  }
  let m = /^\/api\/wins\/([0-9a-f-]{36})$/.exec(path);
  if (m && method === 'DELETE') return deleteWin(ctx, m[1]);

  m = /^\/api\/tools\/([a-z]+)(?:\/(revize|gecmis))?$/.exec(path);
  if (m && isToolId(m[1])) {
    if (m[2] === 'revize' && method === 'POST') return reviseTool(ctx, m[1], req, fetcher);
    if (m[2] === 'gecmis' && method === 'GET') return outputHistory(ctx, m[1]);
    if (!m[2] && method === 'POST') return runTool(ctx, m[1], req, fetcher);
    if (!m[2] && method === 'GET') return latestOutput(ctx, m[1]);
  }
  if (path === '/api/anlat' && method === 'POST') return runAnlat(ctx, req, fetcher);
  if (path === '/api/feedback' && method === 'POST') return feedback(ctx, req);
  if (path === '/api/prova' && method === 'POST') return runProva(ctx, req, fetcher);
  if (path === '/api/cv' && method === 'POST') return runCv(ctx, req, fetcher);
  if (path === '/api/report' && method === 'POST') return report(ctx, req);

  throw new HttpError(404, 'not_found', 'Bulunamadı.');
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(req, env);
      } catch (e) {
        return errorResponse(e);
      }
    }
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
