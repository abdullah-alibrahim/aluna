/**
 * Create Mongo test accounts (admin + beauty-center owner + customer).
 * Uses password auth when Firebase Admin is not configured.
 * Usage: npx ts-node src/scripts/seedTestAccounts.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db';
import User, { UserRole } from '../models/User';
import Shop from '../models/Shop';
import City from '../models/City';
import { runFullSyriaSeed } from '../services/seedSyriaData';

const ADMIN = {
  email: 'admin@aluna.app',
  password: 'AlunaAdmin123!',
  name: 'مدير ألونا',
  phone: '+963911000001',
  // Firebase Auth UID (project aluna-23119)
  firebaseUid: 'uOUCSFq3USMoJb0D4qKm97BtKf12',
};

const OWNER = {
  email: 'owner@aluna.app',
  password: 'AlunaOwner123!',
  name: 'مالك مركز تجميل',
  phone: '+963911000002',
  firebaseUid: 'QlCxANQI69YCR0bdV923tsD6IPE2',
};

const CUSTOMER = {
  email: 'user@aluna.app',
  password: 'AlunaUser123!',
  name: 'زبونة اختبار',
  phone: '+963911000003',
  firebaseUid: 'CrSzhRMHVsg3unqW5WfGZkIbNrP2',
};

async function upsertUser(opts: {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  firebaseUid: string;
}) {
  const hash = await bcrypt.hash(opts.password, 10);
  let user = await User.findOne({ email: opts.email }).select('+password');
  if (!user) {
    user = await User.create({
      name: opts.name,
      email: opts.email,
      phone: opts.phone,
      role: opts.role,
      password: hash,
      isVerified: true,
      gender: 'Female',
      firebaseUid: opts.firebaseUid,
    });
  } else {
    user.name = opts.name;
    user.phone = opts.phone;
    user.role = opts.role;
    user.password = hash;
    user.isVerified = true;
    user.firebaseUid = opts.firebaseUid;
    await user.save();
  }
  return user;
}

async function ensureOwnerShop(ownerId: string) {
  const city = (await City.findOne({ name: 'دمشق' })) || (await City.findOne());
  if (!city) return null;

  let shop = await Shop.findOne({ ownerId });
  if (!shop) {
    shop = await Shop.create({
      ownerId,
      name: 'مركز تجميل ألونا — اختبار',
      description: 'مركز تجميل تجريبي للاختبار',
      address: 'أبو رمانة، دمشق',
      cityId: city._id,
      location: { type: 'Point', coordinates: [36.2765, 33.5138] },
      images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80'],
      isApproved: true,
      approvalStatus: 'approved',
      isActive: true,
      isFeatured: true,
      operatingHours: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday']
        .map((day) => ({ day, open: '10:00', close: '20:00', isClosed: false }))
        .concat([{ day: 'Friday', open: '12:00', close: '20:00', isClosed: false }]),
      rating: 4.9,
      reviewCount: 12,
      slotInterval: 15,
      requiresDeposit: false,
      depositPercent: 0,
      noShowFeePercent: 0,
    });
  } else {
    shop.isApproved = true;
    shop.approvalStatus = 'approved';
    shop.isActive = true;
    await shop.save();
  }
  return shop;
}

export async function seedTestAccounts() {
  await runFullSyriaSeed();
  await upsertUser({ ...ADMIN, role: UserRole.ADMIN, firebaseUid: ADMIN.firebaseUid });
  const owner = await upsertUser({ ...OWNER, role: UserRole.OWNER, firebaseUid: OWNER.firebaseUid });
  const shop = await ensureOwnerShop(owner.id);
  await upsertUser({ ...CUSTOMER, role: UserRole.USER, firebaseUid: CUSTOMER.firebaseUid });
  return {
    admin: { email: ADMIN.email, password: ADMIN.password },
    owner: { email: OWNER.email, password: OWNER.password },
    customer: { email: CUSTOMER.email, password: CUSTOMER.password },
    shop: shop ? { name: shop.name, id: shop.id } : null,
  };
}

export const TEST_ACCOUNTS = { ADMIN, OWNER, CUSTOMER };

async function main() {
  await connectDB();
  const result = await seedTestAccounts();
  console.log('\n=== حسابات الاختبار ===');
  console.log(`Admin:    ${result.admin.email}  /  ${result.admin.password}`);
  console.log(`Owner:    ${result.owner.email}  /  ${result.owner.password}`);
  console.log(`Customer: ${result.customer.email}   /  ${result.customer.password}`);
  if (result.shop) console.log(`Shop:     ${result.shop.name}`);
  console.log('========================\n');
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch(async (err) => {
    console.error(err);
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
    process.exit(1);
  });
}
