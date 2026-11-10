import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import type { ProvaTurn, SafetyNotice } from '../../shared/types';
import { api } from '../api';
import { ErrorBox, Field, Icon, PrivacyHint, SafetyBox, TabBar, TopBar, useMe } from '../ui';

interface Item extends ProvaTurn {
  coach?: { feedback: string; better: string } | null;
}

const LEVELS = ['kolay', 'orta', 'zor'];

export default function Prova() {
  const loc = useLocation();
  const { refresh } = useMe();
  const preset = (loc.state as { scenario?: string } | null)?.scenario ?? '';
  const [scenario, setScenario] = useState(preset);
  const [counterpart, setCounterpart] = useState('Yönetici');
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
        counterpart,
        difficulty,
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
        <TopBar title="Zor konuşma provası" />
        <form className="content with-tabs" onSubmit={start}>
          <h1 className="h-lg">Neyin provasını yapalım?</h1>
          <p className="muted">Koç karşı tarafın rolüne girer. Cevabın geliştirilebilirse araya girip daha iyi bir cümle önerir.</p>
          <Field label="Durum">
            <textarea className="textarea" required maxLength={600} value={scenario} onChange={(e) => setScenario(e.target.value)} placeholder="Ör. Yöneticimden yeni projede sorumluluk istemek" />
          </Field>
          <Field label="Karşı taraf">
            <input className="input" maxLength={60} value={counterpart} onChange={(e) => setCounterpart(e.target.value)} />
          </Field>
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
        title={`Prova: ${counterpart}`}
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
              <span className="who">{it.role === 'user' ? 'Sen' : counterpart}</span>
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
        {busy && <div className="small">{counterpart} yazıyor…</div>}
        <SafetyBox notice={notice} />
        <ErrorBox error={error} />
        <div ref={endRef} />
      </div>
      <form className="sticky-actions" onSubmit={send} style={{ alignItems: 'flex-end' }}>
        <label className="field" style={{ flex: 1 }}>
          <span className="visually-hidden">Cevabın</span>
          <input className="input" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder={`${counterpart}'e ne dersin?`} disabled={busy} />
        </label>
        <button className="btn" type="submit" aria-label="Gönder" disabled={busy || !text.trim()} style={{ width: 52, padding: 0 }}>
          <Icon name="send" />
        </button>
      </form>
    </div>
  );
}
