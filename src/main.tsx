import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { onAuthChange } from './auth';
import Abonelik from './screens/Abonelik';
import Anlat from './screens/Anlat';
import Birebir from './screens/Birebir';
import Cv from './screens/Cv';
import CvUyarla from './screens/CvUyarla';
import Gelisim from './screens/Gelisim';
import Gunluk from './screens/Gunluk';
import Hesap from './screens/Hesap';
import Kayit from './screens/Kayit';
import Legal from './screens/Legal';
import KayitDetay from './screens/KayitDetay';
import Maas from './screens/Maas';
import Performans from './screens/Performans';
import Prova from './screens/Prova';
import Rol from './screens/Rol';
import Today from './screens/Today';
import Ton from './screens/Ton';
import Welcome from './screens/Welcome';
import Yol from './screens/Yol';
import './styles.css';
import { ErrorBox, Loading, MeProvider, useMe } from './ui';

function Gate() {
  const { me, error } = useMe();
  const loc = useLocation();
  if (error && !me) {
    return (
      <div className="content">
        <ErrorBox error={error} />
      </div>
    );
  }
  if (!me) return <Loading />;
  if (!me.ageConfirmed && loc.pathname !== '/kayit') return <Navigate to="/kayit" replace />;
  return (
    <Routes>
      <Route path="/" element={<Today />} />
      <Route path="/kayit" element={<Kayit />} />
      <Route path="/kayit/detay" element={<KayitDetay />} />
      <Route path="/birebir" element={<Birebir />} />
      <Route path="/prova" element={<Prova />} />
      <Route path="/gunluk" element={<Gunluk />} />
      <Route path="/yol" element={<Yol />} />
      <Route path="/rol" element={<Rol />} />
      <Route path="/gelisim" element={<Gelisim />} />
      <Route path="/maas" element={<Maas />} />
      <Route path="/ton" element={<Ton />} />
      <Route path="/cv" element={<Cv />} />
      <Route path="/cv-uyarla" element={<CvUyarla />} />
      <Route path="/performans" element={<Performans />} />
      <Route path="/anlat" element={<Anlat />} />
      <Route path="/abonelik" element={<Abonelik />} />
      <Route path="/hesap" element={<Hesap />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const loc = useLocation();
  useEffect(() => onAuthChange(setSignedIn), []);
  // Hukuki metinler girişsiz de okunabilir.
  if (loc.pathname === '/gizlilik') return <Legal doc="gizlilik" />;
  if (loc.pathname === '/kosullar') return <Legal doc="kosullar" />;
  if (signedIn === null) return <Loading />;
  if (!signedIn) return <Welcome />;
  return (
    <MeProvider>
      <Gate />
    </MeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <div className="app">
        <App />
      </div>
    </BrowserRouter>
  </StrictMode>,
);
