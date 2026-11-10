import { useEffect, useState, type FormEvent } from 'react';
import { ErrorBox, Field, Icon, Loading, PrivacyHint, ReportButton, SafetyBox, TopBar, useMe, useTool } from '../ui';

const DONE_KEY = 'by_gelisim_done';

export default function Gelisim() {
  const { me } = useMe();
  const t = useTool('gelisim');
  const [currentRole, setCurrent] = useState(me?.role ?? '');
  const [targetRole, setTarget] = useState('');
  const [notes, setNotes] = useState('');
  const [editing, setEditing] = useState(false);
  const [done, setDone] = useState<Record<number, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(DONE_KEY) ?? '{}');
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify(done));
    } catch {
      /* depolama kapalıysa geç */
    }
  }, [done]);

  const o = t.output;
  const showForm = !o || editing;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    t.run({ currentRole, targetRole, notes }).then((ok) => {
      if (!ok) return;
      setEditing(false);
      setDone({});
    });
  };

  return (
    <>
      <TopBar title="Kendimi geliştirmek" />
      <div className="content">
        {t.loadingLatest ? (
          <Loading />
        ) : showForm ? (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h1 className="h-lg">Beceri açığı haritası</h1>
            <Field label="Şu anki rolün">
              <input className="input" required maxLength={120} value={currentRole} onChange={(e) => setCurrent(e.target.value)} />
            </Field>
            <Field label="Hedeflediğin rol">
              <input className="input" required maxLength={120} value={targetRole} onChange={(e) => setTarget(e.target.value)} placeholder="Ör. Takım lideri" />
            </Field>
            <Field label="Güçlü ve zayıf yanların" hint="(isteğe bağlı)">
              <textarea className="textarea" maxLength={1500} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <PrivacyHint />
            <SafetyBox notice={t.notice} />
            <ErrorBox error={t.error} />
            <button className="btn" type="submit" disabled={t.busy || !currentRole.trim() || !targetRole.trim()}>
              {t.busy ? 'Hazırlanıyor…' : 'Haritamı çıkar'}
            </button>
          </form>
        ) : (
          o && (
            <>
              <SafetyBox notice={t.notice} />
              <h1 className="h-lg">Beceri açığı haritan</h1>
              <div className="card">
                <div className="row small" style={{ fontWeight: 700, gap: 14 }}>
                  <span className="row" style={{ gap: 6 }}><span className="cell now" style={{ width: 12 }} />Şu an</span>
                  <span className="row" style={{ gap: 6 }}><span className="cell target" style={{ width: 12 }} />Hedef rol için</span>
                </div>
                {o.skills.map((s) => (
                  <div key={s.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="between" style={{ fontSize: 14, fontWeight: 700 }}>
                      <span>{s.name}</span>
                      <span style={{ color: 'var(--ink-2)' }}>{s.target > s.now ? `${s.target - s.now} seviye açık` : 'Hazır'}</span>
                    </div>
                    <div className="cells" role="img" aria-label={`Şu an ${s.now}/4, hedef ${s.target}/4`}>
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={`cell${i < s.now ? ' now' : i < s.target ? ' target' : ''}`} />
                      ))}
                    </div>
                    <span className="small">{s.why}</span>
                  </div>
                ))}
                <span className="small">Seviyeler anlattıklarına dayalı bir tahmindir.</span>
              </div>
              <div className="card">
                <div className="between">
                  <p className="eyebrow">Aylık planın</p>
                  <b>{Object.values(done).filter(Boolean).length}/{o.monthPlan.length}</b>
                </div>
                {o.monthPlan.map((w, i) => (
                  <button
                    key={i}
                    type="button"
                    role="checkbox"
                    aria-checked={!!done[i]}
                    onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '6px 0', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <span style={{ width: 26, height: 26, flex: '0 0 26px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: done[i] ? 'var(--ok)' : '#fff', border: done[i] ? 'none' : '2px solid var(--field-line)' }}>
                      {done[i] && <Icon name="check" size={14} />}
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span className="small" style={{ fontWeight: 700 }}>{w.week}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>{w.task}</span>
                    </span>
                  </button>
                ))}
              </div>
              <ReportButton tool="gelisim" content={o} />
              <button className="btn secondary" type="button" onClick={() => setEditing(true)}>
                Yeni harita
              </button>
            </>
          )
        )}
      </div>
    </>
  );
}
