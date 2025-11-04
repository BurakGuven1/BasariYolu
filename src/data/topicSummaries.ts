export interface TopicSummary {
  id: string;
  examType: 'TYT' | 'AYT' | 'LGS';
  subject: string;
  title: string;
  description: string;
  focusPoints: string[];
  difficulty: 'Kolay' | 'Orta' | 'Zor';
  duration: string;
  pdfUrl: string;
  tags: string[];
  updatedAt: string;
}

export const topicSummaries: TopicSummary[] = [
  {
    id: 'tyt-problem',
    examType: 'TYT',
    subject: 'Matematik',
    title: 'Problemler Hızlı Tekrar Paketi',
    description:
      'Oran-orantı, işçi-havuz ve hız problemlerinde en sık çıkan soru kalıpları ile pratik çözümler.',
    focusPoints: [
      'Soru tiplerine göre çözüm stratejileri',
      'Karma problemler için tablo yaklaşımı',
      'Sınavda zaman kazandıran kısayollar'
    ],
    difficulty: 'Orta',
    duration: '15 dk',
    pdfUrl: '/summaries/problemlerNot.pdf',
    tags: ['Problem', 'Zaman Yönetimi', 'TYT'],
    updatedAt: '2024-10-01'
  },
  {
    id: 'tyt-paragraf',
    examType: 'TYT',
    subject: 'Türkçe',
    title: 'Paragraf Stratejileri Özeti',
    description:
      'Paragraf sorularında hız ve doğruluğu artıran kısa teknikler, dikkat edilmesi gereken bağlaç ve ipuçları.',
    focusPoints: [
      'Soru kökü analiz rehberi',
      'Duygu düşünce sorularında seçenek eleme',
      'Paragraf eşleştirme pratik seti'
    ],
    difficulty: 'Orta',
    duration: '15 dk',
    pdfUrl: '/summaries/paragrafOzet.pdf',
    tags: ['Paragraf', 'Hız', 'Okuma'],
    updatedAt: '2024-09-20'
  }
];

export default topicSummaries;
