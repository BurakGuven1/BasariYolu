import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  fetchExamResults,
  addExamResult,
  updateExamResult,
  deleteExamResultById,
} from '../../lib/studentApi';

interface ExamsTabProps {
  studentId: string;
}

interface TopicScore {
  subject: string;
  correct: number;
  wrong: number;
  net: number;
}

const TYT_SUBJECTS = [
  { name: 'Türkçe', maxQuestions: 40 },
  { name: 'Matematik', maxQuestions: 40 },
  { name: 'Fen', maxQuestions: 20 },
  { name: 'Sosyal', maxQuestions: 20 },
];

const AYT_SUBJECTS_MAP: Record<string, { name: string; maxQuestions: number }[]> = {
  sayisal: [
    { name: 'Matematik', maxQuestions: 40 },
    { name: 'Fizik', maxQuestions: 14 },
    { name: 'Kimya', maxQuestions: 13 },
    { name: 'Biyoloji', maxQuestions: 13 },
  ],
  esit_agirlik: [
    { name: 'Matematik', maxQuestions: 40 },
    { name: 'Edebiyat', maxQuestions: 24 },
    { name: 'Tarih', maxQuestions: 10 },
    { name: 'Coğrafya', maxQuestions: 6 },
  ],
  sozel: [
    { name: 'Edebiyat', maxQuestions: 24 },
    { name: 'Tarih 1', maxQuestions: 10 },
    { name: 'Coğrafya 1', maxQuestions: 6 },
    { name: 'Tarih 2', maxQuestions: 11 },
    { name: 'Coğrafya 2', maxQuestions: 11 },
    { name: 'Felsefe', maxQuestions: 12 },
    { name: 'Din', maxQuestions: 6 },
  ],
};

const LGS_SUBJECTS = [
  { name: 'Türkçe', maxQuestions: 20 },
  { name: 'Matematik', maxQuestions: 20 },
  { name: 'Fen', maxQuestions: 20 },
  { name: 'İnkılap', maxQuestions: 10 },
  { name: 'Din', maxQuestions: 10 },
  { name: 'İngilizce', maxQuestions: 10 },
];

export const ExamsTab: React.FC<ExamsTabProps> = ({ studentId }) => {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    exam_name: '',
    exam_date: new Date(),
    exam_type: 'TYT' as 'TYT' | 'AYT' | 'LGS',
    ayt_type: 'sayisal' as 'sayisal' | 'esit_agirlik' | 'sozel',
  });

  const [topicScores, setTopicScores] = useState<Record<string, { correct: string; wrong: string }>>({});

  const loadExams = async () => {
    setLoading(true);
    try {
      const data = await fetchExamResults(studentId);
      setExams(data);
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Denemeler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [studentId]);

  const getSubjects = () => {
    if (formData.exam_type === 'TYT') return TYT_SUBJECTS;
    if (formData.exam_type === 'AYT') return AYT_SUBJECTS_MAP[formData.ayt_type];
    if (formData.exam_type === 'LGS') return LGS_SUBJECTS;
    return [];
  };

  const calculateNet = (correct: number, wrong: number): number => {
    return Math.max(0, correct - wrong / 4);
  };

  const calculateTotalScore = (): number => {
    const subjects = getSubjects();
    let totalNet = 0;

    subjects.forEach((subject) => {
      const score = topicScores[subject.name];
      if (score) {
        const correct = Number(score.correct) || 0;
        const wrong = Number(score.wrong) || 0;
        totalNet += calculateNet(correct, wrong);
      }
    });

    // Approximate score calculation (simplified)
    if (formData.exam_type === 'TYT') {
      return Math.round(totalNet * 5);
    } else if (formData.exam_type === 'AYT') {
      return Math.round(totalNet * 5);
    } else if (formData.exam_type === 'LGS') {
      return Math.round(totalNet * 5);
    }
    return 0;
  };

  const validateTopicScores = (): boolean => {
    const subjects = getSubjects();

    for (const subject of subjects) {
      const score = topicScores[subject.name];
      if (!score) continue;

      const correct = Number(score.correct) || 0;
      const wrong = Number(score.wrong) || 0;
      const total = correct + wrong;

      if (total > subject.maxQuestions) {
        Alert.alert(
          'Uyarı',
          `${subject.name} için toplam soru sayısı ${subject.maxQuestions}'i geçemez. Girdiğiniz: ${total}`
        );
        return false;
      }

      if (correct < 0 || wrong < 0) {
        Alert.alert('Uyarı', 'Doğru ve yanlış sayıları negatif olamaz');
        return false;
      }
    }

    return true;
  };

  const handleAddExam = async () => {
    if (!formData.exam_name.trim()) {
      Alert.alert('Uyarı', 'Deneme adı giriniz');
      return;
    }

    if (!validateTopicScores()) {
      return;
    }

    try {
      const subjects = getSubjects();
      const topicScoresArray: TopicScore[] = subjects.map((subject) => {
        const score = topicScores[subject.name];
        const correct = Number(score?.correct) || 0;
        const wrong = Number(score?.wrong) || 0;
        return {
          subject: subject.name,
          correct,
          wrong,
          net: calculateNet(correct, wrong),
        };
      });

      const totalScore = calculateTotalScore();

      const payload = {
        exam_name: formData.exam_name,
        exam_date: formData.exam_date.toISOString().split('T')[0],
        exam_type: formData.exam_type,
        ayt_type: formData.exam_type === 'AYT' ? formData.ayt_type : undefined,
        total_score: totalScore,
        topic_scores: topicScoresArray,
      };

      if (editingExam) {
        await updateExamResult(editingExam.id, payload);
      } else {
        await addExamResult(studentId, payload);
      }

      setShowModal(false);
      setEditingExam(null);
      resetForm();
      loadExams();
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Deneme eklenemedi');
    }
  };

  const resetForm = () => {
    setFormData({
      exam_name: '',
      exam_date: new Date(),
      exam_type: 'TYT',
      ayt_type: 'sayisal',
    });
    setTopicScores({});
  };

  const handleEditExam = (exam: any) => {
    setEditingExam(exam);
    setFormData({
      exam_name: exam.exam_name ?? '',
      exam_date: new Date(exam.exam_date),
      exam_type: exam.exam_type ?? 'TYT',
      ayt_type: exam.ayt_type ?? 'sayisal',
    });

    // Load existing topic scores
    const scores: Record<string, { correct: string; wrong: string }> = {};
    if (exam.topic_scores && Array.isArray(exam.topic_scores)) {
      exam.topic_scores.forEach((ts: any) => {
        scores[ts.subject] = {
          correct: String(ts.correct || 0),
          wrong: String(ts.wrong || 0),
        };
      });
    }
    setTopicScores(scores);
    setShowModal(true);
  };

  const handleDeleteExam = (examId: string) => {
    Alert.alert(
      'Deneme Sil',
      'Bu denemeyi silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExamResultById(examId);
              loadExams();
            } catch (e: any) {
              Alert.alert('Hata', e?.message ?? 'Deneme silinemedi');
            }
          },
        },
      ]
    );
  };

  const updateTopicScore = (subject: string, field: 'correct' | 'wrong', value: string) => {
    setTopicScores((prev) => ({
      ...prev,
      [subject]: {
        correct: field === 'correct' ? value : prev[subject]?.correct || '0',
        wrong: field === 'wrong' ? value : prev[subject]?.wrong || '0',
      },
    }));
  };

  const renderTopicScoreInputs = () => {
    const subjects = getSubjects();

    return (
      <View style={styles.topicScoresContainer}>
        <Text style={styles.sectionTitle}>Konu Bazlı Puanlar</Text>
        {subjects.map((subject) => {
          const score = topicScores[subject.name] || { correct: '0', wrong: '0' };
          const correct = Number(score.correct) || 0;
          const wrong = Number(score.wrong) || 0;
          const net = calculateNet(correct, wrong);
          const total = correct + wrong;
          const isOverLimit = total > subject.maxQuestions;

          return (
            <View key={subject.name} style={styles.subjectRow}>
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text style={[styles.subjectLimit, isOverLimit && styles.subjectLimitError]}>
                  ({total}/{subject.maxQuestions})
                </Text>
              </View>
              <View style={styles.subjectInputs}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Doğru</Text>
                  <Input
                    value={score.correct}
                    onChangeText={(val) => updateTopicScore(subject.name, 'correct', val)}
                    keyboardType="number-pad"
                    placeholder="0"
                    style={styles.smallInput}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Yanlış</Text>
                  <Input
                    value={score.wrong}
                    onChangeText={(val) => updateTopicScore(subject.name, 'wrong', val)}
                    keyboardType="number-pad"
                    placeholder="0"
                    style={styles.smallInput}
                  />
                </View>
                <View style={styles.netDisplay}>
                  <Text style={styles.netLabel}>Net</Text>
                  <Text style={styles.netValue}>{net.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          );
        })}
        <View style={styles.totalScoreDisplay}>
          <Text style={styles.totalScoreLabel}>Toplam Puan (Tahmini)</Text>
          <Text style={styles.totalScoreValue}>{calculateTotalScore()}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {exams.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Henüz deneme eklenmemiş</Text>
          </Card>
        ) : (
          exams.map((exam) => (
            <Card key={exam.id} style={styles.examCard}>
              <View style={styles.examHeader}>
                <View style={styles.examInfo}>
                  <Text style={styles.examName}>{exam.exam_name}</Text>
                  <Text style={styles.examDate}>{exam.exam_date}</Text>
                  <Text style={styles.examType}>
                    {exam.exam_type ?? 'TYT'}
                    {exam.exam_type === 'AYT' && exam.ayt_type && ` (${exam.ayt_type})`}
                  </Text>
                </View>
                <View style={styles.examScore}>
                  <Text style={styles.scoreValue}>{exam.total_score ?? '-'}</Text>
                  <Text style={styles.scoreLabel}>Puan</Text>
                </View>
              </View>

              {exam.topic_scores && exam.topic_scores.length > 0 && (
                <View style={styles.topicScoresList}>
                  {exam.topic_scores.map((ts: any, idx: number) => (
                    <View key={idx} style={styles.topicScoreItem}>
                      <Text style={styles.topicScoreName}>{ts.subject}</Text>
                      <Text style={styles.topicScoreNet}>Net: {ts.net?.toFixed(2) ?? '0.00'}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.examActions}>
                <Pressable style={styles.actionButton} onPress={() => handleEditExam(exam)}>
                  <Text style={styles.actionButtonText}>Düzenle</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteExam(exam.id)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Sil</Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Deneme Ekle" onPress={() => setShowModal(true)} />
      </View>

      <Modal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingExam(null);
          resetForm();
        }}
        title={editingExam ? 'Deneme Düzenle' : 'Yeni Deneme'}
      >
        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
          <View style={styles.form}>
            <Input
              placeholder="Deneme Adı"
              value={formData.exam_name}
              onChangeText={(text) => setFormData({ ...formData, exam_name: text })}
            />

            <Pressable
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                Tarih: {formData.exam_date.toISOString().split('T')[0]}
              </Text>
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={formData.exam_date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setFormData({ ...formData, exam_date: selectedDate });
                  }
                }}
              />
            )}

            <View style={styles.typeSelector}>
              {['TYT', 'AYT', 'LGS'].map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.typeButton,
                    formData.exam_type === type && styles.typeButtonActive,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, exam_type: type as any });
                    setTopicScores({});
                  }}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.exam_type === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>

            {formData.exam_type === 'AYT' && (
              <View style={styles.aytTypeSelector}>
                <Text style={styles.sectionTitle}>AYT Türü</Text>
                <View style={styles.typeSelector}>
                  {['sayisal', 'esit_agirlik', 'sozel'].map((aytType) => (
                    <Pressable
                      key={aytType}
                      style={[
                        styles.typeButton,
                        formData.ayt_type === aytType && styles.typeButtonActive,
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, ayt_type: aytType as any });
                        setTopicScores({});
                      }}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          formData.ayt_type === aytType && styles.typeButtonTextActive,
                        ]}
                      >
                        {aytType === 'esit_agirlik' ? 'EA' : aytType === 'sozel' ? 'SÖZ' : 'SAY'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {renderTopicScoreInputs()}

            <Button
              title={editingExam ? 'Güncelle' : 'Ekle'}
              onPress={handleAddExam}
            />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  examCard: {
    marginBottom: 12,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  examInfo: {
    flex: 1,
  },
  examName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  examDate: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  examType: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  examScore: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366F1',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  topicScoresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  topicScoreItem: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topicScoreName: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  topicScoreNet: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 2,
  },
  examActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    color: '#DC2626',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalScroll: {
    maxHeight: 500,
  },
  form: {
    gap: 16,
    paddingBottom: 16,
  },
  dateButton: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateButtonText: {
    color: '#0F172A',
    fontSize: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  typeButtonText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },
  typeButtonTextActive: {
    color: '#6366F1',
  },
  aytTypeSelector: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  topicScoresContainer: {
    gap: 12,
    paddingVertical: 8,
  },
  subjectRow: {
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  subjectLimit: {
    fontSize: 12,
    color: '#6B7280',
  },
  subjectLimitError: {
    color: '#DC2626',
    fontWeight: '700',
  },
  subjectInputs: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  inputGroup: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  smallInput: {
    minHeight: 40,
  },
  netDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 40,
  },
  netLabel: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: '600',
  },
  netValue: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '800',
    marginTop: 2,
  },
  totalScoreDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  totalScoreLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  totalScoreValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6366F1',
  },
});
