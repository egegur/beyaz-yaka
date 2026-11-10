import { useState, type FormEvent } from 'react';
import { Bullets, ErrorBox, Field, PrivacyHint, ReportButton, SafetyBox, TopBar, useTool } from '../ui';

export default function Ton() {
  const t = useTool('ton');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('Yöneticim');
  const [copied, setCopied] = useState(false);
  const o = t.output;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setCopied(false);
    t.run({ message, recipient });
  };

  return (
    <>
      <TopBar title="Mesaj tonu kontrolü" />
      <div className="content">
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 className="h-lg">Göndermeden önce bir bak</h1>
          <Field label="Mesaj taslağın">
            <textarea className="textarea" required maxLength={3000} value={message} onChange={(e) => setMessage(e.target.value)} style={{ minHeight: 140 }} />
          </Field>
          <Field label="Kime gidiyor?">
            <input className="input" maxLength={120} value={recipient} onChange={(e) => setRecipient(e.target.value)} />
          </Field>
          <PrivacyHint />
          <SafetyBox notice={t.notice} />
          <ErrorBox error={t.error} />
          <button className="btn" type="submit" disabled={t.busy || !message.trim()}>
            {t.busy ? 'İnceleniyor…' : 'Tonu kontrol et'}
          </button>
        </form>
        {o && (
          <>
            <div className="card">
              <p className="eyebrow">Değerlendirme</p>
              <span style={{ fontSize: 14, lineHeight: 1.5 }}>{o.assessment}</span>
              {!!o.risks.length && (
                <>
                  <p className="eyebrow">Yanlış anlaşılabilecekler</p>
                  <Bullets items={o.risks} />
                </>
              )}
            </div>
            <div className="card soft">
              <p className="eyebrow">Önerilen hali</p>
              <p className="quote" style={{ fontWeight: 500 }}>{o.rewritten}</p>
              <button
                type="button"
                className="btn small"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => navigator.clipboard.writeText(o.rewritten).then(() => setCopied(true)).catch(() => {})}
              >
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>
            <ReportButton tool="ton" content={o} />
          </>
        )}
      </div>
    </>
  );
}
