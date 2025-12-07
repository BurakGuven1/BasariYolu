-- =====================================================
-- SEED CURRICULUM TOPICS
-- Populate topics table with Turkish curriculum data
-- =====================================================

-- Function to insert topics
CREATE OR REPLACE FUNCTION insert_topic(
    p_grade INTEGER,
    p_subject VARCHAR,
    p_main_topic VARCHAR,
    p_sub_topic VARCHAR,
    p_order INTEGER,
    p_exam_type VARCHAR DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.topics (grade_level, subject, main_topic, sub_topic, topic_order, exam_type)
    VALUES (p_grade, p_subject, p_main_topic, p_sub_topic, p_order, p_exam_type)
    ON CONFLICT (grade_level, subject, main_topic, sub_topic) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 5. Sınıf - Matematik
SELECT insert_topic(5, 'Matematik', 'Doğal Sayılar', 'Doğal Sayılarda Toplama', 1);
SELECT insert_topic(5, 'Matematik', 'Doğal Sayılar', 'Doğal Sayılarda Çıkarma', 2);
SELECT insert_topic(5, 'Matematik', 'Doğal Sayılar', 'Doğal Sayılarda Çarpma', 3);
SELECT insert_topic(5, 'Matematik', 'Doğal Sayılar', 'Doğal Sayılarda Bölme', 4);
SELECT insert_topic(5, 'Matematik', 'Doğal Sayılar', 'İşlem Önceliği', 5);
SELECT insert_topic(5, 'Matematik', 'Kesirler', 'Basit Kesirler', 6);
SELECT insert_topic(5, 'Matematik', 'Kesirler', 'Kesirlerde Toplama ve Çıkarma', 7);
SELECT insert_topic(5, 'Matematik', 'Kesirler', 'Kesirlerde Çarpma', 8);
SELECT insert_topic(5, 'Matematik', 'Kesirler', 'Kesirlerde Bölme', 9);
SELECT insert_topic(5, 'Matematik', 'Ondalık Gösterim', 'Ondalık Kesirleri Anlama', 10);
SELECT insert_topic(5, 'Matematik', 'Ondalık Gösterim', 'Ondalık Kesirlerde İşlemler', 11);

-- 6. Sınıf - Matematik
SELECT insert_topic(6, 'Matematik', 'Doğal Sayılar', 'Doğal Sayılarla İşlemler', 1);
SELECT insert_topic(6, 'Matematik', 'Doğal Sayılar', 'EBOB ve EKOK', 2);
SELECT insert_topic(6, 'Matematik', 'Doğal Sayılar', 'Üslü Sayılar', 3);
SELECT insert_topic(6, 'Matematik', 'Oran ve Orantı', 'Oran Kavramı', 4);
SELECT insert_topic(6, 'Matematik', 'Oran ve Orantı', 'Orantı Kavramı', 5);
SELECT insert_topic(6, 'Matematik', 'Oran ve Orantı', 'Doğru ve Ters Orantı', 6);
SELECT insert_topic(6, 'Matematik', 'Cebirsel İfadeler', 'Cebirsel İfadeleri Anlama', 7);
SELECT insert_topic(6, 'Matematik', 'Cebirsel İfadeler', 'Cebirsel İfadelerde İşlemler', 8);

-- 7. Sınıf - Matematik
SELECT insert_topic(7, 'Matematik', 'Tam Sayılar', 'Tam Sayılarda Toplama ve Çıkarma', 1);
SELECT insert_topic(7, 'Matematik', 'Tam Sayılar', 'Tam Sayılarda Çarpma ve Bölme', 2);
SELECT insert_topic(7, 'Matematik', 'Rasyonel Sayılar', 'Rasyonel Sayılarda Toplama', 3);
SELECT insert_topic(7, 'Matematik', 'Rasyonel Sayılar', 'Rasyonel Sayılarda Çarpma', 4);
SELECT insert_topic(7, 'Matematik', 'Denklemler', 'Birinci Dereceden Denklemler', 5);
SELECT insert_topic(7, 'Matematik', 'Denklemler', 'Denklem Problemleri', 6);

-- 8. Sınıf - Matematik (LGS Hazırlık)
SELECT insert_topic(8, 'Matematik', 'Üslü Sayılar', 'Üslü İfadelerde Çarpma ve Bölme', 1, 'LGS');
SELECT insert_topic(8, 'Matematik', 'Üslü Sayılar', 'Kareköklü Sayılar', 2, 'LGS');
SELECT insert_topic(8, 'Matematik', 'Üçgenler', 'Üçgen Çeşitleri', 3, 'LGS');
SELECT insert_topic(8, 'Matematik', 'Üçgenler', 'Üçgende Açı-Kenar Bağıntıları', 4, 'LGS');
SELECT insert_topic(8, 'Matematik', 'Olasılık', 'Basit Olasılık', 5, 'LGS');
SELECT insert_topic(8, 'Matematik', 'Olasılık', 'Permütasyon', 6, 'LGS');

-- 9. Sınıf - Matematik
SELECT insert_topic(9, 'Matematik', 'Kümeler', 'Küme Kavramı', 1);
SELECT insert_topic(9, 'Matematik', 'Kümeler', 'Küme İşlemleri', 2);
SELECT insert_topic(9, 'Matematik', 'Mantık', 'Önermeler', 3);
SELECT insert_topic(9, 'Matematik', 'Fonksiyonlar', 'Fonksiyon Kavramı', 4);

-- 10. Sınıf - Matematik
SELECT insert_topic(10, 'Matematik', 'Denklem ve Eşitsizlikler', 'İkinci Dereceden Denklemler', 1);
SELECT insert_topic(10, 'Matematik', 'Trigonometri', 'Trigonometrik Oranlar', 2);
SELECT insert_topic(10, 'Matematik', 'Trigonometri', 'Trigonometrik Fonksiyonlar', 3);

-- 11. Sınıf TYT - Matematik
SELECT insert_topic(11, 'Matematik', 'Temel Kavramlar', 'Sayı Basamakları', 1, 'TYT');
SELECT insert_topic(11, 'Matematik', 'Temel Kavramlar', 'EBOB-EKOK', 2, 'TYT');
SELECT insert_topic(11, 'Matematik', 'Fonksiyonlar', 'Fonksiyon Kavramı', 3, 'TYT');
SELECT insert_topic(11, 'Matematik', 'Polinomlar', 'Polinomların Toplama ve Çarpma', 4, 'TYT');

-- 11. Sınıf TYT - Geometri
SELECT insert_topic(11, 'Geometri', 'Temel Geometrik Kavramlar', 'Açılar', 1, 'TYT');
SELECT insert_topic(11, 'Geometri', 'Temel Geometrik Kavramlar', 'Üçgenler', 2, 'TYT');
SELECT insert_topic(11, 'Geometri', 'Çember ve Daire', 'Çemberde Açılar', 3, 'TYT');

-- 12. Sınıf AYT-SAY - Matematik
SELECT insert_topic(12, 'Matematik', 'Limit ve Süreklilik', 'Limit Kavramı', 1, 'AYT-SAY');
SELECT insert_topic(12, 'Matematik', 'Türev', 'Türev Alma Kuralları', 2, 'AYT-SAY');
SELECT insert_topic(12, 'Matematik', 'İntegral', 'Belirsiz İntegral', 3, 'AYT-SAY');
SELECT insert_topic(12, 'Matematik', 'İntegral', 'Belirli İntegral', 4, 'AYT-SAY');

-- 12. Sınıf AYT-SAY - Fizik
SELECT insert_topic(12, 'Fizik', 'Çembersel Hareket', 'Düzgün Çembersel Hareket', 1, 'AYT-SAY');
SELECT insert_topic(12, 'Fizik', 'Elektrik ve Manyetizma', 'Elektriksel Potansiyel', 2, 'AYT-SAY');
SELECT insert_topic(12, 'Fizik', 'Modern Fizik', 'Atom Fiziği', 3, 'AYT-SAY');

-- 12. Sınıf AYT-SAY - Kimya
SELECT insert_topic(12, 'Kimya', 'Kimyasal Tepkimeler', 'Tepkime Hızı', 1, 'AYT-SAY');
SELECT insert_topic(12, 'Kimya', 'Organik Kimya', 'Hidrokarbonlar', 2, 'AYT-SAY');

-- 12. Sınıf AYT-SAY - Biyoloji
SELECT insert_topic(12, 'Biyoloji', 'Canlılık ve Enerji İlişkileri', 'Fotosentez', 1, 'AYT-SAY');
SELECT insert_topic(12, 'Biyoloji', 'Ekosistem Ekolojisi', 'Enerji Akışı', 2, 'AYT-SAY');

-- Drop the helper function
DROP FUNCTION insert_topic;
