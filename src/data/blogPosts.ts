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
    excerpt: 'Pomodoro tekniği, çalışma verimliliğinizi artırmanın en etkili yollarından biri. 25 dakikalık odaklanma periyotları ile nasıl daha fazla şey başarabileceğinizi öğrenin.',
    content: `
# Pomodoro Tekniği Nedir?

Pomodoro tekniği, 1980'lerde Francesco Cirillo tarafından geliştirilen bir zaman yönetimi yöntemidir. Temelde şu şekilde çalışır:

## Temel Kurallar

1. **25 dakika odaklanarak çalış** - Tek bir göreve konsantre ol
2. **5 dakika mola ver** - Kafanı dinlendir, ayağa kalk
3. **4 pomodoro sonrası 15-30 dakika uzun mola** - Beynini yenile

## Neden Bu Kadar Etkili?

### 1. Prokrastinasyonu Yener
25 dakika çok kısa bir süre. "Sadece 1 pomodoro" demek, "3 saat çalışacağım" demekten çok daha kolay.

### 2. Odaklanmayı Artırır
Kısa süreler için odaklanmak, uzun sürelere göre çok daha kolay. Beyin 25 dakika boyunca maksimum performansta çalışabilir.

### 3. Düzenli Molalar Performansı Artırır
Araştırmalar gösteriyor ki düzenli molalar, uzun vadede daha yüksek verimlilik sağlıyor.

## Nasıl Başlanır?

1. **Görev listesi hazırla** - Bugün ne yapacağını belirle
2. **Timer kur** - 25 dakika
3. **Çalışmaya başla** - Tek göreve odaklan
4. **Mola ver** - Timer bitince mutlaka mola ver
5. **Takip et** - Kaç pomodoro tamamladığını kaydet

## BaşarıYolu'nda Pomodoro

Platformumuzda entegre pomodoro timer'ı ile:
- Otomatik çalışma seansı takibi
- Grup çalışma seansları
- İstatistikler ve raporlar
- Hedef belirleme

## Sonuç

Pomodoro tekniği basit ama son derece etkili. Özellikle YKS ve LGS gibi uzun soluklu sınavlara hazırlanırken bu tekniği kullanmak, çalışma disiplininizi ve verimliliğinizi katlanarak artırabilir.

**Hemen dene!** İlk 4 pomodoro'nu tamamla ve farkı kendin gör.
`,
    author: 'Dr. Ayşe Yılmaz',
    authorRole: 'Eğitim Danışmanı',
    category: 'calisma-teknikleri',
    tags: ['pomodoro', 'verimlilik', 'zaman yönetimi', 'çalışma teknikleri'],
    readTime: 5,
    publishedAt: '2025-01-10',
    coverImage: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800',
    featured: true
  },
  {
    id: '2',
    slug: 'yks-son-3-ay-stratejisi',
    title: 'YKS Son 3 Ay Stratejisi: Puan Artırmak İçin Yapmanız Gerekenler',
    excerpt: 'YKS\'ye son 3 ay kaldığında panik yerine doğru strateji ile puanınızı 50-100 puan artırmak mümkün. İşte adım adım rehber.',
    content: `
# YKS Son 3 Ay: Kritik Dönem

YKS'ye 3 ay kaldığında artık maraton bitmeye yakındır. Bu son 3 ay, doğru stratejilerle puanınızı ciddi oranda artırabileceğiniz kritik bir dönemdir.

## 1. Mevcut Durumu Analiz Et

### İlk Adım: Son 3 Deneme Ortalaması
- Hangi konularda stabil yanlış yapıyorsun?
- Hangi derslerde dalgalanma var?
- Zaman yönetimi problemin var mı?

## 2. Son 90 Günlük Plan

### Ay 1: Konu Tamamlama (Gün 1-30)
- Eksik konuları listele
- Günde 2 konu hedefle
- Video + soru çöz formatı

### Ay 2: Deneme ve Pekiştirme (Gün 31-60)
- Haftada 3 tam deneme
- Her deneme sonrası analiz
- Zayıf konulara yoğunlaş

### Ay 3: Gerçek Sınav Temposu (Gün 61-90)
- Haftada 4 deneme
- Sınav saatinde çöz
- Stres yönetimi çalış

## 3. Puan Artırma Taktikleri

### Net Artırma Öncelikleri
1. **Kolay konulardaki hatalar** - İlk düzelt
2. **Orta zorluk konular** - En çok net buradan
3. **Zor konular** - Zamana göre bırak

### 50 Puan Artırmak İçin
- TYT'de 5-7 net artır
- AYT'de 8-10 net artır
- Hız kat, doğruluk azalmasın

## 4. Yapılmaması Gerekenler

❌ Yeni kaynak almak  
❌ Çalışma düzenini değiştirmek  
❌ Sosyal medyada vakit harcamak  
❌ Panik yapmak  

✅ Elindeki kaynakları bitir  
✅ Düzenini koru  
✅ Odaklan  
✅ Kendine güven  

## 5. Mentalite

Son 3 ay, fiziksel olduğu kadar mental bir maraton. Her gün biraz ilerlediğini hatırla. BaşarıYolu platformu ile:
- İlerlemeyi takip et
- AI destekli çalışma planı
- Motivasyon için rozet kazan

## Sonuç

Son 3 ay, doğru strateji ile mucizeler yaratabilirsin. Panik değil, plan! Odaklan, çalış, başar.

**Başarılar dileriz!** 🎯
`,
    author: 'Mehmet Kaya',
    authorRole: 'YKS Koordinatörü',
    category: 'sinav-stratejileri',
    tags: ['YKS', 'sınav stratejisi', 'son 3 ay', 'net artırma'],
    readTime: 7,
    publishedAt: '2025-01-08',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
    featured: true
  },
  {
    id: '3',
    slug: 'verimli-not-alma-teknikleri',
    title: 'Cornell Yöntemi: Bilimsel Olarak Kanıtlanmış Not Alma Tekniği',
    excerpt: 'Not almak sadece yazmak değildir. Cornell yöntemi ile nasıl aktif öğrenme yaparak, sınavlarda başarılı olabileceğinizi öğrenin.',
    content: `
# Cornell Not Alma Yöntemi

Cornell Üniversitesi'nde geliştirilen bu yöntem, 70 yıldır milyonlarca öğrenci tarafından kullanılıyor.

## Yöntem Nasıl Çalışır?

Sayfanı 3 bölüme ayır:

### 1. Not Alanı (Sağ, Geniş Bölüm)
Ders anlatılırken buraya not al:
- Ana fikirler
- Önemli detaylar
- Örnekler
- Formüller

### 2. İpucu Alanı (Sol, Dar Bölüm)
Ders bitince buraya yaz:
- Anahtar kelimeler
- Sorular
- Kavramlar

### 3. Özet Alanı (Alt, Yatay)
Sayfanın sonunda:
- 2-3 cümlelik özet
- Ana mesaj ne?

## Neden Bu Kadar Etkili?

### Aktif Öğrenme
Sadece dinleyip yazmıyorsun, düşünüyorsun:
- İpuçları oluştururken → Analiz
- Özet yazarken → Sentez
- Tekrar ederken → Pekiştirme

### Bilimsel Kanıtlar
Araştırmalar gösteriyor:
- %50 daha iyi hatırlama
- Daha az tekrar ihtiyacı
- Sınav öncesi hızlı tarama

## Adım Adım Uygulama

1. **Hazırlık** - Sayfa düzenini oluştur
2. **Ders Anında** - Not alanını doldur
3. **Ders Sonrası (24 saat içinde)** - İpuçlarını ekle
4. **Haftalık Tekrar** - Özetleri gözden geçir

## Digital Cornell

BaşarıYolu'nda Cornell yöntemi:
- Hazır şablonlar
- Markdown editor
- Etiketleme sistemi
- Hızlı arama

## Pratik İpuçları

- 📝 Kısaltmalar kullan (örn: öğrenci → öğr.)
- 🎨 Renkli kalemler - vurgu için
- 📊 Şemalar çiz - görsel hafıza
- ⏱️ 24 saat kuralı - Mutlaka ipuçlarını ekle

## Sonuç

Cornell yöntemi, pasif not almayı aktif öğrenmeye dönüştürür. Bir kere alışkanlık haline getirdiğinde, hem ders anında hem sınav öncesinde büyük avantaj sağlar.

**Bugün dene!** Bir derste uygula, farkı gör.
`,
    author: 'Zeynep Demir',
    authorRole: 'Eğitim Psikoloğu',
    category: 'calisma-teknikleri',
    tags: ['not alma', 'cornell', 'çalışma yöntemi', 'verimlilik'],
    readTime: 6,
    publishedAt: '2025-01-05',
    coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800',
    featured: false
  }
];

export const categories = [
  { id: 'calisma-teknikleri', name: 'Çalışma Teknikleri', icon: '📚' },
  { id: 'sinav-stratejileri', name: 'Sınav Stratejileri', icon: '🎯' },
  { id: 'motivasyon', name: 'Motivasyon', icon: '💪' },
  { id: 'zaman-yonetimi', name: 'Zaman Yönetimi', icon: '⏰' }
];