import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AGE_OPTIONS, CITY_OPTIONS, COMPANY_SIZE_OPTIONS, MANAGES_OPTIONS } from '../../shared/options';
import { api } from '../api';
import { ErrorBox, TopBar, useMe } from '../ui';

const QUESTIONS = [
  { key: 'ageRange', label: 'Yaş aralığın', options: AGE_OPTIONS },
  { key: 'companySize', label: 'Çalıştığın şirketin büyüklüğü', options: COMPANY_SIZE_OPTIONS },
  { key: 'manages', label: 'Bir ekip yönetiyor musun?', options: MANAGES_OPTIONS },
  { key: 'city', label: 'Hangi şehirde çalışıyorsun?', options: CITY_OPTIONS },
] as const;

type Key = (typeof QUESTIONS)[number]['key'];

/** Kayıttan sonra isteğe bağlı ikinci adım. Her soru atlanabilir. */
export default function KayitDetay() {
  const { me, refresh } = useMe();
  const navigate = useNavigate();
  const editing = !!me?.extraDone;
  const [answers, setAnswers] = useState<Record<Key, string>>({
    ageRange: me?.ageRange ?? '',
    companySize: me?.companySize ?? '',
    manages: me?.manages ?? '',
    city: me?.city ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const save = async (skip: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, string | boolean> = { extraDone: true };
      if (!skip) for (const q of QUESTIONS) if (answers[q.key]) body[q.key] = answers[q.key];
      await api.updateMe(body);
      await refresh();
      navigate(editing ? '/hesap' : '/');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <TopBar title="Ek bilgiler" back={editing ? '/hesap' : '/'} />
      <div className="content">
        <div>
          <h1 className="h-xl">Seni biraz daha tanıyalım</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            İsteğe bağlı. Koçun önerilerini kendi durumuna göre ayarlar. Bu bilgiler yalnızca toplu istatistikte kullanılır, kimseyle kişi bazında paylaşılmaz.
          </p>
        </div>
        {QUESTIONS.map((q) => (
          <div className="field" key={q.key}>
            <span id={`q-${q.key}`}>{q.label}</span>
            <div className="chips" role="radiogroup" aria-labelledby={`q-${q.key}`}>
              {q.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={answers[q.key] === o}
                  className="chip"
                  onClick={() => setAnswers((a) => ({ ...a, [q.key]: a[q.key] === o ? '' : o }))}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        ))}
        <ErrorBox error={error} />
      </div>
      <div className="sticky-actions">
        {!editing && (
          <button className="btn secondary" style={{ flex: 1 }} type="button" disabled={busy} onClick={() => save(true)}>
            Şimdi değil
          </button>
        )}
        <button className="btn" style={{ flex: 2 }} type="button" disabled={busy} onClick={() => save(false)}>
          {editing ? 'Kaydet' : 'Devam'}
        </button>
      </div>
    </div>
  );
}
