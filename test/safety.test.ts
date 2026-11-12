import { describe, expect, it } from 'vitest';
import { detectCrisis, detectLegal, normalizeTr, screen } from '../worker/safety';

describe('normalizeTr', () => {
  it('Türkçe harfleri sadeleştirir', () => {
    expect(normalizeTr('İŞTEN ÇIKARILDIM, Öğle')).toBe('isten cikarildim ogle');
  });
});

describe('kriz algılama', () => {
  it.each([
    'Artık yaşamak istemiyorum',
    'İNTİHAR etmeyi düşünüyorum',
    'kendimi öldürmek istiyorum',
    'Canıma kıymayı düşündüm',
    'ölsem daha iyi olacak',
    'Hayatıma son vermek istiyorum',
    'Kendimi bitirmek istiyorum',
    'Yarın sabah uyanmasam keşke',
  ])('yakalar: %s', (t) => {
    expect(detectCrisis([t])).toBe(true);
  });

  it.each([
    'Bu proje beni öldürüyor ama bitireceğim',
    'Yöneticim çok yoğun yaşıyor',
    'Sunumda ölü noktaları düzeltmek istiyorum',
    'Kendimi geliştirmek istiyorum',
    'Bu projeyi bitirmek istiyorum',
    'Toplantıya son vermek için ne demeliyim?',
  ])('yanlış alarm vermez: %s', (t) => {
    expect(detectCrisis([t])).toBe(false);
  });

  it('kriz varsa engeller ve hukuki notu eklemez', () => {
    const r = screen(['işten çıkarıldım, yaşamak istemiyorum']);
    expect(r.block?.kind).toBe('crisis');
    expect(r.block?.text).toContain('112');
    expect(r.note).toBeNull();
  });
});

describe('hukuk algılama', () => {
  it.each(['Kıdem tazminatımı alabilir miyim?', 'İşten çıkarıldım', 'Bana mobbing yapılıyor', 'arabulucuya gitmem gerekiyor mu'])(
    'yakalar: %s',
    (t) => {
      expect(detectLegal([t])).toBe(true);
      const r = screen([t]);
      expect(r.block).toBeNull();
      expect(r.note?.text).toContain('ALO 170');
    },
  );
  it('normal metinde not eklemez', () => {
    expect(screen(['Yöneticimden yeni projede sorumluluk istemek istiyorum']).note).toBeNull();
  });
});
