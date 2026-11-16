import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { AiResult, HistoryItem, Me, SafetyNotice, ToolId, ToolOutputs } from '../shared/types';
import { api, ApiError } from './api';

// ---------- İkonlar (çizgi SVG) ----------

const paths: Record<string, ReactNode> = {
  back: <path d="m15 18-6-6 6-6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  home: <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  pen: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  map: (
    <>
      <path d="M9 20 3 17V4l6 3 6-3 6 3v13l-6-3z" />
      <path d="M9 7v13M15 4v13" />
    </>
  ),
  brief: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  people: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  book: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  up: (
    <>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </>
  ),
  pulse: <path d="M3 12h4l3-9 4 18 3-9h4" />,
  send: (
    <>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  doc: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </>
  ),
  msg: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  trash: <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />,
  bulb: (
    <>
      <path d="M9 18h6M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
    </>
  ),
};

export function Icon({ name, size = 20 }: { name: keyof typeof paths | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

// ---------- Yerleşim ----------

export function TopBar({ title, back = '/', right }: { title: string; back?: string; right?: ReactNode }) {
  return (
    <header className="topbar">
      <Link to={back} className="icon-btn" aria-label="Geri">
        <Icon name="back" size={22} />
      </Link>
      <h1>{title}</h1>
      {right}
    </header>
  );
}

const TABS = [
  { to: '/', label: 'Bugün', icon: 'home' },
  { to: '/anlat', label: 'Koç', icon: 'chat' },
  { to: '/gunluk', label: 'Günlük', icon: 'pen' },
  { to: '/yol', label: 'Planım', icon: 'map' },
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Ana menü">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
          <Icon name={t.icon} size={22} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Loading({ text = 'Yükleniyor…' }: { text?: string }) {
  return (
    <div className="center" role="status">
      <div className="spinner" aria-hidden="true" />
      {text}
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  const navigate = useNavigate();
  if (!error) return null;
  const e = error instanceof ApiError ? error : null;
  const msg = e?.message ?? 'Bir sorun oluştu. Lütfen tekrar dene.';
  return (
    <div className="notice error" role="alert">
      <span>{msg}</span>
      {e?.code === 'trial_ended' && (
        <button className="btn small" type="button" onClick={() => navigate('/abonelik')}>
          Planları gör
        </button>
      )}
      {e?.code === 'age_required' && (
        <button className="btn small" type="button" onClick={() => navigate('/kayit')}>
          Profili tamamla
        </button>
      )}
    </div>
  );
}

export function SafetyBox({ notice }: { notice: SafetyNotice | null }) {
  if (!notice) return null;
  return (
    <div className={`notice ${notice.kind}`} role={notice.kind === 'crisis' ? 'alert' : 'note'}>
      {notice.kind === 'crisis' && <strong>Şu an önemli olan sensin</strong>}
      <span>{notice.text}</span>
      {notice.kind === 'crisis' && (
        <a className="btn small" href="tel:112">
          112'yi ara
        </a>
      )}
    </div>
  );
}

export function Bullets({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul>
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>
        {label} {hint && <span className="hint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

/** "Bu çıktıyı bildir": hatalı veya uygunsuz çıktıları kaydeder. */
export function ReportButton({ tool, content }: { tool: string; content: unknown }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);
  if (sent) return <p className="small">Bildirimin alındı, teşekkürler.</p>;
  if (!open)
    return (
      <button type="button" className="link-btn" onClick={() => setOpen(true)} style={{ color: 'var(--ink-3)', fontWeight: 700 }}>
        Bu çıktıyı bildir
      </button>
    );
  const send = async () => {
    if (!reason.trim()) return;
    try {
      await api.report(tool, reason.trim().slice(0, 300), JSON.stringify(content).slice(0, 8000));
      setSent(true);
    } catch {
      setSent(true);
    }
  };
  return (
    <div className="card">
      <Field label="Bu çıktıda ne yanlış?">
        <input className="input" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <div className="row">
        <button type="button" className="btn small secondary" onClick={() => setOpen(false)}>
          Vazgeç
        </button>
        <button type="button" className="btn small" onClick={send} disabled={!reason.trim()}>
          Gönder
        </button>
      </div>
    </div>
  );
}

export function PrivacyHint() {
  return <p className="small">İsim, şirket adı veya gizli bilgi yazmana gerek yok. Yazdıkların şirketinle paylaşılmaz.</p>;
}

// ---------- Kullanıcı bağlamı ----------

interface MeCtx {
  me: Me | null;
  refresh: () => Promise<void>;
  error: unknown;
}
const MeContext = createContext<MeCtx>({ me: null, refresh: async () => {}, error: null });

export function MeProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<unknown>(null);
  const refresh = useCallback(async () => {
    try {
      setMe(await api.me());
      setError(null);
    } catch (e) {
      setError(e);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return <MeContext.Provider value={{ me, refresh, error }}>{children}</MeContext.Provider>;
}

export function useMe() {
  return useContext(MeContext);
}

// ---------- Araç çalıştırma ----------

export function useTool<K extends ToolId>(id: K) {
  const { refresh } = useMe();
  const [output, setOutput] = useState<ToolOutputs[K] | null>(null);
  const [notice, setNotice] = useState<SafetyNotice | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .latest(id)
      .then((r) => alive && r && setOutput(r.output))
      .catch(() => {})
      .finally(() => alive && setLoadingLatest(false));
    return () => {
      alive = false;
    };
  }, [id]);

  /** Başarılı bir çıktı geldiyse true döner. */
  const run = async (input: Record<string, string>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const r: AiResult<ToolOutputs[K]> = await api.tool(id, input);
      refresh();
      if (r.ok) {
        setOutput(r.output);
        setNotice(r.notice);
        return true;
      }
      setOutput(null);
      setNotice(r.notice);
      return false;
    } catch (e) {
      setError(e);
      return false;
    } finally {
      setBusy(false);
    }
  };
  /** Mevcut çıktıyı tek cümlelik istekle yeniler. */
  const revise = async (instruction: string): Promise<boolean> => {
    if (!output) return false;
    setBusy(true);
    setError(null);
    try {
      const r: AiResult<ToolOutputs[K]> = await api.revize(id, output, instruction);
      refresh();
      setNotice(r.notice);
      if (r.ok) {
        setOutput(r.output);
        return true;
      }
      return false;
    } catch (e) {
      setError(e);
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { id, output, setOutput, notice, error, busy, loadingLatest, run, revise };
}

/** Önceki ekrandan (ör. "Ne oluyor, anlat") gelen form değerleri. */
export function usePrefill(): Record<string, string> {
  const loc = useLocation();
  const p = (loc.state as { prefill?: Record<string, string> } | null)?.prefill;
  return p && typeof p === 'object' ? p : {};
}

// ---------- Çıktı altı: işe yaradı mı, takip isteği, geçmiş, bildir ----------

export function FeedbackBar({ tool }: { tool: string }) {
  const [state, setState] = useState<'ask' | 'note' | 'done'>('ask');
  const [note, setNote] = useState('');
  const send = async (useful: boolean, n?: string) => {
    setState('done');
    try {
      await api.feedback(tool, useful, n);
    } catch {
      /* geri bildirim hatası kullanıcıyı durdurmaz */
    }
  };
  if (state === 'done') return <p className="small">Teşekkürler, geri bildirimin bize yol gösteriyor.</p>;
  if (state === 'note')
    return (
      <div className="card">
        <Field label="Neyi eksik buldun?" hint="(isteğe bağlı)">
          <input className="input" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <button type="button" className="btn small" style={{ alignSelf: 'flex-start' }} onClick={() => send(false, note.trim() || undefined)}>
          Gönder
        </button>
      </div>
    );
  return (
    <div className="between" role="group" aria-label="İşe yaradı mı?">
      <span style={{ fontSize: 14, fontWeight: 700 }}>Bu işine yaradı mı?</span>
      <span className="row">
        <button type="button" className="chip" onClick={() => send(true)}>
          Evet
        </button>
        <button type="button" className="chip" onClick={() => setState('note')}>
          Pek değil
        </button>
      </span>
    </div>
  );
}

export function ReviseBox({ busy, onRevise, placeholder }: { busy: boolean; onRevise: (t: string) => Promise<boolean>; placeholder?: string }) {
  const [text, setText] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    if (await onRevise(t)) setText('');
  };
  return (
    <form className="card" onSubmit={submit}>
      <Field label="Bunu değiştirelim mi?" hint="(ör. daha kısa olsun, şu itirazı da ekle)">
        <input className="input" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} />
      </Field>
      <button className="btn small secondary" type="submit" disabled={busy || !text.trim()} style={{ alignSelf: 'flex-start' }}>
        {busy ? 'Yenileniyor…' : 'Uygula'}
      </button>
    </form>
  );
}

export function HistoryList<K extends ToolId>({ id, onPick }: { id: K; onPick: (o: ToolOutputs[K]) => void }) {
  const [items, setItems] = useState<HistoryItem<ToolOutputs[K]>[] | null>(null);
  const [open, setOpen] = useState(false);
  const load = async () => {
    setOpen(!open);
    if (!items) setItems(await api.history(id).catch(() => []));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button type="button" className="link-btn" onClick={load} aria-expanded={open}>
        {open ? 'Önceki çıktıları gizle' : 'Önceki çıktılar'}
      </button>
      {open && !items && <Loading />}
      {open && items && !items.length && <span className="small">Henüz önceki çıktı yok.</span>}
      {open &&
        items?.map((it, i) => (
          <button
            key={it.id}
            type="button"
            className="list-row"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, textAlign: 'left', cursor: 'pointer', minHeight: 48 }}
            onClick={() => {
              onPick(it.output);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span style={{ flex: 1 }}>
              {new Date(it.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
              {i === 0 && <span className="small"> · en son</span>}
            </span>
            <Icon name="chevron" size={16} />
          </button>
        ))}
    </div>
  );
}

/** Her araç çıktısının altına: takip isteği, işe yaradı mı, geçmiş, bildir. */
export function OutputActions<K extends ToolId>({ tool, history = true }: { tool: ReturnType<typeof useTool<K>> & { id: K }; history?: boolean }) {
  if (!tool.output) return null;
  return (
    <>
      <ReviseBox busy={tool.busy} onRevise={tool.revise} />
      <ErrorBox error={tool.error} />
      <FeedbackBar tool={tool.id} />
      {history && <HistoryList id={tool.id} onPick={(o) => tool.setOutput(o)} />}
      <ReportButton tool={tool.id} content={tool.output} />
    </>
  );
}
