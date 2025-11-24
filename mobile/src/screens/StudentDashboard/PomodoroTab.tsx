import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  savePomodoroSession,
  getTodayPomodoroStats,
  getPomodoroSessions,
} from '../../lib/studentApi';

interface PomodoroTabProps {
  studentId: string;
}

export const PomodoroTab: React.FC<PomodoroTabProps> = ({ studentId }) => {
  const [timer, setTimer] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [todayStats, setTodayStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    totalMinutes: 0,
  });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadRecentSessions();
  }, [studentId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

  const loadStats = async () => {
    try {
      const stats = await getTodayPomodoroStats(studentId);
      setTodayStats(stats);
    } catch (e: any) {
      console.error('Pomodoro stats load error:', e);
    }
  };

  const loadRecentSessions = async () => {
    try {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      const sessions = await getPomodoroSessions(
        studentId,
        weekAgo.toISOString().split('T')[0],
        now.toISOString().split('T')[0]
      );
      setRecentSessions(sessions.slice(0, 10));
    } catch (e: any) {
      console.error('Recent sessions load error:', e);
    }
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    const durationMinutes = isBreak ? 5 : 25;

    if (!isBreak) {
      // Save work session
      try {
        await savePomodoroSession({
          student_id: studentId,
          session_date: new Date().toISOString().split('T')[0],
          duration_minutes: durationMinutes,
          completed: true,
        });
        Alert.alert(
          'Tebrikler!',
          'Pomodoro seansı tamamlandı! 5 dakika mola verin.',
          [{ text: 'Tamam' }]
        );
        loadStats();
        loadRecentSessions();
      } catch (e: any) {
        Alert.alert('Hata', 'Seans kaydedilemedi');
      }
    } else {
      Alert.alert('Mola Bitti', 'Yeni bir pomodoro seansına başlayabilirsiniz!', [
        { text: 'Tamam' },
      ]);
    }

    setIsBreak(!isBreak);
    setTimer(isBreak ? 25 * 60 : 5 * 60);
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimer(isBreak ? 5 * 60 : 25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card title="Pomodoro Zamanlayıcı">
        <View style={styles.timerContainer}>
          <View style={[styles.timerCircle, isBreak && styles.timerCircleBreak]}>
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
            <Text style={styles.timerLabel}>{isBreak ? 'Mola' : 'Çalışma'}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          {!isRunning ? (
            <Pressable style={styles.controlButton} onPress={handleStart}>
              <Text style={styles.controlButtonText}>Başlat</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.controlButton, styles.pauseButton]} onPress={handlePause}>
              <Text style={styles.controlButtonText}>Duraklat</Text>
            </Pressable>
          )}
          <Pressable style={[styles.controlButton, styles.resetButton]} onPress={handleReset}>
            <Text style={[styles.controlButtonText, styles.resetButtonText]}>Sıfırla</Text>
          </Pressable>
        </View>
      </Card>

      <Card title="Bugünün İstatistikleri">
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{todayStats.completedSessions}</Text>
            <Text style={styles.statLabel}>Tamamlanan</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{todayStats.totalMinutes}</Text>
            <Text style={styles.statLabel}>Toplam Dakika</Text>
          </View>
        </View>
      </Card>

      {recentSessions.length > 0 && (
        <Card title="Son Seanslar (7 Gün)">
          {recentSessions.map((session, index) => (
            <View key={index} style={styles.sessionRow}>
              <Text style={styles.sessionDate}>{session.session_date}</Text>
              <Text style={styles.sessionDuration}>{session.duration_minutes} dk</Text>
              {session.completed && <Text style={styles.sessionCompleted}>✓</Text>}
            </View>
          ))}
        </Card>
      )}
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
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#EEF2FF',
    borderWidth: 8,
    borderColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCircleBreak: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '800',
    color: '#6366F1',
  },
  timerLabel: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
  },
  resetButton: {
    backgroundColor: '#F3F4F6',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  resetButtonText: {
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sessionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  sessionDuration: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  sessionCompleted: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '700',
  },
});
