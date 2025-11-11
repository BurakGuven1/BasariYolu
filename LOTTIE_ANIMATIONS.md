# 🎬 Lottie Animasyonları Kullanım Kılavuzu

## 📦 Kurulum

Lottie paketleri zaten yüklü:
```bash
✅ lottie-react
✅ @lottiefiles/dotlottie-react
```

## 🎯 Önerilen Animasyonlar

### 1. **Öğrenci (Student)** - reading-boy-9aYZuECxgE
**Şu an kullanılıyor:** FeaturesShowcase.tsx, line 452

**Alternatifler (LottieFiles'tan):**
- `student-studying` - Çalışan öğrenci
- `education` - Eğitim teması
- `book-reading` - Kitap okuyan animasyon

### 2. **Kurum (Institution)** - quiz-mode-7cFIw4FRuj
**Şu an kullanılıyor:** FeaturesShowcase.tsx, line 479

**Alternatifler:**
- `dashboard` - Dashboard animasyonları
- `analytics` - Analitik grafikler
- `management` - Yönetim paneli

### 3. **Öğretmen (Teacher)** - Henüz eklenmedi
**Öneriler:**
- `teacher-teaching`
- `classroom`
- `presentation`

### 4. **Veli (Parent)** - Henüz eklenmedi
**Öneriler:**
- `family`
- `parent-child`
- `monitoring`

---

## 🔧 Animasyon URL'lerini Güncelleme

### Yöntem 1: LottieFiles Embed URL (Kolay)

1. **LottieFiles'a git:**
   ```
   https://lottiefiles.com/free-animation/reading-boy-9aYZuECxgE
   https://lottiefiles.com/free-animation/quiz-mode-7cFIw4FRuj
   ```

2. **"Embed" butonuna tıkla**

3. **URL'yi kopyala:**
   ```
   https://lottie.host/embed/[ID]/[HASH].lottie
   ```

4. **FeaturesShowcase.tsx'te güncelle:**
   ```typescript
   lottieUrl="https://lottie.host/embed/..."
   ```

---

### Yöntem 2: JSON Dosyasını İndir (Offline)

1. **LottieFiles'tan JSON indir:**
   - "Download" → "Lottie JSON"
   - `reading-boy.json` olarak kaydet

2. **Proje klasörüne ekle:**
   ```
   src/animations/reading-boy.json
   src/animations/quiz-mode.json
   ```

3. **FeaturesShowcase.tsx'te import et:**
   ```typescript
   import readingBoy from '../animations/reading-boy.json';
   import quizMode from '../animations/quiz-mode.json';

   // Daha sonra:
   <DotLottieReact
     animationData={readingBoy}
     loop
     autoplay
   />
   ```

---

### Yöntem 3: Public CDN URL (Hızlı)

LottieFiles'ın public CDN'i:
```
https://assets.lottiefiles.com/packages/lf20_[hash].json
```

**Not:** Hash'i animation detay sayfasından alabilirsin.

---

## 🎨 Mevcut Implementasyon

**Dosya:** `src/components/FeaturesShowcase.tsx`

```typescript
// Line 452: Student animation
lottieUrl="https://lottie.host/embed/9aYZuECxgE/BqxmKGdFwW.lottie"

// Line 479: Institution animation
lottieUrl="https://lottie.host/embed/7cFIw4FRuj/RgJ7HmLB5Q.lottie"
```

**Eğer URL'ler çalışmazsa:**
- Placeholder görsel gösterilir
- Animasyonları indir ve local olarak import et

---

## 🚀 Test Etme

```bash
npm run dev

# Tarayıcıda:
http://localhost:5173/features
```

Scroll yaparak animasyonları gör!

---

## 💡 İpuçları

### Animasyon Performansı

```typescript
<DotLottieReact
  src={lottieUrl}
  loop
  autoplay
  speed={0.8}           // Yavaşlat
  className="w-full"
  style={{ maxWidth: '400px' }}
/>
```

### Scroll-triggered Animation

Animasyonlar zaten scroll'da başlıyor (Framer Motion ile):
```typescript
animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
```

### Dark Mode Compatibility

Lottie animasyonları otomatik olarak dark mode'a uyum sağlar. Eğer sağlamazsa:
```typescript
// Dark mode için farklı animasyon
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
lottieUrl={isDark ? darkAnimation : lightAnimation}
```

---

## 🔍 Alternatif Animasyon Kaynakları

Eğer LottieFiles erişilemezse:

1. **IconScout Lottie** - https://iconscout.com/lottie-animations
2. **LordIcon** - https://lordicon.com (premium)
3. **Flaticon Animated** - https://www.flaticon.com/animated-icons

---

## 📞 Sorun Giderme

### "Animasyon yüklenmiyor"
- URL'nin doğru olduğunu kontrol et
- Network tab'de 404 hatası var mı?
- CORS sorunu varsa animasyonu indir ve local kullan

### "Animasyon bozuk görünüyor"
- Aspect ratio'yu kontrol et: `aspect-square`
- Width/height sınırlaması ekle: `max-w-md`

### "Performans sorunu"
- Animasyon boyutunu küçült
- Loop'u kapat: `loop={false}`
- Autoplay'i kapat, hover'da başlat

---

**Son Güncelleme:** 2025-11-11
**Paketler:** lottie-react, @lottiefiles/dotlottie-react
