import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBox, Field, Loading, OutputActions, PrivacyHint, SafetyBox, TopBar, usePrefill, useTool } from '../ui';

export default function Birebir() {
  const t = useTool('birebir');
  const navigate = useNavigate();
  const prefill = usePrefill();
  const [goal, setGoal] = useState(prefill.goal ?? '');
  const [context, setContext] = useState(prefill.context ?? '');
  const [minutes, setMinutes] = useState('30');
  const [editing, setEditing] = useState(!!prefill.goal);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    t.run({ goal, context, minutes }).then((ok) => ok && setEditing(false));
  };
  const o = t.output;
  const showForm = !o || editing;

  return (
    <>
      <TopBar title="Birebir hazırlığı" />
      <div className="content">
        {t.loadingLatest ? (
          <Loading />
        ) : showForm ? (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h1 className="h-lg">Yöneticinle görüşmeye hazırlan</h1>
            <Field label="Bu görüşmeden ne çıkmalı?">
              <input className="input" required maxLength={400} placeholder="Ör. Yeni projede daha fazla sorumluluk almak" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </Field>
            <Field label="Durumu kısaca anlat" hint="(isteğe bağlı)">
              <textarea className="textarea" maxLength={2000} value={context} onChange={(e) => setContext(e.target.value)} placeholder="Ör. İş yüküm yoğun, yöneticim yeni, geçen ay bir aksilik oldu…" />
            </Field>
            <Field label="Görüşme süresi">
              <select className="select" value={minutes} onChange={(e) => setMinutes(e.target.value)}>
                {['15', '30', '45', '60'].map((m) => (
                  <option key={m} value={m}>{m} dakika</option>
                ))}
              </select>
            </Field>
            <PrivacyHint />
            <SafetyBox notice={t.notice} />
            <ErrorBox error={t.error} />
            <button className="btn" type="submit" disabled={t.busy || !goal.trim()}>
              {t.busy ? 'Hazırlanıyor…' : 'Planımı hazırla'}
            </button>
          </form>
        ) : (
          o && (
            <>
              <SafetyBox notice={t.notice} />
              <h1 className="h-lg">Görüşme planın</h1>
              <div className="card">
                <p className="eyebrow">Görüşmeden ne çıkmalı?</p>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35 }}>{o.goal}</div>
              </div>
              <div className="card">
                <p className="eyebrow">Gündem</p>
                {o.agenda.map((a, i) => (
                  <div className="step" key={i}>
                    <span className="num">{i + 1}</span>
                    <span style={{ flex: 1 }}>
                      <strong>{a.title}</strong> · {a.minutes} dk
                      <br />
                      {a.detail}
                    </span>
                  </div>
                ))}
              </div>
              <div className="card soft">
                <p className="eyebrow">Açılış cümlen</p>
                <p className="quote">"{o.opening}"</p>
              </div>
              {o.objections.map((x, i) => (
                <div className="card" key={i}>
                  <p className="eyebrow">Olası itiraz</p>
                  <b style={{ fontSize: 14 }}>"{x.objection}"</b>
                  <span style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--ink-2)' }}>{x.response}</span>
                </div>
              ))}
              <OutputActions tool={t} />
            </>
          )
        )}
      </div>
      {o && !showForm && (
        <div className="sticky-actions">
          <button className="btn secondary" style={{ flex: 1 }} type="button" onClick={() => setEditing(true)}>
            Yeni plan
          </button>
          <button className="btn" style={{ flex: 2 }} type="button" onClick={() => navigate('/prova', { state: { scenario: o.goal } })}>
            Provasını yap
          </button>
        </div>
      )}
    </>
  );
}
