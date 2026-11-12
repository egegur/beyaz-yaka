import type { AiResult, CvOutput, Me, ProvaOutput, ProvaTurn, ToolId, ToolOutputs, Win } from '../shared/types';
import { authHeaders } from './auth';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: { 'content-type': 'application/json', ...(await authHeaders()) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network', 'İnternet bağlantını kontrol et.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as { error?: { code: string; message: string } } | null)?.error;
    throw new ApiError(res.status, err?.code ?? 'unknown', err?.message ?? 'Bir sorun oluştu.');
  }
  return data as T;
}

export const api = {
  me: () => req<Me>('GET', '/api/me'),
  updateMe: (b: {
    role?: string;
    sector?: string;
    experience?: string;
    needs?: string[];
    ageConfirmed?: boolean;
    ageRange?: string;
    companySize?: string;
    manages?: string;
    city?: string;
    extraDone?: boolean;
  }) =>
    req<Me>('PUT', '/api/me', b),
  deleteMe: () => req<{ deleted: boolean }>('DELETE', '/api/me'),
  wins: () => req<Win[]>('GET', '/api/wins'),
  addWin: (text: string, tags: string[] = []) => req<Win>('POST', '/api/wins', { text, tags }),
  deleteWin: (id: string) => req<{ deleted: boolean }>('DELETE', `/api/wins/${id}`),
  tool: <K extends ToolId>(id: K, input: Record<string, string>) =>
    req<AiResult<ToolOutputs[K]>>('POST', `/api/tools/${id}`, input),
  latest: <K extends ToolId>(id: K) =>
    req<{ output: ToolOutputs[K]; createdAt: number } | null>('GET', `/api/tools/${id}`),
  prova: (b: { scenario: string; counterpart: string; difficulty: string; history: ProvaTurn[] }) =>
    req<AiResult<ProvaOutput>>('POST', '/api/prova', b),
  cv: (cvText: string, jobText: string) => req<AiResult<CvOutput>>('POST', '/api/cv', { cvText, jobText }),
  report: (tool: string, reason: string, content: string) => req('POST', '/api/report', { tool, reason, content }),
};
