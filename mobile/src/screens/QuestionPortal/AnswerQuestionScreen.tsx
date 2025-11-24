import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createAnswer, getQuestionById } from '../../lib/questionPortalApi';
import { supabase } from '../../lib/supabase';

type AnswerQuestionScreenRouteProp = RouteProp<RootStackParamList, 'AnswerQuestion'>;
type AnswerQuestionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AnswerQuestion'>;

export const AnswerQuestionScreen: React.FC = () => {
  const route = useRoute<AnswerQuestionScreenRouteProp>();
  const navigation = useNavigation<AnswerQuestionScreenNavigationProp>();
  const { questionId } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [question, setQuestion] = useState<any>(null);
  const [answerContent, setAnswerContent] = useState('');

  useEffect(() => {
    loadData();
  }, [questionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Hata', 'Kullanıcı bulunamadı');
        navigation.goBack();
        return;
      }

      // Get student record
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (studentError || !studentData) {
        Alert.alert('Hata', 'Öğrenci kaydı bulunamadı');
        navigation.goBack();
        return;
      }

      setStudentId(studentData.id);

      // Load question
      const questionData = await getQuestionById(questionId, user.id);
      setQuestion(questionData);
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Veri yüklenemedi');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!answerContent.trim()) {
      Alert.alert('Uyarı', 'Cevap içeriği giriniz');
      return;
    }

    if (!studentId) {
      Alert.alert('Hata', 'Öğrenci bilgisi bulunamadı');
      return;
    }

    setSubmitting(true);
    try {
      await createAnswer(questionId, studentId, answerContent);

      Alert.alert('Başarılı', 'Cevabınız başarıyla gönderildi', [
        {
          text: 'Tamam',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Cevap gönderilemedi');
    } finally {
      setSubmitting(false);
    }
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
        <Card style={styles.questionPreview}>
          <Text style={styles.previewLabel}>Cevaplanacak Soru:</Text>
          <Text style={styles.questionTitle}>{question.question_title}</Text>
          <Text style={styles.questionContent} numberOfLines={3}>
            {question.question_content}
          </Text>
          {question.subject && (
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectText}>{question.subject}</Text>
            </View>
          )}
        </Card>

        <Card>
          <Text style={styles.header}>Cevabını Yaz</Text>
          <Text style={styles.description}>
            Yardımcı ve açıklayıcı bir cevap yaz. Adım adım açıklama yaparsan daha faydalı olur.
          </Text>
        </Card>

        <Card>
          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Cevap İçeriği *</Text>
              <Input
                placeholder="Cevabını detaylı bir şekilde yaz..."
                value={answerContent}
                onChangeText={setAnswerContent}
                multiline
                numberOfLines={10}
                style={styles.textArea}
              />
              <Text style={styles.helperText}>{answerContent.length} karakter</Text>
            </View>

            <Button
              title="Cevabı Gönder"
              onPress={handleSubmit}
              disabled={submitting}
            />
          </View>
        </Card>

        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 İyi Cevap İpuçları</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tip}>• Soruyu tam olarak cevaplamaya çalış</Text>
            <Text style={styles.tip}>• Adım adım açıkla</Text>
            <Text style={styles.tip}>• Örnekler vererek destekle</Text>
            <Text style={styles.tip}>• Emin olmadığın konularda belirt</Text>
            <Text style={styles.tip}>• Destekleyici ve nazik ol</Text>
          </View>
        </Card>
      </ScrollView>
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
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionPreview: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  questionContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  subjectBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  subjectText: {
    fontSize: 11,
    color: '#6366F1',
    fontWeight: '600',
  },
  header: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  textArea: {
    minHeight: 200,
    textAlignVertical: 'top',
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tip: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
});
