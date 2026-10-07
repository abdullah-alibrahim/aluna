/** Demo fixtures for App Store / Play Store screenshot captures only. */
export const storeDemoCity = {
  _id: 'demo-city-damascus',
  name: 'دمشق',
  location: { type: 'Point', coordinates: [36.2765, 33.5138] },
};

export const storeDemoCategories = [
  { _id: 'c1', name: 'حلاقة' },
  { _id: 'c2', name: 'صبغة' },
  { _id: 'c3', name: 'مكياج' },
  { _id: 'c4', name: 'عناية' },
  { _id: 'c5', name: 'أظافر' },
];

export const storeDemoShops = [
  {
    _id: 's1',
    name: 'صالون لمسة ذهب',
    address: 'أبو رمانة، دمشق',
    rating: 4.9,
    reviewCount: 128,
    images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80'],
    isFeatured: true,
    categoryIds: ['c1', 'c2'],
    startingPrice: 45000,
    description: 'صالون نسائي فاخر في قلب أبو رمانة — حلاقة، صبغة، وعناية متكاملة.',
    cityId: storeDemoCity,
  },
  {
    _id: 's2',
    name: 'ستوديو نورا بيوتي',
    address: 'المزة، دمشق',
    rating: 4.8,
    reviewCount: 96,
    images: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80'],
    isFeatured: true,
    categoryIds: ['c3', 'c4'],
    startingPrice: 60000,
    description: 'مكياج وعناية بشرة بأيدي مختصات محترفات.',
    cityId: storeDemoCity,
  },
  {
    _id: 's3',
    name: 'باربر هاوس',
    address: 'الشعلان، دمشق',
    rating: 4.7,
    reviewCount: 74,
    images: ['https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80'],
    isFeatured: false,
    categoryIds: ['c1'],
    startingPrice: 35000,
    description: 'حلاقة رجالية عصرية وأناقة يومية.',
    cityId: storeDemoCity,
  },
  {
    _id: 's4',
    name: 'جلوريا سبا',
    address: 'مشروع دمر، دمشق',
    rating: 4.9,
    reviewCount: 152,
    images: ['https://images.unsplash.com/photo-1519823551278-64ac92714751?w=800&q=80'],
    isFeatured: true,
    categoryIds: ['c4', 'c5'],
    startingPrice: 80000,
    description: 'سبا وعناية أظافر في أجواء هادئة.',
    cityId: storeDemoCity,
  },
];

export const storeDemoBanners = [
  {
    _id: 'b1',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=80',
    targetLink: '',
  },
];

export const storeDemoServices = [
  {
    _id: 'svc1',
    name: 'قص وتصفيف',
    duration: 45,
    price: 45000,
    categoryId: 'c1',
    description: 'قص عصري وتصفيف حسب شكل الوجه',
  },
  {
    _id: 'svc2',
    name: 'صبغة كاملة',
    duration: 90,
    price: 120000,
    categoryId: 'c2',
    description: 'صبغة احترافية مع عناية بالشعر',
  },
  {
    _id: 'svc3',
    name: 'مكياج سهرة',
    duration: 60,
    price: 150000,
    categoryId: 'c3',
    description: 'مكياج كامل للمناسبات',
  },
  {
    _id: 'svc4',
    name: 'عناية بالبشرة',
    duration: 50,
    price: 80000,
    categoryId: 'c4',
    description: 'تنظيف عميق وترطيب',
  },
];

export const storeDemoStaff = [
  {
    _id: 'st1',
    name: 'سارة أحمد',
    role: 'مختصة حلاقة',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    serviceIds: ['svc1', 'svc2'],
    branchId: 'br1',
  },
  {
    _id: 'st2',
    name: 'لينا خليل',
    role: 'مكياج وعناية',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    serviceIds: ['svc3', 'svc4'],
    branchId: 'br1',
  },
  {
    _id: 'st3',
    name: 'ريم ناصر',
    role: 'مختصة ألوان',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
    serviceIds: ['svc2', 'svc1'],
    branchId: 'br1',
  },
];

export const storeDemoBranches = [
  {
    _id: 'br1',
    name: 'الفرع الرئيسي — أبو رمانة',
    address: 'أبو رمانة، دمشق',
    isMain: true,
  },
];

export const storeDemoSlots = [
  { time: '10:00', staffId: 'st1', staffName: 'سارة أحمد' },
  { time: '11:00', staffId: 'st1', staffName: 'سارة أحمد' },
  { time: '12:30', staffId: 'st2', staffName: 'لينا خليل' },
  { time: '14:00', staffId: 'st1', staffName: 'سارة أحمد' },
  { time: '16:00', staffId: 'st3', staffName: 'ريم ناصر' },
  { time: '17:30', staffId: 'st2', staffName: 'لينا خليل' },
];

export function getStoreDemoShopDetails(shopId?: string) {
  const shop =
    storeDemoShops.find((s) => s._id === shopId) || storeDemoShops[0];
  return {
    shop: {
      ...shop,
      operatingHours: [
        { day: 'sunday', open: '10:00', close: '20:00', isClosed: false },
        { day: 'monday', open: '10:00', close: '20:00', isClosed: false },
        { day: 'tuesday', open: '10:00', close: '20:00', isClosed: false },
        { day: 'wednesday', open: '10:00', close: '20:00', isClosed: false },
        { day: 'thursday', open: '10:00', close: '20:00', isClosed: false },
        { day: 'friday', open: '12:00', close: '20:00', isClosed: false },
        { day: 'saturday', open: '10:00', close: '21:00', isClosed: false },
      ],
    },
    services: storeDemoServices,
    staff: storeDemoStaff,
    branches: storeDemoBranches,
  };
}

export function isStoreDemoMode() {
  if (typeof window !== 'undefined') {
    return window.location.search.includes('storeDemo=1');
  }
  return process.env.EXPO_PUBLIC_STORE_DEMO === '1';
}
