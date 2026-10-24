import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';
import PlatformSettings from '../models/PlatformSettings';
import City from '../models/City';
import Category from '../models/Category';
import { env } from '../config/env';
import { BadRequestError, UnauthorizedError, ForbiddenError } from '../utils/errors';
import cache from '../utils/cache';

import '../config/firebase'; // Ensure Firebase is initialized
import { getAuth } from 'firebase-admin/auth';

const JWT_SECRET = env.JWT_SECRET || 'aluna-dev-jwt-secret-change-me';
const passwordAuthEnabled =
  env.ALLOW_PASSWORD_AUTH === '1' ||
  !env.FIREBASE_PROJECT_ID ||
  !env.FIREBASE_CLIENT_EMAIL ||
  !env.FIREBASE_PRIVATE_KEY;

const PUBLIC_ROLES = new Set<string>([UserRole.USER, UserRole.OWNER]);

const resolveRegistrationRole = (requestedRole?: string, inviteCode?: string): UserRole => {
  const role = (requestedRole || UserRole.USER).toLowerCase();

  if (role === UserRole.ADMIN) {
    if (!env.ADMIN_INVITE_CODE || inviteCode !== env.ADMIN_INVITE_CODE) {
      throw new ForbiddenError('تسجيل الأدمن غير مسموح بدون رمز الدعوة');
    }
    return UserRole.ADMIN;
  }

  if (!PUBLIC_ROLES.has(role)) {
    return UserRole.USER;
  }

  return role as UserRole;
};

const getCloudinaryUrl = (file: Express.Multer.File): string => {
  const anyFile = file as Express.Multer.File & { path?: string; secure_url?: string };
  return anyFile.path || anyFile.secure_url || '';
};

export const register = async (req: Request, res: Response) => {
  const { name, role, phone, gender, token, inviteCode } = req.body;

  if (!token) {
    throw new BadRequestError('Firebase token is required');
  }

  const decoded = await getAuth().verifyIdToken(token);
  const email = decoded.email;
  const firebaseUid = decoded.uid;

  if (!email) {
    throw new BadRequestError('Firebase token must contain an email');
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new BadRequestError('User already exists');
  }

  const assignedRole = resolveRegistrationRole(role, inviteCode);

  // Phone-based accounts skip email verification
  const isVerified = decoded.email_verified || !!phone;

  const user = await User.create({
    name,
    email,
    firebaseUid,
    isVerified,
    role: assignedRole,
    phone,
    gender,
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: token,
    });
  } else {
    throw new BadRequestError('Invalid user data');
  }
};

export const login = async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw new BadRequestError('Firebase token is required');
  }

  // Firebase Admin rejects malformed/expired/foreign tokens with untyped errors —
  // map them to 401 so clients get a proper message instead of a 500.
  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(token);
  } catch (err) {
    const msg = (err as Error)?.message || 'Invalid Firebase token';
    throw new UnauthorizedError(`Session token verification failed: ${msg}`);
  }

  let user = await User.findOne({ firebaseUid: decoded.uid });

  if (!user && decoded.email) {
    user = await User.findOne({ email: decoded.email });
  }

  // Phone-based accounts register with email `<digits>@phone.<domain>` —
  // link back to the Mongo user by phone so seeded/registered accounts can sign in.
  if (!user && decoded.email && decoded.email.includes('@phone.')) {
    const digits = (decoded.email.split('@')[0] || '').replace(/\D/g, '');
    if (digits) {
      user = await User.findOne({ phone: `+${digits}` }) || await User.findOne({ phone: digits });
    }
  }

  if (user && user.firebaseUid !== decoded.uid) {
    user.firebaseUid = decoded.uid;
    await user.save();
  }

  if (!user) {
    throw new UnauthorizedError('User does not exist in our database. Please register first.');
  }

  // Sync verification status
  if (decoded.email_verified && !user.isVerified) {
    user.isVerified = true;
    await user.save();
  }

  res.json({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    token: token,
  });
};

/** Email/password login for dashboard when Firebase Admin is not configured. */
export const passwordLogin = async (req: Request, res: Response) => {
  if (!passwordAuthEnabled) {
    throw new ForbiddenError('تسجيل الدخول بكلمة المرور غير مفعّل');
  }

  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) {
    throw new BadRequestError('البريد وكلمة المرور مطلوبان');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user?.password) {
    throw new UnauthorizedError('بيانات الدخول غير صحيحة');
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw new UnauthorizedError('بيانات الدخول غير صحيحة');
  }

  const token = jwt.sign(
    { typ: 'password', uid: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    token,
  });
};

export const getMe = async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);
  res.json(user);
};

/** Dev helper: seed admin/owner/customer into the running DB (password auth only). */
export const seedTestAccountsHandler = async (_req: Request, res: Response) => {
  if (!passwordAuthEnabled) {
    throw new ForbiddenError('غير متاح');
  }
  const { seedTestAccounts } = await import('../scripts/seedTestAccounts');
  const result = await seedTestAccounts();
  res.json({ ok: true, ...result });
};

export const syncVerification = async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  const token = req.headers.authorization?.startsWith('Bearer')
    ? req.headers.authorization.split(' ')[1]
    : undefined;

  if (!token) {
    throw new UnauthorizedError('Token required');
  }

  const decoded = await getAuth().verifyIdToken(token, true);
  user.isVerified = !!decoded.email_verified;
  await user.save();

  res.json({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    avatar: user.profilePicture,
    profilePicture: user.profilePicture,
  });
};

export const updateProfile = async (req: Request, res: Response) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user?.id);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (name) user.name = name;
  if (email) user.email = email;

  if (req.file) {
    const cloudUrl = getCloudinaryUrl(req.file);
    if (!cloudUrl) {
      throw new BadRequestError('فشل رفع الصورة');
    }
    user.profilePicture = cloudUrl;
  }

  await user.save();

  res.json({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    avatar: user.profilePicture,
    profilePicture: user.profilePicture,
  });
};

export const getPublicSettings = async (req: Request, res: Response) => {
  const key = 'settings:public';
  let settings = cache.get(key);
  if (!settings) {
    settings = await PlatformSettings.findOne({ isGlobal: true }).select('-stripeSecretKey').lean();
    cache.set(key, settings, 300);
  }
  res.json(settings || { currency: 'ل.س', currencyCode: 'syp', platformCommissionRate: 10 });
};

export const getPublicCities = async (req: Request, res: Response) => {
  const key = 'cities:active';
  let cities = cache.get(key);
  if (!cities) {
    cities = await City.find({ isActive: true }).select('name location coordinates').lean();
    cache.set(key, cities, 600);
  }
  res.json(cities);
};

export const getPublicCategories = async (req: Request, res: Response) => {
  const key = 'categories:active';
  let categories = cache.get(key);
  if (!categories) {
    categories = await Category.find({ isActive: true }).select('name description image isActive').lean();
    cache.set(key, categories, 600);
  }
  res.json(categories);
};

export const updatePassword = async (req: Request, res: Response) => {
  const { newPassword } = req.body;

  const user = await User.findById(req.user?.id).select('+password');
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (!newPassword || String(newPassword).length < 6) {
    throw new BadRequestError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
  }

  // Keep local password auth in sync (web dashboard / password-login)
  const bcrypt = await import('bcryptjs');
  user.password = await bcrypt.hash(String(newPassword), 10);
  await user.save();

  // Also update Firebase Auth when Admin SDK + firebaseUid are available
  if (user.firebaseUid && !user.firebaseUid.startsWith('local-')) {
    try {
      await getAuth().updateUser(user.firebaseUid, { password: String(newPassword) });
    } catch (err) {
      console.warn('Firebase password update skipped:', (err as Error).message);
    }
  }

  res.json({ status: 'success', message: 'تم تحديث كلمة المرور بنجاح' });
};

export const updatePushToken = async (req: Request, res: Response) => {
  const { pushToken } = req.body;

  const user = await User.findById(req.user?.id);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  user.pushToken = pushToken;
  await user.save();

  res.json({ status: 'success', data: user });
};
