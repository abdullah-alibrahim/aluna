/**
 * Seed Syria-ready platform data.
 * Usage: npx ts-node src/scripts/seedSyria.ts
 * Requires MONGO_URI in .env (set USE_MEMORY_MONGO=0 for persistent DB)
 */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { runFullSyriaSeed } from '../services/seedSyriaData';

async function seed() {
  await mongoose.connect(env.MONGO_URI);
  console.log('Connected to MongoDB');
  await runFullSyriaSeed({ forceShops: process.argv.includes('--force') });
  console.log('\nSyria seed complete.');
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
