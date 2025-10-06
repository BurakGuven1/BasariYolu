import React, { useState, useEffect } from 'react';
import { X, Calendar, BookOpen, Target } from 'lucide-react';
import { addExamResult } from '../lib/supabase';

interface ExamFormProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onSuccess: () => void;
  editData?: any;
}

export default function ExamForm({ isOpen, onClose, studentId, onSuccess, editData }: ExamFormProps) {
  const [formData, setFormData] = useState({
    exam_name: '',
    exam_type: 'TYT',
    exam_date: '',
    // TYT Scores (doğru sayıları)
    tyt_turkce_dogru: '',
    tyt_turkce_yanlis: '',
    tyt_matematik_dogru: '',
    tyt_matematik_yanlis: '',
    tyt_fen_dogru: '',
    tyt_fen_yanlis: '',
    tyt_sosyal_dogru: '',
    tyt_sosyal_yanlis: '',
    // AYT Scores (doğru sayıları)
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
    ayt_matematik_dogru: '',
    ayt_matematik_yanlis: '',
    ayt_fizik_dogru: '',
    ayt_fizik_yanlis: '',
    ayt_kimya_dogru: '',
    ayt_kimya_yanlis: '',
    ayt_biyoloji_dogru: '',
    ayt_biyoloji_yanlis: '',
    // LGS Scores (doğru sayıları)
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
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [aytType, setAytType] = useState<'sayisal' | 'esit_agirlik' | 'sozel'>('sayisal');

  // Load edit data when editing
  useEffect(() => {
    if (editData && isOpen) {
      const details = editData.exam_details ? JSON.parse(editData.exam_details) : {};
      setFormData({
        exam_name: editData.exam_name || '',
        exam_type: editData.exam_type || 'TYT',
        exam_date: editData.exam_date || '',
        ...details
      });
      if (details.ayt_type) {
        setAytType(details.ayt_type);
      }
    } else if (!editData && isOpen) {
      // Reset form for new exam
      setFormData({
        exam_name: '',
        exam_type: 'TYT',
        exam_date: '',
        tyt_turkce_dogru: '',
        tyt_turkce_yanlis: '',
        tyt_matematik_dogru: '',
        tyt_matematik_yanlis: '',
        tyt_fen_dogru: '',
        tyt_fen_yanlis: '',
        tyt_sosyal_dogru: '',
        tyt_sosyal_yanlis: '',
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
        ayt_matematik_dogru: '',
        ayt_matematik_yanlis: '',
        ayt_fizik_dogru: '',
        ayt_fizik_yanlis: '',
        ayt_kimya_dogru: '',
        ayt_kimya_yanlis: '',
        ayt_biyoloji_dogru: '',
        ayt_biyoloji_yanlis: '',
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
        notes: ''
      });
      setAytType('sayisal');
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  // Soru sayısı limitleri
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
    lgs_ingilizce: 10
  };

  const calculateNetScore = (dogru: string, yanlis: string) => {
    const d = parseInt(dogru) || 0;
    const y = parseInt(yanlis) || 0;
    return Math.max(0, d - (y / 4));
  };

  const validateInput = (field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const limit = questionLimits[field as keyof typeof questionLimits];
    
    if (limit && numValue > limit) {
      return false;
    }
    
    // Doğru + Yanlış toplam soru sayısını geçemez
    if (field.includes('_dogru')) {
      const baseField = field.replace('_dogru', '');
      const yanlisValue = parseInt(formData[`${baseField}_yanlis` as keyof typeof formData] as string) || 0;
      const limit = questionLimits[baseField as keyof typeof questionLimits];
      if (limit && (numValue + yanlisValue) > limit) {
        return false;
      }
    }
    
    if (field.includes('_yanlis')) {
      const baseField = field.replace('_yanlis', '');
      const dogruValue = parseInt(formData[`${baseField}_dogru` as keyof typeof formData] as string) || 0;
      const limit = questionLimits[baseField as keyof typeof questionLimits];
      if (limit && (dogruValue + numValue) > limit) {
        return false;
      }
    }
    
    return true;
  };

  const calculateTYTScore = () => {
    const turkceNet = calculateNetScore(formData.tyt_turkce_dogru, formData.tyt_turkce_yanlis);
    const matematikNet = calculateNetScore(formData.tyt_matematik_dogru, formData.tyt_matematik_yanlis);
    const fenNet = calculateNetScore(formData.tyt_fen_dogru, formData.tyt_fen_yanlis);
    const sosyalNet = calculateNetScore(formData.tyt_sosyal_dogru, formData.tyt_sosyal_yanlis);

    const hamPuan =
        100 +
        (turkceNet * 3.33) +
        (matematikNet * 3.33) +
        (fenNet * 3.45) +
        (sosyalNet * 3.45);

    return Math.min(500, Math.max(100, hamPuan));
  };

  const calculateAYTScore = () => {
  // Ortak yardımcı: sayı/4 kırpması zaten calculateNetScore'da var.
  const m = (d: string, y: string) => calculateNetScore(d, y);

  let aytNetToplam = 0;

  if (aytType === 'sayisal') {
    const aytMat = m(formData.ayt_matematik_dogru, formData.ayt_matematik_yanlis); // 40
    const fiz = m(formData.ayt_fizik_dogru, formData.ayt_fizik_yanlis);             // 14
    const kim = m(formData.ayt_kimya_dogru, formData.ayt_kimya_yanlis);             // 13
    const bio = m(formData.ayt_biyoloji_dogru, formData.ayt_biyoloji_yanlis);       // 13
    aytNetToplam = aytMat + fiz + kim + bio; // 40 + 40 = 80 max
  } else if (aytType === 'esit_agirlik') {
    const aytMat = m(formData.ayt_matematik_dogru, formData.ayt_matematik_yanlis);  // 40
    const edb   = m(formData.ayt_edebiyat_dogru, formData.ayt_edebiyat_yanlis);     // 24
    const tar1  = m(formData.ayt_tarih1_dogru, formData.ayt_tarih1_yanlis);         // 10
    const cog1  = m(formData.ayt_cografya1_dogru, formData.ayt_cografya1_yanlis);   // 6
    aytNetToplam = aytMat + edb + tar1 + cog1; // 80 max
  } else { // sözel
    const edb   = m(formData.ayt_edebiyat_dogru, formData.ayt_edebiyat_yanlis);     // 24
    const tar1  = m(formData.ayt_tarih1_dogru, formData.ayt_tarih1_yanlis);         // 10
    const cog1  = m(formData.ayt_cografya1_dogru, formData.ayt_cografya1_yanlis);   // 6
    const tar2  = m(formData.ayt_tarih2_dogru, formData.ayt_tarih2_yanlis);         // 11
    const cog2  = m(formData.ayt_cografya2_dogru, formData.ayt_cografya2_yanlis);   // 11
    const fls   = m(formData.ayt_felsefe_dogru, formData.ayt_felsefe_yanlis);       // 12
    const dkab  = m(formData.ayt_dkab_dogru, formData.ayt_dkab_yanlis);             // 6
    aytNetToplam = edb + tar1 + cog1 + tar2 + cog2 + fls + dkab; // 80 max
  }

  const aytHamPuan = (aytNetToplam * 5) + 100; // 0 net = 100, full = 500
  return Math.min(500, Math.max(100, aytHamPuan));
};

  const calculateYKSScore = () => {
    const tytPuan = calculateTYTScore();
    const aytPuan = calculateAYTScore();
    
    // YKS = (TYT × %40) + (AYT × %60)
    const yksPuani = (tytPuan * 0.4) + (aytPuan * 0.6);
    return Math.min(500, Math.max(100, yksPuani));
  };

  const calculateLGSScore = () => {
    const turkceNet = calculateNetScore(formData.lgs_turkce_dogru, formData.lgs_turkce_yanlis);
    const matematikNet = calculateNetScore(formData.lgs_matematik_dogru, formData.lgs_matematik_yanlis);
    const fenNet = calculateNetScore(formData.lgs_fen_dogru, formData.lgs_fen_yanlis);
    const inkilapNet = calculateNetScore(formData.lgs_inkılap_dogru, formData.lgs_inkılap_yanlis);
    const ingilizceNet = calculateNetScore(formData.lgs_ingilizce_dogru, formData.lgs_ingilizce_yanlis);
    const dinNet = calculateNetScore(formData.lgs_din_dogru, formData.lgs_din_yanlis);
    
    // LGS puan hesaplama: Katsayılı hesaplama
    // Türkçe, Matematik, Fen: Katsayı 4
    // İnkılap, İngilizce, Din: Katsayı 1
    const katsayiliToplam = (turkceNet * 4) + (matematikNet * 4) + (fenNet * 4) + 
                           (inkilapNet * 1) + (ingilizceNet * 1) + (dinNet * 1);
    
    // Ham puan hesaplama (500 üzerinden)
    const hamPuan = (katsayiliToplam * 500) / 270;
    return Math.min(500, Math.max(0, hamPuan));
  };

  const calculateTotalScore = () => {
    const examType = formData.exam_type;
    
    if (examType === 'TYT') {
      return calculateTYTScore();
    } else if (examType === 'AYT') {
      return calculateAYTScore(); // AYT içinde YKS hesabı yapılıyor
    } else if (examType === 'LGS') {
      return calculateLGSScore();
    }
    
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) {
      console.log('Form already submitting, ignoring...');
      return;
    }
    
    setLoading(true);
    console.log('Submitting exam form with data:', formData);

    try {
      const examData = {
        student_id: studentId,
        exam_name: formData.exam_name,
        exam_type: formData.exam_type,
        exam_date: formData.exam_date,
        total_score: formData.exam_type === 'AYT' ? calculateYKSScore() : calculateTotalScore(),
        notes: formData.notes,
        // Store raw data as JSON for detailed analysis
        exam_details: JSON.stringify({
          ...formData,
          ayt_type: aytType,
          tyt_score: formData.exam_type === 'AYT' ? calculateTYTScore() : null,
          ayt_score: formData.exam_type === 'AYT' ? calculateAYTScore() : null,
          yks_score: formData.exam_type === 'AYT' ? calculateYKSScore() : null
        })
      };

      console.log('Calling addExamResult with:', examData);
      const { error } = await addExamResult(examData);
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Exam result added successfully');
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        exam_name: '',
        exam_type: 'TYT',
        exam_date: '',
        tyt_turkce_dogru: '',
        tyt_turkce_yanlis: '',
        tyt_matematik_dogru: '',
        tyt_matematik_yanlis: '',
        tyt_fen_dogru: '',
        tyt_fen_yanlis: '',
        tyt_sosyal_dogru: '',
        tyt_sosyal_yanlis: '',
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
        ayt_matematik_dogru: '',
        ayt_matematik_yanlis: '',
        ayt_fizik_dogru: '',
        ayt_fizik_yanlis: '',
        ayt_kimya_dogru: '',
        ayt_kimya_yanlis: '',
        ayt_biyoloji_dogru: '',
        ayt_biyoloji_yanlis: '',
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
        notes: ''
      });
      setAytType('sayisal');
    } catch (error) {
      console.error('Error adding exam result:', error);
      alert('Deneme sonucu eklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Validasyon kontrolü
    if (name.includes('_dogru') || name.includes('_yanlis')) {
      if (!validateInput(name, value)) {
        return; // Geçersiz değer girilirse güncelleme yapma
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const renderInputField = (
    label: string,
    dogruField: string,
    yanlisField: string,
    maxQuestions: number
  ) => {
    const dogruValue = formData[dogruField as keyof typeof formData] as string;
    const yanlisValue = formData[yanlisField as keyof typeof formData] as string;
    const net = calculateNetScore(dogruValue, yanlisValue);
    
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} ({maxQuestions} soru)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            name={dogruField}
            value={dogruValue}
            onChange={handleInputChange}
            min="0"
            max={maxQuestions}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="Doğru"
          />
          <input
            type="number"
            name={yanlisField}
            value={yanlisValue}
            onChange={handleInputChange}
            min="0"
            max={maxQuestions}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="Yanlış"
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Net: {net.toFixed(1)} | Toplam: {(parseInt(dogruValue) || 0) + (parseInt(yanlisValue) || 0)}/{maxQuestions}
        </div>
      </div>
    );
  };

  const renderTYTFields = () => (
    <div className="space-y-4">
      <h4 className="font-semibold text-blue-600">TYT - Temel Yeterlilik Testi (120 soru - 135 dk)</h4>
      
      <div className="grid grid-cols-2 gap-4">
        {renderInputField('Türkçe', 'tyt_turkce_dogru', 'tyt_turkce_yanlis', 40)}
        {renderInputField('Matematik', 'tyt_matematik_dogru', 'tyt_matematik_yanlis', 40)}
        {renderInputField('Fen Bilimleri', 'tyt_fen_dogru', 'tyt_fen_yanlis', 20)}
        {renderInputField('Sosyal Bilgiler', 'tyt_sosyal_dogru', 'tyt_sosyal_yanlis', 20)}
      </div>
    </div>
  );

  const renderAYTFields = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-green-600">AYT - Alan Yeterlilik Testi (160 soru - 180 dk)</h4>
        <select
          value={aytType}
          onChange={(e) => setAytType(e.target.value as any)}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="sayisal">Sayısal</option>
          <option value="esit_agirlik">Eşit Ağırlık</option>
          <option value="sozel">Sözel</option>
        </select>
      </div>

      {/* TYT kısmı (AYT ile birlikte alınır) */}
      <div className="bg-blue-50 p-3 rounded">
        <h5 className="font-medium text-blue-800 mb-2">TYT Kısmı (AYT ile birlikte)</h5>
        <div className="grid grid-cols-2 gap-4">
          {renderInputField('Türkçe', 'tyt_turkce_dogru', 'tyt_turkce_yanlis', 40)}
          {renderInputField('Matematik', 'tyt_matematik_dogru', 'tyt_matematik_yanlis', 40)}
          {renderInputField('Fen Bilimleri', 'tyt_fen_dogru', 'tyt_fen_yanlis', 20)}
          {renderInputField('Sosyal Bilgiler', 'tyt_sosyal_dogru', 'tyt_sosyal_yanlis', 20)}
        </div>
      </div>
      
      {/* AYT alanları */}
      <div className="grid grid-cols-2 gap-4">
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
            {renderInputField('Türk Dili ve Edebiyatı', 'ayt_edebiyat_dogru', 'ayt_edebiyat_yanlis', 24)}
            {renderInputField('Tarih-1', 'ayt_tarih1_dogru', 'ayt_tarih1_yanlis', 10)}
            {renderInputField('Coğrafya-1', 'ayt_cografya1_dogru', 'ayt_cografya1_yanlis', 6)}
          </>
        )}
        
        {aytType === 'sozel' && (
          <>
            {renderInputField('Türk Dili ve Edebiyatı', 'ayt_edebiyat_dogru', 'ayt_edebiyat_yanlis', 24)}
            {renderInputField('Tarih-1', 'ayt_tarih1_dogru', 'ayt_tarih1_yanlis', 10)}
            {renderInputField('Coğrafya-1', 'ayt_cografya1_dogru', 'ayt_cografya1_yanlis', 6)}
            {renderInputField('Tarih-2', 'ayt_tarih2_dogru', 'ayt_tarih2_yanlis', 11)}
            {renderInputField('Coğrafya-2', 'ayt_cografya2_dogru', 'ayt_cografya2_yanlis', 11)}
            {renderInputField('Felsefe Grubu', 'ayt_felsefe_dogru', 'ayt_felsefe_yanlis', 12)}
            {renderInputField('Din Kültürü ve Ahlak Bilgisi', 'ayt_dkab_dogru', 'ayt_dkab_yanlis', 6)}
          </>
        )}
      </div>
    </div>
  );

  const renderLGSFields = () => (
    <div className="space-y-4">
      <h4 className="font-semibold text-purple-600">LGS - Liseye Geçiş Sınavı (90 soru - 155 dk)</h4>
      
      <div className="grid grid-cols-2 gap-4">
        {renderInputField('Türkçe', 'lgs_turkce_dogru', 'lgs_turkce_yanlis', 20)}
        {renderInputField('Matematik', 'lgs_matematik_dogru', 'lgs_matematik_yanlis', 20)}
        {renderInputField('Fen Bilimleri', 'lgs_fen_dogru', 'lgs_fen_yanlis', 20)}
        {renderInputField('T.C. İnkılap Tarihi', 'lgs_inkılap_dogru', 'lgs_inkılap_yanlis', 10)}
        {renderInputField('Din Kültürü ve Ahlak Bilgisi', 'lgs_din_dogru', 'lgs_din_yanlis', 10)}
        {renderInputField('İngilizce', 'lgs_ingilizce_dogru', 'lgs_ingilizce_yanlis', 10)}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Target className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Yeni Deneme Sonucu</h2>
          <p className="text-gray-600 mt-2">Deneme sonucunuzu detaylı olarak kaydedin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deneme Adı *
              </label>
              <input
                type="text"
                name="exam_name"
                value={formData.exam_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Örn: TYT Deneme 15"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deneme Türü *
              </label>
              <select
                name="exam_type"
                value={formData.exam_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="TYT">TYT - Temel Yeterlilik Testi</option>
                <option value="AYT">AYT - Alan Yeterlilik Testi</option>
                <option value="LGS">LGS - Liseye Geçiş Sınavı</option>
                <option value="custom">Diğer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deneme Tarihi *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                name="exam_date"
                value={formData.exam_date}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              Sınav Sonuçları
            </h3>
            
            {formData.exam_type === 'TYT' && renderTYTFields()}
            {formData.exam_type === 'AYT' && renderAYTFields()}
            {formData.exam_type === 'LGS' && renderLGSFields()}
            {formData.exam_type === 'custom' && (
              <div className="text-center py-8 text-gray-500">
                <p>Bu sınav türü için detaylı form henüz hazırlanmamıştır.</p>
                <p>Genel notlarınızı aşağıdaki not alanına yazabilirsiniz.</p>
              </div>
            )}

            {formData.exam_type !== 'custom' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800">
                  {formData.exam_type === 'AYT' && (
                    <>
                      <div>TYT Ham Puan: {calculateTYTScore().toFixed(1)} / 500</div>
                      <div>AYT Ham Puan ({aytType}): {calculateAYTScore().toFixed(1)} / 500</div>
                      <div className="font-bold text-green-800">YKS Puanı: {calculateYKSScore().toFixed(1)} / 500</div>
                    </>
                  )}
                  {formData.exam_type === 'TYT' && (
                    <div className="font-bold">TYT Puanı: {calculateTotalScore().toFixed(1)} / 500</div>
                  )}
                  {formData.exam_type === 'LGS' && (
                    <div className="font-bold">LGS Puanı: {calculateTotalScore().toFixed(1)} / 500</div>
                  )}
                  <div className="text-xs text-blue-600 mt-1">
                    * OBP (Okul Başarı Puanı) dahil değildir. Gerçek yerleştirme puanı için OBP (max 60 puan) eklenmelidir.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notlar (Opsiyonel)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Deneme hakkında notlarınız..."
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}