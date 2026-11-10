import { useState } from 'react';
import { Icon, TopBar, useMe } from '../ui';

const FEATURES = [
  'Beş alanda tüm araçlar ve koç sohbeti',
  'Zor konuşma ve mülakat provaları',
  'Terfi dosyası ve maaş görüşmesi hazırlığı',
  'Yazdıkların yalnızca sende; şirketinle paylaşılmaz',
];

export default function Abonelik() {
  const { me } = useMe();
  const [plan, setPlan] = useState<'yearly' | 'monthly'>('yearly');
  const days = me ? Math.max(0, Math.ceil((me.trialEndsAt - Date.now()) / 86_400_000)) : 0;

  return (
    <>
      <TopBar title="Planlar" />
      <div className="content">
        {me?.plan === 'trial' && <span className="tag amber" style={{ alignSelf: 'flex-start' }}>Denemende {days} gün kaldı</span>}
        {me?.plan === 'expired' && <span className="tag red" style={{ alignSelf: 'flex-start' }}>Deneme süren bitti</span>}
        {me?.plan === 'sub' && <span className="tag" style={{ alignSelf: 'flex-start' }}>Abonesin</span>}
        <h1 className="h-xl">İşteyken yanındaki koç, her gün</h1>
        <p className="muted">Deneme bitince araçlar kilitlenir; günlüğün ve planların silinmez.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FEATURES.map((f) => (
            <div key={f} className="row" style={{ fontSize: 15, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--ok)' }}><Icon name="check" /></span>
              {f}
            </div>
          ))}
        </div>
        <div role="radiogroup" aria-label="Plan" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(
            [
              ['yearly', 'Yıllık', '[YILLIK FİYAT] · aylığa göre indirimli'],
              ['monthly', 'Aylık', '[AYLIK FİYAT] · istediğin zaman iptal'],
            ] as const
          ).map(([id, title, sub]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={plan === id}
              onClick={() => setPlan(id)}
              className="card"
              style={{ textAlign: 'left', cursor: 'pointer', border: plan === id ? '2px solid var(--accent)' : '2px solid var(--line-2)' }}
            >
              <b style={{ fontSize: 16 }}>{title}</b>
              <span className="small">{sub}</span>
            </button>
          ))}
        </div>
        <div className="card amber">
          <b>ATS CV skoru</b>
          <span style={{ fontSize: 14 }}>Abonelikten ayrı satın alınan araç · [CV ARACI FİYATI]</span>
        </div>
        <div className="notice legal" role="note">
          Ödeme sistemi bir sonraki geliştirme adımında eklenecek. Şimdilik satın alma yapılamıyor.
        </div>
      </div>
      <div className="sticky-actions">
        <button className="btn block" type="button" disabled>
          Aboneliği başlat
        </button>
      </div>
    </>
  );
}
