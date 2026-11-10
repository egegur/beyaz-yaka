import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { BirebirOutput } from '../../shared/types';
import { api } from '../api';
import { Icon, TabBar, useMe } from '../ui';

const AREAS = [
  { to: '/rol', icon: 'brief', title: 'Rolümü anlamak', sub: 'Şirket senden ne bekliyor, ilk 90 gün' },
  { to: '/birebir', icon: 'people', title: 'Yöneticimle ilişki', sub: 'Birebir hazırlığı, zor konuşma provası' },
  { to: '/gelisim', icon: 'book', title: 'Kendimi geliştirmek', sub: 'Beceri açığı haritası, aylık plan' },
  { to: '/maas', icon: 'up', title: 'Yükselmek', sub: 'Maaş görüşmesi, terfi dosyası' },
  { to: '/yol', icon: 'pulse', title: 'Kariyer değişimi', sub: 'Geçiş yol haritası, mülakat provası' },
];
const EXTRA = [
  { to: '/ton', icon: 'msg', title: 'Mesaj tonu kontrolü', sub: 'Göndermeden önce bir kez bak' },
  { to: '/cv', icon: 'doc', title: 'ATS CV skoru', sub: 'Ücretli araç · CV\'ni ilana göre ölç' },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

function daysLeft(ts: number): number {
  return Math.max(0, Math.ceil((ts - Date.now()) / 86_400_000));
}

export default function Today() {
  const { me } = useMe();
  const [birebir, setBirebir] = useState<BirebirOutput | null>(null);
  useEffect(() => {
    api.latest('birebir').then((r) => r && setBirebir(r.output)).catch(() => {});
  }, []);

  const chip =
    me?.plan === 'trial' ? `Deneme · ${daysLeft(me.trialEndsAt)} gün kaldı` : me?.plan === 'sub' ? 'Abone' : 'Deneme bitti';

  return (
    <>
      <div className="content with-tabs" style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))' }}>
        <div className="between">
          <div style={{ fontSize: 17, fontWeight: 800 }}>[Marka]</div>
          <div className="row" style={{ gap: 4 }}>
            <Link to="/abonelik" className="chip" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: 'var(--ink)' }}>
              {chip}
            </Link>
            <Link to="/hesap" className="icon-btn" aria-label="Hesabım">
              <Icon name="user" size={22} />
            </Link>
          </div>
        </div>
        <div>
          <h1 className="h-xl">{greeting()}</h1>
          <p className="muted">Bu hafta neye odaklanalım?</p>
        </div>

        <Link to="/birebir" className="card hero" style={{ textDecoration: 'none' }}>
          <div className="row" style={{ fontSize: 13, fontWeight: 700, opacity: 0.92 }}>
            <Icon name="people" size={18} />
            {birebir ? 'Son birebir hazırlığın' : 'Yöneticinle görüşmen mi var?'}
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.2 }}>{birebir ? birebir.goal : 'Gündemini ve söyleyeceklerini birlikte hazırlayalım'}</div>
          <span className="btn white small" style={{ alignSelf: 'flex-start' }}>
            {birebir ? 'Aç' : 'Hazırlan'}
          </span>
        </Link>

        <Link to="/gunluk" className="card amber" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
          <span style={{ width: 44, height: 44, flex: '0 0 44px', borderRadius: 12, background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="pen" size={22} />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <b style={{ fontSize: 15 }}>Bu hafta ne başardın?</b>
            <span style={{ fontSize: 13, color: 'var(--amber-ink-2)' }}>2 dakikada yaz, terfi dosyan büyüsün.</span>
          </span>
        </Link>

        <h2 className="eyebrow">Beş alan</h2>
        <nav className="list" aria-label="Beş alan">
          {AREAS.map((a) => (
            <Link key={a.to} to={a.to} className="list-row">
              <span className="list-icon"><Icon name={a.icon} /></span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="row-title">{a.title}</span>
                <span className="row-sub">{a.sub}</span>
              </span>
              <Icon name="chevron" size={18} />
            </Link>
          ))}
        </nav>

        <h2 className="eyebrow">Diğer araçlar</h2>
        <nav className="list" aria-label="Diğer araçlar">
          {EXTRA.map((a) => (
            <Link key={a.to} to={a.to} className="list-row">
              <span className="list-icon"><Icon name={a.icon} /></span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="row-title">{a.title}</span>
                <span className="row-sub">{a.sub}</span>
              </span>
              <Icon name="chevron" size={18} />
            </Link>
          ))}
        </nav>
        {me && me.plan !== 'expired' && (
          <p className="small">
            Bugünkü kullanım: {me.usedToday}/{me.dailyLimit}
          </p>
        )}
      </div>
      <TabBar />
    </>
  );
}
