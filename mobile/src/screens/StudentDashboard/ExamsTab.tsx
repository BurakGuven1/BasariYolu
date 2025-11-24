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

export const ExamsTab: React.FC<ExamsTabProps> = ({ studentId }) => {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    exam_name: '',
    exam_date: new Date(),
    score: '',
    total_score: '',
    exam_type: 'TYT',
  });

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

  const handleAddExam = async () => {
    if (!formData.exam_name.trim()) {
      Alert.alert('Uyarı', 'Deneme adı giriniz');
      return;
    }

    try {
      const payload = {
        exam_name: formData.exam_name,
        exam_date: formData.exam_date.toISOString().split('T')[0],
        score: formData.score ? Number(formData.score) : undefined,
        total_score: formData.total_score ? Number(formData.total_score) : undefined,
        exam_type: formData.exam_type,
      };

      if (editingExam) {
        await updateExamResult(editingExam.id, payload);
      } else {
        await addExamResult(studentId, payload);
      }

      setShowModal(false);
      setEditingExam(null);
      setFormData({
        exam_name: '',
        exam_date: new Date(),
        score: '',
        total_score: '',
        exam_type: 'TYT',
      });
      loadExams();
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Deneme eklenemedi');
    }
  };

  const handleEditExam = (exam: any) => {
    setEditingExam(exam);
    setFormData({
      exam_name: exam.exam_name ?? '',
      exam_date: new Date(exam.exam_date),
      score: exam.score ? String(exam.score) : '',
      total_score: exam.total_score ? String(exam.total_score) : '',
      exam_type: exam.exam_type ?? 'TYT',
    });
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
                  <Text style={styles.examType}>{exam.exam_type ?? 'TYT'}</Text>
                </View>
                <View style={styles.examScore}>
                  <Text style={styles.scoreValue}>
                    {exam.score ?? '-'} / {exam.total_score ?? '-'}
                  </Text>
                </View>
              </View>
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
        }}
        title={editingExam ? 'Deneme Düzenle' : 'Yeni Deneme'}
      >
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

          <Input
            placeholder="Puan"
            value={formData.score}
            onChangeText={(text) => setFormData({ ...formData, score: text })}
            keyboardType="numeric"
          />

          <Input
            placeholder="Toplam Puan"
            value={formData.total_score}
            onChangeText={(text) => setFormData({ ...formData, total_score: text })}
            keyboardType="numeric"
          />

          <View style={styles.typeSelector}>
            {['TYT', 'AYT', 'LGS'].map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.typeButton,
                  formData.exam_type === type && styles.typeButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, exam_type: type })}
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

          <Button title={editingExam ? 'Güncelle' : 'Ekle'} onPress={handleAddExam} />
        </View>
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
    fontSize: 20,
    fontWeight: '800',
    color: '#6366F1',
  },
  examActions: {
    flexDirection: 'row',
    gap: 8,
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
  form: {
    gap: 12,
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
});
