/**
 * Standart TYT/AYT/LGS Sınav Template'leri
 * MEB müfredatına ve standart sınav yapısına göre hazırlanmıştır
 */

import { CreateExternalExamTemplatePayload, ExternalExamQuestionMapping } from './institutionExternalExamApi';

/**
 * TYT Standart Yapısı (120 Soru)
 * - Türkçe: 40 soru (1-40)
 * - Matematik: 40 soru (41-80)
 * - Fen Bilimleri: 20 soru (81-100)
 * - Sosyal Bilimler: 20 soru (101-120)
 */
export const TYT_STANDARD_TEMPLATE: Omit<CreateExternalExamTemplatePayload, 'institutionId'> = {
  name: 'TYT Standart (120 Soru)',
  publisher: 'MEB Standart',
  examType: 'TYT',
  totalQuestions: 120,
  isPublic: true,
  questionMapping: [
    // TÜRKÇE (1-40)
    // Sözcükte Anlam (1-8)
    ...Array.from({ length: 8 }, (_, i) => ({
      questionNumber: i + 1,
      subject: 'Türkçe',
      topic: 'Sözcükte Anlam',
    })),
    // Cümlede Anlam (9-16)
    ...Array.from({ length: 8 }, (_, i) => ({
      questionNumber: i + 9,
      subject: 'Türkçe',
      topic: 'Cümlede Anlam',
    })),
    // Paragraf (17-24)
    ...Array.from({ length: 8 }, (_, i) => ({
      questionNumber: i + 17,
      subject: 'Türkçe',
      topic: 'Paragraf',
    })),
    // Parçada Anlam (25-32)
    ...Array.from({ length: 8 }, (_, i) => ({
      questionNumber: i + 25,
      subject: 'Türkçe',
      topic: 'Parçada Anlam',
    })),
    // Yazım Kuralları (33-40)
    ...Array.from({ length: 8 }, (_, i) => ({
      questionNumber: i + 33,
      subject: 'Türkçe',
      topic: 'Yazım Kuralları',
    })),

    // MATEMATİK (41-80)
    // Temel Matematik (41-60)
    // Sayılar (41-45)
    ...Array.from({ length: 5 }, (_, i) => ({
      questionNumber: i + 41,
      subject: 'Matematik',
      topic: 'Sayılar',
    })),
    // Rasyonel Sayılar (46-48)
    ...Array.from({ length: 3 }, (_, i) => ({
      questionNumber: i + 46,
      subject: 'Matematik',
      topic: 'Rasyonel Sayılar',
    })),
    // Oran-Orantı (49-51)
    ...Array.from({ length: 3 }, (_, i) => ({
      questionNumber: i + 49,
      subject: 'Matematik',
      topic: 'Oran-Orantı',
    })),
    // Cebirsel İfadeler (52-55)
    ...Array.from({ length: 4 }, (_, i) => ({
      questionNumber: i + 52,
      subject: 'Matematik',
      topic: 'Cebirsel İfadeler',
    })),
    // Denklemler (56-60)
    ...Array.from({ length: 5 }, (_, i) => ({
      questionNumber: i + 56,
      subject: 'Matematik',
      topic: 'Denklemler ve Eşitsizlikler',
    })),
    // Geometri (61-80)
    // Temel Geometri (61-65)
    ...Array.from({ length: 5 }, (_, i) => ({
      questionNumber: i + 61,
      subject: 'Geometri',
      topic: 'Temel Geometri',
    })),
    // Üçgenler (66-70)
    ...Array.from({ length: 5 }, (_, i) => ({
      questionNumber: i + 66,
      subject: 'Geometri',
      topic: 'Üçgenler',
    })),
    // Dörtgenler (71-73)
    ...Array.from({ length: 3 }, (_, i) => ({
      questionNumber: i + 71,
      subject: 'Geometri',
      topic: 'Dörtgenler',
    })),
    // Çember (74-77)
    ...Array.from({ length: 4 }, (_, i) => ({
      questionNumber: i + 74,
      subject: 'Geometri',
      topic: 'Çember',
    })),
    // Analitik Geometri (78-80)
    ...Array.from({ length: 3 }, (_, i) => ({
      questionNumber: i + 78,
      subject: 'Geometri',
      topic: 'Analitik Geometri',
    })),

    // FEN BİLİMLERİ (81-100)
    // Fizik (81-87)
    ...Array.from({ length: 7 }, (_, i) => ({
      questionNumber: i + 81,
      subject: 'Fizik',
      topic: i < 3 ? 'Hareket' : i < 5 ? 'Kuvvet' : 'Enerji',
    })),
    // Kimya (88-94)
    ...Array.from({ length: 7 }, (_, i) => ({
      questionNumber: i + 88,
      subject: 'Kimya',
      topic: i < 3 ? 'Atom Yapısı' : i < 5 ? 'Kimyasal Türler' : 'Kimyasal Tepkimeler',
    })),
    // Biyoloji (95-100)
    ...Array.from({ length: 6 }, (_, i) => ({
      questionNumber: i + 95,
      subject: 'Biyoloji',
      topic: i < 3 ? 'Hücre' : 'Canlılar',
    })),

    // SOSYAL BİLİMLER (101-120)
    // Tarih (101-105)
    ...Array.from({ length: 5 }, (_, i) => ({
      questionNumber: i + 101,
      subject: 'Tarih',
      topic: i < 2 ? 'İnkılap Tarihi' : 'Türk Tarihi',
    })),
    // Coğrafya (106-110)
    ...Array.from({ length: 5 }, (_, i) => ({
      questionNumber: i + 106,
      subject: 'Coğrafya',
      topic: i < 2 ? 'Fiziki Coğrafya' : 'Beşeri Coğrafya',
    })),
    // Felsefe (111-115)
    ...Array.from({ length: 5 }, (_, i) => ({
      questionNumber: i + 111,
      subject: 'Felsefe',
      topic: i < 2 ? 'Felsefe Bilimi' : 'Felsefi Disiplinler',
    })),
    // Din Kültürü (116-120)
    ...Array.from({ length: 5 }, (_, i) => ({
      questionNumber: i + 116,
      subject: 'Din Kültürü',
      topic: i < 2 ? 'İslam' : 'Dinler Tarihi',
    })),
  ],
};

/**
 * AYT Sayısal (80 Soru)
 */
export const AYT_SAY_STANDARD_TEMPLATE: Omit<CreateExternalExamTemplatePayload, 'institutionId'> = {
  name: 'AYT Sayısal (80 Soru)',
  publisher: 'MEB Standart',
  examType: 'AYT',
  totalQuestions: 80,
  isPublic: true,
  questionMapping: [
    // MATEMATİK (1-40)
    // Fonksiyonlar (1-6)
    ...Array.from({ length: 6 }, (_, i) => ({
      questionNumber: i + 1,
      subject: 'Matematik',
      topic: 'Fonksiyonlar',
    })),
    // Polinomlar (7-10)
    ...Array.from({ length: 4 }, (_, i) => ({
      questionNumber: i + 7,
      subject: 'Matematik',
      topic: 'Polinomlar',
    })),
    // Üstel ve Logaritmik Fonksiyonlar (11-14)
    ...Array.from({ length: 4 }, (_, i) => ({
      questionNumber: i + 11,
      subject: 'Matematik',
      topic: 'Üstel ve Logaritmik Fonksiyonlar',
    })),
    // Trigonometri (15-18)
    ...Array.from({ length: 4 }, (_, i) => ({
      questionNumber: i + 15,
      subject: 'Matematik',
      topic: 'Trigonometri',
    })),
    // Limit ve Süreklilik (19-24)
    ...Array.from({ length: 6 }, (_, i) => ({
      questionNumber: i + 19,
      subject: 'Matematik',
      topic: 'Limit ve Süreklilik',
    })),
    // Türev (25-32)
    ...Array.from({ length: 8 }, (_, i) => ({
      questionNumber: i + 25,
      subject: 'Matematik',
      topic: 'Türev',
    })),
    // İntegral (33-38)
    ...Array.from({ length: 6 }, (_, i) => ({
      questionNumber: i + 33,
      subject: 'Matematik',
      topic: 'İntegral',
    })),
    // Olasılık (39-40)
    ...Array.from({ length: 2 }, (_, i) => ({
      questionNumber: i + 39,
      subject: 'Matematik',
      topic: 'Olasılık',
    })),

    // FİZİK (41-54)
    // Elektrik ve Manyetizma (41-46)
    ...Array.from({ length: 6 }, (_, i) => ({
      questionNumber: i + 41,
      subject: 'Fizik',
      topic: 'Elektrik ve Manyetizma',
    })),
    // Kuvvet ve Hareket (47-50)
    ...Array.from({ length: 4 }, (_, i) => ({
      questionNumber: i + 47,
      subject: 'Fizik',
      topic: 'Kuvvet ve Hareket',
    })),
    // Enerji (51-54)
    ...Array.from({ length: 4 }, (_, i) => ({
      questionNumber: i + 51,
      subject: 'Fizik',
      topic: 'Enerji',
    })),

    // KİMYA (55-67)
    // Organik Kimya (55-60)
    ...Array.from({ length: 6 }, (_, i) => ({
      questionNumber: i + 55,
      subject: 'Kimya',
      topic: 'Organik Kimya',
    })),
    // Asit-Baz Dengeleri (61-64)
    ...Array.from({ length: 4 }, (_, i) => ({
      questionNumber: i + 61,
      subject: 'Kimya',
      topic: 'Asit-Baz Dengeleri',
    })),
    // Çözünürlük (65-67)
    ...Array.from({ length: 3 }, (_, i) => ({
      questionNumber: i + 65,
      subject: 'Kimya',
      topic: 'Çözünürlük',
    })),

    // BİYOLOJİ (68-80)
    // Hücre Bölünmesi (68-71)
    ...Array.from({ length: 4 }, (_, i) => ({
      questionNumber: i + 68,
      subject: 'Biyoloji',
      topic: 'Hücre Bölünmesi ve Kalıtım',
    })),
    // Sistemler (72-76)
    ...Array.from({ length: 5 }, (_, i) => ({
      questionNumber: i + 72,
      subject: 'Biyoloji',
      topic: 'Canlılarda Sistemler',
    })),
    // Ekosistem (77-80)
    ...Array.from({ length: 4 }, (_, i) => ({
      questionNumber: i + 77,
      subject: 'Biyoloji',
      topic: 'Ekosistem Ekolojisi',
    })),
  ],
};

/**
 * AYT Eşit Ağırlık (80 Soru)
 */
export const AYT_EA_STANDARD_TEMPLATE: Omit<CreateExternalExamTemplatePayload, 'institutionId'> = {
  name: 'AYT Eşit Ağırlık (80 Soru)',
  publisher: 'MEB Standart',
  examType: 'AYT',
  totalQuestions: 80,
  isPublic: true,
  questionMapping: [
    // EDEBİYAT (1-24)
    // Eski Türk Edebiyatı (1-8)
    ...Array.from({ length: 8 }, (_, i) => ({
      questionNumber: i + 1,
      subject: 'Edebiyat',
      topic: 'Eski Türk Edebiyatı',
    })),
    // Yeni Türk Edebiyatı (9-16)
    ...Array.from({ length: 8 }, (_, i) => ({
      questionNumber: i + 9,
      subject: 'Edebiyat',
      topic: 'Yeni Türk Edebiyatı',
    })),
    // Cumhuriyet Dönemi (17-24)
    ...Array.from({ length: 8 }, (_, i) => ({
      questionNumber: i + 17,
      subject: 'Edebiyat',
      topic: 'Cumhuriyet Dönemi Edebiyatı',
    })),

    // TARİH-1 (25-49)
    ...Array.from({ length: 25 }, (_, i) => ({
      questionNumber: i + 25,
      subject: 'Tarih',
      topic: i < 10 ? 'İlk ve Orta Çağ' : i < 20 ? 'Osmanlı Tarihi' : 'Yakınçağ Tarihi',
    })),

    // COĞRAFYA-1 (50-55)
    ...Array.from({ length: 6 }, (_, i) => ({
      questionNumber: i + 50,
      subject: 'Coğrafya',
      topic: i < 3 ? 'Fiziki Coğrafya' : 'Beşeri Coğrafya',
    })),

    // TARİH-2 (56-66)
    ...Array.from({ length: 11 }, (_, i) => ({
      questionNumber: i + 56,
      subject: 'Tarih',
      topic: i < 5 ? '20. Yüzyıl Tarihi' : 'Türkiye Cumhuriyeti Tarihi',
    })),

    // COĞRAFYA-2 (67-80)
    ...Array.from({ length: 14 }, (_, i) => ({
      questionNumber: i + 67,
      subject: 'Coğrafya',
      topic: i < 7 ? 'Türkiye Coğrafyası' : 'Bölge Coğrafyası',
    })),
  ],
};

/**
 * LGS Standart (90 Soru)
 */
export const LGS_STANDARD_TEMPLATE: Omit<CreateExternalExamTemplatePayload, 'institutionId'> = {
  name: 'LGS Standart (90 Soru)',
  publisher: 'MEB Standart',
  examType: 'LGS',
  totalQuestions: 90,
  isPublic: true,
  questionMapping: [
    // TÜRKÇE (1-20)
    ...Array.from({ length: 20 }, (_, i) => ({
      questionNumber: i + 1,
      subject: 'Türkçe',
      topic: i < 10 ? 'Sözcük-Cümle Bilgisi' : 'Paragraf-Tema',
    })),

    // MATEMATİK (21-40)
    ...Array.from({ length: 20 }, (_, i) => ({
      questionNumber: i + 21,
      subject: 'Matematik',
      topic: i < 5 ? 'Sayılar' : i < 10 ? 'Cebir' : i < 15 ? 'Geometri' : 'Veri Analizi',
    })),

    // FEN BİLİMLERİ (41-60)
    ...Array.from({ length: 20 }, (_, i) => ({
      questionNumber: i + 41,
      subject: 'Fen Bilimleri',
      topic: i < 7 ? 'Fizik' : i < 14 ? 'Kimya' : 'Biyoloji',
    })),

    // İNKILAP TARİHİ (61-70)
    ...Array.from({ length: 10 }, (_, i) => ({
      questionNumber: i + 61,
      subject: 'İnkılap Tarihi',
      topic: i < 5 ? 'Milli Mücadele' : 'Atatürk İlkeleri',
    })),

    // İNGİLİZCE (71-80)
    ...Array.from({ length: 10 }, (_, i) => ({
      questionNumber: i + 71,
      subject: 'İngilizce',
      topic: i < 5 ? 'Grammar' : 'Reading',
    })),

    // DİN KÜLTÜRÜ (81-90)
    ...Array.from({ length: 10 }, (_, i) => ({
      questionNumber: i + 81,
      subject: 'Din Kültürü',
      topic: i < 5 ? 'İslam Dini' : 'Ahlak',
    })),
  ],
};

/**
 * Tüm standart template'ler
 */
export const STANDARD_EXAM_TEMPLATES = [
  TYT_STANDARD_TEMPLATE,
  AYT_SAY_STANDARD_TEMPLATE,
  AYT_EA_STANDARD_TEMPLATE,
  LGS_STANDARD_TEMPLATE,
];
