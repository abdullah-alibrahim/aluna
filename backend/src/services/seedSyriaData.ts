/**
 * Shared Syria seed used by CLI script and auto-seed on empty / memory DB.
 */
import City from '../models/City';
import Category from '../models/Category';
import PlatformSettings from '../models/PlatformSettings';
import FAQ from '../models/FAQ';
import User, { UserRole } from '../models/User';
import Shop from '../models/Shop';
import Service from '../models/Service';
import Staff from '../models/Staff';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const defaultHours = () =>
  DAYS.map((day) => ({
    day,
    open: '09:00',
    close: '21:00',
    isClosed: day === 'Friday',
  }));

const defaultStaffHours = () =>
  DAYS.map((day) => ({
    day,
    open: '09:00',
    close: '21:00',
    isClosed: day === 'Friday',
    breaks: [{ start: '13:00', end: '14:00' }],
  }));

export const SYRIAN_CITIES: { name: string; coordinates: [number, number] }[] = [
  { name: 'دمشق', coordinates: [36.2765, 33.5138] },
  { name: 'حلب', coordinates: [37.1612, 36.2021] },
  { name: 'حمص', coordinates: [36.7234, 34.7268] },
  { name: 'حماة', coordinates: [36.7578, 35.1318] },
  { name: 'اللاذقية', coordinates: [35.7831, 35.5317] },
  { name: 'طرطوس', coordinates: [35.8866, 34.895] },
  { name: 'دير الزور', coordinates: [40.1408, 35.3359] },
  { name: 'الحسكة', coordinates: [40.742, 36.5024] },
  { name: 'الرقة', coordinates: [39.0081, 35.95] },
  { name: 'السويداء', coordinates: [36.5667, 32.7] },
  { name: 'درعا', coordinates: [36.1021, 32.6189] },
  { name: 'إدلب', coordinates: [36.6333, 35.9333] },
  { name: 'القامشلي', coordinates: [41.227, 37.0522] },
];

const CATEGORIES = [
  { name: 'حلاقة رجالية', description: 'قص وتصفيف للرجال' },
  { name: 'صالون نسائي', description: 'قص وصبغ وتصفيف للنساء' },
  { name: 'عناية بالبشرة', description: 'تنظيف وعلاجات البشرة' },
  { name: 'مكياج', description: 'مكياج مناسبات ويومي' },
  { name: 'أظافر', description: 'مانيكير وباديكير' },
  { name: 'سبا واسترخاء', description: 'مساج وعناية شاملة' },
  { name: 'حلاقة أطفال', description: 'قص شعر للأطفال' },
];

const USER_FAQS = [
  {
    question: 'كيف أحجز موعداً؟',
    answer: 'اختر الصالون والخدمة والموظف ثم أكّد الموعد وادفع نقداً في الصالون أو إلكترونياً إن كان متاحاً.',
    target: 'user',
  },
  {
    question: 'هل يمكنني الإلغاء؟',
    answer: 'نعم، يمكنك إلغاء الموعد من تبويب حجوزاتي. الإلغاء المجاني قبل ساعات محددة؛ بعدها قد يُطبَّق عربون أو رسوم عدم حضور حسب سياسة الصالون.',
    target: 'user',
  },
  {
    question: 'ما العملة المستخدمة؟',
    answer: 'التطبيق معدّ لسوريا ويعرض الأسعار بالليرة السورية (ل.س) حسب إعدادات المنصة.',
    target: 'user',
  },
];

const OWNER_FAQS = [
  {
    question: 'كيف أفعّل صالوني؟',
    answer: 'أنشئ الصالون، أضف الخدمات والموظفين وساعات العمل، ثم انتظر موافقة الإدارة.',
    target: 'owner',
  },
  {
    question: 'متى أستلم أرباحي؟',
    answer: 'بعد اكتمال الحجوزات المدفوعة، يظهر الرصيد في المحفظة ويمكنك طلب سحب.',
    target: 'owner',
  },
];

type DemoShop = {
  name: string;
  description: string;
  address: string;
  cityName: string;
  categoryNames: string[];
  featured?: boolean;
  rating: number;
  reviewCount: number;
  requiresDeposit: boolean;
  depositPercent: number;
  noShowFeePercent: number;
  images: string[];
  services: { name: string; price: number; duration: number; categoryName: string }[];
  staff: { name: string; role: string }[];
  coords: [number, number];
};

const DEMO_SHOPS: DemoShop[] = [
  {
    name: 'ألونا بوتيك دمشق',
    description: 'صالون نسائي فاخر في قلب دمشق — قص، صبغ، وتصفيف مناسبات.',
    address: 'شارع أبو رمانة، دمشق',
    cityName: 'دمشق',
    categoryNames: ['صالون نسائي', 'مكياج'],
    featured: true,
    rating: 4.8,
    reviewCount: 42,
    requiresDeposit: true,
    depositPercent: 20,
    noShowFeePercent: 50,
    coords: [36.291, 33.514],
    images: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    ],
    services: [
      { name: 'قص وتصفيف', price: 75000, duration: 45, categoryName: 'صالون نسائي' },
      { name: 'صبغة كاملة', price: 180000, duration: 90, categoryName: 'صالون نسائي' },
      { name: 'مكياج سهرة', price: 120000, duration: 60, categoryName: 'مكياج' },
    ],
    staff: [
      { name: 'سارة الحسن', role: 'مصففة شعر' },
      { name: 'ليان خوري', role: 'خبيرة مكياج' },
    ],
  },
  {
    name: 'حلاق الملوك — أبو رمانة',
    description: 'حلاقة رجالية كلاسيكية وعصرية مع عناية باللحية.',
    address: 'ساحة الأمويين، دمشق',
    cityName: 'دمشق',
    categoryNames: ['حلاقة رجالية'],
    featured: true,
    rating: 4.6,
    reviewCount: 88,
    requiresDeposit: false,
    depositPercent: 0,
    noShowFeePercent: 30,
    coords: [36.28, 33.51],
    images: [
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80',
    ],
    services: [
      { name: 'قص شعر رجالي', price: 25000, duration: 30, categoryName: 'حلاقة رجالية' },
      { name: 'تهذيب لحية', price: 15000, duration: 20, categoryName: 'حلاقة رجالية' },
      { name: 'باقة قص + لحية', price: 35000, duration: 45, categoryName: 'حلاقة رجالية' },
    ],
    staff: [
      { name: 'أحمد المصري', role: 'حلاق' },
      { name: 'محمود دياب', role: 'حلاق أول' },
    ],
  },
  {
    name: 'سبا أوتال حلب',
    description: 'مساج واسترخاء وعناية بالبشرة في حلب الجديدة.',
    address: 'العزيزية، حلب',
    cityName: 'حلب',
    categoryNames: ['سبا واسترخاء', 'عناية بالبشرة'],
    featured: true,
    rating: 4.7,
    reviewCount: 31,
    requiresDeposit: true,
    depositPercent: 25,
    noShowFeePercent: 50,
    coords: [37.15, 36.21],
    images: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
      'https://images.unsplash.com/photo-1519823551278-3af5859983c9?w=800&q=80',
    ],
    services: [
      { name: 'مساج استرخاء 60 دقيقة', price: 90000, duration: 60, categoryName: 'سبا واسترخاء' },
      { name: 'تنظيف بشرة عميق', price: 70000, duration: 50, categoryName: 'عناية بالبشرة' },
    ],
    staff: [{ name: 'نور حموي', role: 'أخصائية سبا' }],
  },
  {
    name: 'نايلز آند جلو اللاذقية',
    description: 'مانيكير وباديكير وتلميع أظافر بإطلالة ساحلية.',
    address: 'الكورنيش، اللاذقية',
    cityName: 'اللاذقية',
    categoryNames: ['أظافر'],
    featured: false,
    rating: 4.5,
    reviewCount: 19,
    requiresDeposit: true,
    depositPercent: 15,
    noShowFeePercent: 40,
    coords: [35.78, 35.52],
    images: [
      'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',
      'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&q=80',
    ],
    services: [
      { name: 'مانيكير كلاسيك', price: 30000, duration: 40, categoryName: 'أظافر' },
      { name: 'باديكير', price: 35000, duration: 45, categoryName: 'أظافر' },
      { name: 'أظافر جل', price: 55000, duration: 60, categoryName: 'أظافر' },
    ],
    staff: [{ name: 'ريم سليمان', role: 'فنية أظافر' }],
  },
  {
    name: 'كيدز كات حمص',
    description: 'حلاقة أطفال في أجواء مريحة وآمنة.',
    address: 'الوعر، حمص',
    cityName: 'حمص',
    categoryNames: ['حلاقة أطفال'],
    featured: false,
    rating: 4.4,
    reviewCount: 12,
    requiresDeposit: false,
    depositPercent: 0,
    noShowFeePercent: 20,
    coords: [36.72, 34.73],
    images: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80',
    ],
    services: [
      { name: 'قص أطفال', price: 15000, duration: 25, categoryName: 'حلاقة أطفال' },
      { name: 'قص + تصفيف', price: 20000, duration: 35, categoryName: 'حلاقة أطفال' },
    ],
    staff: [{ name: 'يوسف طالب', role: 'حلاق أطفال' }],
  },
];

export async function seedSyriaBase() {
  await PlatformSettings.findOneAndUpdate(
    { isGlobal: true },
    {
      isGlobal: true,
      currency: 'ل.س',
      currencyCode: 'syp',
      platformCommissionRate: 10,
      depositPercent: 20,
      noShowFeePercent: 50,
      freeCancelHours: 4,
    },
    { upsert: true, new: true }
  );

  for (const city of SYRIAN_CITIES) {
    await City.findOneAndUpdate(
      { name: city.name },
      {
        name: city.name,
        coordinates: { type: 'Point', coordinates: city.coordinates },
        isActive: true,
      },
      { upsert: true, new: true }
    );
  }

  for (const cat of CATEGORIES) {
    await Category.findOneAndUpdate({ name: cat.name }, { ...cat, isActive: true }, { upsert: true, new: true });
  }

  const faqCount = await FAQ.countDocuments();
  if (faqCount === 0) {
    await FAQ.insertMany([...USER_FAQS, ...OWNER_FAQS].map((f) => ({ ...f, isActive: true })));
  }
}

export async function seedDemoShops(force = false) {
  const existing = await Shop.countDocuments({ isApproved: true });
  // Always sync demo shop images/metadata; only skip full create when already seeded
  const cities = await City.find({});
  const categories = await Category.find({});
  const cityByName = Object.fromEntries(cities.map((c) => [c.name, c]));
  const catByName = Object.fromEntries(categories.map((c) => [c.name, c]));

  if (existing > 0 && !force) {
    // Backfill photos for demo shops that were seeded without images
    for (const demo of DEMO_SHOPS) {
      const city = cityByName[demo.cityName];
      if (!city) continue;
      await Shop.updateOne(
        {
          name: demo.name,
          cityId: city._id,
          $or: [{ images: { $exists: false } }, { images: { $size: 0 } }],
        },
        { $set: { images: demo.images } }
      );
    }
    console.log(`• ${existing} approved shops — demo images backfilled if empty`);
    return;
  }

  for (let i = 0; i < DEMO_SHOPS.length; i++) {
    const demo = DEMO_SHOPS[i]!;
    const city = cityByName[demo.cityName];
    if (!city) continue;

    const ownerEmail = `seed-owner-${i + 1}@aluna.app`;
    let owner = await User.findOne({ email: ownerEmail });
    if (!owner) {
      owner = await User.create({
        name: `مالك ${demo.name}`,
        email: ownerEmail,
        phone: `+9639${String(10000000 + i).slice(0, 8)}`,
        role: UserRole.OWNER,
        isVerified: true,
        gender: 'Female',
      });
    }

    const categoryIds = demo.categoryNames
      .map((n) => catByName[n]?._id)
      .filter((id): id is NonNullable<typeof id> => Boolean(id));

    let shop = await Shop.findOne({ name: demo.name, cityId: city._id });
    if (!shop) {
      shop = await Shop.create({
        ownerId: owner._id,
        name: demo.name,
        description: demo.description,
        address: demo.address,
        cityId: city._id,
        categoryIds,
        location: { type: 'Point', coordinates: demo.coords },
        images: demo.images,
        isApproved: true,
        approvalStatus: 'approved',
        isActive: true,
        isFeatured: !!demo.featured,
        operatingHours: defaultHours(),
        rating: demo.rating,
        reviewCount: demo.reviewCount,
        slotInterval: 15,
        requiresDeposit: demo.requiresDeposit,
        depositPercent: demo.depositPercent,
        noShowFeePercent: demo.noShowFeePercent,
      });
    } else {
      shop.isApproved = true;
      shop.approvalStatus = 'approved';
      shop.isActive = true;
      shop.isFeatured = !!demo.featured;
      shop.requiresDeposit = demo.requiresDeposit;
      shop.depositPercent = demo.depositPercent;
      shop.noShowFeePercent = demo.noShowFeePercent;
      // Backfill images for previously seeded shops without photos
      if (!shop.images?.length) {
        shop.images = demo.images;
      }
      await shop.save();
    }

    const serviceIds: any[] = [];
    for (const svc of demo.services) {
      const cat = catByName[svc.categoryName] || categories[0];
      let service = await Service.findOne({ shopId: shop._id, name: svc.name });
      if (!service) {
        service = await Service.create({
          shopId: shop._id,
          categoryId: cat!._id,
          name: svc.name,
          description: svc.name,
          price: svc.price,
          duration: svc.duration,
          bufferTime: 5,
        });
      }
      serviceIds.push(service._id);
    }

    for (const st of demo.staff) {
      const existingStaff = await Staff.findOne({ shopId: shop._id, name: st.name });
      if (!existingStaff) {
        await Staff.create({
          shopId: shop._id,
          name: st.name,
          role: st.role,
          servicesProvided: serviceIds,
          workingHours: defaultStaffHours(),
          blockedDates: [],
        });
      } else {
        existingStaff.servicesProvided = serviceIds;
        await existingStaff.save();
      }
    }
  }

  console.log(`✓ Seeded ${DEMO_SHOPS.length} demo Syrian salons`);
}

export async function runFullSyriaSeed(options?: { forceShops?: boolean }) {
  await seedSyriaBase();
  console.log('✓ Platform settings, cities, categories, FAQs');
  await seedDemoShops(options?.forceShops);
}
