interface Package {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  sixMonthPrice: number;
  yearlyPrice: number;
  maxParents: number;
  aiSupport: boolean;
  features: string[];
  featureAccess: { [key: string]: boolean }; // Hangi özellikler var/yok
  paymentLinks?: {
    monthly: string;
    sixMonth: string;
    yearly: string;
  };
}

// Tüm özellikler listesi (karşılaştırma tablosu için)
export const allFeatures = [
  { id: 'exam_tracking', name: 'Deneme sonuçlarını kaydetme', category: 'Temel' },
  { id: 'basic_reports', name: 'Temel grafik raporlar', category: 'Temel' },
  { id: 'homework_tracking', name: 'Ödev takibi', category: 'Temel' },
  { id: 'parent_accounts', name: 'Veliniz takip edebilir', category: 'Temel' },
  { id: 'basic_analysis', name: 'Temel analiz raporları', category: 'Temel' },
  { id: 'weekly_goals', name: 'Haftalık çalışma hedefi', category: 'Temel' },
  { id: 'advanced_infographics', name: 'Ayrıntılı infografik analizler', category: 'Gelişmiş' },
  { id: 'ai_gap_detection', name: 'Yapay zeka destekli eksik tespit', category: 'Gelişmiş' },
  { id: 'auto_homework', name: 'Otomatik ödev önerileri', category: 'Gelişmiş' },
  { id: 'topic_analysis', name: 'Konu bazlı başarı analizi', category: 'Gelişmiş' },
  { id: 'advanced_tracking', name: 'Gelişmiş çalışma takibi', category: 'Gelişmiş' },
  { id: 'ai_study_plan', name: 'AI ile kişiselleştirilmiş çalışma planı', category: 'Profesyonel' },
  { id: 'ai_chat', name: 'AI Sohbet Asistanı (Günlük 15 Soru)', category: 'Profesyonel' },
  { id: 'ai_vision', name: 'AI Görsel Analiz (Fotoğraftan Soru Çözme)', category: 'Profesyonel' },
  { id: 'student_comparison', name: 'Öğrenci karşılaştırma analizi', category: 'Profesyonel' },
  { id: 'weekly_email', name: 'Haftalık rapor e-posta/SMS', category: 'Profesyonel' },
  { id: 'unlimited_exams', name: 'Sınırsız deneme/ödev kaydı', category: 'Profesyonel' },
  { id: 'pdf_reports', name: 'PDF rapor indirme', category: 'Profesyonel' },
  { id: 'priority_support', name: 'Öncelikli destek', category: 'Profesyonel' },
  { id: 'past_questions', name: 'TYT-AYT Çıkmış Konular (2018-2025)', category: 'Profesyonel' },
  { id: 'advanced_ai', name: 'Gelişmiş AI analiz ve öneriler', category: 'Profesyonel' },
];

export const packages: Package[] = [
  {
    id: 'basic',
    name: 'Temel Paket',
    monthlyPrice: 229,
    sixMonthPrice: 1199,
    yearlyPrice: 1999,
    maxParents: 1,
    aiSupport: false,
    features: [
      'ÖSYM-MEB Son 8 yılın Çıkmış konular analizi',
      'Deneme sonuçlarını kaydetme',
      'Çalışma Programı Oluşturma',
      'Temel grafik raporlar',
      'Ödev takibi (manuel giriş)',
      'Veliniz de ücretsiz sizi takip edebilir.',
      'Temel analiz raporları',
      'Haftalık çalışma hedefi',
      'Sınıf ile etkileşim',
      'Denemelerinizin trend analiz grafikleri',
      'BaşarıYoluna özel soru bankası erişimi',
    ],
    featureAccess: {
      exam_tracking: true,
      basic_reports: true,
      homework_tracking: true,
      parent_accounts: true,
      basic_analysis: true,
      weekly_goals: true,
      advanced_infographics: false,
      ai_gap_detection: false,
      auto_homework: false,
      topic_analysis: false,
      advanced_tracking: false,
      ai_study_plan: false,
      ai_chat: false,
      ai_vision: false,
      student_comparison: false,
      weekly_email: false,
      unlimited_exams: false,
      pdf_reports: false,
      priority_support: false,
      past_questions: false,
      advanced_ai: false,
    },
    paymentLinks: {
      monthly: 'IYZICO_LINK_TEMEL_1AY',
      sixMonth: 'IYZICO_LINK_TEMEL_6AY',
      yearly: 'IYZICO_LINK_TEMEL_12AY'
    }
  },
  {
    id: 'advanced',
    name: 'Gelişmiş Paket',
    monthlyPrice: 339,
    sixMonthPrice: 1899,
    yearlyPrice: 2899,
    maxParents: 2,
    aiSupport: true,
    features: [
      'Tüm temel özellikleri barındırır',
      'Yapay Zeka Görsel Analiz(Fotoğraftan Soru Çözme)',
      'Anlamadığınız konular için Yapay Zeka destekli konu özeti çıkarma',
      'Ayrıntılı infografik analizler',
      'Yapay zeka destekli eksik tespit',
      'BaşarıYolu özel Online Soru Bankası',
      'Akıllı plan oluşturma',
      'Konu bazlı başarı analizi',
      'Gelişmiş çalışma takibi',
      'Denemelerinizde netlerinizi arttırmak için yapay zeka destekli öneriler',
      'Pomodoro tekniği ile çalışma zamanlayıcı',
      'Akılda kalıcı Tarih-Coğrafya harita çalışmaları',
      'Kurumunuz ve Öğretmeniniz ile entegrasyon'
    ],
    featureAccess: {
      exam_tracking: true,
      basic_reports: true,
      homework_tracking: true,
      parent_accounts: true,
      basic_analysis: true,
      weekly_goals: true,
      advanced_infographics: true,
      ai_gap_detection: true,
      auto_homework: true,
      topic_analysis: true,
      advanced_tracking: true,
      ai_study_plan: false,
      ai_chat: false,
      ai_vision: false,
      student_comparison: false,
      weekly_email: false,
      unlimited_exams: false,
      pdf_reports: false,
      priority_support: false,
      past_questions: false,
      advanced_ai: false,
    },
    paymentLinks: {
      monthly: 'IYZICO_LINK_GELISMIS_1AY',
      sixMonth: 'IYZICO_LINK_GELISMIS_6AY',
      yearly: 'IYZICO_LINK_GELISMIS_12AY'
    }
  },
  {
    id: 'professional',
    name: 'Profesyonel Paket',
    monthlyPrice: 499,
    sixMonthPrice: 2799,
    yearlyPrice: 3999,
    maxParents: 3,
    aiSupport: true,
    features: [
      'Tüm gelişmiş özellikleri barındırır',
      'Yapay Zeka Görsel Analiz(Fotoğraftan Soru Çözme)',
      'AI ile kişiselleştirilmiş çalışma planı',
      'Size Özel Yapay Zeka Sohbet Asistanı',
      'Profesyonel Pakete Özel Konu Özetleri',
      'Formül Kartları(Flashcard) ile akılda kalıcı öğrenme',
      'Özel not alma ve vurgulama araçları',
      'BaşarıYolumda öncelikli destek',
      'BaşarıYolu özel Online Soru Bankası',
      'Haftalık rapor e-posta/SMS',
      'Sınırsız deneme/ödev kaydı',
      'Gelişmiş AI analiz ve öneriler',
      'Kurumunuz ve Öğretmeniniz ile entegrasyon'
    ],
    featureAccess: {
      exam_tracking: true,
      basic_reports: true,
      homework_tracking: true,
      parent_accounts: true,
      basic_analysis: true,
      weekly_goals: true,
      advanced_infographics: true,
      ai_gap_detection: true,
      auto_homework: true,
      topic_analysis: true,
      advanced_tracking: true,
      ai_study_plan: true,
      ai_chat: true,
      ai_vision: true,
      student_comparison: true,
      weekly_email: true,
      unlimited_exams: true,
      pdf_reports: true,
      priority_support: true,
      past_questions: true,
      advanced_ai: true,
    },
    paymentLinks: {
      monthly: 'IYZICO_LINK_PROFESYONEL_1AY',
      sixMonth: 'IYZICO_LINK_PROFESYONEL_6AY',
      yearly: 'IYZICO_LINK_PROFESYONEL_12AY'
    }
  }
];
