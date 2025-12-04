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
  fetchHomeworks,
  addHomeworkItem,
  updateHomework,
  deleteHomework,
  toggleHomeworkStatus,
} from '../../lib/studentApi';

interface HomeworksTabProps {
  studentId: string;
}

export const HomeworksTab: React.FC<HomeworksTabProps> = ({ studentId }) => {
  const [loading, setLoading] = useState(true);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingHomework, setEditingHomework] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: new Date(),
  });

  const loadHomeworks = async () => {
    setLoading(true);
    try {
      const data = await fetchHomeworks(studentId);
      setHomeworks(data);
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Ödevler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeworks();
  }, [studentId]);

  const handleAddHomework = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Uyarı', 'Ödev başlığı giriniz');
      return;
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date.toISOString().split('T')[0],
      };

      if (editingHomework) {
        await updateHomework(editingHomework.id, payload);
      } else {
        await addHomeworkItem(studentId, payload);
      }

      setShowModal(false);
      setEditingHomework(null);
      setFormData({ title: '', description: '', due_date: new Date() });
      loadHomeworks();
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Ödev eklenemedi');
    }
  };

  const handleToggleStatus = async (homeworkId: string, currentStatus: boolean) => {
    try {
      await toggleHomeworkStatus(homeworkId, !currentStatus);
      loadHomeworks();
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Durum güncellenemedi');
    }
  };

  const handleDelete = (homeworkId: string) => {
    Alert.alert('Ödev Sil', 'Bu ödevi silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHomework(homeworkId);
            loadHomeworks();
          } catch (e: any) {
            Alert.alert('Hata', e?.message ?? 'Ödev silinemedi');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const pendingHomeworks = homeworks.filter((h) => !h.completed);
  const completedHomeworks = homeworks.filter((h) => h.completed);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {pendingHomeworks.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Bekleyen Ödevler</Text>
            {pendingHomeworks.map((hw) => (
              <Card key={hw.id} style={styles.homeworkCard}>
                <Pressable onPress={() => handleToggleStatus(hw.id, hw.completed)}>
                  <View style={styles.homeworkHeader}>
                    <View style={styles.checkbox}>
                      {hw.completed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.homeworkInfo}>
                      <Text style={styles.homeworkTitle}>{hw.title}</Text>
                      {hw.description && (
                        <Text style={styles.homeworkDesc}>{hw.description}</Text>
                      )}
                      <Text style={styles.homeworkDate}>Son tarih: {hw.due_date}</Text>
                    </View>
                  </View>
                </Pressable>
                <View style={styles.homeworkActions}>
                  <Pressable
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(hw.id)}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Sil</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </>
        )}

        {completedHomeworks.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Tamamlanan Ödevler</Text>
            {completedHomeworks.map((hw) => (
              <Card key={hw.id} style={[styles.homeworkCard, styles.completedCard]}>
                <Pressable onPress={() => handleToggleStatus(hw.id, hw.completed)}>
                  <View style={styles.homeworkHeader}>
                    <View style={[styles.checkbox, styles.checkboxCompleted]}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                    <View style={styles.homeworkInfo}>
                      <Text style={[styles.homeworkTitle, styles.completedTitle]}>
                        {hw.title}
                      </Text>
                      {hw.description && (
                        <Text style={styles.homeworkDesc}>{hw.description}</Text>
                      )}
                      <Text style={styles.homeworkDate}>
                        Tamamlandı: {hw.completed_at?.split('T')[0] ?? hw.due_date}
                      </Text>
                    </View>
                  </View>
                </Pressable>
                <View style={styles.homeworkActions}>
                  <Pressable
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(hw.id)}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Sil</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </>
        )}

        {homeworks.length === 0 && (
          <Card>
            <Text style={styles.emptyText}>Henüz ödev eklenmemiş</Text>
          </Card>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Ödev Ekle" onPress={() => setShowModal(true)} />
      </View>

      <Modal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingHomework(null);
        }}
        title="Yeni Ödev"
      >
        <View style={styles.form}>
          <Input
            placeholder="Ödev Başlığı"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
          />

          <Input
            placeholder="Açıklama (Opsiyonel)"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={3}
          />

          <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>
              Son Tarih: {formData.due_date.toISOString().split('T')[0]}
            </Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={formData.due_date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setFormData({ ...formData, due_date: selectedDate });
                }
              }}
            />
          )}

          <Button title="Ekle" onPress={handleAddHomework} />
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  homeworkCard: {
    marginBottom: 12,
  },
  completedCard: {
    opacity: 0.7,
  },
  homeworkHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#6366F1',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  homeworkInfo: {
    flex: 1,
  },
  homeworkTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  homeworkDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  homeworkDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  homeworkActions: {
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
});
