import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/ui/Card';
import { CustomLineChart } from '../../components/ui/Chart';
import {
  fetchExamResults,
  fetchHomeworks,
  fetchWeeklyGoal,
  fetchQuestionPlan,
  getWeeklyStudySessions,
} from '../../lib/studentApi';
import { generatePerformanceInsights, generateDailyChallenge, generateMotivationalMessage } from '../../lib/ai';
import { getStudentPoints, completeChallenge, isChallengeCompletedToday } from '../../lib/pointsSystem';
import type { PerformanceInsight, DailyChallenge } from '../../lib/ai';
import type { StudentPoints } from '../../lib/pointsSystem';

interface OverviewTabProps {
  student: any;
  profile: any;
}

const getCurrentWeekRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + offset);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const toISODate = (date: Date) => date.toISOString().split('T')[0];

  return {
    startDate: toISODate(start),
    endDate: toISODate(end),
  };
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ student, profile }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExams: 0,
    pendingHomeworks: 0,
    weeklyStudyHours: 0,
    weeklyGoalHours: 0,
    questionTarget: 0,
    questionsCompleted: 0,
    lastExamScore: null as number | null,
  });
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [motivationMessage, setMotivationMessage] = useState<string>('');
  const [points, setPoints] = useState<StudentPoints | null>(null);
  const [badges, setBadges] = useState<string[]>(['🎯 İlk Adım', '📚 Çalışkan']);

  const loadOverviewData = async () => {
    if (!student?.id) return;
    setLoading(true);
    try {
      const { startDate, endDate } = getCurrentWeekRange();

      const [exams, homeworks, weeklyGoal, questionPlan, studySessions, studentPoints] = await Promise.all([
        fetchExamResults(student.id),
        fetchHomeworks(student.id),
        fetchWeeklyGoal(student.id),
        fetchQuestionPlan(student.id),
        getWeeklyStudySessions(student.id, startDate, endDate),
        getStudentPoints(student.id),
      ]);

      const totalStudyHours = studySessions.reduce((sum, session) => sum + (session.duration_minutes ?? 0) / 60, 0);
      const lastExam = exams.length > 0 ? exams[0] : null;

      setStats({
        totalExams: exams.length,
        pendingHomeworks: homeworks.filter((h: any) => !h.completed).length,
        weeklyStudyHours: totalStudyHours,
        weeklyGoalHours: weeklyGoal?.weekly_hours_target ?? 0,
        questionTarget: questionPlan?.question_target ?? 0,
        questionsCompleted: questionPlan?.questions_completed ?? 0,
        lastExamScore: lastExam?.score ?? null,
      });

      // AI Insights
      const studentData = {
        examResults: exams,
        studySessions,
      };
      const performanceInsights = generatePerformanceInsights(studentData);
      setInsights(performanceInsights);

      // Daily Challenge
      const challenge = generateDailyChallenge(studentData);
      setDailyChallenge(challenge);

      // Motivation
      const motivation = generateMotivationalMessage(exams);
      setMotivationMessage(motivation);

      // Points
      setPoints(studentPoints);

      // Badges - add based on performance
      const newBadges = ['🎯 İlk Adım'];
      if (exams.length >= 5) newBadges.push('📝 Deneme Ustası');
      if (totalStudyHours >= 10) newBadges.push('🔥 Çalışkan');
      if (exams.length >= 2) {
        const sorted = exams.sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());
        if (sorted[0].total_score > sorted[1].total_score) {
          newBadges.push('📈 Yükseliş Trendi');
        }
      }
      setBadges(newBadges);

      // Prepare chart data for last 7 exams
      if (exams.length > 0) {
        const recentExams = exams.slice(0, 7).reverse();
        setWeeklyData({
          labels: recentExams.map((e: any) => e.exam_name?.substring(0, 8) ?? 'Deneme'),
          datasets: [
            {
              data: recentExams.map((e: any) => e.total_score ?? 0),
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              strokeWidth: 2,
            },
          ],
        });
      }
    } catch (e: any) {
      console.error('Overview data load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverviewData();
  }, [student?.id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const handleCompleteChallenge = async () => {
    if (!dailyChallenge || !student?.id) return;

    try {
      const alreadyCompleted = await isChallengeCompletedToday(student.id, dailyChallenge.id);

      if (alreadyCompleted) {
        Alert.alert('Tamamlandı', 'Bu görevi bugün zaten tamamladınız!');
        return;
      }

      const result = await completeChallenge(
        student.id,
        dailyChallenge.id,
        dailyChallenge.points,
        dailyChallenge.title
      );

      if (result.success) {
        Alert.alert('Tebrikler!', `Görev tamamlandı! +${dailyChallenge.points} puan kazandınız!`);
        loadOverviewData(); // Reload to update points
      } else {
        Alert.alert('Hata', result.error || 'Görev tamamlanamadı');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir sorun oluştu');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Motivation Message */}
      {motivationMessage && (
        <Card style={styles.motivationCard}>
          <Text style={styles.motivationText}>{motivationMessage}</Text>
        </Card>
      )}

      {/* Points Display */}
      {points && (
        <Card style={styles.pointsCard}>
          <View style={styles.pointsRow}>
            <View>
              <Text style={styles.pointsLabel}>Toplam Puanın</Text>
              <Text style={styles.pointsValue}>{points.total_points}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Seviye {points.level}</Text>
            </View>
          </View>
        </Card>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card title="🧠 AI Önerileri">
          {insights.map((insight, idx) => (
            <View
              key={idx}
              style={[
                styles.insightBox,
                insight.type === 'success' && styles.insightSuccess,
                insight.type === 'warning' && styles.insightWarning,
                insight.type === 'danger' && styles.insightDanger,
                insight.type === 'info' && styles.insightInfo,
              ]}
            >
              <Text style={styles.insightIcon}>{insight.icon}</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightMessage}>{insight.message}</Text>
                <Text style={styles.insightAction}>{insight.action}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Daily Challenge */}
      {dailyChallenge && (
        <View style={styles.challengeContainer}>
          <LinearGradient
            colors={['#9333EA', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.challengeCard}
          >
            <Text style={styles.challengeHeader}>🏆 Günün Görevi</Text>
            <Text style={styles.challengeTitle}>{dailyChallenge.title}</Text>
            <Text style={styles.challengeDescription}>{dailyChallenge.description}</Text>
            <View style={styles.challengeFooter}>
              <View style={styles.challengeTags}>
                <View style={styles.challengeTag}>
                  <Text style={styles.challengeTagText}>
                    {dailyChallenge.difficulty === 'easy' ? '✓ Kolay' :
                     dailyChallenge.difficulty === 'medium' ? '✓ Orta' : '✓ Zor'}
                  </Text>
                </View>
                <View style={styles.challengeTag}>
                  <Text style={styles.challengeTagText}>+{dailyChallenge.points} puan</Text>
                </View>
              </View>
              <Pressable style={styles.challengeButton} onPress={handleCompleteChallenge}>
                <Text style={styles.challengeButtonText}>Tamamla</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <Card title="🏅 Rozetlerim">
          <View style={styles.badgesContainer}>
            {badges.map((badge, idx) => (
              <View key={idx} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Stats Grid */}
      <Card title="İstatistikler">
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalExams}</Text>
            <Text style={styles.statLabel}>Toplam Deneme</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.pendingHomeworks}</Text>
            <Text style={styles.statLabel}>Bekleyen Ödev</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {stats.weeklyStudyHours.toFixed(1)}/{stats.weeklyGoalHours}
            </Text>
            <Text style={styles.statLabel}>Haftalık Saat</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {stats.questionsCompleted}/{stats.questionTarget}
            </Text>
            <Text style={styles.statLabel}>Soru Hedefi</Text>
          </View>
        </View>
      </Card>

      {/* Performance Chart */}
      {weeklyData && (
        <Card title="📊 Deneme Performansı (Son 7)">
          <CustomLineChart data={weeklyData} height={200} />
        </Card>
      )}

      {/* Profile Info */}
      <Card title="Profil Bilgileri">
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ad Soyad:</Text>
          <Text style={styles.infoValue}>{profile?.full_name ?? 'Belirtilmemiş'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Okul:</Text>
          <Text style={styles.infoValue}>{profile?.school_name ?? 'Belirtilmemiş'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Sınıf:</Text>
          <Text style={styles.infoValue}>{profile?.grade ? `${profile.grade}. Sınıf` : 'Belirtilmemiş'}</Text>
        </View>
        {student?.invite_code && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Davet Kodu:</Text>
            <Text style={[styles.infoValue, styles.inviteCode]}>{student.invite_code}</Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  motivationCard: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  motivationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4338CA',
    textAlign: 'center',
  },
  pointsCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F59E0B',
  },
  levelBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  insightBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 12,
    gap: 12,
  },
  insightSuccess: {
    backgroundColor: '#ECFDF5',
    borderLeftColor: '#10B981',
  },
  insightWarning: {
    backgroundColor: '#FFFBEB',
    borderLeftColor: '#F59E0B',
  },
  insightDanger: {
    backgroundColor: '#FEF2F2',
    borderLeftColor: '#EF4444',
  },
  insightInfo: {
    backgroundColor: '#EFF6FF',
    borderLeftColor: '#3B82F6',
  },
  insightIcon: {
    fontSize: 24,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  insightMessage: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  insightAction: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  challengeContainer: {
    marginVertical: 8,
  },
  challengeCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  challengeHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 15,
    color: '#F3E8FF',
    marginBottom: 16,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeTags: {
    flexDirection: 'row',
    gap: 8,
  },
  challengeTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  challengeTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  challengeButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  challengeButtonText: {
    color: '#9333EA',
    fontSize: 14,
    fontWeight: '700',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4338CA',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  inviteCode: {
    color: '#6366F1',
    fontFamily: 'monospace',
  },
});
