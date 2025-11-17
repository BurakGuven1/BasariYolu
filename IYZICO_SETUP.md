# İyzico Ödeme Entegrasyonu Kurulum Rehberi

## 📋 Genel Bakış

BaşarıYolu platformu şu anda **9 farklı paket** sunmaktadır:
- **3 Paket Tipi:** Temel, Gelişmiş, Profesyonel
- **3 Süre Seçeneği:** 1 Ay, 6 Ay, 12 Ay

Her paket-süre kombinasyonu için ayrı bir İyzico ödeme linki oluşturmanız gerekiyor.

## 💰 Paket Fiyatları

### Temel Paket
- **1 Ay:** 219.99₺
- **6 Ay:** 1,189₺ (aylık 198₺ - %10 indirim)
- **12 Ay:** 1,999.99₺ (aylık 167₺ - %25 indirim)

### Gelişmiş Paket
- **1 Ay:** 319.99₺
- **6 Ay:** 1,729₺ (aylık 288₺ - %10 indirim)
- **12 Ay:** 2,599.99₺ (aylık 217₺ - %25 indirim)

### Profesyonel Paket
- **1 Ay:** 499.99₺
- **6 Ay:** 2,699₺ (aylık 450₺ - %10 indirim)
- **12 Ay:** 3,499.99₺ (aylık 292₺ - %30 indirim)

## 🔗 İyzico Link Oluşturma Adımları

### 1. İyzico Paneline Giriş
- https://merchant.iyzipay.com/ adresine gidin
- Bireysel hesabınızla giriş yapın

### 2. Ödeme Linki Oluşturma
Her paket için aşağıdaki bilgilerle link oluşturun:

#### Temel Paket - 1 Ay
- **Ürün Adı:** BaşarıYolu Temel Paket (1 Ay)
- **Fiyat:** 219.99₺
- **Açıklama:** 1 aylık Temel paket - Deneme takibi, temel raporlar, 1 veli hesabı

#### Temel Paket - 6 Ay
- **Ürün Adı:** BaşarıYolu Temel Paket (6 Ay)
- **Fiyat:** 1,189₺
- **Açıklama:** 6 aylık Temel paket (%10 indirim) - Deneme takibi, temel raporlar, 1 veli hesabı

#### Temel Paket - 12 Ay
- **Ürün Adı:** BaşarıYolu Temel Paket (12 Ay)
- **Fiyat:** 1,999.99₺
- **Açıklama:** 12 aylık Temel paket (%25 indirim) - Deneme takibi, temel raporlar, 1 veli hesabı

#### Gelişmiş Paket - 1 Ay
- **Ürün Adı:** BaşarıYolu Gelişmiş Paket (1 Ay)
- **Fiyat:** 319.99₺
- **Açıklama:** 1 aylık Gelişmiş paket - AI analiz, otomatik öneriler, 2 veli hesabı

#### Gelişmiş Paket - 6 Ay
- **Ürün Adı:** BaşarıYolu Gelişmiş Paket (6 Ay)
- **Fiyat:** 1,729₺
- **Açıklama:** 6 aylık Gelişmiş paket (%10 indirim) - AI analiz, otomatik öneriler, 2 veli hesabı

#### Gelişmiş Paket - 12 Ay
- **Ürün Adı:** BaşarıYolu Gelişmiş Paket (12 Ay)
- **Fiyat:** 2,599.99₺
- **Açıklama:** 12 aylık Gelişmiş paket (%25 indirim) - AI analiz, otomatik öneriler, 2 veli hesabı

#### Profesyonel Paket - 1 Ay
- **Ürün Adı:** BaşarıYolu Profesyonel Paket (1 Ay)
- **Fiyat:** 499.99₺
- **Açıklama:** 1 aylık Profesyonel paket - AI kişiselleştirme, öncelikli destek, 3 veli hesabı

#### Profesyonel Paket - 6 Ay
- **Ürün Adı:** BaşarıYolu Profesyonel Paket (6 Ay)
- **Fiyat:** 2,699₺
- **Açıklama:** 6 aylık Profesyonel paket (%10 indirim) - AI kişiselleştirme, öncelikli destek, 3 veli hesabı

#### Profesyonel Paket - 12 Ay
- **Ürün Adı:** BaşarıYolu Profesyonel Paket (12 Ay)
- **Fiyat:** 3,499.99₺
- **Açıklama:** 12 aylık Profesyonel paket (%30 indirim) - AI kişiselleştirme, öncelikli destek, 3 veli hesabı

### 3. Linkleri Koda Ekleme

Oluşturduğunuz linkleri `src/data/packages.ts` dosyasındaki ilgili yerlere yapıştırın:

```typescript
paymentLinks: {
  monthly: 'https://payment.iyzico.com/xxxxxxxx',  // İyzico'dan aldığınız linki buraya
  sixMonth: 'https://payment.iyzico.com/xxxxxxxx', // İyzico'dan aldığınız linki buraya
  yearly: 'https://payment.iyzico.com/xxxxxxxx'    // İyzico'dan aldığınız linki buraya
}
```

## ⚠️ Önemli Notlar

### Yasal Uyarılar
1. **Vergi Mükellefi:** Satışa başlamadan önce vergi dairesine gidip gelir vergisi mükellefi olun
2. **Fatura Kesme:** E-fatura/e-arşiv fatura kesme zorunluluğu var
3. **Gelir Beyanı:** Tüm gelirleri yıl sonunda beyan etmeniz gerekiyor

### İyzico Komisyonları
- İyzico her işlemden %2.9 + 0.25₺ komisyon alır
- Net kazancınızı hesaplarken bunu göz önünde bulundurun

### Müşteri Deneyimi
- Ödeme tamamlandıktan sonra **manuel** olarak kullanıcıya erişim vermeniz gerekiyor
- Webhook entegrasyonu için backend geliştirme yapılması önerilir

## 🚀 Gelecek İyileştirmeler

### Otomatik Ödeme Sistemi (Önerilen)
1. **Supabase Edge Functions** kullanarak İyzico API entegrasyonu
2. **Webhook** ile otomatik hesap açma
3. **Otomatik fatura** kesme sistemi
4. **Abonelik yönetimi** (recurring payments)

Bu özellikler için backend geliştirme gerekiyor. Şu anlık manuel link sistemi ile başlayabilirsiniz.

## 📞 Destek

Herhangi bir sorunuz olursa:
- **E-posta:** destek@basariyolum.com
- **Platform:** [basariyolum.com](https://basariyolum.com)

---

**Son Güncelleme:** 2025-11-17
