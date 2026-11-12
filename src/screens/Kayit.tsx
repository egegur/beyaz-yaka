import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EXPERIENCE_OPTIONS, NEED_OPTIONS } from '../../shared/options';
import { api } from '../api';
import { ErrorBox, Field, TopBar, useMe } from '../ui';

const SECTORS = ['Bankacılık ve finans', 'Teknoloji', 'Perakende', 'Üretim', 'Danışmanlık', 'Sağlık', 'Enerji', 'Medya ve iletişim', 'Kamu dışı diğer'];
const LEVELS = EXPERIENCE_OPTIONS;
const NEEDS = NEED_OPTIONS;

export default function Kayit() {
  const { me, refresh } = useMe();
  const navigate = useNavigate();
  const [role, setRole] = useState(me?.role ?? '');
  const [sector, setSector] = useState(me?.sector ?? SECTORS[0]);
  const [level, setLevel] = useState(me?.experience ?? '');
  const [needs, setNeeds] = useState<string[]>(me?.needs ?? []);
  const [age, setAge] = useState(me?.ageConfirmed ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const first = !me?.ageConfirmed;

  const toggle = (n: string) => setNeeds((xs) => (xs.includes(n) ? xs.filter((x) => x !== n) : [...xs, n]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.updateMe({ role: role.trim(), sector, experience: level || undefined, needs, ageConfirmed: age });
      await refresh();
      navigate(first ? '/kayit/detay' : '/hesap');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {first ? <div style={{ height: 24 }} /> : <TopBar title="Profilim" back="/hesap" />}
      <div className="content">
        <h1 className="h-xl">Seni tanıyalım</h1>
        <p className="muted">Koçun önerilerini buna göre kişiselleştirir. Şirket adını yazman gerekmiyor.</p>
        <Field label="Rolün">
          <input className="input" required maxLength={120} placeholder="Ör. Kıdemli finans uzmanı" value={role} onChange={(e) => setRole(e.target.value)} />
        </Field>
        <Field label="Sektörün">
          <select className="select" value={sector} onChange={(e) => setSector(e.target.value)}>
            {SECTORS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <div className="field">
          <span id="lvl">İş deneyimin</span>
          <div className="chips" role="radiogroup" aria-labelledby="lvl">
            {LEVELS.map((l) => (
              <button key={l} type="button" role="radio" aria-checked={level === l} className="chip" onClick={() => setLevel(l)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>
            Şu an en çok neye ihtiyacın var? <span className="hint">(birden fazla)</span>
          </span>
          <div className="chips">
            {NEEDS.map((n) => (
              <button key={n} type="button" aria-pressed={needs.includes(n)} className="chip" onClick={() => toggle(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <label className="check">
          <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} required />
          <span>
            18 yaşından büyüğüm. Bu uygulamanın hukuki, mali veya psikolojik danışmanlık yerine geçmediğini biliyorum.{' '}
            <Link to="/kosullar">Kullanım Koşulları</Link> · <Link to="/gizlilik">Aydınlatma Metni</Link>
          </span>
        </label>
        <ErrorBox error={error} />
      </div>
      <div className="sticky-actions">
        <button className="btn block" type="submit" disabled={busy || !age || !role.trim()}>
          {first ? 'Başla' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
