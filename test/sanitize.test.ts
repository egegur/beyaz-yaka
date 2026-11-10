import { describe, expect, it } from 'vitest';
import { sanitizeCv, sanitizeProva, sanitizeTool } from '../worker/sanitize';

describe('sanitize', () => {
  it('bozuk araç çıktısını güvenli şekle sokar', () => {
    const out = sanitizeTool('gelisim', { skills: [{ name: 'Sunum', now: 9, target: -3, why: 5 }, 'x'], monthPlan: 'yok' });
    expect(out.skills).toEqual([{ name: 'Sunum', now: 4, target: 4, why: '' }]);
    expect(out.monthPlan).toEqual([]);
  });
  it('birebir dakikayı sınırlar ve eksik alanları doldurur', () => {
    const out = sanitizeTool('birebir', { agenda: [{ title: 'A', detail: 'B', minutes: 'abc' }] });
    expect(out.agenda[0].minutes).toBe(5);
    expect(out.opening).toBe('');
    expect(out.objections).toEqual([]);
  });
  it('prova: boş koç notunu null yapar', () => {
    expect(sanitizeProva({ reply: 'Merhaba', coachNote: { feedback: '', better: '' } })).toEqual({ reply: 'Merhaba', coachNote: null });
    expect(sanitizeProva({ reply: 'X', coachNote: { feedback: 'Net ol', better: 'Şöyle de' } }).coachNote?.better).toBe('Şöyle de');
  });
  it('cv: skorları 0-100 aralığına sıkıştırır', () => {
    const out = sanitizeCv({ score: 150, metrics: { keywords: -5, format: 70, sections: '80', impact: 45 }, missingKeywords: ['SQL', 3], tips: [] });
    expect(out.score).toBe(100);
    expect(out.metrics).toEqual({ keywords: 0, format: 70, sections: 80, impact: 45 });
    expect(out.missingKeywords).toEqual(['SQL']);
  });
});
