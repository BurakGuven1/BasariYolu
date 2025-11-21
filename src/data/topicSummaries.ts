export type GradeLevel = 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface TopicSummary {
  id: string;
  title: string;
  description: string;
  focusPoints: string[];
  difficulty: 'Kolay' | 'Orta' | 'Zor';
  duration: string;
  pdfUrl: string;
  tags: string[];
  updatedAt: string;
}

export interface SubjectTopicGroup {
  id: string;
  name: string;
  description: string;
  topics: TopicSummary[];
}

export interface GradeTopicSummary {
  grade: GradeLevel;
  label: string;
  info: string;
  subjects: SubjectTopicGroup[];
}

export const gradeTopicSummaries: GradeTopicSummary[] = [
  {
    grade: 5,
    label: '5. Sınıf',
    info: 'Temel becerileri pekiştirmek isteyen 5. sınıf öğrencileri için PDF özetleri',
    subjects: [
      {
        id: '5-matematik',
        name: 'Matematik',
        description: 'Kesirler, geometrik cisimler ve dört işlem hızını artırmaya yönelik özetler',
        topics: [
          {
            id: '5-kesirler',
            title: 'Kesirlerde İşlemler',
            description: 'Kesir kavramı, sadeleştirme ve farklı paydalarda toplama çıkarma adımları.',
            focusPoints: [
              'Payda eşitleme stratejileri',
              'Problem cümlelerini tabloya çevirme',
              'Model çizimleriyle kontrol'
            ],
            difficulty: 'Kolay',
            duration: '10 dk',
            pdfUrl: '/summaries/5sinif-matematik-kesirler.pdf',
            tags: ['5. sınıf', 'Matematik', 'Kesir'],
            updatedAt: '2024-09-01'
          },
          {
            id: '5-geometri',
            title: 'Geometrik Cisimler',
            description:
              'Küp, prizma ve piramitlerin temel özellikleri, açınımlar ve yüzey alanı hesaplama.',
            focusPoints: [
              'Şekil açınımlarıyla yüzey alanı bulma',
              'Birim küp modelleme',
              'Görsel hafıza kartlarıyla tekrar'
            ],
            difficulty: 'Orta',
            duration: '12 dk',
            pdfUrl: '/summaries/5sinif-matematik-geometri.pdf',
            tags: ['5. sınıf', 'Matematik', 'Geometri'],
            updatedAt: '2024-10-15'
          }
        ]
      },
      {
        id: '5-fen',
        name: 'Fen Bilimleri',
        description: 'Fen okuryazarlığını destekleyen güneş sistemi ve madde konuları',
        topics: [
          {
            id: '5-gunes-sistemi',
            title: 'Güneş Sistemi',
            description:
              'Gezegenlerin sıralanışı, temel özellikleri ve okula yönelik kıyaslamalarla hatırlatma.',
            focusPoints: [
              'Gezegen kartları',
              'Dünya ile kıyaslama',
              'Dönme ve dolanma animasyonları'
            ],
            difficulty: 'Kolay',
            duration: '8 dk',
            pdfUrl: '/summaries/5sinif-fen-gunes-sistemi.pdf',
            tags: ['5. sınıf', 'Fen', 'Uzay'],
            updatedAt: '2024-09-20'
          },
          {
            id: '5-madde',
            title: 'Madde ve Değişim',
            description: 'Hal değişimleri, ısı alışverişi ve deney taslakları ile hızlı tekrar.',
            focusPoints: ['Günlük hayat örnekleri', 'Laboratuvar güvenliği', 'Şema ile özet'],
            difficulty: 'Orta',
            duration: '10 dk',
            pdfUrl: '/summaries/5sinif-fen-madde-degisim.pdf',
            tags: ['5. sınıf', 'Fen', 'Madde'],
            updatedAt: '2024-11-02'
          }
        ]
      }
    ]
  },
  {
    grade: 6,
    label: '6. Sınıf',
    info: '6. sınıf öğrencileri için beceri temelli konu özetleri',
    subjects: [
      {
        id: '6-matematik',
        name: 'Matematik',
        description: 'Oran-orantı ve geometrik düşünmeye odaklı özetler',
        topics: [
          {
            id: '6-oran',
            title: 'Oran Orantı',
            description: 'Oran hesaplama, birim oran ve orantı kurma teknikleri.',
            focusPoints: [
              'Grafik üzerinden oran okuma',
              'Tablo ile orantı tamamlama',
              'Problem yazma alıştırmaları'
            ],
            difficulty: 'Orta',
            duration: '12 dk',
            pdfUrl: '/summaries/6sinif-matematik-oran.pdf',
            tags: ['6. sınıf', 'Matematik', 'Oran'],
            updatedAt: '2024-09-12'
          },
          {
            id: '6-cokgen',
            title: 'Çokgenler',
            description: 'Açı toplamları, düzgün çokgenlerin özellikleri ve çevre hesaplamaları.',
            focusPoints: [
              'İç ve dış açı bağlantısı',
              'Düzgün çokgen akılda tutma',
              'Çevre ölçme'
            ],
            difficulty: 'Kolay',
            duration: '9 dk',
            pdfUrl: '/summaries/6sinif-matematik-cokgenler.pdf',
            tags: ['6. sınıf', 'Matematik', 'Geometri'],
            updatedAt: '2024-10-01'
          }
        ]
      },
      {
        id: '6-sosyal',
        name: 'Sosyal Bilgiler',
        description: 'Tarihsel olayları ve Türkiye’nin konumunu yorumlama pratikleri',
        topics: [
          {
            id: '6-orta-cag',
            title: 'Türk Tarihinde Yolculuk',
            description: 'Anadolu’ya göçler, Selçuklu ve beylikler dönemini haritalarla inceleme.',
            focusPoints: ['Kronoloji çizelgesi', 'Özet harita notları', 'Kavram kartları'],
            difficulty: 'Kolay',
            duration: '7 dk',
            pdfUrl: '/summaries/6sinif-sosyal-tarih.pdf',
            tags: ['6. sınıf', 'Sosyal', 'Tarih'],
            updatedAt: '2024-09-05'
          },
          {
            id: '6-konum',
            title: 'Türkiye’nin Konumu',
            description: 'Paralel-meridyen ilişkisi, iklim ve ekonomik sonuçlar.',
            focusPoints: ['Harita üzerinde uygulama', 'İklim tablosu', 'Ekonomik etkiler notu'],
            difficulty: 'Orta',
            duration: '11 dk',
            pdfUrl: '/summaries/6sinif-sosyal-konum.pdf',
            tags: ['6. sınıf', 'Sosyal', 'Coğrafya'],
            updatedAt: '2024-10-18'
          }
        ]
      }
    ]
  },
  {
    grade: 7,
    label: '7. Sınıf',
    info: 'TEOG öncesi temel kavramları sağlamlaştıran kısa özetler',
    subjects: [
      {
        id: '7-matematik',
        name: 'Matematik',
        description: 'Cebirsel ifadeler ve geometri bağlantılarını güçlendiren içerikler',
        topics: [
          {
            id: '7-dortgen',
            title: 'Dörtgenler ve Çokgenler',
            description: 'Paralelkenar, eşkenar dörtgen ve yamukta alan ilişkileri.',
            focusPoints: ['Alan formülleri', 'Örüntü ile ispat', 'Örnek soru çözümleri'],
            difficulty: 'Orta',
            duration: '13 dk',
            pdfUrl: '/summaries/7sinif-matematik-dortgenler.pdf',
            tags: ['7. sınıf', 'Matematik', 'Geometri'],
            updatedAt: '2024-10-22'
          },
          {
            id: '7-cebir',
            title: 'Cebirsel İfadeler',
            description: 'Çarpanlara ayırma, özdeşlikler ve denklemlerde hızlı çözümler.',
            focusPoints: ['Model ile özdeşlik', 'Çarpan ağacı', 'Sık hata listesi'],
            difficulty: 'Zor',
            duration: '15 dk',
            pdfUrl: '/summaries/7sinif-matematik-cebir.pdf',
            tags: ['7. sınıf', 'Matematik', 'Cebir'],
            updatedAt: '2024-11-03'
          }
        ]
      },
      {
        id: '7-fen',
        name: 'Fen Bilimleri',
        description: 'Hücreden enerji dönüşümlerine uzanan kapsamlı tekrar PDF’leri',
        topics: [
          {
            id: '7-hucre',
            title: 'Hücre ve Bölünmeler',
            description: 'Mitoz ve mayoz karşılaştırmaları, organellerin görevleri.',
            focusPoints: ['Karşılaştırma tabloları', 'Soru kökü analizleri', 'Kavram haritası'],
            difficulty: 'Orta',
            duration: '12 dk',
            pdfUrl: '/summaries/7sinif-fen-hucre.pdf',
            tags: ['7. sınıf', 'Fen', 'Biyoloji'],
            updatedAt: '2024-09-25'
          },
          {
            id: '7-enerji',
            title: 'Enerji Dönüşümleri',
            description: 'Isı, iş ve enerji türleri arasındaki ilişkilere dair kısa notlar.',
            focusPoints: ['Grafik yorumlama', 'Hata avcısı etkinliği', 'Günlük hayat örnekleri'],
            difficulty: 'Kolay',
            duration: '9 dk',
            pdfUrl: '/summaries/7sinif-fen-enerji.pdf',
            tags: ['7. sınıf', 'Fen', 'Fizik'],
            updatedAt: '2024-10-10'
          }
        ]
      }
    ]
  },
  {
    grade: 8,
    label: '8. Sınıf',
    info: 'LGS hazırlığı için en kritik konu başlıkları tek dosyada',
    subjects: [
      {
        id: '8-matematik',
        name: 'Matematik',
        description: 'LGS’de en çok soru gelen konu başlıklarına odaklanan özetler',
        topics: [
          {
            id: '8-olasilik',
            title: 'Olasılık ve İstatistik',
            description: 'Şans grafikleri, gerçek hayat senaryoları ve hızlı soru yolları.',
            focusPoints: ['Ağaç diyagramı', 'Sıklık tablosu', 'Mantık soruları'],
            difficulty: 'Zor',
            duration: '14 dk',
            pdfUrl: '/summaries/8sinif-matematik-olasilik.pdf',
            tags: ['8. sınıf', 'Matematik', 'Olasılık'],
            updatedAt: '2024-11-05'
          },
          {
            id: '8-fonksiyon',
            title: 'Fonksiyonel İlişkiler',
            description: 'Bağıntı, fonksiyon tablosu ve grafik yorumlamaları.',
            focusPoints: ['Fonksiyon şemaları', 'Grafik yorumları', 'Hızlı test'],
            difficulty: 'Orta',
            duration: '11 dk',
            pdfUrl: '/summaries/8sinif-matematik-fonksiyon.pdf',
            tags: ['8. sınıf', 'Matematik', 'Fonksiyon'],
            updatedAt: '2024-10-08'
          }
        ]
      },
      {
        id: '8-turkce',
        name: 'Türkçe',
        description: 'Paragraf, anlam ve dil bilgisi ağırlıklı kısa özetler',
        topics: [
          {
            id: '8-paragraf',
            title: 'Paragraf Yorumlama',
            description:
              'Ana düşünce bulma, soru kökü taktikleri ve paragraf eşleştirme çalışmaları.',
            focusPoints: [
              'Soru kökü sözlüğü',
              'Zaman kazandıran okuma tekniği',
              '5 adımda paragraf çözümü'
            ],
            difficulty: 'Orta',
            duration: '10 dk',
            pdfUrl: '/summaries/8sinif-turkce-paragraf.pdf',
            tags: ['8. sınıf', 'Türkçe', 'Paragraf'],
            updatedAt: '2024-09-18'
          },
          {
            id: '8-cumle',
            title: 'Cümlede Anlam',
            description: 'Yapı, anlam kayması ve bağlaç kullanımının hızlı tekrarı.',
            focusPoints: ['Bağlaç listeleri', 'Olumsuz kökler', 'Mini deneme soruları'],
            difficulty: 'Kolay',
            duration: '8 dk',
            pdfUrl: '/summaries/8sinif-turkce-cumle-anlam.pdf',
            tags: ['8. sınıf', 'Türkçe', 'Anlam'],
            updatedAt: '2024-10-02'
          }
        ]
      }
    ]
  },
  {
    grade: 9,
    label: '9. Sınıf',
    info: 'Liseye başlangıç konularını sağlamlaştıran özetler',
    subjects: [
      {
        id: '9-matematik',
        name: 'Matematik',
        description: 'Ders geçişlerinde temel analiz becerilerini öne çıkaran konular',
        topics: [
          {
            id: '9-koklu',
            title: 'Köklü Sayılar',
            description: 'Tanım, sadeleştirme ve denklem çözümlerine giriş.',
            focusPoints: ['Üslü-köklü bağlantısı', 'Kural kartları', 'Hızlı sadeleştirme'],
            difficulty: 'Orta',
            duration: '12 dk',
            pdfUrl: '/summaries/9sinif-matematik-koklu-sayilar.pdf',
            tags: ['9. sınıf', 'Matematik', 'Sayılar'],
            updatedAt: '2024-11-11'
          },
          {
            id: '9-kumeler',
            title: 'Kümeler',
            description: 'Venn diyagramları, işlemler ve soru tipleri.',
            focusPoints: ['Venn diyagramı çizimi', 'Sık hata analizi', 'Mini test'],
            difficulty: 'Kolay',
            duration: '9 dk',
            pdfUrl: '/summaries/9sinif-matematik-kumeler.pdf',
            tags: ['9. sınıf', 'Matematik', 'Kümeler'],
            updatedAt: '2024-09-29'
          }
        ]
      },
      {
        id: '9-fizik',
        name: 'Fizik',
        description: 'Hareket ve kuvvet başlıklarını karşılaştırmalı öğrenme yaklaşımıyla sunar',
        topics: [
          {
            id: '9-hareket',
            title: 'Hareket ve Vektörler',
            description:
              'Temel hareket grafikleri, hız-zaman yorumu ve vektörel hesaplamalar.',
            focusPoints: ['Grafik okuma', 'İşaretli sayı pratiği', 'Vektör şemaları'],
            difficulty: 'Orta',
            duration: '11 dk',
            pdfUrl: '/summaries/9sinif-fizik-hareket.pdf',
            tags: ['9. sınıf', 'Fizik', 'Hareket'],
            updatedAt: '2024-10-15'
          },
          {
            id: '9-kuvvet',
            title: 'Kuvvet ve Denge',
            description: 'Bileşke kuvvet hesaplamaları, moment ve denge soruları.',
            focusPoints: ['Serbest cisim diyagramı', 'Moment tablosu', 'Örnek çözümler'],
            difficulty: 'Zor',
            duration: '15 dk',
            pdfUrl: '/summaries/9sinif-fizik-kuvvet.pdf',
            tags: ['9. sınıf', 'Fizik', 'Kuvvet'],
            updatedAt: '2024-11-07'
          }
        ]
      }
    ]
  },
  {
    grade: 10,
    label: '10. Sınıf',
    info: 'Ara sınıf öğrencileri için TYT temelini güçlendiren özetler',
    subjects: [
      {
        id: '10-kimya',
        name: 'Kimya',
        description: 'Mol kavramından asit-baz dengesine kadar temel içerikler',
        topics: [
          {
            id: '10-mol',
            title: 'Mol Kavramı',
            description: 'Avogadro sayısı, derişim ve mol hesaplamalarına yönelik kısa notlar.',
            focusPoints: ['Birim dönüşüm tablosu', 'Örnek problem seti', 'Hızlı ipuçları'],
            difficulty: 'Orta',
            duration: '13 dk',
            pdfUrl: '/summaries/10sinif-kimya-mol.pdf',
            tags: ['10. sınıf', 'Kimya', 'Mol'],
            updatedAt: '2024-09-30'
          },
          {
            id: '10-gazlar',
            title: 'Gazlar',
            description: 'Gaz yasaları, grafik yorumlamaları ve karışık gaz soruları.',
            focusPoints: [
              'Boyle-Charles karşılaştırması',
              'Grafik ipuçları',
              'Çıkmış soru analizi'
            ],
            difficulty: 'Zor',
            duration: '14 dk',
            pdfUrl: '/summaries/10sinif-kimya-gazlar.pdf',
            tags: ['10. sınıf', 'Kimya', 'Gazlar'],
            updatedAt: '2024-10-28'
          }
        ]
      },
      {
        id: '10-edebiyat',
        name: 'Türk Dili ve Edebiyatı',
        description: 'Hikâye, şiir ve tiyatro türlerinin ayırt edici özelliklerini özetler',
        topics: [
          {
            id: '10-hikaye',
            title: 'Hikâye ve Roman',
            description:
              'Anlatım teknikleri, kahraman analizi ve yapı unsurlarının kıyaslaması.',
            focusPoints: ['Anlatıcı türleri', 'Olay örgüsü şeması', 'Metin inceleme formu'],
            difficulty: 'Kolay',
            duration: '8 dk',
            pdfUrl: '/summaries/10sinif-edebiyat-hikaye.pdf',
            tags: ['10. sınıf', 'Edebiyat', 'Hikaye'],
            updatedAt: '2024-09-18'
          },
          {
            id: '10-siir',
            title: 'Şiir Bilgisi',
            description: 'Nazım biçimleri, ölçü ve kafiye örgülerini tabloyla özetler.',
            focusPoints: ['Ölçü karşılaştırmaları', 'Uyak şemaları', 'Örnek analiz'],
            difficulty: 'Orta',
            duration: '10 dk',
            pdfUrl: '/summaries/10sinif-edebiyat-siir.pdf',
            tags: ['10. sınıf', 'Edebiyat', 'Şiir'],
            updatedAt: '2024-10-10'
          }
        ]
      }
    ]
  },
  {
    grade: 11,
    label: '11. Sınıf',
    info: 'AYT ve okul yazılılarına hazırlık için ileri seviye özetler',
    subjects: [
      {
        id: '11-geometri',
        name: 'Geometri',
        description: 'Trigonometri ve çember konularını sınava hazır hale getiren özetler',
        topics: [
          {
            id: '11-trigonometri',
            title: 'Trigonometri Özeti',
            description:
              'Açılar, trigonometrik oranlar ve denklem çözümlerini hızlandıran tablo.',
            focusPoints: ['Birim çember', 'Formül hafıza kartı', 'İleri soru örnekleri'],
            difficulty: 'Zor',
            duration: '16 dk',
            pdfUrl: '/summaries/11sinif-geometri-trigonometri.pdf',
            tags: ['11. sınıf', 'Geometri', 'Trigonometri'],
            updatedAt: '2024-11-09'
          },
          {
            id: '11-cember',
            title: 'Çemberde Açılar',
            description: 'Teğet, kiriş ve açı ilişkilerini özetleyen örnekli rehber.',
            focusPoints: ['Sözlü ipuçları', 'Şekilli anlatım', 'ÖSYM tarzı sorular'],
            difficulty: 'Orta',
            duration: '12 dk',
            pdfUrl: '/summaries/11sinif-geometri-cember.pdf',
            tags: ['11. sınıf', 'Geometri', 'Çember'],
            updatedAt: '2024-10-17'
          }
        ]
      },
      {
        id: '11-biyoloji',
        name: 'Biyoloji',
        description: 'Sinir sistemi ve ekoloji odaklı, görsel ağırlıklı kısa notlar',
        topics: [
          {
            id: '11-sinir-sistemi',
            title: 'Sinir Sistemi',
            description: 'Nöron yapısı, sinaps ve hormon ilişkilerini tek sayfada toplar.',
            focusPoints: ['Şema ile öğren', 'Tablo karşılaştırması', 'Çıkmış soru taraması'],
            difficulty: 'Orta',
            duration: '11 dk',
            pdfUrl: '/summaries/11sinif-biyoloji-sinir-sistemi.pdf',
            tags: ['11. sınıf', 'Biyoloji', 'Sinir Sistemi'],
            updatedAt: '2024-09-21'
          },
          {
            id: '11-ekosistem',
            title: 'Ekosistem Ekolojisi',
            description: 'Enerji piramitleri, madde döngüleri ve çevre sorunlarına yönelik özet.',
            focusPoints: ['Piramid çizimleri', 'Akış diyagramı', 'Güncel çevre örnekleri'],
            difficulty: 'Kolay',
            duration: '9 dk',
            pdfUrl: '/summaries/11sinif-biyoloji-ekosistem.pdf',
            tags: ['11. sınıf', 'Biyoloji', 'Ekoloji'],
            updatedAt: '2024-10-05'
          }
        ]
      }
    ]
  },
  {
    grade: 12,
    label: '12. Sınıf',
    info: 'YKS (TYT + AYT) kampı için hızlı tekrar PDF’leri',
    subjects: [
      {
        id: '12-tyt-matematik',
        name: 'TYT Matematik',
        description: 'TYT’de en çok soru gelen sayı ve problem konuları',
        topics: [
          {
            id: '12-problem',
            title: 'Problemler Sprint',
            description:
              'Oran-orantı, işçi-havuz ve hız problemlerini tek tablo üzerinde çözümler.',
            focusPoints: [
              'Soru tiplerine göre çözüm stratejileri',
              'Karma problemler için tablo yaklaşımı',
              'Sınavda zaman kazandıran kısayollar'
            ],
            difficulty: 'Orta',
            duration: '15 dk',
            pdfUrl: '/summaries/tyt-problemler.pdf',
            tags: ['12. sınıf', 'TYT', 'Problem'],
            updatedAt: '2024-10-01'
          },
          {
            id: '12-sayilar',
            title: 'Temel Sayılar',
            description: 'Bölünebilme, Ebob-Ekok ve sayı basamaklarında pratik yöntemler.',
            focusPoints: ['Örüntü tablosu', 'Çıkmış soru analizi', 'Bölünebilme ipuçları'],
            difficulty: 'Kolay',
            duration: '12 dk',
            pdfUrl: '/summaries/tyt-sayilar.pdf',
            tags: ['12. sınıf', 'TYT', 'Sayılar'],
            updatedAt: '2024-09-15'
          }
        ]
      },
      {
        id: '12-ayt-edebiyat',
        name: 'AYT Edebiyat',
        description: 'Tanzimat’tan Cumhuriyet’e tüm dönemleri kapsayan özetler',
        topics: [
          {
            id: '12-tanzimat',
            title: 'Tanzimat ve Servet-i Fünun',
            description: 'Sanatçılar, eserler ve akımlar için tek bakışta hatırlatma.',
            focusPoints: ['Tablo halinde sanatçılar', 'Akım eşleştirmesi', 'Çıkmış soru örnekleri'],
            difficulty: 'Orta',
            duration: '13 dk',
            pdfUrl: '/summaries/ayt-edebiyat-tanzimat.pdf',
            tags: ['12. sınıf', 'AYT', 'Edebiyat'],
            updatedAt: '2024-10-25'
          },
          {
            id: '12-cumhuriyet',
            title: 'Cumhuriyet Dönemi',
            description: 'Temsilciler, türler ve kronoloji listesi ile hızlı tekrar.',
            focusPoints: ['Zaman çizelgesi', 'Türlere göre eser listesi', 'Hızlı test'],
            difficulty: 'Zor',
            duration: '14 dk',
            pdfUrl: '/summaries/ayt-edebiyat-cumhuriyet.pdf',
            tags: ['12. sınıf', 'AYT', 'Cumhuriyet'],
            updatedAt: '2024-11-12'
          }
        ]
      }
    ]
  }
];

export default gradeTopicSummaries;
