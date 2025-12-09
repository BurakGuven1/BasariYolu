# DeepSeek Prompt: Türk Eğitim Müfredatı Konu Listesi SQL Üretimi

## GÖREV
Türk eğitim sistemindeki 5-12. sınıf konularını PostgreSQL INSERT formatında SQL komutlarına dönüştür.

## TABLO YAPISI
```sql
CREATE TABLE public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_level integer NOT NULL,           -- 5-12 arası sınıf seviyesi
  subject varchar(100) NOT NULL,          -- Ders adı (Matematik, Türkçe, Fen vs.)
  topic_name varchar(200) NOT NULL,       -- Konu adı
  topic_order integer NOT NULL,           -- Konunun sıra numarası
  exam_type varchar(50) NULL,             -- Sınav türü (LGS, TYT, AYT-SAY, AYT-EA, AYT-SOZ)
  UNIQUE(grade_level, subject, topic_name)
);
```

## SINAV TÜRLERİ
- **5-8. Sınıflar**: `'LGS'`
- **9-10. Sınıflar**: `NULL` (henüz merkezi sınav yok)
- **11-12. Sınıflar**:
  - Matematik, Fizik, Kimya, Biyoloji → `'TYT'` veya `'AYT-SAY'`
  - Türk Dili ve Edebiyatı, Tarih, Coğrafya, Felsefe → `'TYT'` veya `'AYT-SOZ'`
  - Temel dersler (TYT) ve alan dersleri (AYT) olarak ayırabilirsin

## BEKLENEN ÇIKTI FORMATI
Tek bir INSERT komutu ile birden fazla satır ekle (BATCH INSERT):

```sql
INSERT INTO public.topics (grade_level, subject, topic_name, topic_order, exam_type) VALUES
(6, 'Türkçe', 'Biçim Bilgisi', 1, 'LGS'),
(6, 'Türkçe', 'Sözcükte Anlam', 2, 'LGS'),
(6, 'Türkçe', 'İsimler ve İsim Tamlamaları', 3, 'LGS'),
(6, 'Türkçe', 'Sıfatlar ve Sıfat Tamlamaları', 4, 'LGS'),
(6, 'Matematik', 'Doğal Sayılar', 1, 'LGS'),
(6, 'Matematik', 'Kesirler', 2, 'LGS');
```

## KURALLAR
1. Her konu için `topic_order` sıralı olmalı (aynı sınıf + ders için 1'den başla)
2. Her satır sonunda virgül (`,`) koy, sadece son satırda noktalı virgül (`;`)
3. Konu adları Türkçe karakterler içerebilir (ş, ğ, ı, ü vs.)
4. Her INSERT bloğunu sınıf ve derse göre grupla (okunabilirlik için)

## ÖRNEK GİRDİ VE ÇIKTI

### Girdi:
```
6. Sınıf Türkçe Konuları:
- Biçim Bilgisi
- Sözcükte Anlam
- İsimler ve İsim Tamlamaları

6. Sınıf Matematik Konuları:
- Doğal Sayılar
- Kesirler
```

### Çıktı:
```sql
-- 6. Sınıf Türkçe
INSERT INTO public.topics (grade_level, subject, topic_name, topic_order, exam_type) VALUES
(6, 'Türkçe', 'Biçim Bilgisi', 1, 'LGS'),
(6, 'Türkçe', 'Sözcükte Anlam', 2, 'LGS'),
(6, 'Türkçe', 'İsimler ve İsim Tamlamaları', 3, 'LGS');

-- 6. Sınıf Matematik
INSERT INTO public.topics (grade_level, subject, topic_name, topic_order, exam_type) VALUES
(6, 'Matematik', 'Doğal Sayılar', 1, 'LGS'),
(6, 'Matematik', 'Kesirler', 2, 'LGS');
```

## ŞİMDİ BU KONULARI SQL'E ÇEVİR:

[BURAYA KONULARINI YAPIŞITIR]

Örnek:
```
6. Sınıf Türkçe Konuları:
Biçim Bilgisi
Sözcükte Anlam
İsimler ve İsim Tamlamaları
Sıfatlar ve Sıfat Tamlamaları
Cümlede Anlam
Zamirler
Parçada Anlam
Edat-Bağlaç-Ünlem
Yazım Kuralları
Noktalama İşaretleri
Söz Gruplarında Anlam
Metin Türleri

6. Sınıf Matematik Konuları:
Doğal Sayılar
Kesirler
Ondalık Gösterim
Oran ve Orantı
İşlemler
Cebirsel İfadeler
Eşitlik ve Denklem
Geometri
Alan Ölçme
Veri Analizi
```

---

## NOTLAR:
- Her sınıf için (5-12) tüm dersleri bu şekilde dönüştür
- Çıktı direkt olarak PostgreSQL'de çalıştırılabilir olmalı
- ON CONFLICT kullanmana gerek yok, direkt INSERT yap
