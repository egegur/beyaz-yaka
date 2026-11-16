import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import type { ProvaMode, ProvaTurn, SafetyNotice } from '../../shared/types';
import { api } from '../api';
import { ErrorBox, FeedbackBar, Field, Icon, PrivacyHint, SafetyBox, TabBar, TopBar, useMe } from '../ui';

interface Item extends ProvaTurn {
  coach?: { feedback: string; better: string } | null;
}

const LEVELS = ['kolay', 'orta', 'zor'];

export default function Prova() {
  const loc = useLocation();
  const { refresh } = useMe();
  const st = (loc.state as { scenario?: string; mode?: ProvaMode; prefill?: Record<string, string> } | null) ?? {};
  const pre = st.prefill ?? {};
  const [mode, setMode] = useState<ProvaMode>(st.mode === 'mulakat' ? 'mulakat' : 'konusma');
  const [scenario, setScenario] = useState(pre.scenario ?? pre.role ?? st.scenario ?? '');
  const [jobText, setJobText] = useState(pre.jobText ?? '');
  const [counterpart, setCounterpart] = useState(pre.counterpart ?? 'Yönetici');
  const who = mode === 'mulakat' ? 'Mülakatçı' : counterpart || 'Karşı taraf';
  const [difficulty, setDifficulty] = useState('orta');
  const [items, setItems] = useState<Item[]>([]);
  const [started, setStarted] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<SafetyNotice | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [items, busy]);

  const turn = async (history: Item[]) => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.prova({
        scenario,
        counterpart: who,
        difficulty,
        mode,
        jobText: mode === 'mulakat' ? jobText : undefined,
        history: history.map(({ role, text }) => ({ role, text })),
      });
      if (!r.ok) {
        setNotice(r.notice);
        return;
      }
      setNotice(r.notice);
      const next = [...history];
      if (r.output.coachNote && next.length) {
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, coach: r.output.coachNote };
      }
      next.push({ role: 'counterpart', text: r.output.reply });
      setItems(next);
      refresh();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const start = (e: FormEvent) => {
    e.preventDefault();
    setStarted(true);
    setItems([]);
    turn([]);
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    const next: Item[] = [...items, { role: 'user', text: t }];
    setItems(next);
    setText('');
    turn(next);
  };

  const reset = () => {
    setStarted(false);
    setItems([]);
    setNotice(null);
    setError(null);
  };

  if (!started) {
    return (
      <>
        <TopBar title={mode === 'mulakat' ? 'Mülakat provası' : 'Zor konuşma provası'} />
        <form className="content with-tabs" onSubmit={start}>
          <h1 className="h-lg">Neyin provasını yapalım?</h1>
          <div className="chips" role="radiogroup" aria-label="Prova türü">
            <button type="button" role="radio" aria-checked={mode === 'konusma'} className="chip" onClick={() => setMode('konusma')}>
              Zor konuşma
            </button>
            <button type="button" role="radio" aria-checked={mode === 'mulakat'} className="chip" onClick={() => setMode('mulakat')}>
              İş mülakatı
            </button>
          </div>
          <p className="muted">
            {mode === 'mulakat'
              ? 'Koç mülakatçı olur, her seferinde tek soru sorar. Cevabın eksikse Durum-Görev-Eylem-Sonuç yapısına göre nasıl güçlendireceğini söyler.'
              : 'Koç karşı tarafın rolüne girer. Cevabın geliştirilebilirse araya girip daha iyi bir cümle önerir.'}
          </p>
          {mode === 'mulakat' ? (
            <>
              <Field label="Hangi rol için?">
                <input className="input" required maxLength={600} value={scenario} onChange={(e) => setScenario(e.target.value)} placeholder="Ör. Kıdemli ürün yöneticisi" />
              </Field>
              <Field label="İş ilanı" hint="(isteğe bağlı, sorular buna göre gelir)">
                <textarea className="textarea" maxLength={4000} value={jobText} onChange={(e) => setJobText(e.target.value)} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Durum">
                <textarea className="textarea" required maxLength={600} value={scenario} onChange={(e) => setScenario(e.target.value)} placeholder="Ör. Yöneticimden yeni projede sorumluluk istemek" />
              </Field>
              <Field label="Karşı taraf">
                <input className="input" maxLength={60} value={counterpart} onChange={(e) => setCounterpart(e.target.value)} />
              </Field>
            </>
          )}
          <p className="small">Bir prova oturumu günlük hakkından yalnızca 1 sayılır.</p>
          <div className="field">
            <span id="zorluk">Zorluk</span>
            <div className="chips" role="radiogroup" aria-labelledby="zorluk">
              {LEVELS.map((l) => (
                <button key={l} type="button" role="radio" aria-checked={difficulty === l} className="chip" onClick={() => setDifficulty(l)}>
                  {l[0].toLocaleUpperCase('tr-TR') + l.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <PrivacyHint />
          <button className="btn" type="submit" disabled={!scenario.trim()}>
            Provayı başlat
          </button>
        </form>
        <TabBar />
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <TopBar
        title={mode === 'mulakat' ? 'Mülakat provası' : `Prova: ${who}`}
        back="/"
        right={
          <button className="btn secondary small" type="button" onClick={reset}>
            Bitir
          </button>
        }
      />
      <div className="content" aria-live="polite" style={{ gap: 12 }}>
        <div className="small" style={{ alignSelf: 'center' }}>
          {scenario} · zorluk: {difficulty}
        </div>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className={`bubble ${it.role === 'user' ? 'me' : 'them'}`}>
              <span className="who">{it.role === 'user' ? 'Sen' : who}</span>
              <span className="text">{it.text}</span>
            </div>
            {it.coach && (
              <div className="card amber">
                <div className="row" style={{ fontSize: 13, fontWeight: 800 }}>
                  <Icon name="bulb" size={18} />
                  Koçun notu
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{it.coach.feedback}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5, fontWeight: 700 }}>Dene: "{it.coach.better}"</div>
                <button type="button" className="link-btn" style={{ color: 'var(--amber-ink)' }} onClick={() => setText(it.coach!.better)}>
                  Bu cümleyi kullan
                </button>
              </div>
            )}
          </div>
        ))}
        {busy && <div className="small">{who} yazıyor…</div>}
        <SafetyBox notice={notice} />
        <ErrorBox error={error} />
        {items.filter((x) => x.role === 'user').length >= 2 && !busy && <FeedbackBar tool={mode === 'mulakat' ? 'mulakat' : 'prova'} />}
        <div ref={endRef} />
      </div>
      <form className="sticky-actions" onSubmit={send} style={{ alignItems: 'flex-end' }}>
        <label className="field" style={{ flex: 1 }}>
          <span className="visually-hidden">Cevabın</span>
          <input className="input" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Cevabın…" disabled={busy} />
        </label>
        <button className="btn" type="submit" aria-label="Gönder" disabled={busy || !text.trim()} style={{ width: 52, padding: 0 }}>
          <Icon name="send" />
        </button>
      </form>
    </div>
  );
}
