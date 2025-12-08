import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  getTopicsByGrade,
  getSubjectsByGrade,
  getStudentProgressBySubject,
  upsertTopicProgress,
  addSourceBook,
  getTopicStats,
  type Topic,
  type StudentTopicProgress,
  type TopicStats,
} from '../../lib/topicTrackingApi';

interface TopicTrackingTabProps {
  studentId: string;
  gradeLevel: number;
}

export const TopicTrackingTab: React.FC<TopicTrackingTabProps> = ({
  studentId,
  gradeLevel,
}) => {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<Map<string, StudentTopicProgress>>(new Map());
  const [stats, setStats] = useState<TopicStats | null>(null);

  // Modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [editPercentage, setEditPercentage] = useState('0');
  const [editQuestions, setEditQuestions] = useState('0');
  const [editCorrect, setEditCorrect] = useState('0');
  const [editWrong, setEditWrong] = useState('0');
  const [editBook, setEditBook] = useState('');

  useEffect(() => {
    loadData();
  }, [studentId, gradeLevel]);

  useEffect(() => {
    if (selectedSubject) {
      loadTopicsAndProgress();
    }
  }, [selectedSubject]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load subjects and stats
      const [subjectsData, statsData] = await Promise.all([
        getSubjectsByGrade(gradeLevel),
        getTopicStats(studentId),
      ]);

      setSubjects(subjectsData);
      setStats(statsData);

      if (subjectsData.length > 0 && !selectedSubject) {
        setSelectedSubject(subjectsData[0]);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadTopicsAndProgress = async () => {
    try {
      const [topicsData, progressData] = await Promise.all([
        getTopicsByGrade(gradeLevel),
        getStudentProgressBySubject(studentId, gradeLevel, selectedSubject),
      ]);

      // Filter topics by selected subject
      const filteredTopics = topicsData.filter((t) => t.subject === selectedSubject);
      setTopics(filteredTopics);

      // Create progress map
      const progressMap = new Map<string, StudentTopicProgress>();
      progressData.forEach((p) => {
        progressMap.set(p.topic_id, p);
      });
      setProgress(progressMap);
    } catch (error: any) {
      console.error('Error loading topics:', error);
    }
  };

  const handleTopicPress = (topic: Topic) => {
    const currentProgress = progress.get(topic.id);

    setSelectedTopic(topic);
    setEditPercentage(currentProgress?.completion_percentage.toString() || '0');
    setEditQuestions(currentProgress?.total_questions_solved.toString() || '0');
    setEditCorrect(currentProgress?.correct_answers.toString() || '0');
    setEditWrong(currentProgress?.wrong_answers.toString() || '0');
    setEditBook('');
    setEditModalVisible(true);
  };

  const handleSaveProgress = async () => {
    if (!selectedTopic) return;

    try {
      const percentage = parseInt(editPercentage) || 0;
      const totalQuestions = parseInt(editQuestions) || 0;
      const correct = parseInt(editCorrect) || 0;
      const wrong = parseInt(editWrong) || 0;

      await upsertTopicProgress(studentId, selectedTopic.id, {
        completion_percentage: Math.min(100, Math.max(0, percentage)),
        total_questions_solved: totalQuestions,
        correct_answers: correct,
        wrong_answers: wrong,
        is_completed: percentage >= 100,
      });

      if (editBook.trim()) {
        await addSourceBook(studentId, selectedTopic.id, editBook.trim());
      }

      setEditModalVisible(false);
      await loadTopicsAndProgress();
      await loadData(); // Refresh stats
    } catch (error: any) {
      Alert.alert('Hata', 'Kaydetme başarısız');
    }
  };

  const renderTopicRow = (topic: Topic) => {
    const topicProgress = progress.get(topic.id);
    const percentage = topicProgress?.completion_percentage || 0;
    const totalQ = topicProgress?.total_questions_solved || 0;
    const correct = topicProgress?.correct_answers || 0;
    const wrong = topicProgress?.wrong_answers || 0;
    const books = topicProgress?.source_books || [];
    const accuracy = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;

    return (
      <Pressable
        key={topic.id}
        style={styles.tableRow}
        onPress={() => handleTopicPress(topic)}
      >
        <View style={styles.topicNameCell}>
          <Text style={styles.topicName} numberOfLines={2}>
            {topic.topic_name}
          </Text>
        </View>

        <View style={styles.percentageCell}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${percentage}%` }]} />
          </View>
          <Text style={styles.percentageText}>{percentage}%</Text>
        </View>

        <View style={styles.statsCell}>
          <Text style={styles.statsText}>{totalQ}</Text>
        </View>

        <View style={styles.statsCell}>
          <Text style={[styles.statsText, { color: '#10B981' }]}>{correct}</Text>
        </View>

        <View style={styles.statsCell}>
          <Text style={[styles.statsText, { color: '#EF4444' }]}>{wrong}</Text>
        </View>

        <View style={styles.accuracyCell}>
          <Text style={styles.statsText}>{accuracy}%</Text>
        </View>

        <View style={styles.booksCell}>
          <Text style={styles.statsText} numberOfLines={1}>
            {books.length > 0 ? books.join(', ') : '-'}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (subjects.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          {gradeLevel}. sınıf için konu bulunamadı
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      {stats && (
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.completedTopics}</Text>
              <Text style={styles.statLabel}>Tamamlanan</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.inProgressTopics}</Text>
              <Text style={styles.statLabel}>Devam Eden</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalQuestionsSolved}</Text>
              <Text style={styles.statLabel}>Soru Çözüldü</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.accuracy}%</Text>
              <Text style={styles.statLabel}>Doğruluk</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Subject Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {subjects.map((subject) => (
          <Pressable
            key={subject}
            style={[
              styles.tab,
              selectedSubject === subject && styles.tabActive,
            ]}
            onPress={() => setSelectedSubject(subject)}
          >
            <Text
              style={[
                styles.tabText,
                selectedSubject === subject && styles.tabTextActive,
              ]}
            >
              {subject}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Topic Table */}
      <ScrollView style={styles.tableContainer}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <View style={styles.topicNameCell}>
            <Text style={styles.headerText}>Konu</Text>
          </View>
          <View style={styles.percentageCell}>
            <Text style={styles.headerText}>İlerleme</Text>
          </View>
          <View style={styles.statsCell}>
            <Text style={styles.headerText}>Soru</Text>
          </View>
          <View style={styles.statsCell}>
            <Text style={styles.headerText}>Doğru</Text>
          </View>
          <View style={styles.statsCell}>
            <Text style={styles.headerText}>Yanlış</Text>
          </View>
          <View style={styles.accuracyCell}>
            <Text style={styles.headerText}>Başarı</Text>
          </View>
          <View style={styles.booksCell}>
            <Text style={styles.headerText}>Kaynaklar</Text>
          </View>
        </View>

        {/* Table Rows */}
        {topics.map((topic) => renderTopicRow(topic))}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedTopic?.topic_name}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tamamlanma Yüzdesi (%)</Text>
              <TextInput
                style={styles.input}
                value={editPercentage}
                onChangeText={setEditPercentage}
                keyboardType="number-pad"
                placeholder="0-100"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Toplam Soru Sayısı</Text>
              <TextInput
                style={styles.input}
                value={editQuestions}
                onChangeText={setEditQuestions}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Doğru</Text>
                <TextInput
                  style={styles.input}
                  value={editCorrect}
                  onChangeText={setEditCorrect}
                  keyboardType="number-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Yanlış</Text>
                <TextInput
                  style={styles.input}
                  value={editWrong}
                  onChangeText={setEditWrong}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kaynak Kitap Ekle</Text>
              <TextInput
                style={styles.input}
                value={editBook}
                onChangeText={setEditBook}
                placeholder="Örn: Orijinal Yayınları TYT Matematik"
              />
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="İptal"
                onPress={() => setEditModalVisible(false)}
                variant="secondary"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Kaydet"
                onPress={handleSaveProgress}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  topicNameCell: {
    flex: 2,
    justifyContent: 'center',
  },
  topicName: {
    fontSize: 14,
    color: '#1F2937',
  },
  percentageCell: {
    flex: 1.5,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsCell: {
    flex: 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accuracyCell: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  booksCell: {
    flex: 1.5,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  statsText: {
    fontSize: 13,
    color: '#1F2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
