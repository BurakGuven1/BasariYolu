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
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const { width } = Dimensions.get('window');

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
  const [sortBy, setSortBy] = useState<'order' | 'progress'>('order');

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
  }, [selectedSubject, sortBy]);

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
      let filteredTopics = topicsData.filter((t) => t.subject === selectedSubject);

      // Sort topics
      if (sortBy === 'progress') {
        const progressMap = new Map<string, StudentTopicProgress>();
        progressData.forEach((p) => progressMap.set(p.topic_id, p));

        filteredTopics = filteredTopics.sort((a, b) => {
          const progressA = progressMap.get(a.id)?.completion_percentage || 0;
          const progressB = progressMap.get(b.id)?.completion_percentage || 0;
          return progressB - progressA; // Descending order
        });
      } else {
        filteredTopics = filteredTopics.sort((a, b) => a.topic_order - b.topic_order);
      }

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

  const getProgressColor = (percentage: number): string[] => {
    if (percentage === 0) return ['#E5E7EB', '#E5E7EB'];
    if (percentage < 25) return ['#EF4444', '#DC2626'];
    if (percentage < 50) return ['#F59E0B', '#D97706'];
    if (percentage < 75) return ['#3B82F6', '#2563EB'];
    if (percentage < 100) return ['#8B5CF6', '#7C3AED'];
    return ['#10B981', '#059669'];
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 80) return '#10B981';
    if (accuracy >= 60) return '#3B82F6';
    if (accuracy >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const renderTopicCard = (topic: Topic) => {
    const topicProgress = progress.get(topic.id);
    const percentage = topicProgress?.completion_percentage || 0;
    const totalQ = topicProgress?.total_questions_solved || 0;
    const correct = topicProgress?.correct_answers || 0;
    const wrong = topicProgress?.wrong_answers || 0;
    const books = topicProgress?.source_books || [];
    const accuracy = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
    const isCompleted = percentage === 100;
    const isStarted = percentage > 0;

    return (
      <Pressable
        key={topic.id}
        onPress={() => handleTopicPress(topic)}
        style={({ pressed }) => [
          styles.topicCard,
          pressed && styles.topicCardPressed,
        ]}
      >
        <Card style={styles.cardContent}>
          {/* Header with topic name and badge */}
          <View style={styles.cardHeader}>
            <View style={styles.topicNameContainer}>
              <Text style={styles.topicNameText} numberOfLines={2}>
                {topic.topic_name}
              </Text>
              {topic.exam_type && (
                <View style={[styles.examBadge, { backgroundColor: getExamBadgeColor(topic.exam_type) }]}>
                  <Text style={styles.examBadgeText}>{topic.exam_type}</Text>
                </View>
              )}
            </View>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedIcon}>✓</Text>
              </View>
            )}
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBarContainer}>
              <LinearGradient
                colors={getProgressColor(percentage)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${percentage}%` }]}
              />
            </View>
            <Text style={styles.progressPercentageText}>{percentage}%</Text>
          </View>

          {/* Statistics */}
          {isStarted ? (
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{totalQ}</Text>
                <Text style={styles.statLabel}>Soru</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>{correct}</Text>
                <Text style={styles.statLabel}>Doğru</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>{wrong}</Text>
                <Text style={styles.statLabel}>Yanlış</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: getAccuracyColor(accuracy) }]}>
                  {accuracy}%
                </Text>
                <Text style={styles.statLabel}>Başarı</Text>
              </View>
            </View>
          ) : (
            <View style={styles.notStartedContainer}>
              <Text style={styles.notStartedText}>Henüz başlanmadı</Text>
              <Text style={styles.tapToStartText}>Başlamak için dokun 👆</Text>
            </View>
          )}

          {/* Source Books */}
          {books.length > 0 && (
            <View style={styles.booksContainer}>
              <Text style={styles.booksLabel}>📚 Kaynaklar:</Text>
              <Text style={styles.booksText} numberOfLines={1}>
                {books.join(', ')}
              </Text>
            </View>
          )}
        </Card>
      </Pressable>
    );
  };

  const getExamBadgeColor = (examType: string): string => {
    if (examType === 'LGS') return '#8B5CF6';
    if (examType === 'TYT') return '#3B82F6';
    if (examType.startsWith('AYT')) return '#F59E0B';
    return '#6B7280';
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
        <Text style={styles.emptyIcon}>📚</Text>
        <Text style={styles.emptyTitle}>Henüz konu eklenmemiş</Text>
        <Text style={styles.emptyText}>
          {gradeLevel}. sınıf için konu bulunamadı
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Header with Gradient */}
      {stats && (
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsGradient}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statHeaderValue}>{stats.completedTopics}</Text>
              <Text style={styles.statHeaderLabel}>Tamamlanan</Text>
            </View>
            <View style={styles.statItemDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statHeaderValue}>{stats.inProgressTopics}</Text>
              <Text style={styles.statHeaderLabel}>Devam Eden</Text>
            </View>
            <View style={styles.statItemDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statHeaderValue}>{stats.totalQuestionsSolved}</Text>
              <Text style={styles.statHeaderLabel}>Toplam Soru</Text>
            </View>
            <View style={styles.statItemDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statHeaderValue}>{stats.accuracy}%</Text>
              <Text style={styles.statHeaderLabel}>Doğruluk</Text>
            </View>
          </View>
        </LinearGradient>
      )}

      {/* Subject Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
        contentContainerStyle={styles.tabsContent}
      >
        {subjects.map((subject) => (
          <Pressable
            key={subject}
            style={({ pressed }) => [
              styles.tab,
              selectedSubject === subject && styles.tabActive,
              pressed && styles.tabPressed,
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

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Pressable
          style={[styles.sortButton, sortBy === 'order' && styles.sortButtonActive]}
          onPress={() => setSortBy('order')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'order' && styles.sortButtonTextActive]}>
            Sıraya Göre
          </Text>
        </Pressable>
        <Pressable
          style={[styles.sortButton, sortBy === 'progress' && styles.sortButtonActive]}
          onPress={() => setSortBy('progress')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'progress' && styles.sortButtonTextActive]}>
            İlerlemeye Göre
          </Text>
        </Pressable>
      </View>

      {/* Topics List */}
      <ScrollView
        style={styles.topicsContainer}
        contentContainerStyle={styles.topicsContent}
      >
        {topics.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>Konu bulunamadı</Text>
            <Text style={styles.emptyText}>
              {selectedSubject} için konu bulunmuyor
            </Text>
          </View>
        ) : (
          topics.map((topic) => renderTopicCard(topic))
        )}
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedTopic?.topic_name}
              </Text>
              <Pressable
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tamamlanma Yüzdesi (%)</Text>
                <TextInput
                  style={styles.input}
                  value={editPercentage}
                  onChangeText={setEditPercentage}
                  keyboardType="number-pad"
                  placeholder="0-100"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Toplam Soru Sayısı</Text>
                <TextInput
                  style={styles.input}
                  value={editQuestions}
                  onChangeText={setEditQuestions}
                  keyboardType="number-pad"
                  placeholder="Örn: 50"
                  placeholderTextColor="#9CA3AF"
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
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Yanlış</Text>
                  <TextInput
                    style={styles.input}
                    value={editWrong}
                    onChangeText={setEditWrong}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
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
                  placeholderTextColor="#9CA3AF"
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
            </ScrollView>
          </View>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsGradient: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statHeaderValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statHeaderLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  tabs: {
    flexGrow: 0,
    marginBottom: 12,
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  tabPressed: {
    opacity: 0.7,
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  topicsContainer: {
    flex: 1,
  },
  topicsContent: {
    padding: 16,
    paddingTop: 0,
  },
  topicCard: {
    marginBottom: 12,
  },
  topicCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  topicNameContainer: {
    flex: 1,
    marginRight: 8,
  },
  topicNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  examBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  examBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressPercentageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    minWidth: 45,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  notStartedContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notStartedText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  tapToStartText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  booksContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  booksLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  booksText: {
    fontSize: 13,
    color: '#374151',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#6B7280',
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
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
