import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../types/navigation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { createAnswer, getQuestionById } from '../../lib/questionPortalApi';
import { supabase } from '../../lib/supabase';

type AnswerQuestionScreenRouteProp = RouteProp<RootStackParamList, 'AnswerQuestion'>;
type AnswerQuestionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AnswerQuestion'
>;

export const AnswerQuestionScreen: React.FC = () => {
  const route = useRoute<AnswerQuestionScreenRouteProp>();
  const navigation = useNavigation<AnswerQuestionScreenNavigationProp>();
  const { questionId } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [question, setQuestion] = useState<any>(null);
  const [answerContent, setAnswerContent] = useState('');
  const [image, setImage] = useState<{
    uri: string;
    base64?: string;
    mimeType?: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [questionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Hata', 'Kullanıcı bulunamadı');
        navigation.goBack();
        return;
      }

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

      const questionData = await getQuestionById(questionId, user.id);
      setQuestion(questionData);
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Veri yüklenemedi');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const buildDataUrl = () => {
    if (!image?.base64) return undefined;
    const mime = image.mimeType || 'image/jpeg';
    return `data:${mime};base64,${image.base64}`;
  };

  const pickFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!res.canceled && res.assets?.[0]) {
      const asset = res.assets[0];
      setImage({
        uri: asset.uri,
        base64: asset.base64 ?? undefined,
        mimeType: asset.mimeType ?? undefined,
      });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Kamera izni olmadan fotoğraf çekemezsiniz.');
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!res.canceled && res.assets?.[0]) {
      const asset = res.assets[0];
      setImage({
        uri: asset.uri,
        base64: asset.base64 ?? undefined,
        mimeType: asset.mimeType ?? undefined,
      });
    }
  };

  const handleSubmit = async () => {
    if (!answerContent.trim()) {
      Alert.alert('Uyarı', 'Cevap içeriğini giriniz');
      return;
    }

    if (!studentId) {
      Alert.alert('Hata', 'Öğrenci bilgisi bulunamadı');
      return;
    }

    setSubmitting(true);
    try {
      await createAnswer({
        question_id: questionId,
        student_id: studentId,
        answer_text: answerContent.trim(),
        image_url: buildDataUrl(),
      });

      Alert.alert('Başarılı', 'Cevabınız gönderildi', [
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
          <Text style={styles.previewLabel}>Cevaplanacak Soru</Text>
          <Text style={styles.questionTitle}>{question.title}</Text>
          <Text style={styles.questionContent} numberOfLines={5}>
            {question.description}
          </Text>
          {question.subject && (
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectText}>{question.subject}</Text>
            </View>
          )}
          {question.image_url && (
            <Image source={{ uri: question.image_url }} style={styles.questionImage} />
          )}
        </Card>

        <Card>
          <Text style={styles.header}>Cevabını Yaz</Text>
          <Text style={styles.description}>
            Yardımcı ve açıklayıcı bir cevap yaz. Adım adım anlatabilir, gerekirse fotoğraf ekleyebilirsin.
          </Text>
        </Card>

        <Card>
          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Cevap İçeriği *</Text>
              <TextInput
                placeholder="Cevabını detaylı bir şekilde yaz..."
                placeholderTextColor="#94A3B8"
                value={answerContent}
                onChangeText={setAnswerContent}
                multiline
                numberOfLines={10}
                style={[styles.input, styles.textArea]}
                textAlignVertical="top"
              />
              <Text style={styles.helperText}>{answerContent.length} karakter</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Görsel Ekle (isteğe bağlı)</Text>
              <View style={styles.imageActions}>
                <Button
                  title="Galeriden seç"
                  variant="secondary"
                  onPress={pickFromLibrary}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Fotoğraf çek"
                  variant="secondary"
                  onPress={takePhoto}
                  style={{ flex: 1 }}
                />
              </View>
              {image && (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: image.uri }} style={styles.previewImage} />
                  <Button title="Görseli Kaldır" variant="secondary" onPress={() => setImage(null)} />
                </View>
              )}
            </View>

            <Button
              title="Cevabı Gönder"
              onPress={handleSubmit}
              disabled={submitting}
            />
          </View>
        </Card>

        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>✅ İyi Cevap İpuçları</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tip}>• Soruyu tam olarak cevaplamaya çalış.</Text>
            <Text style={styles.tip}>• Adım adım açıkla, mümkünse örnek ver.</Text>
            <Text style={styles.tip}>• Emin olmadığın noktalarda belirt.</Text>
            <Text style={styles.tip}>• Saygılı ve destekleyici ol.</Text>
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
  questionImage: {
    marginTop: 10,
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
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
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  imagePreview: {
    marginTop: 10,
    gap: 8,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
});
