import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  getQuestionById,
  getAnswersForQuestion,
  toggleQuestionLike,
  toggleAnswerLike,
  deleteQuestion,
  deleteAnswer,
} from '../../lib/questionPortalApi';
import { supabase } from '../../lib/supabase';

type QuestionDetailScreenRouteProp = RouteProp<RootStackParamList, 'QuestionDetail'>;
type QuestionDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuestionDetail'
>;

export const QuestionDetailScreen: React.FC = () => {
  const route = useRoute<QuestionDetailScreenRouteProp>();
  const navigation = useNavigation<QuestionDetailScreenNavigationProp>();
  const { questionId } = route.params;

  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
    loadQuestionData();
  }, [questionId]);

  const loadCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);
  };

  const loadQuestionData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id;

      const [questionData, answersData] = await Promise.all([
        getQuestionById(questionId, userId),
        getAnswersForQuestion(questionId, userId),
      ]);

      setQuestion(questionData);
      setAnswers(answersData);
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Soru yüklenemedi');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleLikeQuestion = async () => {
    if (!currentUserId) {
      Alert.alert('Uyarı', 'Beğenmek için giriş yapmalısınız');
      return;
    }

    try {
      await toggleQuestionLike(questionId, currentUserId);
      loadQuestionData();
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Beğeni işlemi başarısız');
    }
  };

  const handleLikeAnswer = async (answerId: string) => {
    if (!currentUserId) {
      Alert.alert('Uyarı', 'Beğenmek için giriş yapmalısınız');
      return;
    }

    try {
      await toggleAnswerLike(answerId, currentUserId);
      loadQuestionData();
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Beğeni işlemi başarısız');
    }
  };

  const handleDeleteQuestion = () => {
    Alert.alert('Soru Sil', 'Bu soruyu silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteQuestion(questionId);
            Alert.alert('Başarılı', 'Soru silindi');
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Hata', e?.message ?? 'Soru silinemedi');
          }
        },
      },
    ]);
  };

  const handleDeleteAnswer = (answerId: string) => {
    Alert.alert('Cevap Sil', 'Bu cevabı silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAnswer(answerId);
            loadQuestionData();
          } catch (e: any) {
            Alert.alert('Hata', e?.message ?? 'Cevap silinemedi');
          }
        },
      },
    ]);
  };

  if (loading || !question) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.authorInfo}>
              {question.student?.profiles?.avatar_url && (
                <Image
                  source={{ uri: question.student.profiles.avatar_url }}
                  style={styles.avatar}
                />
              )}
              <View>
                <Text style={styles.authorName}>
                  {question.student?.profiles?.full_name ?? 'Anonim'}
                </Text>
                <Text style={styles.questionDate}>
                  {new Date(question.created_at).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>
            {currentUserId === question.student?.user_id && (
              <Pressable onPress={handleDeleteQuestion}>
                <Text style={styles.deleteText}>Sil</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.questionTitle}>{question.title}</Text>
          <Text style={styles.questionContent}>{question.description}</Text>

          {question.image_url && (
            <Image source={{ uri: question.image_url }} style={styles.questionImage} />
          )}

          {question.subject && (
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectText}>{question.subject}</Text>
            </View>
          )}

          <View style={styles.questionStats}>
            <Pressable style={styles.statButton} onPress={handleLikeQuestion}>
              <Text style={styles.statIcon}>{question.user_has_liked ? '👍' : '🤍'}</Text>
              <Text style={styles.statText}>{question.like_count ?? 0} Beğeni</Text>
            </Pressable>
            <View style={styles.statButton}>
              <Text style={styles.statIcon}>💬</Text>
              <Text style={styles.statText}>{question.answer_count ?? 0} Cevap</Text>
            </View>
            <View style={styles.statButton}>
              <Text style={styles.statIcon}>👀</Text>
              <Text style={styles.statText}>{question.view_count ?? 0} Görüntüleme</Text>
            </View>
          </View>
        </Card>

        <View style={styles.answersSection}>
          <Text style={styles.answersTitle}>Cevaplar ({answers.length})</Text>

          {answers.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>Henüz cevap yok. İlk cevabı sen ver!</Text>
            </Card>
          ) : (
            answers.map((answer) => (
              <Card key={answer.id} style={styles.answerCard}>
                <View style={styles.answerHeader}>
                  <View style={styles.authorInfo}>
                    {answer.student?.profiles?.avatar_url && (
                      <Image
                        source={{ uri: answer.student.profiles.avatar_url }}
                        style={styles.avatarSmall}
                      />
                    )}
                    <View>
                      <Text style={styles.authorNameSmall}>
                        {answer.student?.profiles?.full_name ?? 'Anonim'}
                      </Text>
                      <Text style={styles.answerDate}>
                        {new Date(answer.created_at).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                  </View>
                  {currentUserId === answer.student?.user_id && (
                    <Pressable onPress={() => handleDeleteAnswer(answer.id)}>
                      <Text style={styles.deleteText}>Sil</Text>
                    </Pressable>
                  )}
                </View>

                <Text style={styles.answerContent}>{answer.answer_text}</Text>
                {answer.image_url && (
                  <Image source={{ uri: answer.image_url }} style={styles.answerImage} />
                )}

                <View style={styles.answerStats}>
                  <Pressable
                    style={styles.likeButton}
                    onPress={() => handleLikeAnswer(answer.id)}
                  >
                    <Text style={styles.statIcon}>{answer.user_has_liked ? '👍' : '🤍'}</Text>
                    <Text style={styles.statText}>{answer.like_count ?? 0} Beğeni</Text>
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Cevap Yaz"
          onPress={() => navigation.navigate('AnswerQuestion', { questionId })}
        />
      </View>
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
  questionCard: {
    marginBottom: 24,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  authorNameSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  questionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  answerDate: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  deleteText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  questionContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  questionImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  subjectBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  subjectText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  questionStats: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 16,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  answersSection: {
    gap: 12,
  },
  answersTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  answerCard: {
    marginBottom: 12,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  answerContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  answerImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  answerStats: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
});
