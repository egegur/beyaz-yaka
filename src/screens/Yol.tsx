import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBox, Field, Loading, OutputActions, PrivacyHint, SafetyBox, TabBar, usePrefill, useTool } from '../ui';

export default function Yol() {
  const t = useTool('yol');
  const prefill = usePrefill();
  const [fromRole, setFrom] = useState(prefill.fromRole ?? '');
  const [toRole, setTo] = useState(prefill.toRole ?? '');
  const [constraints, setConstraints] = useState(prefill.constraints ?? '');
  const [editing, setEditing] = useState(Object.keys(prefill).length > 0);
  const [copied, setCopied] = useState(false);
  const o = t.output;
  const showForm = !o || editing;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    t.run({ fromRole, toRole, constraints }).then((ok) => ok && setEditing(false));
  };

  const copy = async (s: string) => {
    try {
      await navigator.clipboard.writeText(s);
      setCopied(true);
    } catch {
      /* pano izni yoksa geç */
    }
  };

  return (
    <>
      <div className="content with-tabs" style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))' }}>
        {t.loadingLatest ? (
          <Loading />
        ) : showForm ? (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h1 className="h-xl">Kariyer değişimi planı</h1>
            <p className="muted">Nereden nereye geçmek istediğini yaz; adım adım yol haritanı çıkaralım.</p>
            <Field label="Şu anki rolün">
              <input className="input" required maxLength={120} value={fromRole} onChange={(e) => setFrom(e.target.value)} placeholder="Ör. Pazarlama uzmanı" />
            </Field>
            <Field label="Hedef rol veya alan">
              <input className="input" required maxLength={120} value={toRole} onChange={(e) => setTo(e.target.value)} placeholder="Ör. Ürün yöneticisi" />
            </Field>
            <Field label="Kısıtların" hint="(isteğe bağlı)">
              <textarea className="textarea" maxLength={1500} value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="Ör. 1 yıl içinde, maaşım düşmeden, şehir değiştirmeden" />
            </Field>
            <PrivacyHint />
            <SafetyBox notice={t.notice} />
            <ErrorBox error={t.error} />
            <button className="btn" type="submit" disabled={t.busy || !fromRole.trim() || !toRole.trim()}>
              {t.busy ? 'Hazırlanıyor…' : 'Yol haritamı çıkar'}
            </button>
          </form>
        ) : (
          o && (
            <>
              <SafetyBox notice={t.notice} />
              <h1 className="h-lg">Kariyer değişimi planın</h1>
              <div className="card hero">
                <p className="eyebrow" style={{ color: '#fff', opacity: 0.92 }}>Bu haftanın adımı</p>
                <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{o.thisWeek.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.45, opacity: 0.92 }}>{o.thisWeek.detail}</div>
                {o.thisWeek.draftMessage && (
                  <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {o.thisWeek.draftMessage}
                  </div>
                )}
                {o.thisWeek.draftMessage && (
                  <button type="button" className="btn white small" style={{ alignSelf: 'flex-start' }} onClick={() => copy(o.thisWeek.draftMessage)}>
                    {copied ? 'Kopyalandı' : 'Mesajı kopyala'}
                  </button>
                )}
              </div>
              <div className="card">
                {o.steps.map((s, i) => (
                  <div className="step" key={i}>
                    <span className="num">{i + 1}</span>
                    <span style={{ flex: 1 }}>
                      <strong>{s.title}</strong>
                      <br />
                      {s.detail}
                    </span>
                  </div>
                ))}
              </div>
              <Link to="/cv" className="card" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
                <span className="between">
                  <b>ATS CV skorunu ölç</b>
                  <span className="tag amber">Ücretli</span>
                </span>
                <span className="small">CV'ni hedef ilana göre ölç, eksik anahtar kelimeleri gör.</span>
              </Link>
              <OutputActions tool={t} />
              <button className="btn secondary" type="button" onClick={() => setEditing(true)}>
                Yeni plan
              </button>
            </>
          )
        )}
      </div>
      <TabBar />
    </>
  );
}
