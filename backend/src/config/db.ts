import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async () => {
  try {
    let uri = env.MONGO_URI;

    // Local fallback when system MongoDB isn't installed
    if (process.env.USE_MEMORY_MONGO === '1') {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri('salonapp');
      console.log('Using in-memory MongoDB for local development');
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed only for in-memory Mongo or when explicitly enabled (never wipe/reseed production silently)
    try {
      const memory = process.env.USE_MEMORY_MONGO === '1';
      const autoSeed = process.env.AUTO_SEED === '1';
      if (memory || autoSeed) {
        const { runFullSyriaSeed } = await import('../services/seedSyriaData');
        await runFullSyriaSeed();
        console.log(`Syria auto-seed applied (${memory ? 'memory' : 'AUTO_SEED=1'})`);
      }
    } catch (seedErr) {
      console.error('Auto-seed failed:', (seedErr as Error).message);
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${(error as Error).message}`);
    process.exit(1);
  }
};
