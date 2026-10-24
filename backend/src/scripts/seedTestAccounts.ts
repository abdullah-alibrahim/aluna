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
import Category from '../models/Category';
import Service from '../models/Service';
import Staff from '../models/Staff';
import Branch from '../models/Branch';
import Booking, { BookingStatus } from '../models/Booking';
import Wallet from '../models/Wallet';
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

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Add realistic services, staff, branch and bookings so owner/admin dashboards are populated. */
async function ensureOwnerShopDemoData(shop: any, customerId: string) {
  const categories = await Category.find({ isActive: true });
  if (!categories.length) return;
  const cat = (name: string) => categories.find((c) => c.name === name) || categories[0];

  const hours = DAYS.map((day) => ({
    day,
    open: day === 'Friday' ? '12:00' : '10:00',
    close: '20:00',
    isClosed: false,
  }));

  const branch =
    (await Branch.findOne({ shopId: shop._id, isMain: true })) ||
    (await Branch.create({
      shopId: shop._id,
      name: 'الفرع الرئيسي',
      address: shop.address || 'أبو رمانة، دمشق',
      cityId: shop.cityId,
      phone: '+963911000002',
      location: {
        type: 'Point',
        coordinates: shop.location?.coordinates?.length ? shop.location.coordinates : [36.2765, 33.5138],
      },
      operatingHours: hours,
      isMain: true,
      isActive: true,
    }));

  const serviceDefs = [
    {
      name: 'قص وتصفيف',
      price: 75000,
      duration: 45,
      categoryName: 'مركز تجميل نسائي',
      description: 'قص وتصفيف شعر احترافي مع سيشوار',
      image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=80',
    },
    {
      name: 'صبغة كاملة',
      price: 180000,
      duration: 90,
      categoryName: 'مركز تجميل نسائي',
      description: 'صبغة شعر كاملة بأجود الأنواع',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
    },
    {
      name: 'مانيكير',
      price: 45000,
      duration: 30,
      categoryName: 'أظافر',
      description: 'عناية وتنسيق الأظافر',
      image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
    },
    {
      name: 'تنظيف بشرة',
      price: 90000,
      duration: 60,
      categoryName: 'عناية بالبشرة',
      description: 'تنظيف عميق وترطيب للبشرة',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
    },
  ];

  const services: any[] = [];
  for (const def of serviceDefs) {
    let service = await Service.findOne({ shopId: shop._id, name: def.name });
    if (!service) {
      service = await Service.create({
        shopId: shop._id,
        categoryId: cat(def.categoryName)!._id,
        name: def.name,
        description: def.description,
        price: def.price,
        duration: def.duration,
        bufferTime: 5,
        image: def.image,
      });
    }
    services.push(service);
  }

  const staffDefs = [
    {
      name: 'لمى الأحمد',
      role: 'مصففة شعر',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80',
      services: [0, 1],
    },
    {
      name: 'ريم خوري',
      role: 'خبيرة تجميل',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
      services: [2, 3],
    },
    {
      name: 'نور الحسن',
      role: 'أخصائية أظافر',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80',
      services: [2],
    },
  ];

  const staff: any[] = [];
  for (const def of staffDefs) {
    let member = await Staff.findOne({ shopId: shop._id, name: def.name });
    if (!member) {
      member = await Staff.create({
        shopId: shop._id,
        branchId: branch._id,
        name: def.name,
        role: def.role,
        avatar: def.avatar,
        servicesProvided: def.services.map((i) => services[i]._id),
        workingHours: hours.map((h) => ({ ...h, breaks: [{ start: '14:00', end: '14:30' }] })),
        blockedDates: [],
      });
    }
    staff.push(member);
  }

  const existingBookings = await Booking.countDocuments({ shopId: shop._id });
  if (existingBookings === 0 && customerId) {
    const at = (dayOffset: number) => {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset);
      d.setHours(12, 0, 0, 0);
      return d;
    };
    const make = (
      serviceIdx: number,
      staffIdx: number,
      dayOffset: number,
      startTime: string,
      endTime: string,
      status: BookingStatus,
      paid = false
    ) => {
      const service = services[serviceIdx];
      return Booking.create({
        userId: customerId,
        shopId: shop._id,
        branchId: branch._id,
        staffId: staff[staffIdx]._id,
        serviceIds: [service._id],
        date: at(dayOffset),
        startTime,
        endTime,
        status,
        totalPrice: service.price,
        originalPrice: service.price,
        paymentStatus: paid ? 'paid' : 'pending',
        paymentMethod: 'cash',
        pointsEarned: Math.round(service.price / 1000),
      });
    };

    await make(0, 0, 0, '13:00', '13:45', BookingStatus.PENDING);
    await make(1, 1, 1, '16:00', '17:30', BookingStatus.CONFIRMED);
    const completedDemo = await make(2, 2, -4, '11:00', '11:30', BookingStatus.COMPLETED, true);
    await make(3, 1, -2, '15:00', '16:00', BookingStatus.CANCELLED);

    // Mirror the runtime rule: completed bookings credit the owner wallet (net of 10% commission)
    const demoNet = Math.round(completedDemo.totalPrice * 0.9);
    await Wallet.findOneAndUpdate(
      { ownerId: shop.ownerId },
      { $inc: { balance: demoNet, totalEarnings: demoNet } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    await Booking.updateOne(
      { _id: completedDemo._id },
      { $set: { ownerCredited: true, ownerEarnings: demoNet } }
    );
    console.log('• Demo services, staff, branch and bookings for owner shop');
  }
}

export async function seedTestAccounts() {
  await runFullSyriaSeed();
  await upsertUser({ ...ADMIN, role: UserRole.ADMIN, firebaseUid: ADMIN.firebaseUid });
  const owner = await upsertUser({ ...OWNER, role: UserRole.OWNER, firebaseUid: OWNER.firebaseUid });
  const shop = await ensureOwnerShop(owner.id);
  const customer = await upsertUser({ ...CUSTOMER, role: UserRole.USER, firebaseUid: CUSTOMER.firebaseUid });
  if (shop) await ensureOwnerShopDemoData(shop, customer.id);
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
