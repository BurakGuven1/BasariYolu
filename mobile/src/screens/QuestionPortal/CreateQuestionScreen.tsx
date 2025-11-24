import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createQuestion } from '../../lib/questionPortalApi';
import { supabase } from '../../lib/supabase';

type CreateQuestionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateQuestion'>;

const SUBJECTS = [
  'Matematik',
  'Türkçe',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Edebiyat',
  'Tarih',
  'Coğrafya',
  'Felsefe',
  'Din Kültürü',
  'İngilizce',
  'Diğer',
];

export const CreateQuestionScreen: React.FC = () => {
  const navigation = useNavigation<CreateQuestionScreenNavigationProp>();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject: '',
  });

  useEffect(() => {
    loadStudentId();
  }, []);

  const loadStudentId = async () => {
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
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Veri yüklenemedi');
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Uyarı', 'Soru başlığı giriniz');
      return;
    }

    if (!formData.content.trim()) {
      Alert.alert('Uyarı', 'Soru içeriği giriniz');
      return;
    }

    if (!studentId) {
      Alert.alert('Hata', 'Öğrenci bilgisi bulunamadı');
      return;
    }

    setLoading(true);
    try {
      await createQuestion(
        studentId,
        formData.title,
        formData.content,
        formData.subject || null
      );

      Alert.alert('Başarılı', 'Soru başarıyla oluşturuldu', [
        {
          text: 'Tamam',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Soru oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.header}>Yeni Soru Oluştur</Text>
          <Text style={styles.description}>
            Diğer öğrencilere sorabileceğin bir soru oluştur. Detaylı ve açık sorular daha iyi cevaplar alır.
          </Text>
        </Card>

        <Card>
          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Soru Başlığı *</Text>
              <Input
                placeholder="Örn: Matematik fonksiyonlar konusunda yardım"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                maxLength={200}
              />
              <Text style={styles.helperText}>
                {formData.title.length}/200 karakter
              </Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Soru İçeriği *</Text>
              <Input
                placeholder="Sorunuzu detaylı bir şekilde açıklayın..."
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                multiline
                numberOfLines={8}
                style={styles.textArea}
              />
              <Text style={styles.helperText}>
                {formData.content.length} karakter
              </Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Ders/Konu (Opsiyonel)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subjectsContainer}
              >
                {SUBJECTS.map((subject) => (
                  <Pressable
                    key={subject}
                    style={[
                      styles.subjectChip,
                      formData.subject === subject && styles.subjectChipActive,
                    ]}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        subject: formData.subject === subject ? '' : subject,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.subjectChipText,
                        formData.subject === subject && styles.subjectChipTextActive,
                      ]}
                    >
                      {subject}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <Button
              title="Soruyu Yayınla"
              onPress={handleSubmit}
              disabled={loading}
            />
          </View>
        </Card>

        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 İpuçları</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tip}>• Net ve anlaşılır bir başlık kullan</Text>
            <Text style={styles.tip}>• Sorunuzu detaylı açıklayın</Text>
            <Text style={styles.tip}>• Varsa denediğiniz çözümleri belirtin</Text>
            <Text style={styles.tip}>• İlgili dersi seçmeyi unutmayın</Text>
            <Text style={styles.tip}>• Saygılı ve nazik bir dil kullanın</Text>
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
  header: {
    fontSize: 20,
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
    gap: 20,
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  subjectsContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  subjectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subjectChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  subjectChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  subjectChipTextActive: {
    color: '#6366F1',
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
