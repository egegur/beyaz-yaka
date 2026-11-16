import { useState, type ChangeEvent, type FormEvent } from 'react';
import { pdfToText } from '../pdf';
import { Bullets, ErrorBox, Field, OutputActions, SafetyBox, TopBar, usePrefill, useTool } from '../ui';

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn small secondary"
      style={{ alignSelf: 'flex-start' }}
      onClick={() => navigator.clipboard.writeText(text).then(() => setDone(true)).catch(() => {})}
    >
      {done ? 'Kopyalandı' : 'Kopyala'}
    </button>
  );
}

export default function CvUyarla() {
  const t = useTool('cvuyarla');
  const prefill = usePrefill();
  const [cvText, setCvText] = useState('');
  const [target, setTarget] = useState(prefill.target ?? '');
  const [fileName, setFileName] = useState('');
  const [reading, setReading] = useState(false);
  const [fileError, setFileError] = useState<unknown>(null);
  const o = t.output;

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setReading(true);
    setFileError(null);
    try {
      if (f.size > 5_000_000) throw new Error('Dosya 5 MB\'tan büyük olamaz.');
      setCvText((await pdfToText(f)).slice(0, 20_000));
      setFileName(f.name);
    } catch (err) {
      setFileError(err instanceof Error && err.message.includes('MB') ? err : new Error('PDF okunamadı. Metni aşağıya yapıştırabilirsin.'));
    } finally {
      setReading(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    t.run({ cvText, target });
  };

  return (
    <>
      <TopBar title="CV ve LinkedIn uyarlama" />
      <div className="content">
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 className="h-lg">CV'ni ve LinkedIn'ini hedef role uyarla</h1>
          <p className="muted">CV'n ve bu araçtaki sonuçlar sunucuda saklanmaz. Yapmadığın bir işi CV'ne asla eklemeyiz.</p>
          <Field label="CV (PDF)" hint="(dosya cihazında okunur)">
            <input className="input" type="file" accept="application/pdf" onChange={onFile} style={{ paddingTop: 10 }} />
          </Field>
          {reading && <span className="small">PDF okunuyor…</span>}
          {fileName && <span className="small">{fileName} okundu · {cvText.length} karakter</span>}
          <Field label="veya CV metnini yapıştır">
            <textarea className="textarea" required maxLength={20000} value={cvText} onChange={(e) => setCvText(e.target.value)} />
          </Field>
          <Field label="Hedef rol veya iş ilanı">
            <textarea className="textarea" required maxLength={8000} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Ör. Ürün yöneticisi — ya da ilan metnini yapıştır" />
          </Field>
          <ErrorBox error={fileError} />
          <SafetyBox notice={t.notice} />
          <ErrorBox error={t.error} />
          <button className="btn" type="submit" disabled={t.busy || cvText.trim().length < 100 || !target.trim()}>
            {t.busy ? 'Uyarlanıyor…' : 'Uyarla'}
          </button>
        </form>
        {o && (
          <>
            <div className="card">
              <p className="eyebrow">LinkedIn başlığı</p>
              <p className="quote">{o.headline}</p>
              <CopyBtn text={o.headline} />
            </div>
            <div className="card">
              <p className="eyebrow">LinkedIn "Hakkında"</p>
              <p className="quote" style={{ fontWeight: 500 }}>{o.about}</p>
              <CopyBtn text={o.about} />
            </div>
            <div className="card soft">
              <p className="eyebrow">CV profil özeti</p>
              <p className="quote" style={{ fontWeight: 500 }}>{o.cvSummary}</p>
              <CopyBtn text={o.cvSummary} />
            </div>
            {!!o.bulletRewrites.length && (
              <div className="card">
                <p className="eyebrow">Güçlendirilmiş maddeler</p>
                {o.bulletRewrites.map((b, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14, lineHeight: 1.45 }}>
                    <span className="small" style={{ textDecoration: 'line-through' }}>{b.before}</span>
                    <span style={{ fontWeight: 600 }}>{b.after}</span>
                  </div>
                ))}
              </div>
            )}
            {!!o.skills.length && (
              <div className="card">
                <p className="eyebrow">Öne çıkar</p>
                <div className="chips">
                  {o.skills.map((k) => (
                    <span key={k} className="tag">{k}</span>
                  ))}
                </div>
              </div>
            )}
            {!!o.warnings.length && (
              <div className="card amber">
                <b>Dikkat</b>
                <Bullets items={o.warnings} />
              </div>
            )}
            <OutputActions tool={t} history={false} />
          </>
        )}
      </div>
    </>
  );
}
