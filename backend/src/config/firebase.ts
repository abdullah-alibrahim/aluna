import { initializeApp, cert } from 'firebase-admin/app';
import { env } from './env';

try {
  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    // Replace literal '\n' characters in the env var with actual newlines
    const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('Firebase Admin Initialized successfully.');
  } else {
    console.warn('Firebase Admin is not fully configured. Missing env variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).');
  }
} catch (error) {
  console.error('Firebase Admin initialization error', error);
}
