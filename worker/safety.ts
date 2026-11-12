import type { SafetyNotice } from '../shared/types';

/**
 * Deterministik güvenlik katmanı. Yapay zekâya gitmeden önce çalışır.
 * 1) Kendine zarar sinyali → yapay zekâ çağrılmaz, kriz yönlendirmesi döner.
 * 2) İş hukuku konusu → çıktıya hukuki yönlendirme notu eklenir.
 */

/** Türkçe küçük harf + aksan sadeleştirme (ı→i, ş→s ...) ile eşleştirme metni. */
export function normalizeTr(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CRISIS_PATTERNS: RegExp[] = [
  /\bintihar/,
  /\bkendimi (oldur|asmak|asacag|atacag|atmak|kesmek|kesecek|yok etmek)/,
  /\bcanima kiy/,
  /\byasamak istemiyorum/,
  /\byasamanin (bir )?anlami (yok|kalmadi)/,
  /\bolmek istiyorum/,
  /\bolsem (daha iyi|kurtulurum)/,
  /\bhayatima son ver/,
  /\bkendime zarar ver/,
  /\bkendimi bitir/,
  /\bher seye son ver/,
  /\byasamaya devam etmek istemiyorum/,
  /\buyanmasam (keske|daha iyi)/,
];

const LEGAL_PATTERNS: RegExp[] = [
  /\bkidem tazminat/,
  /\bihbar (tazminat|sure|onel)/,
  /\bisten (cikarildim|cikarilma|cikariliyorum|atildim|atilma)/,
  /\bmobbing/,
  /\bpsikolojik taciz/,
  /\bdava (ac|acmak|acacag)/,
  /\barabulucu/,
  /\bhakli fesih/,
  /\bis sozlesmesi feshi/,
  /\bfazla mesai ucret/,
  /\bsgk prim/,
  /\bcinsel taciz/,
];

export const CRISIS_TEXT =
  'Yazdıkların çok ağır bir yükün altında olduğunu gösteriyor ve bu konuda sana bir koçluk aracından daha fazla destek gerekiyor. ' +
  'Kendine zarar verme düşüncen varsa ya da şu an güvende değilsen lütfen hemen 112 Acil Çağrı Merkezi\'ni ara. ' +
  'Güvendiğin birine şu an ulaşmak ve bir ruh sağlığı uzmanından destek almak da çok önemli. Yalnız değilsin.';

export const LEGAL_TEXT =
  'Bu konu iş hukukunu ilgilendiriyor. Buradaki bilgiler genel niteliktedir ve hukuki danışmanlık yerine geçmez. ' +
  'Haklarını öğrenmek için bir iş hukuku avukatına danışabilir veya ALO 170\'i (Çalışma ve Sosyal Güvenlik İletişim Merkezi) arayabilirsin.';

export function detectCrisis(texts: string[]): boolean {
  const t = normalizeTr(texts.join(' \n '));
  return CRISIS_PATTERNS.some((p) => p.test(t));
}

export function detectLegal(texts: string[]): boolean {
  const t = normalizeTr(texts.join(' \n '));
  return LEGAL_PATTERNS.some((p) => p.test(t));
}

export function screen(texts: string[]): { block: SafetyNotice | null; note: SafetyNotice | null } {
  if (detectCrisis(texts)) return { block: { kind: 'crisis', text: CRISIS_TEXT }, note: null };
  if (detectLegal(texts)) return { block: null, note: { kind: 'legal', text: LEGAL_TEXT } };
  return { block: null, note: null };
}
