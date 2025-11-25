import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { getAllQuestions, toggleQuestionLike } from '../../lib/questionPortalApi';
import type { StudentQuestion } from '../../lib/questionPortalApi';

type RootStackParamList = {
  Auth: undefined;
  QuestionList: undefined;
  QuestionDetail: { questionId: string };
  CreateQuestion: undefined;
};

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const QuestionListScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [filter, setFilter] = useState<'all' | 'solved' | 'unsolved'>('all');

  const loadQuestions = async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await getAllQuestions(user?.id);
      setQuestions(data);
    } catch (e: any) {
      console.error('Questions load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuestions();
  };

  const handleLike = async (questionId: string) => {
    if (!user?.id) return;
    try {
      await toggleQuestionLike(questionId, user.id);
      loadQuestions();
    } catch (e: any) {
      console.error('Like error:', e);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'solved') return q.is_solved;
    if (filter === 'unsolved') return !q.is_solved;
    return true;
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Soru Portalı</Text>
        <Button
          title={user ? 'Soru Sor' : 'Giriş yap'}
          onPress={() => navigation.navigate(user ? 'CreateQuestion' : 'Auth')}
        />
      </View>

      <View style={styles.filters}>
        {(['all', 'unsolved', 'solved'] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[styles.filterText, filter === f && styles.filterTextActive]}
            >
              {f === 'all' ? 'Tümü' : f === 'solved' ? '✅ Çözüldü' : '🕐 Çözülmedi'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!user && (
          <Card style={{ marginBottom: 12 }}>
            <Text style={styles.emptyText}>
              Soruları görmek ve paylaşmak için giriş yapmalısın.
            </Text>
          </Card>
        )}
        {filteredQuestions.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Henüz soru bulunmuyor</Text>
          </Card>
        ) : (
          filteredQuestions.map((question) => (
            <Pressable
              key={question.id}
              onPress={() =>
                navigation.navigate('QuestionDetail', { questionId: question.id })
              }
            >
              <Card style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <View style={styles.questionTags}>
                    {question.subject && (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{question.subject}</Text>
                      </View>
                    )}
                    {question.difficulty && (
                      <View style={[styles.tag, styles.tagDifficulty]}>
                        <Text style={styles.tagText}>{question.difficulty}</Text>
                      </View>
                    )}
                    {question.is_solved && (
                      <View style={[styles.tag, styles.tagSolved]}>
                        <Text style={styles.tagTextSolved}>Çözüldü</Text>
                      </View>
                    )}
                    {question.image_url && (
                      <View style={[styles.tag, styles.tagMedia]}>
                        <Text style={styles.tagText}>📷 Görsel</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.questionTitle}>{question.title}</Text>
                <Text style={styles.questionDesc} numberOfLines={2}>
                  {question.description}
                </Text>

                <View style={styles.questionFooter}>
                  <Text style={styles.questionAuthor}>
                    {question.student?.profiles?.full_name ?? 'Anonim'}
                  </Text>
                  <View style={styles.questionStats}>
                    <Pressable
                      style={styles.stat}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleLike(question.id);
                      }}
                    >
                      <Text style={styles.statText}>
                        {question.user_has_liked ? '👍' : '🤍'} {question.like_count ?? 0}
                      </Text>
                    </Pressable>
                    <View style={styles.stat}>
                      <Text style={styles.statText}>
                        💬 {question.answer_count ?? 0}
                      </Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statText}>👀 {question.view_count ?? 0}</Text>
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  filterText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#6366F1',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  questionCard: {
    marginBottom: 12,
  },
  questionHeader: {
    marginBottom: 8,
  },
  questionTags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
  },
  tagDifficulty: {
    backgroundColor: '#FEF3C7',
  },
  tagSolved: {
    backgroundColor: '#D1FAE5',
  },
  tagMedia: {
    backgroundColor: '#E0F2FE',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
  tagTextSolved: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  questionDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionAuthor: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  questionStats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
