import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { getStudentData, getExamResults, getHomeworks } from '../lib/supabase';
import Icon from 'react-native-vector-icons/Ionicons';

export default function DashboardScreen() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);

  const loadData = async () => {
    if (!user) return;

    try {
      if (user.userType === 'student') {
        const { data: student } = await getStudentData(user.id);
        setStudentData(student);

        if (student?.id) {
          const { data: exams } = await getExamResults(student.id);
          setExamResults(exams || []);

          const { data: hw } = await getHomeworks(student.id);
          setHomeworks(hw || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Merhaba,</Text>
        <Text style={styles.userName}>{user?.profile?.full_name || 'Öğrenci'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="document-text" size={30} color="#3B82F6" />
          <Text style={styles.statNumber}>{examResults.length}</Text>
          <Text style={styles.statLabel}>Sınav</Text>
        </View>

        <View style={styles.statCard}>
          <Icon name="checkmark-done" size={30} color="#10B981" />
          <Text style={styles.statNumber}>{homeworks.length}</Text>
          <Text style={styles.statLabel}>Ödev</Text>
        </View>

        <View style={styles.statCard}>
          <Icon name="trophy" size={30} color="#F59E0B" />
          <Text style={styles.statNumber}>
            {examResults.length > 0
              ? Math.round(
                  examResults.reduce((sum, e) => sum + (e.total_net || 0), 0) /
                    examResults.length
                )
              : 0}
          </Text>
          <Text style={styles.statLabel}>Ort. Net</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Son Sınavlar</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>

        {examResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="document-outline" size={50} color="#9CA3AF" />
            <Text style={styles.emptyText}>Henüz sınav kaydı yok</Text>
          </View>
        ) : (
          examResults.slice(0, 3).map((exam, index) => (
            <View key={index} style={styles.examCard}>
              <View style={styles.examHeader}>
                <Text style={styles.examName}>{exam.exam_name}</Text>
                <Text style={styles.examDate}>
                  {new Date(exam.exam_date).toLocaleDateString('tr-TR')}
                </Text>
              </View>
              <View style={styles.examStats}>
                <View style={styles.examStat}>
                  <Text style={styles.examStatLabel}>Net</Text>
                  <Text style={styles.examStatValue}>
                    {exam.total_net || 0}
                  </Text>
                </View>
                <View style={styles.examStat}>
                  <Text style={styles.examStatLabel}>Doğru</Text>
                  <Text style={styles.examStatValue}>
                    {exam.total_correct || 0}
                  </Text>
                </View>
                <View style={styles.examStat}>
                  <Text style={styles.examStatLabel}>Yanlış</Text>
                  <Text style={styles.examStatValue}>
                    {exam.total_wrong || 0}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Aktif Ödevler</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>

        {homeworks.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="book-outline" size={50} color="#9CA3AF" />
            <Text style={styles.emptyText}>Henüz ödev yok</Text>
          </View>
        ) : (
          homeworks.slice(0, 3).map((hw, index) => (
            <View key={index} style={styles.homeworkCard}>
              <View style={styles.homeworkHeader}>
                <Text style={styles.homeworkTitle}>{hw.subject}</Text>
                <View
                  style={[
                    styles.homeworkBadge,
                    hw.is_completed && styles.homeworkBadgeCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.homeworkBadgeText,
                      hw.is_completed && styles.homeworkBadgeTextCompleted,
                    ]}
                  >
                    {hw.is_completed ? 'Tamamlandı' : 'Bekliyor'}
                  </Text>
                </View>
              </View>
              <Text style={styles.homeworkDescription}>
                {hw.description}
              </Text>
              <Text style={styles.homeworkDueDate}>
                Son Tarih:{' '}
                {new Date(hw.due_date).toLocaleDateString('tr-TR')}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#3B82F6',
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAll: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  examCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  examName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  examDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  examStats: {
    flexDirection: 'row',
    gap: 20,
  },
  examStat: {
    alignItems: 'center',
  },
  examStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  examStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginTop: 4,
  },
  homeworkCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  homeworkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  homeworkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  homeworkBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  homeworkBadgeCompleted: {
    backgroundColor: '#D1FAE5',
  },
  homeworkBadgeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  homeworkBadgeTextCompleted: {
    color: '#065F46',
  },
  homeworkDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  homeworkDueDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
