/**
 * In-App Purchase Ürün Kimlikleri
 *
 * YENİ PAKET SİSTEMİ: 3 Seviye × 3 Süre = 9 Paket
 * - Temel (Basic)
 * - Gelişmiş (Advanced)
 * - Profesyonel (Professional)
 * × (Aylık, 6 Aylık, 12 Aylık)
 *
 * ÖNEMLİ: Bu ID'leri Google Play Console ve App Store Connect'te
 * AYNEN oluşturmanız gerekiyor!
 */

export const IAP_PRODUCT_IDS = {
  // Android (Google Play) Product IDs
  android: {
    basic_monthly: 'com.basariyolu.basic.monthly',
    basic_6months: 'com.basariyolu.basic.6months',
    basic_yearly: 'com.basariyolu.basic.yearly',

    advanced_monthly: 'com.basariyolu.advanced.monthly',
    advanced_6months: 'com.basariyolu.advanced.6months',
    advanced_yearly: 'com.basariyolu.advanced.yearly',

    professional_monthly: 'com.basariyolu.professional.monthly',
    professional_6months: 'com.basariyolu.professional.6months',
    professional_yearly: 'com.basariyolu.professional.yearly',
  },
  // iOS (App Store) Product IDs - Aynı ID'ler
  ios: {
    basic_monthly: 'com.basariyolu.basic.monthly',
    basic_6months: 'com.basariyolu.basic.6months',
    basic_yearly: 'com.basariyolu.basic.yearly',

    advanced_monthly: 'com.basariyolu.advanced.monthly',
    advanced_6months: 'com.basariyolu.advanced.6months',
    advanced_yearly: 'com.basariyolu.advanced.yearly',

    professional_monthly: 'com.basariyolu.professional.monthly',
    professional_6months: 'com.basariyolu.professional.6months',
    professional_yearly: 'com.basariyolu.professional.yearly',
  },
};

/**
 * Paket seviyeleri
 */
export type PackageLevel = 'basic' | 'advanced' | 'professional';
export type PackageDuration = 'monthly' | '6months' | 'yearly';

/**
 * Paket bilgileri (fiyatlar Play Store/App Store'dan gelecek)
 */
export interface PackageInfo {
  id: string;
  level: PackageLevel;
  duration: PackageDuration;
  name: string;
  duration_months: number;
  base_price: number; // TL cinsinden tahmini fiyat (gerçek fiyat store'dan gelir)
  discount_percent: number;
  popular?: boolean;
  recommended?: boolean;
  features: string[];
  limits: {
    maxClasses: number;
    maxStudentsPerClass: number;
    storage: string;
    support: string;
  };
}

/**
 * TÜM PAKETLER - Seviye ve Süre Kombinasyonları
 */
export const PACKAGE_INFO: PackageInfo[] = [
  // ========== TEMEL PAKETLER ==========
  {
    id: 'basic_monthly',
    level: 'basic',
    duration: 'monthly',
    name: 'Temel - Aylık',
    duration_months: 1,
    base_price: 99,
    discount_percent: 0,
    features: [
      '3 sınıfa kadar',
      'Sınıf başına 30 öğrenci',
      'Temel sınav sistemi',
      'Basit performans raporları',
      'E-posta desteği',
    ],
    limits: {
      maxClasses: 3,
      maxStudentsPerClass: 30,
      storage: '5 GB',
      support: 'E-posta (48 saat)',
    },
  },
  {
    id: 'basic_6months',
    level: 'basic',
    duration: '6months',
    name: 'Temel - 6 Aylık',
    duration_months: 6,
    base_price: 499, // ~83 TL/ay (16% indirim)
    discount_percent: 16,
    features: [
      'Tüm Aylık Temel özellikler',
      '%16 indirim',
      '6 ay kullanım',
    ],
    limits: {
      maxClasses: 3,
      maxStudentsPerClass: 30,
      storage: '5 GB',
      support: 'E-posta (48 saat)',
    },
  },
  {
    id: 'basic_yearly',
    level: 'basic',
    duration: 'yearly',
    name: 'Temel - Yıllık',
    duration_months: 12,
    base_price: 899, // ~75 TL/ay (24% indirim)
    discount_percent: 24,
    features: [
      'Tüm Aylık Temel özellikler',
      '%24 indirim',
      '12 ay kullanım',
    ],
    limits: {
      maxClasses: 3,
      maxStudentsPerClass: 30,
      storage: '5 GB',
      support: 'E-posta (48 saat)',
    },
  },

  // ========== GELİŞMİŞ PAKETLER ==========
  {
    id: 'advanced_monthly',
    level: 'advanced',
    duration: 'monthly',
    name: 'Gelişmiş - Aylık',
    duration_months: 1,
    base_price: 199,
    discount_percent: 0,
    popular: true,
    features: [
      '10 sınıfa kadar',
      'Sınıf başına 50 öğrenci',
      'Gelişmiş sınav ve analiz sistemi',
      'Fiziksel sınav entegrasyonu',
      'Ders programı yönetimi',
      'Yoklama sistemi',
      'Veli bildirim sistemi',
      'Öncelikli destek',
    ],
    limits: {
      maxClasses: 10,
      maxStudentsPerClass: 50,
      storage: '20 GB',
      support: 'E-posta + Chat (24 saat)',
    },
  },
  {
    id: 'advanced_6months',
    level: 'advanced',
    duration: '6months',
    name: 'Gelişmiş - 6 Aylık',
    duration_months: 6,
    base_price: 999, // ~166 TL/ay (16% indirim)
    discount_percent: 16,
    popular: true,
    features: [
      'Tüm Aylık Gelişmiş özellikler',
      '%16 indirim',
      '6 ay kullanım',
      'Ücretsiz 1 hafta uzatma',
    ],
    limits: {
      maxClasses: 10,
      maxStudentsPerClass: 50,
      storage: '20 GB',
      support: 'E-posta + Chat (24 saat)',
    },
  },
  {
    id: 'advanced_yearly',
    level: 'advanced',
    duration: 'yearly',
    name: 'Gelişmiş - Yıllık',
    duration_months: 12,
    base_price: 1799, // ~150 TL/ay (24% indirim)
    discount_percent: 24,
    recommended: true,
    features: [
      'Tüm Aylık Gelişmiş özellikler',
      '%24 indirim (EN AVANTAJLI)',
      '12 ay kullanım',
      'Ücretsiz 1 ay uzatma',
    ],
    limits: {
      maxClasses: 10,
      maxStudentsPerClass: 50,
      storage: '20 GB',
      support: 'E-posta + Chat (24 saat)',
    },
  },

  // ========== PROFESYONEL PAKETLER ==========
  {
    id: 'professional_monthly',
    level: 'professional',
    duration: 'monthly',
    name: 'Profesyonel - Aylık',
    duration_months: 1,
    base_price: 399,
    discount_percent: 0,
    features: [
      'Sınırsız sınıf',
      'Sınıf başına sınırsız öğrenci',
      'Tüm premium özellikler',
      'AI asistan entegrasyonu',
      'Özel raporlar ve analizler',
      'API erişimi',
      'Özel domain',
      'VIP 7/24 destek',
      'Özel eğitim ve onboarding',
    ],
    limits: {
      maxClasses: 999999,
      maxStudentsPerClass: 999999,
      storage: 'Sınırsız',
      support: '7/24 Telefon + Chat',
    },
  },
  {
    id: 'professional_6months',
    level: 'professional',
    duration: '6months',
    name: 'Profesyonel - 6 Aylık',
    duration_months: 6,
    base_price: 1999, // ~333 TL/ay (16% indirim)
    discount_percent: 16,
    features: [
      'Tüm Aylık Profesyonel özellikler',
      '%16 indirim',
      '6 ay kullanım',
      'Ücretsiz 2 hafta uzatma',
      'Özel API limitleri',
    ],
    limits: {
      maxClasses: 999999,
      maxStudentsPerClass: 999999,
      storage: 'Sınırsız',
      support: '7/24 Telefon + Chat + Özel Account Manager',
    },
  },
  {
    id: 'professional_yearly',
    level: 'professional',
    duration: 'yearly',
    name: 'Profesyonel - Yıllık',
    duration_months: 12,
    base_price: 3599, // ~300 TL/ay (24% indirim)
    discount_percent: 24,
    features: [
      'Tüm Aylık Profesyonel özellikler',
      '%24 indirim',
      '12 ay kullanım',
      'Ücretsiz 2 ay uzatma',
      'Premium API limitleri',
      'Özel feature istekleri',
    ],
    limits: {
      maxClasses: 999999,
      maxStudentsPerClass: 999999,
      storage: 'Sınırsız',
      support: '7/24 Telefon + Chat + Özel Account Manager',
    },
  },
];

/**
 * Platform ve paket kombinasyonuna göre ürün ID'sini getir
 */
export const getProductId = (
  platform: 'android' | 'ios',
  level: PackageLevel,
  duration: PackageDuration
): string => {
  const key = `${level}_${duration}` as keyof typeof IAP_PRODUCT_IDS.android;
  return IAP_PRODUCT_IDS[platform][key];
};

/**
 * Tüm ürün ID'lerini platform'a göre getir
 */
export const getAllProductIds = (platform: 'android' | 'ios'): string[] => {
  return Object.values(IAP_PRODUCT_IDS[platform]);
};

/**
 * Paket bilgisini ID'ye göre getir
 */
export const getPackageInfo = (id: string): PackageInfo | undefined => {
  return PACKAGE_INFO.find((pkg) => pkg.id === id);
};

/**
 * Seviye ve süreye göre paket bilgisini getir
 */
export const getPackageByLevelAndDuration = (
  level: PackageLevel,
  duration: PackageDuration
): PackageInfo | undefined => {
  return PACKAGE_INFO.find((pkg) => pkg.level === level && pkg.duration === duration);
};
