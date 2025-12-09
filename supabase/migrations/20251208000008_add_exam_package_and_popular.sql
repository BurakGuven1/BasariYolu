-- Add is_popular column to coaching_packages
ALTER TABLE public.coaching_packages
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;

-- Mark Premium package (7500 TL / 24 sessions) as popular
UPDATE public.coaching_packages
SET is_popular = true
WHERE price = 7500.00 AND session_count = 24;

-- Add new "Sınava Kadar Paketi" package
INSERT INTO public.coaching_packages (name, description, session_count, duration_days, price, is_popular, features, is_active)
VALUES (
  'Sınava Kadar Paketi',
  '🎓 Sınav başarısı için maksimum destek! YKS/LGS''ye hazırlık sürecinde kesintisiz takip ve tercih döneminde profesyonel rehberlik. Hedefine ulaşmak için her adımda yanındayız!

📚 Paket İçeriği:
• 48 birebir koçluk seansı
• Haftada 3-4 düzenli görüşme
• Günlük ders takibi ve motivasyon desteği
• Sınav stratejisi ve zaman yönetimi planlaması
• Deneme sınavı analizi ve geri bildirim
• **ÖZEL: Tercih dönemi rehberlik desteği**
• Üniversite/lise tercih stratejisi
• Bölüm-meslek danışmanlığı

🎯 Platform İmkanları:
• Tüm premium özellikler
• Sınırsız konu takibi
• Gelişmiş analitik raporlar
• Özel çalışma programı
• Aile bilgilendirme toplantıları
• WhatsApp destek hattı',
  48,
  180, -- 6 months
  13500.00,
  false,
  ARRAY[
    'Haftada 3-4 düzenli görüşme',
    'Günlük ders takibi ve motivasyon',
    'Sınav stratejisi planlaması',
    'Deneme sınavı analizi',
    'Tercih dönemi rehberlik desteği',
    'Üniversite/lise tercih stratejisi',
    'Bölüm-meslek danışmanlığı',
    'Tüm platform özellikleri',
    'Sınırsız konu takibi',
    'Gelişmiş analitik raporlar',
    'Özel çalışma programı',
    'Aile bilgilendirme toplantıları',
    'WhatsApp destek hattı'
  ],
  true
)
ON CONFLICT DO NOTHING;
