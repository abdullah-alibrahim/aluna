import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const app = initializeApp({
  apiKey: 'AIzaSyAZ1_CZ92ekQjPEb_fmDhJHntjpqoMCenI',
  authDomain: 'aluna-23119.firebaseapp.com',
  projectId: 'aluna-23119',
});
const auth = getAuth(app);
const cred = await signInWithEmailAndPassword(auth, '963911000003@phone.aluna.app', 'AlunaUser123!');
const token = await cred.user.getIdToken();
// decode iss to confirm token type
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
console.log('iss:', payload.iss, 'uid:', payload.user_id);

const r = await fetch('http://localhost:5010/api/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token }),
});
console.log('login status:', r.status);
const j = await r.json();
console.log('name:', j.name, '| role:', j.role, '| phone-matched:', !!j._id);
