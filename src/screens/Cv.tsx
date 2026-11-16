import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CvOutput } from '../../shared/types';
import { api } from '../api';
import { ErrorBox, FeedbackBar, Field, ReportButton, TopBar, useMe } from '../ui';
import { pdfToText } from '../pdf';

const METRICS: { key: keyof CvOutput['metrics']; label: string }[] = [
  { key: 'keywords', label: 'Anahtar kelime uyumu' },
  { key: 'format', label: 'Okunabilir biçim' },
  { key: 'sections', label: 'Bölüm başlıkları' },
  { key: 'impact', label: 'Ölçülebilir başarılar' },
];

function color(v: number): string {
  return v >= 75 ? 'var(--ok)' : v >= 50 ? 'var(--warn)' : 'var(--bad)';
}

export default function Cv() {
  const { me, refresh } = useMe();
  const [cvText, setCvText] = useState('');
  const [jobText, setJobText] = useState('');
  const [fileName, setFileName] = useState('');
  const [out, setOut] = useState<CvOutput | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const credits = me?.cvCredits ?? 0;

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setReading(true);
    setError(null);
    try {
      if (f.size > 5_000_000) throw new Error('Dosya 5 MB\'tan büyük olamaz.');
      setCvText((await pdfToText(f)).slice(0, 20_000));
      setFileName(f.name);
    } catch (err) {
      setError(err instanceof Error && err.message.includes('MB') ? err : new Error('PDF okunamadı. Metni aşağıya yapıştırabilirsin.'));
    } finally {
      setReading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api.cv(cvText, jobText);
      if (r.ok) setOut(r.output);
      await refresh();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const C = 2 * Math.PI * 44;

  return (
    <>
      <TopBar title="ATS CV skoru" right={<span className="tag amber" style={{ marginRight: 8 }}>Ücretli araç</span>} />
      <div className="content">
        {credits <= 0 && !out ? (
          <div className="card amber">
            <b style={{ fontSize: 16 }}>CV'ni başvurmadan önce ölç</b>
            <span style={{ fontSize: 14, lineHeight: 1.5 }}>
              CV'ni hedef ilana göre değerlendirir; eksik anahtar kelimeleri, biçim sorunlarını ve en çok puan kazandıracak düzeltmeleri gösterir. Bu araç abonelikten ayrı, ücretli bir araçtır.
            </span>
            <Link className="btn" to="/abonelik">
              Hak satın al
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="between">
              <h1 className="h-lg">CV'ni ilana göre ölç</h1>
              <span className="tag">{credits} hak</span>
            </div>
            <Field label="CV (PDF)" hint="(dosya cihazında okunur, sunucuya yüklenmez)">
              <input className="input" type="file" accept="application/pdf" onChange={onFile} style={{ paddingTop: 10 }} />
            </Field>
            {reading && <span className="small">PDF okunuyor…</span>}
            {fileName && <span className="small">{fileName} okundu · {cvText.length} karakter</span>}
            <Field label="veya CV metnini yapıştır">
              <textarea className="textarea" required maxLength={20000} value={cvText} onChange={(e) => setCvText(e.target.value)} />
            </Field>
            <Field label="Hedef iş ilanı">
              <textarea className="textarea" required maxLength={8000} value={jobText} onChange={(e) => setJobText(e.target.value)} placeholder="İlan metnini buraya yapıştır" />
            </Field>
            <ErrorBox error={error} />
            <button className="btn" type="submit" disabled={busy || credits <= 0 || cvText.trim().length < 200 || !jobText.trim()}>
              {busy ? 'Ölçülüyor…' : 'Skorumu ölç (1 hak)'}
            </button>
          </form>
        )}

        {out && (
          <>
            <div className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
              <svg width="104" height="104" viewBox="0 0 104 104" role="img" aria-label={`Tahmini ATS uyum skoru: 100 üzerinden ${out.score}`} style={{ flex: '0 0 104px' }}>
                <circle cx="52" cy="52" r="44" fill="none" stroke="#eef1f5" strokeWidth="10" />
                <circle cx="52" cy="52" r="44" fill="none" stroke={color(out.score)} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(C * out.score) / 100} ${C}`} transform="rotate(-90 52 52)" />
                <text x="52" y="60" textAnchor="middle" fontSize="28" fontWeight="800" fill="#0f172a">{out.score}</text>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <b style={{ fontSize: 18 }}>Tahmini ATS uyumu</b>
                <span className="small">Şirketlerin kullandığı sistemler farklı çalışır; skor bir tahmindir.</span>
              </div>
            </div>
            <div className="card">
              <p className="eyebrow">Ölçümler</p>
              {METRICS.map((m) => (
                <div key={m.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="between" style={{ fontSize: 14, fontWeight: 700 }}>
                    <span>{m.label}</span>
                    <span>{out.metrics[m.key]}/100</span>
                  </div>
                  <div className="bar">
                    <div style={{ width: `${out.metrics[m.key]}%`, background: color(out.metrics[m.key]) }} />
                  </div>
                </div>
              ))}
            </div>
            {!!out.missingKeywords.length && (
              <div className="card">
                <p className="eyebrow">İlanda var, CV'nde yok</p>
                <div className="chips">
                  {out.missingKeywords.map((k) => (
                    <span key={k} className="tag red">{k}</span>
                  ))}
                </div>
                <span className="small">Yalnızca gerçekten yaptığın işler için ekle.</span>
              </div>
            )}
            {out.tips.map((tip, i) => (
              <div className="card" key={i}>
                <div className="between">
                  <b style={{ fontSize: 15 }}>{tip.title}</b>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ok)', whiteSpace: 'nowrap' }}>+{tip.gain} puan</span>
                </div>
                <span style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--ink-2)' }}>{tip.body}</span>
              </div>
            ))}
            <Link className="card" to="/cv-uyarla" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
              <b>CV'ni ve LinkedIn profilini bu role uyarla</b>
              <span className="small">Profil özeti, güçlendirilmiş maddeler ve LinkedIn metinleri.</span>
            </Link>
            <FeedbackBar tool="cv" />
            <ReportButton tool="cv" content={out} />
          </>
        )}
      </div>
    </>
  );
}
