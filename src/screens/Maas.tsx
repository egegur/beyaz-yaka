import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bullets, ErrorBox, Field, Loading, OutputActions, PrivacyHint, SafetyBox, TopBar, usePrefill, useTool } from '../ui';

export default function Maas() {
  const t = useTool('maas');
  const navigate = useNavigate();
  const prefill = usePrefill();
  const [context, setContext] = useState(prefill.context ?? '');
  const [request, setRequest] = useState(prefill.request ?? '');
  const [editing, setEditing] = useState(Object.keys(prefill).length > 0);
  const o = t.output;
  const showForm = !o || editing;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    t.run({ context, request }).then((ok) => ok && setEditing(false));
  };

  return (
    <>
      <TopBar title="Maaş görüşmesi" />
      <div className="content">
        {t.loadingLatest ? (
          <Loading />
        ) : showForm ? (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h1 className="h-lg">Zam talebine hazırlık</h1>
            <p className="muted">
              Gerekçelerini <Link to="/gunluk">kazanım günlüğünden</Link> alırız. Günlüğün ne kadar doluysa hazırlık o kadar güçlü olur.
            </p>
            <Field label="Durumun">
              <textarea className="textarea" required maxLength={2000} value={context} onChange={(e) => setContext(e.target.value)} placeholder="Ör. 2 yıldır aynı ücretle çalışıyorum, sorumluluklarım arttı, performans dönemi yaklaşıyor." />
            </Field>
            <Field label="Talebin" hint="(isteğe bağlı)">
              <input className="input" maxLength={300} value={request} onChange={(e) => setRequest(e.target.value)} placeholder="Ör. Zam, unvan değişikliği" />
            </Field>
            <PrivacyHint />
            <SafetyBox notice={t.notice} />
            <ErrorBox error={t.error} />
            <button className="btn" type="submit" disabled={t.busy || !context.trim()}>
              {t.busy ? 'Hazırlanıyor…' : 'Hazırlığımı çıkar'}
            </button>
          </form>
        ) : (
          o && (
            <>
              <SafetyBox notice={t.notice} />
              <h1 className="h-lg">Zam talebine hazırlık</h1>
              <div className="card dark">
                <p className="eyebrow">Gerekçelerin</p>
                {o.reasons.map((r, i) => (
                  <div key={i} className="step">
                    <b style={{ color: 'var(--amber)' }}>{i + 1}</b>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <p className="eyebrow">Piyasa aralığı</p>
                <span className="small">
                  Koç maaş rakamı önermez; kaynağı belli olmayan bir sayı seni zor durumda bırakabilir. Güncel ve kaynağı belli maaş araştırmalarına bak, kendi aralığını oradan belirle.
                </span>
              </div>
              <div className="card soft">
                <p className="eyebrow">Söyleyeceğin cümle</p>
                <p className="quote">"{o.script}"</p>
              </div>
              <div className="card">
                <p className="eyebrow">"Şu an bütçe yok" derse</p>
                <Bullets items={o.ifNo} />
              </div>
              <div className="card">
                <p className="eyebrow">Görüşmeden önce</p>
                <Bullets items={o.prep} />
              </div>
              <OutputActions tool={t} />
            </>
          )
        )}
      </div>
      {o && !showForm && (
        <div className="sticky-actions">
          <button className="btn secondary" style={{ flex: 1 }} type="button" onClick={() => setEditing(true)}>
            Yenile
          </button>
          <button className="btn" style={{ flex: 2 }} type="button" onClick={() => navigate('/prova', { state: { scenario: 'Yöneticimle zam görüşmesi' } })}>
            Görüşmenin provasını yap
          </button>
        </div>
      )}
    </>
  );
}
