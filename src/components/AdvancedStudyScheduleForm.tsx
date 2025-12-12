import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Clock, BookOpen, Target, Save, Users, User, CheckCircle } from 'lucide-react';
import { createBulkStudySchedule, createStudySchedule, StudyScheduleItem } from '../lib/studyScheduleApi';
import { supabase } from '../lib/supabase';

interface AdvancedStudyScheduleFormProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  teacherId: string;
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Pazartesi' },
  { value: 1, label: 'Salı' },
  { value: 2, label: 'Çarşamba' },
  { value: 3, label: 'Perşembe' },
  { value: 4, label: 'Cuma' },
  { value: 5, label: 'Cumartesi' },
  { value: 6, label: 'Pazar' }
];

const SUBJECTS = [
  'Matematik',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Türkçe',
  'Tarih',
  'Coğrafya',
  'İngilizce',
  'Felsefe',
  'Din Kültürü'
];

interface Student {
  id: string;
  name: string;
  grade: number;
}

export default function AdvancedStudyScheduleForm({
  isOpen,
  onClose,
  classId,
  teacherId,
  onSuccess
}: AdvancedStudyScheduleFormProps) {
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(true);
  
  // Mode: 'bulk' (tüm sınıf) veya 'individual' (seçili öğrenciler)
  const [mode, setMode] = useState<'bulk' | 'individual'>('bulk');
  
  // Öğrenci listesi
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weekStartDate, setWeekStartDate] = useState('');
  const [items, setItems] = useState<StudyScheduleItem[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);

  // Yeni item formu
  const [newItem, setNewItem] = useState<StudyScheduleItem>({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '10:00',
    subject: 'Matematik',
    topic: '',
    description: '',
    goal: '',
    resources: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadStudents();
      initializeForm();
    }
  }, [isOpen, classId]);

const loadStudents = async () => {
  setStudentsLoading(true);
  try {

    const { data: classStudentsData, error: classError } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', classId)
      .eq('status', 'active');

    if (classError) {
      console.error('Sinif ogrencileri sorgusu hatasi:', classError);
      throw classError;
    }

    if (!classStudentsData || classStudentsData.length === 0) {
      setStudents([]);
      return;
    }

    const studentIds = classStudentsData.map(cs => cs.student_id);

    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        grade,
        profile:profiles!students_profile_id_fkey(
          full_name
        )
      `)
      .in('id', studentIds);

    if (studentsError) throw studentsError;

    const studentList = (studentsData as Array<{
      id: string;
      grade: number | null;
      profile?: { full_name?: string | null } | null;
    }> | null | undefined || []).map((student, index) => ({
      id: student.id,
      name: student.profile?.full_name || `Ogrenci ${index + 1}`,
      grade: student.grade ?? 9
    }));

    setStudents(studentList);

  } catch (error) {
    console.error('Ogrenci verisi yukleme hatasi:', error);

    try {
      const { data: fallbackData } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classId)
        .eq('status', 'active');

      const fallbackList = (fallbackData ?? []).map((cs, index) => ({
        id: cs.student_id,
        name: `Ogrenci ${index + 1}`,
        grade: 9
      }));

      setStudents(fallbackList);
    } catch (fallbackError) {
      console.error('Yedek ogrenci listesi de yuklenemedi:', fallbackError);
      setStudents([]);
    }
  } finally {
    setStudentsLoading(false);
  }
};

  const initializeForm = () => {
    const today = new Date();
    const monday = new Date(today);
    const currentDay = today.getDay();
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    monday.setDate(today.getDate() + daysToMonday);
    setWeekStartDate(monday.toISOString().split('T')[0]);
    
    setTitle('Haftalık Çalışma Programı');
    setDescription('');
    setItems([]);
    setMode('bulk');
    setSelectedStudents([]);
    setSelectAll(false);
  };

  const calculateWeekEndDate = (startDate: string): string => {
    if (!startDate) return '';
    try {
      const start = new Date(startDate + 'T00:00:00');
      if (isNaN(start.getTime())) return '';
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return end.toISOString().split('T')[0];
    } catch (error) {
      console.error('Date calculation error:', error);
      return '';
    }
  };

  const handleAddItem = () => {
    setItems([...items, { ...newItem }]);
    setNewItem({
      day_of_week: 0,
      start_time: '09:00',
      end_time: '10:00',
      subject: 'Matematik',
      topic: '',
      description: '',
      goal: '',
      resources: ''
    });
    setShowAddItem(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleToggleStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
      setSelectAll(false);
    } else {
      const newSelected = [...selectedStudents, studentId];
      setSelectedStudents(newSelected);
      if (newSelected.length === students.length) {
        setSelectAll(true);
      }
    }
  };

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
      setSelectAll(false);
    } else {
      setSelectedStudents(students.map(s => s.id));
      setSelectAll(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Lütfen program başlığı girin');
      return;
    }

    if (items.length === 0) {
      alert('Lütfen en az bir ders ekleyin');
      return;
    }

    if (mode === 'individual' && selectedStudents.length === 0) {
      alert('Lütfen en az bir öğrenci seçin');
      return;
    }

    setLoading(true);
    try {
      const weekEndDate = calculateWeekEndDate(weekStartDate);

      if (mode === 'bulk') {
        // Tüm sınıfa toplu gönder
        const { data, error } = await createBulkStudySchedule(
          classId,
          teacherId,
          {
            title,
            description,
            week_start_date: weekStartDate,
            week_end_date: weekEndDate,
            items
          }
        );

        if (error) throw error;
        alert(data.message || 'Program başarıyla oluşturuldu!');
      } else {
        // Seçili öğrencilere bireysel gönder
        const promises = selectedStudents.map(studentId =>
          createStudySchedule({
            student_id: studentId,
            teacher_id: teacherId,
            class_id: classId,
            title,
            description,
            week_start_date: weekStartDate,
            week_end_date: weekEndDate,
            items
          })
        );

        await Promise.all(promises);
        alert(`${selectedStudents.length} öğrenci için program oluşturuldu!`);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      alert('Program oluşturulurken hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Items'ları güne göre grupla
  const itemsByDay = DAYS_OF_WEEK.map(day => ({
    day,
    items: items.filter(item => item.day_of_week === day.value)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto my-4">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Haftalık Çalışma Programı Oluştur
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Mode Selection */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Program Gönderim Türü
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('bulk')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mode === 'bulk'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <Users className={`w-6 h-6 mx-auto mb-2 ${mode === 'bulk' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="font-semibold text-gray-900 dark:text-white">Tüm Sınıfa</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Sınıftaki tüm öğrencilere aynı program
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('individual')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mode === 'individual'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                <User className={`w-6 h-6 mx-auto mb-2 ${mode === 'individual' ? 'text-purple-600' : 'text-gray-400'}`} />
                <div className="font-semibold text-gray-900 dark:text-white">Seçili Öğrencilere</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Öğrenci bazlı özel program
                </div>
              </button>
            </div>
          </div>

          {/* Öğrenci Seçimi - Sadece Individual Mode'da */}
          {mode === 'individual' && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-600" />
                  Öğrenci Seçimi ({selectedStudents.length}/{students.length})
                </h3>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  {selectAll ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                </button>
              </div>

              {studentsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                  Sınıfta aktif öğrenci bulunamadı
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {students.map(student => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleToggleStudent(student.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedStudents.includes(student.id)
                          ? 'border-purple-600 bg-purple-100 dark:bg-purple-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {student.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {student.grade}. Sınıf
                          </div>
                        </div>
                        {selectedStudents.includes(student.id) && (
                          <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Temel Bilgiler */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Temel Bilgiler
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Program Başlığı *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Örn: 15-21 Ocak Haftalık Program"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hafta Başlangıç (Pazartesi) *
              </label>
              <input
                type="date"
                value={weekStartDate}
                onChange={(e) => setWeekStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Bitiş: {calculateWeekEndDate(weekStartDate)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Açıklama
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                rows={2}
                placeholder="Program hakkında not ekleyebilirsiniz..."
              />
            </div>
          </div>

          {/* Ders Programı */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                Ders Programı ({items.length} ders)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddItem(!showAddItem)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ders Ekle</span>
              </button>
            </div>

            {/* Ders Ekleme Formu */}
            {showAddItem && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Gün *</label>
                    <select
                      value={newItem.day_of_week}
                      onChange={(e) => setNewItem({ ...newItem, day_of_week: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      {DAYS_OF_WEEK.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Ders *</label>
                    <select
                      value={newItem.subject}
                      onChange={(e) => setNewItem({ ...newItem, subject: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      {SUBJECTS.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Başlangıç *</label>
                    <input
                      type="time"
                      value={newItem.start_time}
                      onChange={(e) => setNewItem({ ...newItem, start_time: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Bitiş *</label>
                    <input
                      type="time"
                      value={newItem.end_time}
                      onChange={(e) => setNewItem({ ...newItem, end_time: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Konu</label>
                  <input
                    type="text"
                    value={newItem.topic}
                    onChange={(e) => setNewItem({ ...newItem, topic: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Örn: İkinci Derece Denklemler"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Hedef</label>
                  <input
                    type="text"
                    value={newItem.goal}
                    onChange={(e) => setNewItem({ ...newItem, goal: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Örn: 20 soru çöz, formülleri ezberle"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddItem(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            )}

            {/* Haftalık Program Görünümü */}
            <div className="space-y-3">
              {itemsByDay.map(({ day, items: dayItems }) => (
                <div key={day.value} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {day.label}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {dayItems.length} ders
                    </span>
                  </div>
                  
                  {dayItems.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Ders eklenmedi</p>
                  ) : (
                    <div className="space-y-2">
                      {dayItems.map((item, index) => {
                        const globalIndex = items.findIndex(i => 
                          i.day_of_week === item.day_of_week && 
                          i.start_time === item.start_time &&
                          i.subject === item.subject
                        );
                        
                        return (
                          <div
                            key={index}
                            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex items-start justify-between"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-sm">
                                  {item.start_time} - {item.end_time}
                                </span>
                                <span className="font-semibold text-blue-600">
                                  {item.subject}
                                </span>
                              </div>
                              {item.topic && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                                  📚 {item.topic}
                                </p>
                              )}
                              {item.goal && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                                  🎯 {item.goal}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(globalIndex)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0 || (mode === 'individual' && selectedStudents.length === 0)}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Oluşturuluyor...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>
                    {mode === 'bulk' 
                      ? 'Tüm Sınıfa Yayınla' 
                      : `${selectedStudents.length} Öğrenciye Gönder`
                    }
                  </span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            {mode === 'bulk' 
              ? 'Bu program sınıftaki tüm aktif öğrencilere otomatik olarak atanacaktır.'
              : `Bu program sadece seçtiğiniz ${selectedStudents.length} öğrenciye atanacaktır.`
            }
          </p>
        </form>
      </div>
    </div>
  );
}

