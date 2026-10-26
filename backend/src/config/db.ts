import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async () => {
  try {
    let uri = env.MONGO_URI;
    const isAtlasOrRemote =
      /^mongodb(\+srv)?:\/\//i.test(uri) && !/localhost|127\.0\.0\.1/i.test(uri);

    // Prefer durable Mongo (Atlas). Memory DB only when forced AND no remote URI.
    const wantMemory = process.env.USE_MEMORY_MONGO === '1' && !isAtlasOrRemote;
    if (process.env.USE_MEMORY_MONGO === '1' && isAtlasOrRemote) {
      console.warn('USE_MEMORY_MONGO ignored because MONGO_URI points to a remote database');
    }

    if (wantMemory) {
      // Vercel sandbox has no writable $HOME — force downloads into /tmp
      if (!process.env.HOME || process.env.HOME.startsWith('/home/sbx_')) {
        process.env.HOME = '/tmp';
      }
      process.env.MONGOMS_DOWNLOAD_DIR = process.env.MONGOMS_DOWNLOAD_DIR || '/tmp';
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: { dbName: 'salonapp' },
      });
      uri = mongod.getUri();
      console.log('Using in-memory MongoDB');
    }

    const conn = await mongoose.connect(uri);
    (globalThis as any).__alunaDb = {
      mode: wantMemory ? 'memory' : isAtlasOrRemote ? 'remote' : 'local',
      host: conn.connection.host,
    };
    console.log(`MongoDB Connected: ${conn.connection.host} (${(globalThis as any).__alunaDb.mode})`);

    // Auto-seed only for in-memory Mongo or when explicitly enabled (never wipe/reseed production silently)
    try {
      const memory = wantMemory;
      const autoSeed = process.env.AUTO_SEED === '1';
      if (memory || autoSeed) {
        const { runFullSyriaSeed } = await import('../services/seedSyriaData');
        await runFullSyriaSeed();
        console.log(`Syria auto-seed applied (${memory ? 'memory' : 'AUTO_SEED=1'})`);
        if (memory || process.env.SEED_TEST_ACCOUNTS === '1') {
          const { seedTestAccounts } = await import('../scripts/seedTestAccounts');
          await seedTestAccounts();
          console.log('Test accounts seeded');
        }
      }
    } catch (seedErr) {
      console.error('Auto-seed failed:', (seedErr as Error).message);
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${(error as Error).message}`);
    process.exit(1);
  }
};
