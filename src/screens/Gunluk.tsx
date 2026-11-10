import { useEffect, useState, type FormEvent } from 'react';
import type { Win } from '../../shared/types';
import { api } from '../api';
import { Bullets, ErrorBox, Field, Icon, Loading, ReportButton, SafetyBox, TabBar, useTool } from '../ui';

const TAGS = ['Verimlilik', 'Liderlik', 'Müşteri', 'Ekip çalışması', 'Rakamlı etki', 'Öğrenme'];

export default function Gunluk() {
  const [wins, setWins] = useState<Win[] | null>(null);
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const terfi = useTool('terfi');

  useEffect(() => {
    api.wins().then(setWins).catch(setError);
  }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const w = await api.addWin(text.trim(), tags);
      setWins((xs) => [w, ...(xs ?? [])]);
      setText('');
      setTags([]);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Bu kaydı silmek istiyor musun?')) return;
    await api.deleteWin(id).catch(setError);
    setWins((xs) => (xs ?? []).filter((w) => w.id !== id));
  };

  const toggle = (t: string) => setTags((xs) => (xs.includes(t) ? xs.filter((x) => x !== t) : [...xs, t]));
  const tagCount = new Set((wins ?? []).flatMap((w) => w.tags)).size;
  const t = terfi.output;

  return (
    <>
      <div className="content with-tabs" style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))' }}>
        <div>
          <h1 className="h-xl">Kazanım günlüğü</h1>
          <p className="muted">Küçük başarılar unutulur. Yazdıkların terfi dosyana dönüşür.</p>
        </div>
        <form className="card" onSubmit={add}>
          <Field label="Bu hafta ne başardın?">
            <textarea className="textarea" required maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ör. Aylık raporu otomatikleştirdim; süre 2 günden yarım güne indi." />
          </Field>
          <div className="chips" aria-label="Etiketler">
            {TAGS.map((x) => (
              <button key={x} type="button" className="chip" aria-pressed={tags.includes(x)} onClick={() => toggle(x)}>
                {x}
              </button>
            ))}
          </div>
          <div className="between">
            <span className="small">İpucu: Varsa rakamı ve etkisini yaz.</span>
            <button className="btn small" type="submit" disabled={busy || !text.trim()}>
              Ekle
            </button>
          </div>
        </form>
        <ErrorBox error={error} />

        <div className="card dark">
          <div className="between">
            <b style={{ fontSize: 16 }}>Terfi dosyan</b>
          </div>
          <div className="stats">
            <div className="stat"><b>{wins?.length ?? 0}</b><span>kazanım</span></div>
            <div className="stat"><b>{tagCount}</b><span>alan</span></div>
            <div className="stat"><b>{(wins ?? []).filter((w) => /\d/.test(w.text)).length}</b><span>rakamlı</span></div>
          </div>
          <button className="btn amber" type="button" disabled={terfi.busy || !wins?.length} onClick={() => terfi.run({})}>
            {terfi.busy ? 'Hazırlanıyor…' : t ? 'Terfi dosyasını güncelle' : 'Terfi dosyasını oluştur'}
          </button>
        </div>
        <SafetyBox notice={terfi.notice} />
        <ErrorBox error={terfi.error} />
        {t && (
          <div className="card">
            <p className="eyebrow">Terfi dosyası</p>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>{t.summary}</p>
            {t.achievements.map((a, i) => (
              <div key={i} style={{ fontSize: 14, lineHeight: 1.45 }}>
                <b>{a.title}</b>
                <br />
                {a.impact}
              </div>
            ))}
            {!!t.competencies.length && (
              <div className="chips">
                {t.competencies.map((c) => (
                  <span key={c} className="tag">{c}</span>
                ))}
              </div>
            )}
            {!!t.gaps.length && (
              <>
                <p className="eyebrow">Eksik görünen alanlar</p>
                <Bullets items={t.gaps} />
              </>
            )}
            {!!t.nextSteps.length && (
              <>
                <p className="eyebrow">Sonraki adımlar</p>
                <Bullets items={t.nextSteps} />
              </>
            )}
            <ReportButton tool="terfi" content={t} />
          </div>
        )}

        <h2 className="eyebrow">Kayıtlar</h2>
        {!wins ? (
          <Loading />
        ) : !wins.length ? (
          <p className="small">Henüz kayıt yok. İlk kazanımını yukarıdan ekle.</p>
        ) : (
          wins.map((w) => (
            <div key={w.id} className="card" style={{ gap: 8 }}>
              <div className="between">
                <span className="small" style={{ fontWeight: 700 }}>
                  {new Date(w.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <button type="button" className="icon-btn" aria-label="Kaydı sil" onClick={() => remove(w.id)}>
                  <Icon name="trash" size={18} />
                </button>
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.45, fontWeight: 600 }}>{w.text}</div>
              {!!w.tags.length && (
                <div className="chips">
                  {w.tags.map((x) => (
                    <span key={x} className="tag">{x}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <TabBar />
    </>
  );
}
