import type { CvOutput, ProvaOutput, ToolId, ToolOutputs } from '../shared/types';

/**
 * Yapay zekâ çıktısını ekrana gitmeden önce şekle sokar.
 * Model beklenmedik bir şey döndürse bile ön yüz bozulmaz.
 */

const MAX_STR = 2000;

export function s(v: unknown, max = MAX_STR): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export function sa(v: unknown, maxItems = 10, maxLen = 600): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => s(x, maxLen)).filter(Boolean).slice(0, maxItems);
}

export function int(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function objs(v: unknown, maxItems = 10): Record<string, unknown>[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object').slice(0, maxItems);
}

function o(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export function sanitizeTool<K extends ToolId>(id: K, raw: unknown): ToolOutputs[K] {
  const r = o(raw);
  switch (id) {
    case 'rol':
      return {
        written: sa(r.written),
        unwritten: sa(r.unwritten),
        plan: objs(r.plan, 3).map((p) => ({ phase: s(p.phase, 20), title: s(p.title, 120), actions: sa(p.actions, 6) })),
        askManager: sa(r.askManager, 5),
      } as ToolOutputs[K];
    case 'birebir':
      return {
        goal: s(r.goal, 400),
        agenda: objs(r.agenda, 6).map((a) => ({ title: s(a.title, 120), detail: s(a.detail, 400), minutes: int(a.minutes, 1, 120, 5) })),
        opening: s(r.opening, 800),
        objections: objs(r.objections, 4).map((x) => ({ objection: s(x.objection, 300), response: s(x.response, 600) })),
      } as ToolOutputs[K];
    case 'gelisim':
      return {
        skills: objs(r.skills, 6).map((k) => {
          const now = int(k.now, 1, 4, 1);
          return { name: s(k.name, 80), now, target: Math.max(now, int(k.target, 1, 4, now)), why: s(k.why, 300) };
        }),
        monthPlan: objs(r.monthPlan, 5).map((w) => ({ week: s(w.week, 30), task: s(w.task, 300) })),
      } as ToolOutputs[K];
    case 'maas':
      return { reasons: sa(r.reasons, 5), script: s(r.script, 800), ifNo: sa(r.ifNo, 5), prep: sa(r.prep, 5) } as ToolOutputs[K];
    case 'yol': {
      const tw = o(r.thisWeek);
      return {
        steps: objs(r.steps, 7).map((x) => ({ title: s(x.title, 120), detail: s(x.detail, 400) })),
        thisWeek: { title: s(tw.title, 200), detail: s(tw.detail, 500), draftMessage: s(tw.draftMessage, 1200) },
      } as ToolOutputs[K];
    }
    case 'ton':
      return { assessment: s(r.assessment, 800), risks: sa(r.risks, 6), rewritten: s(r.rewritten, 4000) } as ToolOutputs[K];
    case 'terfi':
      return {
        summary: s(r.summary, 1000),
        achievements: objs(r.achievements, 8).map((a) => ({ title: s(a.title, 200), impact: s(a.impact, 400) })),
        competencies: sa(r.competencies, 8),
        gaps: sa(r.gaps, 6),
        nextSteps: sa(r.nextSteps, 6),
      } as ToolOutputs[K];
    default:
      throw new Error('Bilinmeyen araç');
  }
}

export function sanitizeProva(raw: unknown): ProvaOutput {
  const r = o(raw);
  const cn = r.coachNote && typeof r.coachNote === 'object' ? o(r.coachNote) : null;
  const note = cn ? { feedback: s(cn.feedback, 500), better: s(cn.better, 500) } : null;
  return { reply: s(r.reply, 800), coachNote: note && note.feedback ? note : null };
}

export function sanitizeCv(raw: unknown): CvOutput {
  const r = o(raw);
  const m = o(r.metrics);
  const metrics = {
    keywords: int(m.keywords, 0, 100, 0),
    format: int(m.format, 0, 100, 0),
    sections: int(m.sections, 0, 100, 0),
    impact: int(m.impact, 0, 100, 0),
  };
  return {
    score: int(r.score, 0, 100, Math.round((metrics.keywords + metrics.format + metrics.sections + metrics.impact) / 4)),
    metrics,
    missingKeywords: sa(r.missingKeywords, 12, 60),
    tips: objs(r.tips, 6).map((t) => ({ title: s(t.title, 120), body: s(t.body, 500), gain: int(t.gain, 1, 20, 5) })),
  };
}
