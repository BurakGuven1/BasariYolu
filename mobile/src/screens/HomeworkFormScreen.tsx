import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Calendar, FileText, X } from 'lucide-react-native';
import { addHomework, updateHomework } from '../lib/supabase';
import { RootStackParamList, Homework } from '../types';

type HomeworkFormScreenRouteProp = RouteProp<RootStackParamList, 'HomeworkForm'>;
type HomeworkFormScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'HomeworkForm'
>;

const subjects = [
  'Matematik',
  'Fen Bilimleri',
  'Türkçe',
  'Sosyal Bilimler',
  'İngilizce',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Tarih',
  'Coğrafya',
  'Edebiyat',
  'Diğer',
];

export default function HomeworkFormScreen() {
  const navigation = useNavigation<HomeworkFormScreenNavigationProp>();
  const route = useRoute<HomeworkFormScreenRouteProp>();
  const { editData, studentId } = route.params;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    due_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title || '',
        description: editData.description || '',
        subject: editData.subject || '',
        due_date: editData.due_date || new Date().toISOString().split('T')[0],
        notes: editData.notes || '',
      });
    }
  }, [editData]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Hata', 'Lütfen ödev başlığını girin');
      return;
    }

    if (!formData.subject) {
      Alert.alert('Hata', 'Lütfen ders seçin');
      return;
    }

    if (!formData.due_date) {
      Alert.alert('Hata', 'Lütfen son teslim tarihini seçin');
      return;
    }

    setLoading(true);

    try {
      const homeworkData = {
        student_id: studentId,
        ...formData,
      };

      if (editData) {
        await updateHomework(editData.id, homeworkData);
        Alert.alert('Başarılı', 'Ödev güncellendi');
      } else {
        await addHomework(homeworkData);
        Alert.alert('Başarılı', 'Ödev kaydedildi');
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <X size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">
          {editData ? 'Ödev Düzenle' : 'Yeni Ödev'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          <View className="bg-green-100 p-4 rounded-full w-16 h-16 items-center justify-center mb-4 self-center">
            <FileText size={32} color="#10B981" />
          </View>

          <Text className="text-center text-gray-600 mb-6">
            Ödevinizi kaydedin ve takip edin
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Ödev Başlığı *</Text>
            <TextInput
              className="px-3 py-3 border border-gray-300 rounded-lg bg-white"
              placeholder="Örn: Matematik - Limit Soruları"
              value={formData.title}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, title: value }))}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Ders *</Text>
            <View className="border border-gray-300 rounded-lg overflow-hidden bg-white">
              <Picker
                selectedValue={formData.subject}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, subject: value }))}
              >
                <Picker.Item label="Ders seçin" value="" />
                {subjects.map((subject) => (
                  <Picker.Item key={subject} label={subject} value={subject} />
                ))}
              </Picker>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Son Teslim Tarihi *</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="px-3 py-3 border border-gray-300 rounded-lg bg-white flex-row items-center"
            >
              <Calendar size={20} color="#9CA3AF" />
              <Text className="ml-2 text-gray-900">{formData.due_date}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(formData.due_date)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setFormData((prev) => ({
                      ...prev,
                      due_date: selectedDate.toISOString().split('T')[0],
                    }));
                  }
                }}
              />
            )}
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Açıklama</Text>
            <TextInput
              className="px-3 py-3 border border-gray-300 rounded-lg bg-white"
              placeholder="Ödev detayları..."
              value={formData.description}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, description: value }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Notlar</Text>
            <TextInput
              className="px-3 py-3 border border-gray-300 rounded-lg bg-white"
              placeholder="Ek notlar..."
              value={formData.notes}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, notes: value }))}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="flex-1 bg-gray-100 py-3 rounded-lg items-center"
            >
              <Text className="text-gray-700 font-semibold">İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 py-3 rounded-lg items-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold">Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
