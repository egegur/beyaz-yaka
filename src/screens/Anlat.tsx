import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AnlatOutput, SafetyNotice, SuggestTarget } from '../../shared/types';
import { api } from '../api';
import { ErrorBox, FeedbackBar, Field, Icon, PrivacyHint, SafetyBox, TabBar, useMe } from '../ui';

/** Öneri hedefi → ekran ve kart başlığı. */
const TARGETS: Record<SuggestTarget, { path: string; label: string; state?: Record<string, unknown> }> = {
  rol: { path: '/rol', label: 'Rolümü anlamak' },
  birebir: { path: '/birebir', label: 'Birebir görüşme hazırlığı' },
  prova: { path: '/prova', label: 'Zor konuşma provası' },
  mulakat: { path: '/prova', label: 'Mülakat provası', state: { mode: 'mulakat' } },
  ton: { path: '/ton', label: 'Mesaj tonu kontrolü' },
  gelisim: { path: '/gelisim', label: 'Beceri açığı haritası' },
  performans: { path: '/performans', label: 'Performans değerlendirmesi hazırlığı' },
  maas: { path: '/maas', label: 'Maaş görüşmesi' },
  terfi: { path: '/gunluk', label: 'Terfi dosyası' },
  yol: { path: '/yol', label: 'Kariyer değişimi yol haritası' },
  cvuyarla: { path: '/cv-uyarla', label: 'CV ve LinkedIn uyarlama' },
};

export default function Anlat() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { refresh } = useMe();
  const initial = (loc.state as { text?: string } | null)?.text ?? '';
  const [text, setText] = useState(initial);
  const [out, setOut] = useState<AnlatOutput | null>(null);
  const [notice, setNotice] = useState<SafetyNotice | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const run = async (t: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const r = await api.anlat(t);
      setNotice(r.notice);
      setOut(r.ok ? r.output : null);
      refresh();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  // Ana ekrandan metinle gelindiyse hemen çalıştır.
  useEffect(() => {
    if (initial.trim() && !started.current) {
      started.current = true;
      run(initial.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) run(text.trim());
  };

  const go = (target: SuggestTarget, prefill: Record<string, string>) => {
    const t = TARGETS[target];
    navigate(t.path, { state: { prefill, ...(t.state ?? {}) } });
  };

  return (
    <>
      <div className="content with-tabs" style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))' }}>
        <div>
          <h1 className="h-xl">Ne oluyor, anlat</h1>
          <p className="muted">İş yerinde aklını kurcalayan durumu kendi cümlelerinle yaz. Önce ne yapabileceğini söyleyelim, sonra doğru aracı hazır açalım.</p>
        </div>
        <form className="card" onSubmit={submit}>
          <Field label="Durumun">
            <textarea
              className="textarea"
              required
              maxLength={2000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ör. Yöneticim toplantılarda sözümü kesiyor, fikirlerim görmezden geliniyor. Konuşmalı mıyım, nasıl?"
              style={{ minHeight: 130 }}
            />
          </Field>
          <PrivacyHint />
          <button className="btn" type="submit" disabled={busy || !text.trim()}>
            {busy ? 'Dinliyorum…' : 'Koça anlat'}
          </button>
        </form>
        <SafetyBox notice={notice} />
        <ErrorBox error={error} />
        {out && (
          <>
            <div className="card soft">
              <p className="eyebrow">Anladığım kadarıyla</p>
              <p className="quote" style={{ fontWeight: 500 }}>{out.understanding}</p>
            </div>
            {!!out.firstSteps.length && (
              <div className="card">
                <p className="eyebrow">Hemen yapabileceklerin</p>
                {out.firstSteps.map((s, i) => (
                  <div className="step" key={i}>
                    <span className="num">{i + 1}</span>
                    <span style={{ flex: 1 }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {out.question && (
              <div className="card amber">
                <b>Daha iyi yardım edebilmem için</b>
                <span style={{ fontSize: 14, lineHeight: 1.5 }}>{out.question}</span>
                <span className="small" style={{ color: 'var(--amber-ink-2)' }}>Cevabını yukarıdaki metne ekleyip tekrar gönderebilirsin.</span>
              </div>
            )}
            {!!out.suggestions.length && (
              <>
                <h2 className="eyebrow">Senin için hazırladım</h2>
                <nav className="list" aria-label="Önerilen araçlar">
                  {out.suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className="list-row"
                      onClick={() => go(s.target, s.prefill)}
                      style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #eef1f5', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <span className="list-icon"><Icon name="chevron" /></span>
                      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className="row-title">{TARGETS[s.target].label}</span>
                        <span className="row-sub">{s.why}</span>
                      </span>
                    </button>
                  ))}
                </nav>
              </>
            )}
            <FeedbackBar tool="anlat" />
          </>
        )}
      </div>
      <TabBar />
    </>
  );
}
