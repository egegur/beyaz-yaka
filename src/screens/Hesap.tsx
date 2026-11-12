import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { authErrorText, deleteAuthAccount, logout } from '../auth';
import { ErrorBox, Field, TopBar, useMe } from '../ui';

export default function Hesap() {
  const { me } = useMe();
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [authMsg, setAuthMsg] = useState('');

  const del = async () => {
    setBusy(true);
    setError(null);
    setAuthMsg('');
    try {
      await api.deleteMe();
      try {
        await deleteAuthAccount();
      } catch (e) {
        setAuthMsg(`Verilerin silindi. Giriş hesabını silmek için: ${authErrorText(e)}`);
        return;
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TopBar title="Hesabım" />
      <div className="content">
        <div className="card">
          <p className="eyebrow">Profil</p>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{me?.role ?? '—'}</span>
          <span className="small">
            {[me?.sector, me?.experience].filter(Boolean).join(' · ') || 'Sektör ve deneyim girilmedi'}
          </span>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <Link to="/kayit" className="btn secondary small">
              Profili düzenle
            </Link>
            <Link to="/kayit/detay" className="btn secondary small">
              Ek bilgiler
            </Link>
          </div>
        </div>
        <div className="card">
          <p className="eyebrow">Plan</p>
          <span style={{ fontSize: 15, fontWeight: 700 }}>
            {me?.plan === 'sub' ? 'Abone' : me?.plan === 'trial' ? 'Deneme' : 'Deneme bitti'}
          </span>
          <span className="small">ATS CV skoru hakkı: {me?.cvCredits ?? 0}</span>
          <Link to="/abonelik" className="btn secondary small" style={{ alignSelf: 'flex-start' }}>
            Planları gör
          </Link>
        </div>
        <button className="btn secondary" type="button" onClick={() => logout()}>
          Çıkış yap
        </button>
        <div className="card">
          <p className="eyebrow">Hesabı sil</p>
          <span className="small">
            Profilin, kazanım günlüğün ve kayıtlı çıktıların kalıcı olarak silinir. Bu işlem geri alınamaz.
          </span>
          <Field label='Onaylamak için "SİL" yaz'>
            <input className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          <ErrorBox error={error} />
          {authMsg && <p role="alert" className="small">{authMsg}</p>}
          <button className="btn danger" type="button" disabled={busy || confirm.trim().toLocaleUpperCase('tr-TR') !== 'SİL'} onClick={del}>
            Hesabımı ve verilerimi sil
          </button>
        </div>
        <p className="small">
          Bu uygulama kariyer koçluğu sunar; hukuki, mali veya psikolojik danışmanlık yerine geçmez. Acil bir durumda 112'yi ara.
        </p>
        <p className="small">
          <Link to="/gizlilik">Aydınlatma Metni</Link> · <Link to="/kosullar">Kullanım Koşulları</Link>
        </p>
      </div>
    </>
  );
}
