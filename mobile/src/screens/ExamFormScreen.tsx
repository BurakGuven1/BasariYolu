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
import { Calendar, BookOpen, Target, X } from 'lucide-react-native';
import { addExamResult, updateExamResult } from '../lib/supabase';
import { RootStackParamList, ExamResult } from '../types';

type ExamFormScreenRouteProp = RouteProp<RootStackParamList, 'ExamForm'>;
type ExamFormScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ExamForm'>;

interface FormData {
  exam_name: string;
  exam_type: 'TYT' | 'AYT' | 'LGS' | 'custom';
  exam_date: string;
  tyt_turkce_dogru: string;
  tyt_turkce_yanlis: string;
  tyt_matematik_dogru: string;
  tyt_matematik_yanlis: string;
  tyt_fen_dogru: string;
  tyt_fen_yanlis: string;
  tyt_sosyal_dogru: string;
  tyt_sosyal_yanlis: string;
  ayt_matematik_dogru: string;
  ayt_matematik_yanlis: string;
  ayt_fizik_dogru: string;
  ayt_fizik_yanlis: string;
  ayt_kimya_dogru: string;
  ayt_kimya_yanlis: string;
  ayt_biyoloji_dogru: string;
  ayt_biyoloji_yanlis: string;
  ayt_edebiyat_dogru: string;
  ayt_edebiyat_yanlis: string;
  ayt_tarih1_dogru: string;
  ayt_tarih1_yanlis: string;
  ayt_cografya1_dogru: string;
  ayt_cografya1_yanlis: string;
  ayt_tarih2_dogru: string;
  ayt_tarih2_yanlis: string;
  ayt_cografya2_dogru: string;
  ayt_cografya2_yanlis: string;
  ayt_felsefe_dogru: string;
  ayt_felsefe_yanlis: string;
  ayt_dkab_dogru: string;
  ayt_dkab_yanlis: string;
  lgs_turkce_dogru: string;
  lgs_turkce_yanlis: string;
  lgs_matematik_dogru: string;
  lgs_matematik_yanlis: string;
  lgs_fen_dogru: string;
  lgs_fen_yanlis: string;
  lgs_inkılap_dogru: string;
  lgs_inkılap_yanlis: string;
  lgs_din_dogru: string;
  lgs_din_yanlis: string;
  lgs_ingilizce_dogru: string;
  lgs_ingilizce_yanlis: string;
  notes: string;
}

const questionLimits = {
  tyt_turkce: 40,
  tyt_matematik: 40,
  tyt_fen: 20,
  tyt_sosyal: 20,
  ayt_edebiyat: 24,
  ayt_tarih1: 10,
  ayt_cografya1: 6,
  ayt_tarih2: 11,
  ayt_cografya2: 11,
  ayt_felsefe: 12,
  ayt_dkab: 6,
  ayt_matematik: 40,
  ayt_fizik: 14,
  ayt_kimya: 13,
  ayt_biyoloji: 13,
  lgs_turkce: 20,
  lgs_matematik: 20,
  lgs_fen: 20,
  lgs_inkılap: 10,
  lgs_din: 10,
  lgs_ingilizce: 10,
};

export default function ExamFormScreen() {
  const navigation = useNavigation<ExamFormScreenNavigationProp>();
  const route = useRoute<ExamFormScreenRouteProp>();
  const { editData, studentId } = route.params;

  const [formData, setFormData] = useState<FormData>({
    exam_name: '',
    exam_type: 'TYT',
    exam_date: new Date().toISOString().split('T')[0],
    tyt_turkce_dogru: '',
    tyt_turkce_yanlis: '',
    tyt_matematik_dogru: '',
    tyt_matematik_yanlis: '',
    tyt_fen_dogru: '',
    tyt_fen_yanlis: '',
    tyt_sosyal_dogru: '',
    tyt_sosyal_yanlis: '',
    ayt_matematik_dogru: '',
    ayt_matematik_yanlis: '',
    ayt_fizik_dogru: '',
    ayt_fizik_yanlis: '',
    ayt_kimya_dogru: '',
    ayt_kimya_yanlis: '',
    ayt_biyoloji_dogru: '',
    ayt_biyoloji_yanlis: '',
    ayt_edebiyat_dogru: '',
    ayt_edebiyat_yanlis: '',
    ayt_tarih1_dogru: '',
    ayt_tarih1_yanlis: '',
    ayt_cografya1_dogru: '',
    ayt_cografya1_yanlis: '',
    ayt_tarih2_dogru: '',
    ayt_tarih2_yanlis: '',
    ayt_cografya2_dogru: '',
    ayt_cografya2_yanlis: '',
    ayt_felsefe_dogru: '',
    ayt_felsefe_yanlis: '',
    ayt_dkab_dogru: '',
    ayt_dkab_yanlis: '',
    lgs_turkce_dogru: '',
    lgs_turkce_yanlis: '',
    lgs_matematik_dogru: '',
    lgs_matematik_yanlis: '',
    lgs_fen_dogru: '',
    lgs_fen_yanlis: '',
    lgs_inkılap_dogru: '',
    lgs_inkılap_yanlis: '',
    lgs_din_dogru: '',
    lgs_din_yanlis: '',
    lgs_ingilizce_dogru: '',
    lgs_ingilizce_yanlis: '',
    notes: '',
  });

  const [aytType, setAytType] = useState<'sayisal' | 'esit_agirlik' | 'sozel'>('sayisal');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (editData) {
      const details = editData.exam_details ? JSON.parse(editData.exam_details) : {};
      setFormData({
        exam_name: editData.exam_name || '',
        exam_type: editData.exam_type || 'TYT',
        exam_date: editData.exam_date || new Date().toISOString().split('T')[0],
        ...details,
      });
      if (details.ayt_type) {
        setAytType(details.ayt_type);
      }
    }
  }, [editData]);

  const calculateNetScore = (dogru: string, yanlis: string) => {
    const d = parseInt(dogru) || 0;
    const y = parseInt(yanlis) || 0;
    return Math.max(0, d - y / 4);
  };

  const validateInput = (field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const limit = questionLimits[field as keyof typeof questionLimits];

    if (limit && numValue > limit) {
      return false;
    }

    if (field.includes('_dogru')) {
      const baseField = field.replace('_dogru', '');
      const yanlisValue =
        parseInt(formData[`${baseField}_yanlis` as keyof FormData] as string) || 0;
      const limit = questionLimits[baseField as keyof typeof questionLimits];
      if (limit && numValue + yanlisValue > limit) {
        return false;
      }
    }

    if (field.includes('_yanlis')) {
      const baseField = field.replace('_yanlis', '');
      const dogruValue =
        parseInt(formData[`${baseField}_dogru` as keyof FormData] as string) || 0;
      const limit = questionLimits[baseField as keyof typeof questionLimits];
      if (limit && dogruValue + numValue > limit) {
        return false;
      }
    }

    return true;
  };

  const calculateTYTScore = () => {
    const turkceNet = calculateNetScore(formData.tyt_turkce_dogru, formData.tyt_turkce_yanlis);
    const matematikNet = calculateNetScore(
      formData.tyt_matematik_dogru,
      formData.tyt_matematik_yanlis
    );
    const fenNet = calculateNetScore(formData.tyt_fen_dogru, formData.tyt_fen_yanlis);
    const sosyalNet = calculateNetScore(formData.tyt_sosyal_dogru, formData.tyt_sosyal_yanlis);

    const hamPuan =
      100 + turkceNet * 3.33 + matematikNet * 3.33 + fenNet * 3.45 + sosyalNet * 3.45;

    return Math.min(500, Math.max(100, hamPuan));
  };

  const calculateAYTScore = () => {
    const m = (d: string, y: string) => calculateNetScore(d, y);

    let aytNetToplam = 0;

    if (aytType === 'sayisal') {
      const aytMat = m(formData.ayt_matematik_dogru, formData.ayt_matematik_yanlis);
      const fiz = m(formData.ayt_fizik_dogru, formData.ayt_fizik_yanlis);
      const kim = m(formData.ayt_kimya_dogru, formData.ayt_kimya_yanlis);
      const bio = m(formData.ayt_biyoloji_dogru, formData.ayt_biyoloji_yanlis);
      aytNetToplam = aytMat + fiz + kim + bio;
    } else if (aytType === 'esit_agirlik') {
      const aytMat = m(formData.ayt_matematik_dogru, formData.ayt_matematik_yanlis);
      const edb = m(formData.ayt_edebiyat_dogru, formData.ayt_edebiyat_yanlis);
      const tar1 = m(formData.ayt_tarih1_dogru, formData.ayt_tarih1_yanlis);
      const cog1 = m(formData.ayt_cografya1_dogru, formData.ayt_cografya1_yanlis);
      aytNetToplam = aytMat + edb + tar1 + cog1;
    } else {
      const edb = m(formData.ayt_edebiyat_dogru, formData.ayt_edebiyat_yanlis);
      const tar1 = m(formData.ayt_tarih1_dogru, formData.ayt_tarih1_yanlis);
      const cog1 = m(formData.ayt_cografya1_dogru, formData.ayt_cografya1_yanlis);
      const tar2 = m(formData.ayt_tarih2_dogru, formData.ayt_tarih2_yanlis);
      const cog2 = m(formData.ayt_cografya2_dogru, formData.ayt_cografya2_yanlis);
      const fls = m(formData.ayt_felsefe_dogru, formData.ayt_felsefe_yanlis);
      const dkab = m(formData.ayt_dkab_dogru, formData.ayt_dkab_yanlis);
      aytNetToplam = edb + tar1 + cog1 + tar2 + cog2 + fls + dkab;
    }

    const aytHamPuan = aytNetToplam * 5 + 100;
    return Math.min(500, Math.max(100, aytHamPuan));
  };

  const calculateYKSScore = () => {
    const tytPuan = calculateTYTScore();
    const aytPuan = calculateAYTScore();
    const yksPuani = tytPuan * 0.4 + aytPuan * 0.6;
    return Math.min(500, Math.max(100, yksPuani));
  };

  const calculateLGSScore = () => {
    const turkceNet = calculateNetScore(formData.lgs_turkce_dogru, formData.lgs_turkce_yanlis);
    const matematikNet = calculateNetScore(
      formData.lgs_matematik_dogru,
      formData.lgs_matematik_yanlis
    );
    const fenNet = calculateNetScore(formData.lgs_fen_dogru, formData.lgs_fen_yanlis);
    const inkilapNet = calculateNetScore(formData.lgs_inkılap_dogru, formData.lgs_inkılap_yanlis);
    const ingilizceNet = calculateNetScore(
      formData.lgs_ingilizce_dogru,
      formData.lgs_ingilizce_yanlis
    );
    const dinNet = calculateNetScore(formData.lgs_din_dogru, formData.lgs_din_yanlis);

    const katsayiliToplam =
      turkceNet * 4 +
      matematikNet * 4 +
      fenNet * 4 +
      inkilapNet * 1 +
      ingilizceNet * 1 +
      dinNet * 1;

    const hamPuan = (katsayiliToplam * 500) / 270;
    return Math.min(500, Math.max(0, hamPuan));
  };

  const calculateTotalScore = () => {
    const examType = formData.exam_type;

    if (examType === 'TYT') {
      return calculateTYTScore();
    } else if (examType === 'AYT') {
      return calculateYKSScore();
    } else if (examType === 'LGS') {
      return calculateLGSScore();
    }

    return 0;
  };

  const handleSubmit = async () => {
    if (!formData.exam_name.trim()) {
      Alert.alert('Hata', 'Lütfen deneme adını girin');
      return;
    }

    if (!formData.exam_date) {
      Alert.alert('Hata', 'Lütfen deneme tarihini seçin');
      return;
    }

    setLoading(true);

    try {
      const examDataToSave = {
        student_id: studentId,
        exam_name: formData.exam_name,
        exam_type: formData.exam_type,
        exam_date: formData.exam_date,
        total_score:
          formData.exam_type === 'AYT' ? calculateYKSScore() : calculateTotalScore(),
        notes: formData.notes,
        exam_details: JSON.stringify({
          ...formData,
          ayt_type: aytType,
          tyt_score: formData.exam_type === 'AYT' ? calculateTYTScore() : null,
          ayt_score: formData.exam_type === 'AYT' ? calculateAYTScore() : null,
          yks_score: formData.exam_type === 'AYT' ? calculateYKSScore() : null,
        }),
      };

      if (editData) {
        await updateExamResult(editData.id, examDataToSave);
        Alert.alert('Başarılı', 'Deneme güncellendi');
      } else {
        await addExamResult(examDataToSave);
        Alert.alert('Başarılı', 'Deneme kaydedildi');
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field.includes('_dogru') || field.includes('_yanlis')) {
      if (!validateInput(field, value)) {
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderInputField = (
    label: string,
    dogruField: keyof FormData,
    yanlisField: keyof FormData,
    maxQuestions: number
  ) => {
    const dogruValue = formData[dogruField] as string;
    const yanlisValue = formData[yanlisField] as string;
    const net = calculateNetScore(dogruValue, yanlisValue);

    return (
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          {label} ({maxQuestions} soru)
        </Text>
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white"
            placeholder="Doğru"
            keyboardType="numeric"
            value={dogruValue}
            onChangeText={(value) => handleInputChange(dogruField, value)}
            maxLength={2}
          />
          <TextInput
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white"
            placeholder="Yanlış"
            keyboardType="numeric"
            value={yanlisValue}
            onChangeText={(value) => handleInputChange(yanlisField, value)}
            maxLength={2}
          />
        </View>
        <Text className="text-xs text-gray-500 mt-1">
          Net: {net.toFixed(1)} | Toplam: {(parseInt(dogruValue) || 0) + (parseInt(yanlisValue) || 0)}/
          {maxQuestions}
        </Text>
      </View>
    );
  };

  const renderTYTFields = () => (
    <View>
      <Text className="text-base font-semibold text-blue-600 mb-3">
        TYT - Temel Yeterlilik Testi (120 soru)
      </Text>
      {renderInputField('Türkçe', 'tyt_turkce_dogru', 'tyt_turkce_yanlis', 40)}
      {renderInputField('Matematik', 'tyt_matematik_dogru', 'tyt_matematik_yanlis', 40)}
      {renderInputField('Fen Bilimleri', 'tyt_fen_dogru', 'tyt_fen_yanlis', 20)}
      {renderInputField('Sosyal Bilgiler', 'tyt_sosyal_dogru', 'tyt_sosyal_yanlis', 20)}
    </View>
  );

  const renderAYTFields = () => (
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-semibold text-green-600">
          AYT - Alan Yeterlilik Testi
        </Text>
        <View className="border border-gray-300 rounded-lg overflow-hidden">
          <Picker
            selectedValue={aytType}
            onValueChange={(value) => setAytType(value as any)}
            style={{ width: 140, height: 40 }}
          >
            <Picker.Item label="Sayısal" value="sayisal" />
            <Picker.Item label="Eşit Ağırlık" value="esit_agirlik" />
            <Picker.Item label="Sözel" value="sozel" />
          </Picker>
        </View>
      </View>

      <View className="bg-blue-50 p-3 rounded-lg mb-4">
        <Text className="text-sm font-medium text-blue-800 mb-2">
          TYT Kısmı (AYT ile birlikte)
        </Text>
        {renderInputField('Türkçe', 'tyt_turkce_dogru', 'tyt_turkce_yanlis', 40)}
        {renderInputField('Matematik', 'tyt_matematik_dogru', 'tyt_matematik_yanlis', 40)}
        {renderInputField('Fen Bilimleri', 'tyt_fen_dogru', 'tyt_fen_yanlis', 20)}
        {renderInputField('Sosyal Bilgiler', 'tyt_sosyal_dogru', 'tyt_sosyal_yanlis', 20)}
      </View>

      {aytType === 'sayisal' && (
        <>
          {renderInputField('Matematik', 'ayt_matematik_dogru', 'ayt_matematik_yanlis', 40)}
          {renderInputField('Fizik', 'ayt_fizik_dogru', 'ayt_fizik_yanlis', 14)}
          {renderInputField('Kimya', 'ayt_kimya_dogru', 'ayt_kimya_yanlis', 13)}
          {renderInputField('Biyoloji', 'ayt_biyoloji_dogru', 'ayt_biyoloji_yanlis', 13)}
        </>
      )}

      {aytType === 'esit_agirlik' && (
        <>
          {renderInputField('Matematik', 'ayt_matematik_dogru', 'ayt_matematik_yanlis', 40)}
          {renderInputField(
            'Türk Dili ve Edebiyatı',
            'ayt_edebiyat_dogru',
            'ayt_edebiyat_yanlis',
            24
          )}
          {renderInputField('Tarih-1', 'ayt_tarih1_dogru', 'ayt_tarih1_yanlis', 10)}
          {renderInputField('Coğrafya-1', 'ayt_cografya1_dogru', 'ayt_cografya1_yanlis', 6)}
        </>
      )}

      {aytType === 'sozel' && (
        <>
          {renderInputField(
            'Türk Dili ve Edebiyatı',
            'ayt_edebiyat_dogru',
            'ayt_edebiyat_yanlis',
            24
          )}
          {renderInputField('Tarih-1', 'ayt_tarih1_dogru', 'ayt_tarih1_yanlis', 10)}
          {renderInputField('Coğrafya-1', 'ayt_cografya1_dogru', 'ayt_cografya1_yanlis', 6)}
          {renderInputField('Tarih-2', 'ayt_tarih2_dogru', 'ayt_tarih2_yanlis', 11)}
          {renderInputField('Coğrafya-2', 'ayt_cografya2_dogru', 'ayt_cografya2_yanlis', 11)}
          {renderInputField('Felsefe Grubu', 'ayt_felsefe_dogru', 'ayt_felsefe_yanlis', 12)}
          {renderInputField(
            'Din Kültürü ve Ahlak Bilgisi',
            'ayt_dkab_dogru',
            'ayt_dkab_yanlis',
            6
          )}
        </>
      )}
    </View>
  );

  const renderLGSFields = () => (
    <View>
      <Text className="text-base font-semibold text-purple-600 mb-3">
        LGS - Liseye Geçiş Sınavı (90 soru)
      </Text>
      {renderInputField('Türkçe', 'lgs_turkce_dogru', 'lgs_turkce_yanlis', 20)}
      {renderInputField('Matematik', 'lgs_matematik_dogru', 'lgs_matematik_yanlis', 20)}
      {renderInputField('Fen Bilimleri', 'lgs_fen_dogru', 'lgs_fen_yanlis', 20)}
      {renderInputField('T.C. İnkılap Tarihi', 'lgs_inkılap_dogru', 'lgs_inkılap_yanlis', 10)}
      {renderInputField(
        'Din Kültürü ve Ahlak Bilgisi',
        'lgs_din_dogru',
        'lgs_din_yanlis',
        10
      )}
      {renderInputField('İngilizce', 'lgs_ingilizce_dogru', 'lgs_ingilizce_yanlis', 10)}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <X size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">
          {editData ? 'Deneme Düzenle' : 'Yeni Deneme'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          <View className="bg-blue-100 p-4 rounded-full w-16 h-16 items-center justify-center mb-4 self-center">
            <Target size={32} color="#3B82F6" />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Deneme Adı *</Text>
            <TextInput
              className="px-3 py-3 border border-gray-300 rounded-lg bg-white"
              placeholder="Örn: TYT Deneme 15"
              value={formData.exam_name}
              onChangeText={(value) => handleInputChange('exam_name', value)}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Deneme Türü *</Text>
            <View className="border border-gray-300 rounded-lg overflow-hidden bg-white">
              <Picker
                selectedValue={formData.exam_type}
                onValueChange={(value) => handleInputChange('exam_type', value)}
              >
                <Picker.Item label="TYT - Temel Yeterlilik Testi" value="TYT" />
                <Picker.Item label="AYT - Alan Yeterlilik Testi" value="AYT" />
                <Picker.Item label="LGS - Liseye Geçiş Sınavı" value="LGS" />
                <Picker.Item label="Diğer" value="custom" />
              </Picker>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Deneme Tarihi *</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="px-3 py-3 border border-gray-300 rounded-lg bg-white flex-row items-center"
            >
              <Calendar size={20} color="#9CA3AF" />
              <Text className="ml-2 text-gray-900">{formData.exam_date}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(formData.exam_date)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    handleInputChange('exam_date', selectedDate.toISOString().split('T')[0]);
                  }
                }}
              />
            )}
          </View>

          <View className="bg-gray-100 p-4 rounded-lg mb-4">
            <View className="flex-row items-center mb-3">
              <BookOpen size={20} color="#3B82F6" />
              <Text className="text-base font-semibold text-gray-900 ml-2">
                Sınav Sonuçları
              </Text>
            </View>

            {formData.exam_type === 'TYT' && renderTYTFields()}
            {formData.exam_type === 'AYT' && renderAYTFields()}
            {formData.exam_type === 'LGS' && renderLGSFields()}
            {formData.exam_type === 'custom' && (
              <View className="py-8 items-center">
                <Text className="text-gray-500 text-center">
                  Bu sınav türü için detaylı form henüz hazırlanmamıştır.
                </Text>
                <Text className="text-gray-500 text-center mt-1">
                  Genel notlarınızı aşağıdaki not alanına yazabilirsiniz.
                </Text>
              </View>
            )}

            {formData.exam_type !== 'custom' && (
              <View className="mt-4 p-3 bg-blue-50 rounded-lg">
                {formData.exam_type === 'AYT' && (
                  <>
                    <Text className="text-sm text-blue-800">
                      TYT Ham Puan: {calculateTYTScore().toFixed(1)} / 500
                    </Text>
                    <Text className="text-sm text-blue-800">
                      AYT Ham Puan ({aytType}): {calculateAYTScore().toFixed(1)} / 500
                    </Text>
                    <Text className="text-sm font-bold text-green-800">
                      YKS Puanı: {calculateYKSScore().toFixed(1)} / 500
                    </Text>
                  </>
                )}
                {formData.exam_type === 'TYT' && (
                  <Text className="text-sm font-bold text-blue-800">
                    TYT Puanı: {calculateTotalScore().toFixed(1)} / 500
                  </Text>
                )}
                {formData.exam_type === 'LGS' && (
                  <Text className="text-sm font-bold text-purple-800">
                    LGS Puanı: {calculateTotalScore().toFixed(1)} / 500
                  </Text>
                )}
                <Text className="text-xs text-blue-600 mt-1">
                  * OBP (Okul Başarı Puanı) dahil değildir
                </Text>
              </View>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Notlar (Opsiyonel)
            </Text>
            <TextInput
              className="px-3 py-3 border border-gray-300 rounded-lg bg-white"
              placeholder="Deneme hakkında notlarınız..."
              value={formData.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              multiline
              numberOfLines={3}
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
              className="flex-1 bg-blue-600 py-3 rounded-lg items-center"
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
