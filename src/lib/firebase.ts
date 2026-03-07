import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Use the current hostname as authDomain in production so that the OAuth
// flow stays on the same origin (proxied via vercel.json rewrite).
// This avoids Safari ITP / storage-partitioning issues on mobile.
// Falls back to the .env value for local development.
const authDomain =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.host
    : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'duma-finance.firebaseapp.com';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
