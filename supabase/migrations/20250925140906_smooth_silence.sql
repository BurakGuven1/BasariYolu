/*
  # Sample Data for EduTracker Platform

  1. Sample Users and Profiles
  2. Sample Students and Parents
  3. Sample Exam Results
  4. Sample Homeworks
  5. Sample AI Recommendations

  Note: This is for development/demo purposes
*/

-- Insert sample exam results for demo
INSERT INTO exam_results (id, student_id, exam_name, exam_type, exam_date, total_score, mathematics_score, science_score, turkish_score) VALUES
  (uuid_generate_v4(), (SELECT id FROM students LIMIT 1), 'AYT Deneme 15', 'AYT', '2024-01-22', 82.5, 85, 78, 90),
  (uuid_generate_v4(), (SELECT id FROM students LIMIT 1), 'AYT Deneme 14', 'AYT', '2024-01-15', 78.3, 82, 75, 88),
  (uuid_generate_v4(), (SELECT id FROM students LIMIT 1), 'AYT Deneme 13', 'AYT', '2024-01-08', 75.7, 78, 72, 85)
ON CONFLICT DO NOTHING;

-- Insert sample homeworks
INSERT INTO homeworks (student_id, title, description, subject, due_date, completed) VALUES
  ((SELECT id FROM students LIMIT 1), 'Matematik - Limit Soruları', 'Sayfa 45-50 arası limit problemleri', 'Matematik', '2024-02-10', false),
  ((SELECT id FROM students LIMIT 1), 'Fizik - Hareket Problemleri', 'Düzgün hızlanan hareket soruları', 'Fizik', '2024-02-08', true),
  ((SELECT id FROM students LIMIT 1), 'Kimya - Mol Hesaplamaları', 'Mol kavramı ve hesaplama örnekleri', 'Kimya', '2024-02-12', false)
ON CONFLICT DO NOTHING;

-- Insert sample AI recommendations
INSERT INTO ai_recommendations (student_id, recommendation_type, title, description, priority, subject, topic) VALUES
  ((SELECT id FROM students LIMIT 1), 'weakness_detection', 'Dikkat Gereken Alan: Olasılık', 'Olasılık konusunda %45 başarı oranınız var. Bu hafta bu konuya 3 saat ayırmanızı öneriyoruz.', 'high', 'Matematik', 'Olasılık'),
  ((SELECT id FROM students LIMIT 1), 'improvement', 'Güçlü Olduğunuz Alan: Analiz', 'Analiz konusunda %82 başarı gösteriyorsunuz. Bu seviyeyi korumak için haftada 1 saat tekrar yapabilirsiniz.', 'low', 'Matematik', 'Analiz'),
  ((SELECT id FROM students LIMIT 1), 'study_plan', 'Bu Hafta İçin Önerimiz', 'Geometri çalışma saatinizi artırın. Son 2 denemede bu alanda %13 gelişim gösterdiniz.', 'medium', 'Matematik', 'Geometri')
ON CONFLICT DO NOTHING;