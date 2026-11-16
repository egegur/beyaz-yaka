import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Bullets, ErrorBox, Field, Loading, OutputActions, PrivacyHint, SafetyBox, TopBar, usePrefill, useTool } from '../ui';

export default function Performans() {
  const t = useTool('performans');
  const prefill = usePrefill();
  const [period, setPeriod] = useState(prefill.period ?? '');
  const [goals, setGoals] = useState(prefill.goals ?? '');
  const [context, setContext] = useState(prefill.context ?? '');
  const [editing, setEditing] = useState(Object.keys(prefill).length > 0);
  const o = t.output;
  const showForm = !o || editing;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    t.run({ period, goals, context }).then((ok) => ok && setEditing(false));
  };

  return (
    <>
      <TopBar title="Performans değerlendirmesi" />
      <div className="content">
        {t.loadingLatest ? (
          <Loading />
        ) : showForm ? (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h1 className="h-lg">Değerlendirme görüşmesine hazırlan</h1>
            <p className="muted">
              Hedeflerini <Link to="/gunluk">kazanım günlüğündeki</Link> kanıtlarla eşleştiririz. Günlükte olmayan başarıyı yazmayız.
            </p>
            <Field label="Dönem" hint="(isteğe bağlı)">
              <input className="input" maxLength={80} value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Ör. 2026 yıl sonu" />
            </Field>
            <Field label="Bu dönemin hedefleri veya senden beklenenler">
              <textarea className="textarea" required maxLength={2000} value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Ör. Raporlama süresini kısaltmak, yeni sisteme geçişi yönetmek, ekibe destek olmak" />
            </Field>
            <Field label="Eklemek istediklerin" hint="(isteğe bağlı)">
              <textarea className="textarea" maxLength={2000} value={context} onChange={(e) => setContext(e.target.value)} placeholder="Ör. Bir hedefte geride kaldım, nedeni şuydu…" />
            </Field>
            <PrivacyHint />
            <SafetyBox notice={t.notice} />
            <ErrorBox error={t.error} />
            <button className="btn" type="submit" disabled={t.busy || !goals.trim()}>
              {t.busy ? 'Hazırlanıyor…' : 'Hazırlığımı çıkar'}
            </button>
          </form>
        ) : (
          o && (
            <>
              <SafetyBox notice={t.notice} />
              <h1 className="h-lg">Değerlendirme hazırlığın</h1>
              <div className="card soft">
                <p className="eyebrow">Öz değerlendirme özetin</p>
                <p className="quote" style={{ fontWeight: 500 }}>{o.summary}</p>
              </div>
              <div className="card">
                <p className="eyebrow">Hedef ve kanıt</p>
                {o.achievements.map((a, i) => (
                  <div key={i} style={{ fontSize: 14, lineHeight: 1.45 }}>
                    <b>{a.goal}</b>
                    <br />
                    {a.evidence}
                  </div>
                ))}
              </div>
              {!!o.growthAreas.length && (
                <div className="card">
                  <p className="eyebrow">Gelişim alanları ve nasıl söylersin</p>
                  {o.growthAreas.map((g, i) => (
                    <div key={i} style={{ fontSize: 14, lineHeight: 1.45 }}>
                      <b>{g.area}</b>
                      <br />"{g.framing}"
                    </div>
                  ))}
                </div>
              )}
              <div className="card">
                <p className="eyebrow">Yöneticine sor</p>
                <Bullets items={o.questionsToAsk} />
              </div>
              <div className="card">
                <p className="eyebrow">Gelecek dönem için hedef önerileri</p>
                <Bullets items={o.nextGoals} />
              </div>
              <OutputActions tool={t} />
            </>
          )
        )}
      </div>
      {o && !showForm && (
        <div className="sticky-actions">
          <button className="btn secondary" style={{ flex: 1 }} type="button" onClick={() => setEditing(true)}>
            Yeni hazırlık
          </button>
          <Link className="btn" style={{ flex: 1.6 }} to="/prova" state={{ prefill: { scenario: 'Performans değerlendirmesi görüşmesi', counterpart: 'Yönetici' } }}>
            Görüşmenin provasını yap
          </Link>
        </div>
      )}
    </>
  );
}
