export type Package = {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  sixMonthPrice: number;
  yearlyPrice: number;
  maxParents: number;
  aiSupport: boolean;
  features: string[];
};

export const packages: Package[] = [
  {
    id: 'basic',
    name: 'Temel Paket',
    description: 'Temel raporlar ve soru portalı ile başlangıç paketi.',
    monthlyPrice: 229,
    sixMonthPrice: 1199,
    yearlyPrice: 1999,
    maxParents: 1,
    aiSupport: false,
    features: [
      'Soru portalında paylaşım ve çözüm',
      'Deneme sonuçlarını kaydetme',
      'Çalışma programı oluşturma',
      'Temel grafik raporlar',
      'Ödev takibi (manuel giriş)',
      'Veli takibi',
      'Haftalık çalışma hedefi',
    ],
  },
  {
    id: 'advanced',
    name: 'Gelişmiş Paket',
    description: 'Yapay zeka destekli analizler ve detaylı takip.',
    monthlyPrice: 339,
    sixMonthPrice: 1899,
    yearlyPrice: 2899,
    maxParents: 2,
    aiSupport: true,
    features: [
      'Temel paketin tüm özellikleri',
      'AI görsel analiz (fotoğraftan soru çözme)',
      'AI destekli konu özeti çıkarma',
      'Çıkmış konular analizi',
      'İnfografik raporlar',
      'Eksik tespit ve öneriler',
      'Akıllı çalışma planı',
      'Pomodoro zamanlayıcı',
    ],
  },
  {
    id: 'pro',
    name: 'Profesyonel Paket',
    description: 'Öncelikli destek ve sınırsız kayıtlarla tam kapsamlı paket.',
    monthlyPrice: 499,
    sixMonthPrice: 2799,
    yearlyPrice: 3999,
    maxParents: 3,
    aiSupport: true,
    features: [
      'Gelişmiş paketin tüm özellikleri',
      'Kişiselleştirilmiş AI planı',
      'Öncelikli destek',
      'Haftalık rapor e-posta/SMS',
      'Sınırsız deneme/ödev kaydı',
      'Gelişmiş AI analiz ve öneriler',
    ],
  },
];
