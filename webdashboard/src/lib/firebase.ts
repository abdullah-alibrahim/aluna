import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAZ1_CZ92ekQjPEb_fmDhJHntjpqoMCenI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'aluna-23119.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aluna-23119',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'aluna-23119.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '944769790448',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:944769790448:web:e2a2b78a6238334d3e6d35',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
