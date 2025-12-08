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
    base_price: 229,
    discount_percent: 0,
    features: [
      'Soru portalı ile çözemediğiniz soruları paylaşma ve çözme',
      'Deneme sonuçlarını kaydetme',
      'Çalışma Programı Oluşturma',
      'Denemelerinizin trend analiz grafikleri',
      'E-posta desteği',
      'Haftalık çalışma hedefi',
      'Veliniz de ücretsiz sizi takip edebilir.',
      'Sınıf ile etkileşim'
    ]
  },
  {
    id: 'basic_6months',
    level: 'basic',
    duration: '6months',
    name: 'Temel - YKS LGS sınav dönemi bitene kadar',
    duration_months: 7,
    base_price: 1199,
    discount_percent: 16,
    features: [
      'Tüm Aylık Temel özellikler',
      '%13 indirim',
      'YKS-LGS dönemi sonuna kadar kullanım.',
    ]
  },
  {
    id: 'basic_yearly',
    level: 'basic',
    duration: 'yearly',
    name: 'Temel - Yıllık',
    duration_months: 12,
    base_price: 1999, 
    discount_percent: 28,
    features: [
      'Tüm Aylık Temel özellikler',
      '%24 indirim',
      '12 ay kullanım',
    ]
  },

  // ========== GELİŞMİŞ PAKETLER ==========
  {
    id: 'advanced_monthly',
    level: 'advanced',
    duration: 'monthly',
    name: 'Gelişmiş - Aylık',
    duration_months: 1,
    base_price: 339,
    discount_percent: 0,
    popular: true,
    features: [
      'Tüm temel özellikleri barındırır',
      'Yapay Zeka Görsel Analiz(Fotoğraftan Soru Çözme)',
      'Anlamadığınız konular için Yapay Zeka destekli konu özeti çıkarma',
      'ÖSYM-MEB Son 8 yılın Çıkmış konular analizi',
      'Yapay zeka destekli eksik tespit',
      'Ayrıntılı infografik analizler',
      'Denemelerinizde netlerinizi arttırmak için yapay zeka destekli öneriler',
      'Konu bazlı başarı analizi',
      'Pomodoro tekniği ile çalışma zamanlayıcı',
      'Akılda kalıcı Tarih-Coğrafya harita çalışmaları',
    ]
  },
  {
    id: 'advanced_6months',
    level: 'advanced',
    duration: '6months',
    name: 'Gelişmiş - YKS LGS sınav dönemi bitene kadar',
    duration_months: 7,
    base_price: 1899,
    discount_percent: 10,
    popular: true,
    features: [
      'Tüm Aylık Gelişmiş özellikler',
      '%10 indirim',
      'YKS-LGS dönemi sonuna kadar kullanım.',
    ]
  },
  {
    id: 'advanced_yearly',
    level: 'advanced',
    duration: 'yearly',
    name: 'Gelişmiş - Yıllık',
    duration_months: 12,
    base_price: 2899,
    discount_percent: 28,
    recommended: true,
    features: [
      'Tüm Aylık Gelişmiş özellikler',
      '%28 indirim',
      '12 ay kullanım'
    ]
  },

  // ========== PROFESYONEL PAKETLER ==========
  {
    id: 'professional_monthly',
    level: 'professional',
    duration: 'monthly',
    name: 'Profesyonel - Aylık',
    duration_months: 1,
    base_price: 499,
    discount_percent: 0,
    features: [
      'Tüm gelişmiş özellikleri barındırır',
      'AI ile kişiselleştirilmiş çalışma planı',
      'Tüm premium özellikler',
      'Profesyonel Pakete Özel Konu Özetleri',
      'Formül Kartları(Flashcard) ile akılda kalıcı öğrenme',
      'Özel not alma ve vurgulama araçları',
      'BaşarıYolumda öncelikli destek',
      'Haftalık rapor e-posta/SMS',
      'Gelişmiş AI analiz ve öneriler',
    ]
  },
  {
    id: 'professional_6months',
    level: 'professional',
    duration: '6months',
    name: 'Profesyonel - YKS LGS sınav dönemi bitene kadar',
    duration_months: 7,
    base_price: 2499,
    discount_percent: 16,
    features: [
      'Tüm Aylık Profesyonel özellikler',
      '%50 indirim',
      '7 ay kullanım',
    ]
  },
  {
    id: 'professional_yearly',
    level: 'professional',
    duration: 'yearly',
    name: 'Profesyonel - Yıllık',
    duration_months: 12,
    base_price: 3599,
    discount_percent: 24,
    features: [
      'Tüm Aylık Profesyonel özellikler',
      '%33 indirim',
      '12 ay kullanım',
    ]
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
