import { useNavigate } from 'react-router-dom';
import { AYDINLATMA, DRAFT_NOTICE, KOSULLAR } from '../legal';
import { Icon } from '../ui';

export default function Legal({ doc }: { doc: 'gizlilik' | 'kosullar' }) {
  const d = doc === 'gizlilik' ? AYDINLATMA : KOSULLAR;
  const navigate = useNavigate();
  return (
    <>
      <header className="topbar">
        <button type="button" className="icon-btn" aria-label="Geri" onClick={() => (history.length > 1 ? navigate(-1) : navigate('/'))}>
          <Icon name="back" size={22} />
        </button>
        <h1>{d.title}</h1>
      </header>
      <article className="content" style={{ gap: 18 }}>
        <div className="notice legal" role="note">{DRAFT_NOTICE}</div>
        <div>
          <h2 className="h-lg" style={{ fontSize: 22 }}>{d.title}</h2>
          <p className="small">Son güncelleme: {d.updated}</p>
        </div>
        {d.sections.map((s) => (
          <section key={s.title} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{s.title}</h3>
            {s.paragraphs?.map((p, i) => (
              <p key={i} style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>{p}</p>
            ))}
            {s.bullets && (
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)' }}>
                {s.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
            {s.after?.map((p, i) => (
              <p key={`a${i}`} style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>{p}</p>
            ))}
          </section>
        ))}
      </article>
    </>
  );
}
