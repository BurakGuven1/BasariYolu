export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  authorRole: string;
  category: 'calisma-teknikleri' | 'sinav-stratejileri' | 'motivasyon' | 'zaman-yonetimi';
  tags: string[];
  readTime: number;
  publishedAt: string;
  updatedAt?: string;
  coverImage: string;
  featured: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'pomodoro-teknigi-ile-verimli-calisma',
    title: 'Pomodoro Tekniği ile Verimli Çalışma: 25 Dakikada Başarı',
    excerpt:
      'Pomodoro tekniği ile odaklanma süreni artır, molalarını planla ve sadece 25 dakikada verimini yüzde 40’a kadar yükselt.',
    content: `
# Pomodoro Tekniği Nedir?

Pomodoro tekniği, zihni kısa ve güçlü odak bloklarına ayırarak maksimum verim almanı sağlayan bilimsel bir yöntemdir. Her blok 25 dakikalık **tam odaklanma** ve ardından gelen 5 dakikalık **mini moladan** oluşur.

## 1. Neden İşe Yarıyor?

- **Odak süresi net:** 25 dakika boyunca tek bir hedefe yönelirsin.
- **Mola garantisi:** Beynin dinlenir ve bir sonraki bloğa hazır hale gelir.
- **Takip edilebilirlik:** Kaç pomodoro tamamladığını ölçersin, günlük hedefler belirleyebilirsin.

## 2. Nasıl Başlanır?

1. Günlük hedefini belirle (örneğin 8 pomodoro).
2. Çalışma konularını 25 dakikalık setlere böl.
3. Timer’ı başlat ve bildirimleri kapat.
4. 5 dakikalık molalarda hareket et veya su iç.
5. 4 pomodoro sonunda 15-20 dakikalık uzun mola ver.

## 3. BaşarıYolu’nda Pomodoro

BaşarıYolu öğrenci panelinde:

- Hazır pomodoro şablonları
- Grup çalışma odaları
- Haftalık raporlar ve trend grafikleri
- Hedef takip rozetleri bulunur.

> ✅ *7 günlük ücretsiz erişimle pomodoro panelimizi dene, ilk haftada kaç konu bitirebildiğini gör.*

## 4. İleri Seviye İpuçları

- Ders türüne göre pomodoro uzunluğunu 30 dakikaya kadar çıkar.
- Molalarda telefonla vakit geçirme, gözlerini dinlendir.
- Tamamladığın her pomodoroyu not al; motivasyonun artar.

### Önerilen Kaynaklar

- [BaşarıYolu Pomodoro Planlayıcısı](https://basariyolum.com)
- *Deep Work* — Cal Newport
- *Time Management for Students* — Stanford Learning Lab
`,
    author: 'Dr. Vedat Kol',
    authorRole: 'Eğitim Danışmanı',
    category: 'calisma-teknikleri',
    tags: ['pomodoro tekniği', 'zaman yönetimi', 'çalışma disiplini', 'odaklanma'],
    readTime: 5,
    publishedAt: '2025-01-10',
    updatedAt: '2025-02-15',
    coverImage: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800&auto=format&fit=crop',
    featured: true,
  },
  {
    id: '2',
    slug: 'yks-son-3-ay-stratejisi',
    title: 'YKS Son 3 Ay Stratejisi: Netlerini 50+ Artırmanın Formülü',
    excerpt:
      'YKS’ye son 90 gün kala panik yerine plan zamanı. Deneme analizinden branş bazlı hedeflere kadar net artışı sağlayan stratejileri keşfet.',
    content: `
# Son 90 Gün: YKS Maratonunda Altın Dönem

Üç ay kala alınan her karar doğrudan netlerine yansır. Bu dönemi **30 günlük sprintler** halinde planlamak en sağlıklı yöntemdir.

## 1. Mevcut Durumu Analiz Et

- Son 3 denemenin net ortalamasını çıkar.
- Her derste hangi soru tiplerinde hata yaptığını işaretle.
- Zaman yönetimi problemi yaşıyorsan kronometreli denemeler çöz.

## 2. 90 Günlük Plan

### Gün 1-30: Konu Kapatma
- Eksik konuların listesini çıkar.
- Günlük 2 konu hedefi koy ve soru çözerek bitir.
- Haftada 1 genel deneme yap.

### Gün 31-60: Deneme ve Pekiştirme
- Haftada 3 TYT + 2 AYT denemesi çöz.
- Her deneme sonrası 45 dakikalık analiz yap.
- Hataları konu defterine işle.

### Gün 61-90: Sınav Simülasyonu
- Sınav saatlerinde deneme çöz.
- Optik form kullan ve süreyi kısıtla.
- Mental hazırlık için nefes egzersizleri ekle.

## 3. Net Artıran Mikro Alışkanlıklar

- **TYT Türkçe:** Her gün 20 paragraf + 10 dil bilgisi.
- **AYT Matematik:** Özellikle integral ve limit için soru sonrası kısa özet yaz.
- **Deneme Analizi:** Yanlış sorunun çözümünü kendi cümlelerinle sesli anlat.

## 4. BaşarıYolu Ne Sağlar?

- Yapay zekâ destekli net takip paneli
- Haftalık koç aramaları
- Eksik konuya özel mikro ders listeleri
- Motivasyon için rozet ve lig sistemi

> 🎯 *Netlerini 6 haftada 18 artıran öğrencilerimizin planına erişmek için demo talep et.*

## 5. Sık Yapılan Hatalar

- Kaynak değiştirmek
- Uykudan ödün vermek
- Günlük planı esnetmek
- Deneme analizini atlamak

Bu hataları en aza indirdiğinde netlerin stabil biçimde yükselir. Unutma, son 90 gün sprint değil; disiplinli bir tempodur.
`,
    author: 'Mehmet Kaya',
    authorRole: 'YKS Koordinatörü',
    category: 'sinav-stratejileri',
    tags: ['YKS stratejisi', 'net artırma', 'deneme analizi', 'sınav planı'],
    readTime: 5,
    publishedAt: '2025-01-08',
    updatedAt: '2025-02-02',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop',
    featured: true,
  },
  {
    id: '3',
    slug: 'verimli-not-alma-teknikleri',
    title: 'Cornell Yöntemi: Bilimsel Olarak Kanıtlanmış Not Alma Tekniği',
    excerpt:
      'Cornell not alma tekniği ile ders notlarını sadeleştir, tekrar süreni kısalt ve kalıcı öğrenme sağla. Şablon ve uygulama örnekleri burada.',
    content: `
# Cornell Not Alma Yöntemi Nedir?

Cornell Üniversitesi'nde geliştirilen bu yöntem, ders notlarını üç bölüme ayırarak **kalıcı öğrenmeyi** garantiler.

## 1. Sayfa Düzeni

1. **Not Alanı (Sağ bölüm):** Ders anlatılırken ana fikirleri, formülleri ve örnekleri yaz.
2. **İpucu Alanı (Sol bölüm):** Ders bittikten sonra anahtar kelimeleri ve soruları ekle.
3. **Özet Alanı (Alt bölüm):** 3-4 cümleyle dersin ana mesajını yaz.

## 2. Neden Etkili?

- Aktif öğrenmeyi teşvik eder.
- Tekrar süresini %30 kısaltır.
- Deneme öncesi hızlı tarama yapmanı sağlar.

## 3. Uygulama Planı

1. Ders öncesi sayfanı böl.
2. Sadece önemli kavramları not alanına yaz.
3. 24 saat içinde ipucu alanını doldur.
4. Haftalık tekrar günü belirle.

## 4. Dijital Cornell ile Tanış

BaşarıYolu platformunda:

- Markdown destekli Cornell şablonları
- Her derse özel renk etiketleri
- Arama ve filtreleme özellikleri
- PDF olarak dışa aktarma imkanı

> 💡 *Cornell şablonunu indir, bu hafta çözdüğün 3 denemenin analizini bu formatla yap.*

## 5. İpuçları

- Kısaltmalar kullan, gereksiz kelimeleri at.
- Görsel şemalar çizerek hafızayı güçlendir.
- Haftanın sonunda özet alanlarını yüksek sesle tekrar et.
`,
    author: 'Zeynep Demirev',
    authorRole: 'Eğitim Psikoloğu',
    category: 'calisma-teknikleri',
    tags: ['not alma', 'cornell tekniği', 'verimli çalışma', 'aktif öğrenme'],
    readTime: 6,
    publishedAt: '2025-01-05',
    updatedAt: '2025-01-28',
    coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop',
    featured: false,
  },
];

export const categories = [
  { id: 'calisma-teknikleri', name: 'Çalışma Teknikleri', icon: '🧠' },
  { id: 'sinav-stratejileri', name: 'Sınav Stratejileri', icon: '🎯' },
  { id: 'motivasyon', name: 'Motivasyon', icon: '⚡' },
  { id: 'zaman-yonetimi', name: 'Zaman Yönetimi', icon: '⏱️' },
];
