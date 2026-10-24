import { connectDB } from './config/db';

let ready: Promise<void> | null = null;

/** Lazy DB connect — needed for Vercel serverless cold starts */
export function ensureDb(): Promise<void> {
  if (!ready) {
    ready = connectDB().then(() => undefined);
  }
  return ready;
}
