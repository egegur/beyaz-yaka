import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Bullets, ErrorBox, Field, Loading, OutputActions, PrivacyHint, SafetyBox, TopBar, useMe, usePrefill, useTool } from '../ui';

export default function Rol() {
  const { me } = useMe();
  const t = useTool('rol');
  const prefill = usePrefill();
  const [role, setRole] = useState(prefill.role ?? me?.role ?? '');
  const [months, setMonths] = useState(prefill.months ?? '');
  const [jd, setJd] = useState(prefill.jobDescription ?? '');
  const [editing, setEditing] = useState(Object.keys(prefill).length > 0);
  const o = t.output;
  const showForm = !o || editing;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    t.run({ role, months, jobDescription: jd }).then((ok) => ok && setEditing(false));
  };

  return (
    <>
      <TopBar title="Rolümü anlamak" />
      <div className="content">
        {t.loadingLatest ? (
          <Loading />
        ) : showForm ? (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h1 className="h-lg">Şirketin senden ne bekliyor?</h1>
            <Field label="Rolün">
              <input className="input" required maxLength={120} value={role} onChange={(e) => setRole(e.target.value)} />
            </Field>
            <Field label="Bu rolde ne kadardır çalışıyorsun?" hint="(isteğe bağlı)">
              <input className="input" maxLength={40} value={months} onChange={(e) => setMonths(e.target.value)} placeholder="Ör. 4 ay" />
            </Field>
            <Field label="İş tanımın" hint="(isteğe bağlı, şirket adını çıkararak yapıştır)">
              <textarea className="textarea" maxLength={4000} value={jd} onChange={(e) => setJd(e.target.value)} />
            </Field>
            <PrivacyHint />
            <SafetyBox notice={t.notice} />
            <ErrorBox error={t.error} />
            <button className="btn" type="submit" disabled={t.busy || !role.trim()}>
              {t.busy ? 'Hazırlanıyor…' : 'Beklentileri çıkar'}
            </button>
          </form>
        ) : (
          o && (
            <>
              <SafetyBox notice={t.notice} />
              <h1 className="h-lg">Şirketin senden ne bekliyor?</h1>
              <div className="card">
                <p className="eyebrow">Yazılı beklentiler</p>
                <Bullets items={o.written} />
              </div>
              <div className="card soft">
                <p className="eyebrow">Yazılmayan beklentiler</p>
                <Bullets items={o.unwritten} />
                <span style={{ fontSize: 12, color: 'var(--accent-ink)' }}>Bunlar genel gözlemler. Birebirde yöneticine doğrulat.</span>
              </div>
              <div className="card">
                <p className="eyebrow">90 günlük planın</p>
                {o.plan.map((p, i) => (
                  <div className="step" key={i}>
                    <span className="tag" style={{ flex: '0 0 auto' }}>{p.phase}</span>
                    <span style={{ flex: 1 }}>
                      <strong>{p.title}</strong>
                      <br />
                      {p.actions.join(' · ')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="card">
                <p className="eyebrow">Yöneticine sor</p>
                <Bullets items={o.askManager} />
              </div>
              <OutputActions tool={t} />
            </>
          )
        )}
      </div>
      {o && !showForm && (
        <div className="sticky-actions">
          <button className="btn secondary" style={{ flex: 1 }} type="button" onClick={() => setEditing(true)}>
            Yeniden çıkar
          </button>
          <Link className="btn" style={{ flex: 1.4 }} to="/birebir">
            Birebirde sor
          </Link>
        </div>
      )}
    </>
  );
}
