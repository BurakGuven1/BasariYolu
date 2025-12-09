-- Harici sınav şablonları (Yayınevi denemeleri için)
-- Bu tablo yayınevlerinin popüler denemelerini tanımlar

CREATE TABLE IF NOT EXISTS institution_external_exam_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- "X Yayınları 7. Deneme TYT"
  publisher TEXT, -- "X Yayınları", "Bilfen", "Tonguç" vb
  exam_type TEXT NOT NULL, -- "TYT", "AYT", "LGS"
  exam_number INTEGER, -- 1, 2, 3... (kaçıncı deneme)
  total_questions INTEGER NOT NULL,
  question_mapping JSONB NOT NULL, -- Her soru için {questionNumber: 1, subject: "Matematik", topic: "Limit"}
  is_public BOOLEAN DEFAULT false, -- Tüm kurumlara açık mı?
  created_by UUID REFERENCES profiles(id),
  institution_id UUID REFERENCES institutions(id), -- null ise genel template
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Harici sınav sonuçları (Fiziksel sınavlar için)
CREATE TABLE IF NOT EXISTS institution_external_exam_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  template_id UUID REFERENCES institution_external_exam_templates(id) ON DELETE SET NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  answers JSONB NOT NULL, -- {1: "D", 2: "Y", 3: "B", 4: "D", ...} veya {1: {answer: "D", correct: true}, ...}
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  empty_count INTEGER NOT NULL DEFAULT 0,
  net_score DECIMAL(5,2), -- Net puan (Doğru - Yanlış/4)
  score DECIMAL(5,2), -- Hesaplanan puan
  metadata JSONB DEFAULT '{}', -- Extra bilgiler
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_external_exam_templates_type ON institution_external_exam_templates(exam_type);
CREATE INDEX IF NOT EXISTS idx_external_exam_templates_publisher ON institution_external_exam_templates(publisher);
CREATE INDEX IF NOT EXISTS idx_external_exam_templates_public ON institution_external_exam_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_external_exam_results_institution ON institution_external_exam_results(institution_id);
CREATE INDEX IF NOT EXISTS idx_external_exam_results_student ON institution_external_exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_external_exam_results_date ON institution_external_exam_results(exam_date);

-- RLS Policies
ALTER TABLE institution_external_exam_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_external_exam_results ENABLE ROW LEVEL SECURITY;

-- Template'leri görüntüleme (public olanlar veya kendi kurumununkiler)
CREATE POLICY "View external exam templates"
  ON institution_external_exam_templates FOR SELECT
  USING (
    is_public = true OR
    institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid()
    )
  );

-- Template oluşturma (kurum üyeleri)
CREATE POLICY "Create external exam templates"
  ON institution_external_exam_templates FOR INSERT
  WITH CHECK (
    institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'teacher')
    )
  );

-- Sonuçları görüntüleme (kurum üyeleri)
CREATE POLICY "View external exam results"
  ON institution_external_exam_results FOR SELECT
  USING (
    institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid()
    ) OR
    user_id = auth.uid()
  );

-- Sonuç ekleme (kurum üyeleri)
CREATE POLICY "Insert external exam results"
  ON institution_external_exam_results FOR INSERT
  WITH CHECK (
    institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'teacher')
    )
  );

-- Sonuç güncelleme
CREATE POLICY "Update external exam results"
  ON institution_external_exam_results FOR UPDATE
  USING (
    institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- Sonuç silme
CREATE POLICY "Delete external exam results"
  ON institution_external_exam_results FOR DELETE
  USING (
    institution_id IN (
      SELECT institution_id FROM institution_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

COMMENT ON TABLE institution_external_exam_templates IS 'Harici sınav şablonları - yayınevi denemeleri için konu eşleştirmeli template''ler';
COMMENT ON TABLE institution_external_exam_results IS 'Fiziksel sınavların sonuçları - Excel import veya manuel giriş ile oluşturulur';
