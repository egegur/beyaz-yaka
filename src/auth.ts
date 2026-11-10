import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
} from 'firebase/auth';

/**
 * Kimlik doğrulama. Firebase yapılandırması yoksa (yerel geliştirme) "geliştirici girişi" kullanılır;
 * bu mod yalnızca sunucuda DEV_AUTH=1 iken çalışır.
 */
const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
export const devMode = !cfg.apiKey;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
if (!devMode) {
  app = initializeApp(cfg);
  auth = getAuth(app);
  auth.languageCode = 'tr';
}

const DEV_KEY = 'by_dev_user';
type Listener = (signedIn: boolean) => void;
const listeners = new Set<Listener>();

export function onAuthChange(fn: Listener): () => void {
  if (auth) return onAuthStateChanged(auth, (u) => fn(!!u));
  listeners.add(fn);
  fn(!!localStorage.getItem(DEV_KEY));
  return () => listeners.delete(fn);
}

export async function authHeaders(): Promise<Record<string, string>> {
  if (auth) {
    const u = auth.currentUser;
    if (!u) return {};
    return { authorization: `Bearer ${await u.getIdToken()}` };
  }
  const dev = localStorage.getItem(DEV_KEY);
  return dev ? { 'x-dev-user': dev } : {};
}

export async function signInGoogle(): Promise<void> {
  if (!auth) return devSignIn();
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signInEmail(email: string, password: string, create: boolean): Promise<void> {
  if (!auth) return devSignIn();
  if (create) await createUserWithEmailAndPassword(auth, email, password);
  else await signInWithEmailAndPassword(auth, email, password);
}

export async function resetPassword(email: string): Promise<void> {
  if (auth) await sendPasswordResetEmail(auth, email);
}

function devSignIn(): void {
  localStorage.setItem(DEV_KEY, 'gelistirici');
  listeners.forEach((l) => l(true));
}

export async function logout(): Promise<void> {
  if (auth) return signOut(auth);
  localStorage.removeItem(DEV_KEY);
  listeners.forEach((l) => l(false));
}

/** Firebase hesabını siler. Uzun süredir giriş yapılmadıysa Firebase yeniden giriş ister. */
export async function deleteAuthAccount(): Promise<void> {
  if (auth?.currentUser) await deleteUser(auth.currentUser);
  else await logout();
}

export function authErrorText(e: unknown): string {
  const code = (e as { code?: string }).code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/invalid-email': 'Geçerli bir e-posta adresi yaz.',
    'auth/email-already-in-use': 'Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.',
    'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
    'auth/popup-closed-by-user': 'Giriş penceresi kapatıldı.',
    'auth/requires-recent-login': 'Güvenlik için çıkış yapıp tekrar giriş yapman gerekiyor.',
    'auth/too-many-requests': 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.',
  };
  return map[code] ?? 'Bir sorun oluştu. Lütfen tekrar dene.';
}
