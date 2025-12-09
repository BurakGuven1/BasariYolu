-- =====================================================
-- UPDATE COACHING PACKAGES
-- =====================================================
-- Update coaching packages with new pricing structure
-- All coaches will use these standard packages

-- Delete old packages
DELETE FROM public.coaching_packages;

-- Insert new standardized packages
INSERT INTO public.coaching_packages (name, description, session_count, duration_days, price, is_active) VALUES
(
  'Deneme Paketi',
  '🎯 Koçluk hizmetini tanımak için ideal paket

  📌 1 adet 60 dakikalık görüşme
  📌 Hedef belirleme ve motivasyon
  📌 İlk adımı atmak isteyenler için',
  1,
  30,
  400.00,
  true
),
(
  'Standart Paket',
  '⭐ En popüler paket! Düzenli takip ve gelişim

  📌 8 adet 60 dakikalık görüşme (4 hafta)
  📌 Haftada 2 kez düzenli görüşme
  📌 Her gün düzenli denetim ve takip
  📌 Platform özelliklerine tam erişim
  📌 Konu takibi ve ilerleme raporları
  📌 AI destekli analiz ve öneriler
  📌 Kişiselleştirilmiş çalışma planı',
  8,
  30,
  2750.00,
  true
),
(
  'Premium Paket',
  '👑 Yoğun destek ve maksimum gelişim

  📌 24 adet 60 dakikalık görüşme (3 ay)
  📌 Haftada 2 kez düzenli görüşme
  📌 Her gün düzenli denetim ve takip
  📌 Platform özelliklerine tam erişim
  📌 Öncelikli destek
  📌 Sınav stratejisi ve psikolojik destek
  📌 Aile ile düzenli geri bildirim toplantıları
  📌 Hedef odaklı 3 aylık roadmap
  📌 Big Five kişilik analizi
  📌 Özel ders programı oluşturma',
  24,
  90,
  7500.00,
  true
);

-- Update descriptions to be more detailed
COMMENT ON TABLE public.coaching_packages IS 'Standardized coaching packages - all coaches use the same packages and prices';
