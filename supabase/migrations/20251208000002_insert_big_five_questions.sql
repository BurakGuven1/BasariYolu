-- Big Five Personality Test Questions (Turkish)
-- 50 questions covering all 5 traits for grades 5-12

-- Extraversion (Dışa Dönüklük) - 10 questions
INSERT INTO public.big_five_questions (question_text, trait, reverse_scored, min_grade, max_grade, question_order) VALUES
('Yeni insanlarla tanışmaktan hoşlanırım', 'extraversion', false, 5, 12, 1),
('Sosyal etkinliklerde aktif olmayı severim', 'extraversion', false, 5, 12, 2),
('Genellikle sessiz ve içine kapanığımdır', 'extraversion', true, 5, 12, 3),
('Arkadaşlarımla vakit geçirmeyi tercih ederim', 'extraversion', false, 5, 12, 4),
('Büyük gruplarda rahat hissederim', 'extraversion', false, 5, 12, 5),
('İnsanlarla konuşmaktan zevk alırım', 'extraversion', false, 5, 12, 6),
('Yalnız kalmayı tercih ederim', 'extraversion', true, 5, 12, 7),
('Konuşkan bir insanımdır', 'extraversion', false, 5, 12, 8),
('İnsanlarla iletişim kurmakta zorlanırım', 'extraversion', true, 5, 12, 9),
('Etkinliklerde ilgi odağı olmaktan hoşlanırım', 'extraversion', false, 5, 12, 10);

-- Agreeableness (Uyumluluk) - 10 questions
INSERT INTO public.big_five_questions (question_text, trait, reverse_scored, min_grade, max_grade, question_order) VALUES
('İnsanlara yardım etmekten mutluluk duyarım', 'agreeableness', false, 5, 12, 11),
('Başkalarının duygularını önemserim', 'agreeableness', false, 5, 12, 12),
('Kavga çıkarmaktan hoşlanmam', 'agreeableness', false, 5, 12, 13),
('İnsanlarla işbirliği yapmayı severim', 'agreeableness', false, 5, 12, 14),
('Başkalarının hatalarını affetmekte zorlanırım', 'agreeableness', true, 5, 12, 15),
('İnsanlara güvenirim', 'agreeableness', false, 5, 12, 16),
('Çoğu zaman başkalarını eleştiririm', 'agreeableness', true, 5, 12, 17),
('Arkadaşlarımın sorunlarını dinlerim', 'agreeableness', false, 5, 12, 18),
('İnsanların iyi niyetli olduğuna inanırım', 'agreeableness', false, 5, 12, 19),
('Tartışmalarda agresif olurum', 'agreeableness', true, 5, 12, 20);

-- Conscientiousness (Sorumluluk) - 10 questions
INSERT INTO public.big_five_questions (question_text, trait, reverse_scored, min_grade, max_grade, question_order) VALUES
('Görevlerimi zamanında tamamlarım', 'conscientiousness', false, 5, 12, 21),
('Düzenli ve sistemli çalışırım', 'conscientiousness', false, 5, 12, 22),
('Planlar yapmaktan hoşlanırım', 'conscientiousness', false, 5, 12, 23),
('Çok dağınığımdır', 'conscientiousness', true, 5, 12, 24),
('Sorumluluklarımı ciddiye alırım', 'conscientiousness', false, 5, 12, 25),
('İşlerimi son dakikaya bırakırım', 'conscientiousness', true, 5, 12, 26),
('Detaylara özen gösteririm', 'conscientiousness', false, 5, 12, 27),
('Hedeflerime ulaşmak için çok çalışırım', 'conscientiousness', false, 5, 12, 28),
('Genellikle tembelimdir', 'conscientiousness', true, 5, 12, 29),
('Çalışma alanımı düzenli tutarım', 'conscientiousness', false, 5, 12, 30);

-- Neuroticism (Duygusal Denge - ters puanlı) - 10 questions
INSERT INTO public.big_five_questions (question_text, trait, reverse_scored, min_grade, max_grade, question_order) VALUES
('Kolayca strese girerim', 'neuroticism', false, 5, 12, 31),
('Genellikle sakinimdir', 'neuroticism', true, 5, 12, 32),
('Küçük şeyler beni endişelendirir', 'neuroticism', false, 5, 12, 33),
('Duygusal olarak dengeliyimdir', 'neuroticism', true, 5, 12, 34),
('Sık sık üzgün hissederim', 'neuroticism', false, 5, 12, 35),
('Kaygılı bir insanımdır', 'neuroticism', false, 5, 12, 36),
('Duygularımı kontrol etmekte zorlanırım', 'neuroticism', false, 5, 12, 37),
('Rahat ve sakin kalabilirim', 'neuroticism', true, 5, 12, 38),
('Kendimi sık sık gergin hissederim', 'neuroticism', false, 5, 12, 39),
('Zorluklarla başa çıkmakta iyiyimdir', 'neuroticism', true, 5, 12, 40);

-- Openness (Deneyime Açıklık) - 10 questions
INSERT INTO public.big_five_questions (question_text, trait, reverse_scored, min_grade, max_grade, question_order) VALUES
('Yeni şeyler öğrenmekten hoşlanırım', 'openness', false, 5, 12, 41),
('Hayal gücüm kuvvetlidir', 'openness', false, 5, 12, 42),
('Sanat ve kültüre ilgi duyarım', 'openness', false, 5, 12, 43),
('Yeni deneyimlere açığımdır', 'openness', false, 5, 12, 44),
('Geleneksel yöntemleri tercih ederim', 'openness', true, 5, 12, 45),
('Yaratıcı fikirlere değer veririm', 'openness', false, 5, 12, 46),
('Değişiklikten hoşlanmam', 'openness', true, 5, 12, 47),
('Farklı kültürleri keşfetmek isterim', 'openness', false, 5, 12, 48),
('Soyut kavramları düşünmekten hoşlanırım', 'openness', false, 5, 12, 49),
('Rutinimi değiştirmekten rahatsız olurum', 'openness', true, 5, 12, 50);
