import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authErrorText, devMode, resetPassword, signInEmail, signInGoogle } from '../auth';
import { Field, Icon } from '../ui';

export default function Welcome() {
  const [mode, setMode] = useState<'start' | 'email'>('start');
  const [create, setCreate] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const wrap = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg('');
    try {
      await fn();
    } catch (e) {
      setMsg(authErrorText(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    wrap(() => signInEmail(email.trim(), password, create));
  };

  return (
    <main className="welcome">
      <div style={{ fontSize: 17, fontWeight: 800 }}>[Marka]</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
        <h1 className="h-xl" style={{ fontSize: 40, lineHeight: 1.05, letterSpacing: -1.2 }}>
          İşteyken yanındaki koç.
        </h1>
        <p className="muted" style={{ fontSize: 17 }}>
          Yöneticinle görüşmeden önce, terfi istemeden önce, iş değiştirmeden önce.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="feature"><i><Icon name="chat" size={18} /></i>Zor konuşmaların provasını yap</div>
          <div className="feature"><i><Icon name="up" size={18} /></i>Başarılarını terfi dosyasına dönüştür</div>
          <div className="feature"><i><Icon name="user" size={18} /></i>Yazdıkların yalnızca sende kalır</div>
        </div>
      </div>

      {mode === 'start' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {devMode ? (
            <button className="btn white" type="button" onClick={() => wrap(signInGoogle)} disabled={busy}>
              Geliştirici olarak gir (yerel)
            </button>
          ) : (
            <>
              <button className="btn white" type="button" onClick={() => wrap(signInGoogle)} disabled={busy}>
                Google ile devam et
              </button>
              <button className="btn secondary" type="button" onClick={() => setMode('email')}>
                E-posta ile devam et
              </button>
            </>
          )}
          {msg && <p role="alert" style={{ color: '#fecaca', margin: 0 }}>{msg}</p>}
          <p className="small" style={{ color: '#aeb8c7', textAlign: 'center' }}>
            Devam ederek <Link to="/kosullar">Kullanım Koşulları</Link>'nı kabul etmiş ve <Link to="/gizlilik">Aydınlatma Metni</Link>'ni okumuş olursun.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="E-posta">
            <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Şifre" hint={create ? '(en az 6 karakter)' : undefined}>
            <input
              className="input"
              type="password"
              autoComplete={create ? 'new-password' : 'current-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {msg && <p role="alert" style={{ color: '#fecaca', margin: 0 }}>{msg}</p>}
          <button className="btn white" type="submit" disabled={busy}>
            {create ? 'Hesap oluştur' : 'Giriş yap'}
          </button>
          <div className="between">
            <button type="button" className="link-btn" style={{ color: '#fff' }} onClick={() => setCreate(!create)}>
              {create ? 'Hesabım var, giriş yap' : 'Yeni hesap oluştur'}
            </button>
            {!create && (
              <button
                type="button"
                className="link-btn"
                style={{ color: '#c7cfdc' }}
                onClick={() => wrap(async () => {
                  await resetPassword(email.trim());
                  setMsg('Şifre sıfırlama bağlantısı e-postana gönderildi.');
                })}
              >
                Şifremi unuttum
              </button>
            )}
          </div>
          <button type="button" className="link-btn" style={{ color: '#c7cfdc' }} onClick={() => setMode('start')}>
            Geri
          </button>
        </form>
      )}
    </main>
  );
}
