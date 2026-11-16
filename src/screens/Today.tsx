import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { BirebirOutput } from '../../shared/types';
import { api } from '../api';
import { Icon, TabBar, useMe } from '../ui';

// Başlıklar kayıttaki ihtiyaç seçenekleriyle (NEED_OPTIONS) birebir aynı: öncelik sıralaması buna dayanır.
const AREAS = [
  { to: '/rol', icon: 'brief', title: 'Rolümü anlamak', sub: 'Şirket senden ne bekliyor, ilk 90 gün' },
  { to: '/birebir', icon: 'people', title: 'Yöneticimle ilişki', sub: 'Birebir hazırlığı, zor konuşma provası' },
  { to: '/gelisim', icon: 'book', title: 'Kendimi geliştirmek', sub: 'Beceri açığı haritası, aylık plan' },
  { to: '/performans', icon: 'up', title: 'Yükselmek', sub: 'Performans değerlendirmesi, maaş, terfi dosyası' },
  { to: '/yol', icon: 'pulse', title: 'Kariyer değişimi', sub: 'Yol haritası, mülakat provası, CV ve LinkedIn' },
];
const EXTRA = [
  { to: '/prova', icon: 'chat', title: 'Zor konuşma provası', sub: 'Koç karşı tarafı canlandırır' },
  { to: '/performans', icon: 'up', title: 'Performans değerlendirmesi', sub: 'Hedeflerini kanıtlarla eşleştir' },
  { to: '/maas', icon: 'up', title: 'Maaş görüşmesi', sub: 'Zam talebine hazırlık' },
  { to: '/prova?mulakat', icon: 'people', title: 'Mülakat provası', sub: 'Koç mülakatçı olur' },
  { to: '/cv-uyarla', icon: 'doc', title: 'CV ve LinkedIn uyarlama', sub: 'Hedef role göre yeniden yaz' },
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
  const navigate = useNavigate();
  const [story, setStory] = useState('');
  const [birebir, setBirebir] = useState<BirebirOutput | null>(null);
  const needs = me?.needs ?? [];
  const areas = [...AREAS].sort((a, b) => Number(needs.includes(b.title)) - Number(needs.includes(a.title)));
  const tell = (e: FormEvent) => {
    e.preventDefault();
    if (story.trim()) navigate('/anlat', { state: { text: story.trim() } });
  };
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

        <form className="card hero" onSubmit={tell}>
          <label htmlFor="anlat" style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.25 }}>
            Ne oluyor, anlat
          </label>
          <span style={{ fontSize: 14, lineHeight: 1.45, opacity: 0.92 }}>Aklını kurcalayan durumu yaz; ne yapabileceğini söyleyip doğru aracı hazır açalım.</span>
          <textarea
            id="anlat"
            className="textarea"
            maxLength={2000}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Ör. Yöneticim fikirlerimi toplantıda görmezden geliyor…"
            style={{ border: 'none', color: 'var(--ink)' }}
          />
          <button className="btn white" type="submit" disabled={!story.trim()}>
            Koça anlat
          </button>
        </form>

        {birebir && (
          <Link to="/birebir" className="card" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
            <span className="eyebrow">Son birebir hazırlığın</span>
            <b style={{ fontSize: 15 }}>{birebir.goal}</b>
          </Link>
        )}

        <Link to="/gunluk" className="card amber" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
          <span style={{ width: 44, height: 44, flex: '0 0 44px', borderRadius: 12, background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="pen" size={22} />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <b style={{ fontSize: 15 }}>Bu hafta ne başardın?</b>
            <span style={{ fontSize: 13, color: 'var(--amber-ink-2)' }}>2 dakikada yaz, terfi dosyan büyüsün.</span>
          </span>
        </Link>

        {me && !me.extraDone && (
          <Link to="/kayit/detay" className="card" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
            <span className="between">
              <b style={{ fontSize: 15 }}>Seni biraz daha tanıyalım</b>
              <span className="tag">1 dk · isteğe bağlı</span>
            </span>
            <span className="small">4 kısa soruyla önerileri şirketine ve rolüne göre ayarlayalım.</span>
          </Link>
        )}

        <h2 className="eyebrow">Beş alan</h2>
        <nav className="list" aria-label="Beş alan">
          {areas.map((a) => (
            <Link key={a.to} to={a.to} className="list-row">
              <span className="list-icon"><Icon name={a.icon} /></span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="row-title">
                  {a.title} {needs.includes(a.title) && <span className="tag amber">Önceliğin</span>}
                </span>
                <span className="row-sub">{a.sub}</span>
              </span>
              <Icon name="chevron" size={18} />
            </Link>
          ))}
        </nav>

        <h2 className="eyebrow">Tüm araçlar</h2>
        <nav className="list" aria-label="Diğer araçlar">
          {EXTRA.map((a) => (
            <Link key={a.title} to={a.to.split('?')[0]} state={a.to.endsWith('?mulakat') ? { mode: 'mulakat' } : undefined} className="list-row">
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
