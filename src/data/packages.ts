interface Package {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxParents: number;
  aiSupport: boolean;
  features: string[];
}

export const packages: Package[] = [
  {
    id: 'basic',
    name: 'Temel Paket',
    monthlyPrice: 219.99,
    yearlyPrice: 1999.99,
    maxParents: 1,
    aiSupport: false,
    features: [
      'Deneme sonuçlarını kaydetme',
      'Temel grafik raporlar',
      'Ödev takibi (manuel giriş)',
      '1 veli hesabı bağlama',
      'Temel analiz raporları',
      'Haftalık çalışma hedefi'
    ]
  },
  {
    id: 'advanced',
    name: 'Gelişmiş Paket',
    monthlyPrice: 319.99,
    yearlyPrice: 2599.99,
    maxParents: 2,
    aiSupport: true,
    features: [
      'Tüm temel özellikler',
      'Ayrıntılı infografik analizler',
      'Yapay zeka destekli eksik tespit',
      'Otomatik ödev önerileri',
      '2 veli hesabı bağlama',
      'Konu bazlı başarı analizi',
      'Gelişmiş çalışma takibi'
    ]
  },
  {
    id: 'professional',
    name: 'Profesyonel Paket',
    monthlyPrice: 499.99,
    yearlyPrice: 3499.99,
    maxParents: 3,
    aiSupport: true,
    features: [
      'Tüm gelişmiş özellikler',
      'AI ile kişiselleştirilmiş çalışma planı',
      'Öğrenci karşılaştırma analizi',
      'Haftalık rapor e-posta/SMS',
      '3 veli hesabı bağlama',
      'Sınırsız deneme/ödev kaydı',
      'PDF rapor indirme',
      'Öncelikli destek',
      'TYT-AYT Çıkmış Konular (2018-2025)',
      'Gelişmiş AI analiz ve öneriler'
    ]
  }
];