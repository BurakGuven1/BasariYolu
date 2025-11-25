import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Image,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../types/navigation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { createQuestion } from '../../lib/questionPortalApi';
import { supabase } from '../../lib/supabase';

type CreateQuestionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CreateQuestion'
>;

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

const GRADE_LEVELS = ['5', '6', '7', '8', '9', '10', '11', '12'];

const EXAM_TYPES = ['TYT', 'AYT', 'LGS', 'AYT-SAY', 'AYT-EA', 'AYT-SÖZ'];

export const CreateQuestionScreen: React.FC = () => {
  const navigation = useNavigation<CreateQuestionScreenNavigationProp>();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<{
    uri: string;
    base64?: string;
    mimeType?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject: '',
    grade_level: '',
    exam_type: '',
  });

  useEffect(() => {
    loadStudentId();
  }, []);

  const loadStudentId = async () => {
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
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Veri yüklenemedi');
      navigation.goBack();
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
    if (!formData.title.trim()) {
      Alert.alert('Uyarı', 'Soru başlığını giriniz');
      return;
    }

    if (!formData.content.trim()) {
      Alert.alert('Uyarı', 'Soru içeriğini giriniz');
      return;
    }

    if (!studentId) {
      Alert.alert('Hata', 'Öğrenci bilgisi bulunamadı');
      return;
    }

    setLoading(true);
    try {
      await createQuestion({
        student_id: studentId,
        title: formData.title.trim(),
        description: formData.content.trim(),
        subject: formData.subject || null,
        image_url: buildDataUrl(),
        grade_level: formData.grade_level || null,
        exam_type: formData.exam_type || null,
      });

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
            Diğer öğrencilerin görebileceği bir soru oluştur. Detaylı ve açık sorular daha iyi cevaplar alır.
          </Text>
        </Card>

        <Card>
          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Soru Başlığı *</Text>
              <TextInput
                placeholder="Örn: Matematik fonksiyonlar konusunda yardım"
                placeholderTextColor="#94A3B8"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                style={styles.input}
                maxLength={200}
              />
              <Text style={styles.helperText}>
                {formData.title.length}/200 karakter
              </Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Soru İçeriği *</Text>
              <TextInput
                placeholder="Sorunuzu detaylı bir şekilde açıklayın..."
                placeholderTextColor="#94A3B8"
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                multiline
                numberOfLines={8}
                style={[styles.input, styles.textArea]}
                textAlignVertical="top"
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

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Sınıf Seviyesi (Opsiyonel)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subjectsContainer}
              >
                {GRADE_LEVELS.map((grade) => (
                  <Pressable
                    key={grade}
                    style={[
                      styles.subjectChip,
                      formData.grade_level === grade && styles.subjectChipActive,
                    ]}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        grade_level: formData.grade_level === grade ? '' : grade,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.subjectChipText,
                        formData.grade_level === grade && styles.subjectChipTextActive,
                      ]}
                    >
                      {grade}. Sınıf
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Sınav Tipi (Opsiyonel)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subjectsContainer}
              >
                {EXAM_TYPES.map((examType) => (
                  <Pressable
                    key={examType}
                    style={[
                      styles.subjectChip,
                      formData.exam_type === examType && styles.subjectChipActive,
                    ]}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        exam_type: formData.exam_type === examType ? '' : examType,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.subjectChipText,
                        formData.exam_type === examType && styles.subjectChipTextActive,
                      ]}
                    >
                      {examType}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
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
                  <Pressable onPress={() => setImage(null)}>
                    <Text style={styles.removeImage}>Kaldır</Text>
                  </Pressable>
                </View>
              )}
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
            <Text style={styles.tip}>• Net ve anlaşılır bir başlık kullan.</Text>
            <Text style={styles.tip}>• Sorunuzu detaylı anlatın, denediğiniz adımları ekleyin.</Text>
            <Text style={styles.tip}>• İlgili dersi/konuyu seçmeyi unutmayın.</Text>
            <Text style={styles.tip}>• Fotoğraf ekliyorsanız net ve okunur olsun.</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
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
  },
  imageActions: {
    flexDirection: 'row',
    gap: 8,
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
  imagePreview: {
    marginTop: 10,
    gap: 6,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  removeImage: {
    color: '#DC2626',
    fontWeight: '700',
  },
});
