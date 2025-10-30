import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, FileText, BookOpen, Bell, Trophy, ArrowLeft, CreditCard as Edit, Trash2, X, BarChart3, Save, Calendar, User } from 'lucide-react';
import { 
  addClassAssignment, 
  addClassAnnouncement, 
  addClassExam, 
  getClassAssignments, 
  getClassAnnouncements, 
  getClassExams,
  updateClassAssignment,
  updateClassAnnouncement,
  updateClassExam,
  deleteClassAssignment,
  deleteClassAnnouncement,
  deleteClassExam
} from '../lib/teacherApi';
import AdvancedStudyScheduleForm from './AdvancedStudyScheduleForm';
import { getTeacherStudySchedules } from '../lib/studyScheduleApi';

interface ClassManagementPanelProps {
  classData: any;
  onBack: () => void;
  onRefresh: () => void;
  onAnnouncementCreated?: (announcementId: string) => Promise<void>;
}

interface StudentResult {
  id?: string;
  student_name: string;
  score: number;
  correct_answers: number;
  wrong_answers: number;
  empty_answers: number;
  note: string;
  ranking: number;
}

export default function ClassManagementPanel({ classData, onBack, onRefresh, onAnnouncementCreated }: ClassManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<'assignments' | 'announcements' | 'exams' | 'schedules'>('assignments');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Weekly schedule states
  const [showScheduleCreator, setShowScheduleCreator] = useState(false);
  
  // Student results state
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [savingResults, setSavingResults] = useState(false);

  // Load fresh data when component mounts
  useEffect(() => {
    loadClassContent();
  }, [classData.id]);

  const loadClassContent = async () => {
    setDataLoading(true);
    try {
      const [assignmentsRes, announcementsRes, examsRes, schedulesRes] = await Promise.all([
        getClassAssignments(classData.id),
        getClassAnnouncements(classData.id),
        getClassExams(classData.id),
        getTeacherStudySchedules(classData.teacher_id)
      ]);

      console.log('Exams data:', examsRes.data);
      setAssignments(assignmentsRes.data || []);
      setAnnouncements(announcementsRes.data || []);
      setExams(examsRes.data || []);
      
      // Filter schedules for this class
      const classSchedules = (schedulesRes.data || []).filter((s: any) => s.class_id === classData.id);
      setSchedules(classSchedules);
    } catch (error) {
      console.error('Error loading class content:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Assignment form
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    subject: '',
    due_date: ''
  });

  // Announcement form
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error'
  });

  // Exam form
  const [examForm, setExamForm] = useState({
    exam_name: '',
    exam_type: '',
    exam_date: '',
    total_questions: ''
  });

  // Edit form state
  const [editForm, setEditForm] = useState<any>({});

  // Button handlers
  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setEditForm({ ...item });
    setShowEditModal(true);
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleResults = async (exam: any) => {
    setSelectedItem(exam);
    
    // Mevcut sonuçları yükle
    try {
      const { data: existingResults, error } = await supabase
        .from('class_exam_results')
        .select('*')
        .eq('class_exam_id', exam.id)
        .order('ranking', { ascending: true });

      if (error) throw error;

      if (existingResults && existingResults.length > 0) {
        // Mevcut sonuçları yükle
        setStudentResults(existingResults.map((result: any) => ({
          id: result.id,
          student_name: result.student_name || '',
          score: result.score || 0,
          correct_answers: result.correct_answers || 0,
          wrong_answers: result.wrong_answers || 0,
          empty_answers: result.empty_answers || 0,
          note: result.student_note || '',
          ranking: result.ranking || 0
        })));
      } else {
        // Boş formlar oluştur (10 öğrenci için)
        const emptyResults: StudentResult[] = Array.from({ length: 10 }, (_, index) => ({
          student_name: '',
          score: 0,
          correct_answers: 0,
          wrong_answers: 0,
          empty_answers: 0,
          note: '',
          ranking: index + 1
        }));
        setStudentResults(emptyResults);
      }
    } catch (error) {
      console.error('Sonuçları yükleme hatası:', error);
      // Hata durumunda boş formlar oluştur
      const emptyResults: StudentResult[] = Array.from({ length: 10 }, (_, index) => ({
        student_name: '',
        score: 0,
        correct_answers: 0,
        wrong_answers: 0,
        empty_answers: 0,
        note: '',
        ranking: index + 1
      }));
      setStudentResults(emptyResults);
    }
    
    setShowResultsModal(true);
  };

  // Edit submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      if (activeTab === 'assignments') {
        await updateClassAssignment(selectedItem.id, editForm);
        alert('Ödev başarıyla güncellendi!');
      } else if (activeTab === 'announcements') {
        await updateClassAnnouncement(selectedItem.id, editForm);
        alert('Duyuru başarıyla güncellendi!');
      } else if (activeTab === 'exams') {
        await updateClassExam(selectedItem.id, editForm);
        alert('Sınav başarıyla güncellendi!');
      }

      setShowEditModal(false);
      await loadClassContent();
    } catch (error: any) {
      alert('Güncelleme hatası: ' + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Delete submission
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);

    try {
      if (activeTab === 'assignments') {
        await deleteClassAssignment(selectedItem.id);
        alert('Ödev başarıyla silindi!');
      } else if (activeTab === 'announcements') {
        await deleteClassAnnouncement(selectedItem.id);
        alert('Duyuru başarıyla silindi!');
      } else if (activeTab === 'exams') {
        await deleteClassExam(selectedItem.id);
        alert('Sınav başarıyla silindi!');
      }

      setShowDeleteModal(false);
      await loadClassContent();
    } catch (error: any) {
      alert('Silme hatası: ' + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveResults = async () => {
    if (!selectedItem) return;

    setSavingResults(true);
    try {
      // Boş kayıtları filtrele
      const validResults = studentResults.filter(result => 
        result.student_name.trim() !== '' && result.score > 0
      );

      if (validResults.length === 0) {
        alert('Lütfen en az bir öğrenci sonucu girin!');
        return;
      }

      // Önce mevcut sonuçları temizle
      const { error: deleteError } = await supabase
        .from('class_exam_results')
        .delete()
        .eq('class_exam_id', selectedItem.id);

      if (deleteError) throw deleteError;

      // Yeni sonuçları ekle
      const resultsToInsert = validResults.map(result => ({
        class_exam_id: selectedItem.id,
        student_name: result.student_name,
        score: result.score,
        correct_answers: result.correct_answers,
        wrong_answers: result.wrong_answers,
        empty_answers: result.empty_answers,
        student_note: result.note,
        ranking: result.ranking,
        uploaded_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('class_exam_results')
        .insert(resultsToInsert);

      if (insertError) throw insertError;

      alert('Öğrenci sonuçları başarıyla kaydedildi!');
      setShowResultsModal(false);
      
      // Sınıf verilerini yeniden yükle
      await loadClassContent();
      onRefresh();
    } catch (error: any) {
      console.error('Sonuçları kaydetme hatası:', error);
      alert('Sonuçları kaydederken hata oluştu: ' + error.message);
    } finally {
      setSavingResults(false);
    }
  };

  // Öğrenci sonucu güncelle
  const handleStudentResultChange = (index: number, field: keyof StudentResult, value: any) => {
    const updatedResults = [...studentResults];
    updatedResults[index] = {
      ...updatedResults[index],
      [field]: value
    };
    setStudentResults(updatedResults);
  };

  // Yeni öğrenci satırı ekle
  const addStudentRow = () => {
    setStudentResults(prev => [
      ...prev,
      {
        student_name: '',
        score: 0,
        correct_answers: 0,
        wrong_answers: 0,
        empty_answers: 0,
        note: '',
        ranking: prev.length + 1
      }
    ]);
  };

  // Öğrenci satırı sil
  const removeStudentRow = (index: number) => {
    if (studentResults.length <= 1) {
      alert('En az bir öğrenci sonucu olmalıdır!');
      return;
    }
    
    const updatedResults = studentResults.filter((_, i) => i !== index);
    // Ranking'leri güncelle
    const rankedResults = updatedResults.map((result, idx) => ({
      ...result,
      ranking: idx + 1
    }));
    setStudentResults(rankedResults);
  };

  const resetFormState = () => {
    setAssignmentForm({ title: '', description: '', subject: '', due_date: '' });
    setAnnouncementForm({ title: '', content: '', type: 'info' });
    setExamForm({ exam_name: '', exam_type: '', exam_date: '', total_questions: '' });
  };

  const handleOpenForm = () => {
    if (activeTab === 'schedules') {
      setShowScheduleCreator(true);
      return;
    }
    resetFormState();
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetFormState();
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assignmentForm.title.trim() || !assignmentForm.subject || !assignmentForm.due_date) {
      alert('Lütfen ödev başlığı, ders ve teslim tarihini doldurun.');
      return;
    }

    setLoading(true);

    try {
      await addClassAssignment({
        class_id: classData.id,
        teacher_id: classData.teacher_id,
        ...assignmentForm
      });

      alert('Ödev başarıyla eklendi!');
      handleCloseForm();
      await loadClassContent();
    } catch (error: any) {
      alert('Ödev ekleme hatası: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await addClassAnnouncement({
        class_id: classData.id,
        teacher_id: classData.teacher_id,
        ...announcementForm
      });

      if (error) {
        throw error;
      }

      if (data?.id && onAnnouncementCreated) {
        try {
          await onAnnouncementCreated(data.id);
        } catch (notificationError) {
          console.error('Error sending announcement notification:', notificationError);
          alert('Duyuru eklendi ancak bildirimi gönderirken bir sorun oluştu.');
        }
      }

      alert('Duyuru başarıyla eklendi!');
      handleCloseForm();
      await loadClassContent();
    } catch (error: any) {
      alert('Duyuru ekleme hatası: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addClassExam({
        class_id: classData.id,
        teacher_id: classData.teacher_id,
        exam_name: examForm.exam_name,
        exam_type: examForm.exam_type,
        exam_date: examForm.exam_date,
        total_questions: examForm.total_questions ? parseInt(examForm.total_questions) : 0
      });

      alert('Sınav başarıyla eklendi!');
      handleCloseForm();
      await loadClassContent();
    } catch (error: any) {
      alert('Sınav ekleme hatası: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const subjects = [
    'Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce',
    'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Edebiyat', 'Diğer'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Geri</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{classData.class_name} - Yönetim</h1>
              <p className="text-gray-600">Sınıfınızı yönetin ve içerik ekleyin</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {[
            { key: 'assignments', label: 'Ödevler', icon: BookOpen },
            { key: 'announcements', label: 'Duyurular', icon: Bell },
            { key: 'exams', label: 'Sınavlar', icon: Trophy },
            { key: 'schedules', label: 'Çalışma Programı', icon: Calendar },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">
              {activeTab === 'assignments' && 'Ödev Yönetimi'}
              {activeTab === 'announcements' && 'Duyuru Yönetimi'}
              {activeTab === 'exams' && 'Sınav Yönetimi'}
              {activeTab === 'schedules' && 'Haftalık Çalışma Programı'}
            </h3>
            <button
              onClick={handleOpenForm}
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>
                {activeTab === 'assignments' && 'Yeni Ödev'}
                {activeTab === 'announcements' && 'Yeni Duyuru'}
                {activeTab === 'exams' && 'Yeni Sınav'}
                {activeTab === 'schedules' && 'Program Oluştur'}
              </span>
            </button>
          </div>

          {dataLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Veriler yükleniyor...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'assignments' && (
                assignments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Henüz ödev eklenmemiş</p>
                  </div>
                ) : (
                  assignments.map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{assignment.title}</h4>
                          <p className="text-blue-600 font-medium">{assignment.subject}</p>
                          {assignment.description && (
                            <p className="text-gray-600 mt-2">{assignment.description}</p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span>Son Teslim: {new Date(assignment.due_date).toLocaleDateString('tr-TR')}</span>
                            <span>Oluşturulma: {new Date(assignment.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                          <button 
                            onClick={() => handleEdit(assignment)}
                            className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-600 hover:bg-blue-50 flex items-center space-x-1"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Düzenle</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(assignment)}
                            className="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-600 hover:bg-red-50 flex items-center space-x-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Sil</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === 'announcements' && (
                announcements.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Henüz duyuru eklenmemiş</p>
                  </div>
                ) : (
                  announcements.map((announcement) => (
                    <div key={announcement.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-lg">{announcement.title}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              announcement.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              announcement.type === 'success' ? 'bg-green-100 text-green-800' :
                              announcement.type === 'error' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {announcement.type === 'warning' ? 'Uyarı' :
                               announcement.type === 'success' ? 'Başarı' :
                               announcement.type === 'error' ? 'Hata' : 'Bilgi'}
                            </span>
                          </div>
                          <p className="text-gray-700">{announcement.content}</p>
                          <div className="mt-3 text-sm text-gray-500">
                            <span>Oluşturulma: {new Date(announcement.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                          <button 
                            onClick={() => handleEdit(announcement)}
                            className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-600 hover:bg-blue-50 flex items-center space-x-1"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Düzenle</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(announcement)}
                            className="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-600 hover:bg-red-50 flex items-center space-x-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Sil</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === 'exams' && (
                exams.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Henüz sınav eklenmemiş</p>
                  </div>
                ) : (
                  exams.map((exam) => (
                    <div key={exam.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{exam.exam_name}</h4>
                          <p className="text-purple-600 font-medium">{exam.exam_type}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span>Sınav Tarihi: {new Date(exam.exam_date).toLocaleDateString('tr-TR')}</span>
                            {exam.total_questions > 0 && (
                              <span>Soru Sayısı: {exam.total_questions}</span>
                            )}
                            <span>Oluşturulma: {new Date(exam.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                          {exam.class_exam_results && exam.class_exam_results.length > 0 && (
                            <div className="mt-2 text-sm text-green-600">
                              {exam.class_exam_results.length} öğrenci sonucu girildi
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                          <button 
                            onClick={() => handleResults(exam)}
                            className="text-green-600 hover:text-green-800 px-3 py-1 rounded border border-green-600 hover:bg-green-50 flex items-center space-x-1"
                          >
                            <BarChart3 className="h-4 w-4" />
                            <span>Sonuçlar</span>
                          </button>
                          <button 
                            onClick={() => handleEdit(exam)}
                            className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-600 hover:bg-blue-50 flex items-center space-x-1"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Düzenle</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(exam)}
                            className="text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-600 hover:bg-red-50 flex items-center space-x-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Sil</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === 'schedules' && (
                schedules.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Henüz çalışma programı oluşturulmamış</p>
                    <p className="text-sm mt-2">Öğrencileriniz için haftalık çalışma programı oluşturun</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/70 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                              {schedule.title}
                            </h4>
                            {schedule.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {schedule.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span>
                                  {new Date(schedule.week_start_date).toLocaleDateString('tr-TR')} - {new Date(schedule.week_end_date).toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                              {schedule.class?.class_name && (
                                <div className="flex items-center space-x-1">
                                  <BookOpen className="w-4 h-4 text-indigo-500" />
                                  <span>{schedule.class.class_name}</span>
                                </div>
                              )}
                              {schedule.student?.profile?.full_name && (
                                <div className="flex items-center space-x-1">
                                  <User className="w-4 h-4 text-emerald-500" />
                                  <span>{schedule.student.profile.full_name}</span>
                                </div>
                              )}
                              {schedule.study_schedule_items && (
                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200 text-xs font-medium rounded-full">
                                  {schedule.study_schedule_items.length} çalışma saati
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Weekly Schedule Creator Modal */}
        {showScheduleCreator && (
          <AdvancedStudyScheduleForm
            isOpen={showScheduleCreator}
            onClose={() => setShowScheduleCreator(false)}
            classId={classData.id}
            teacherId={classData.teacher_id}
            onSuccess={() => {
              setShowScheduleCreator(false);
              loadClassContent();
            }}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {activeTab === 'assignments' && 'Ödev Düzenle'}
                  {activeTab === 'announcements' && 'Duyuru Düzenle'}
                  {activeTab === 'exams' && 'Sınav Düzenle'}
                </h3>
                <button onClick={() => setShowEditModal(false)}>
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {activeTab === 'assignments' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ödev Başlığı</label>
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ders</label>
                      <select
                        value={editForm.subject || ''}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      >
                        <option value="">Ders seçin</option>
                        {subjects.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Son Teslim Tarihi</label>
                      <input
                        type="date"
                        value={editForm.due_date || ''}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, due_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                      <textarea
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {activeTab === 'announcements' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duyuru Başlığı</label>
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                      <select
                        value={editForm.type || 'info'}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="info">Bilgi</option>
                        <option value="warning">Uyarı</option>
                        <option value="success">Başarı</option>
                        <option value="error">Hata</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">İçerik</label>
                      <textarea
                        value={editForm.content || ''}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, content: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows={4}
                        required
                      />
                    </div>
                  </>
                )}

                {activeTab === 'exams' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sınav Adı</label>
                      <input
                        type="text"
                        value={editForm.exam_name || ''}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, exam_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sınav Türü</label>
                      <select
                        value={editForm.exam_type || ''}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, exam_type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      >
                        <option value="">Tür seçin</option>
                        <option value="TYT">TYT</option>
                        <option value="AYT">AYT</option>
                        <option value="LGS">LGS</option>
                        <option value="Quiz">Quiz</option>
                        <option value="Yazılı">Yazılı</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sınav Tarihi</label>
                      <input
                        type="date"
                        value={editForm.exam_date || ''}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, exam_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Soru Sayısı</label>
                      <input
                        type="number"
                        value={editForm.total_questions || ''}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, total_questions: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="1"
                      />
                    </div>
                  </>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editLoading ? 'Güncelleniyor...' : 'Güncelle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-red-600">Silme Onayı</h3>
                <button onClick={() => setShowDeleteModal(false)}>
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  <strong>{selectedItem?.title || selectedItem?.exam_name}</strong> öğesini silmek istediğinizden emin misiniz?
                </p>
                <p className="text-red-600 text-sm mt-2">Bu işlem geri alınamaz!</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? 'Siliniyor...' : 'Sil'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Modal */}
        {showResultsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  {selectedItem?.exam_name} - Öğrenci Sonuçları
                </h3>
                <button onClick={() => setShowResultsModal(false)}>
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              {/* Öğrenci Sonuçları Formu */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                    Öğrenci Sonuçlarını Girin
                  </h4>
                  <button
                    onClick={addStudentRow}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Öğrenci Ekle</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-left">Sıra</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Öğrenci Ad Soyad *</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Puan *</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Doğru</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Yanlış</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Boş</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Not</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentResults.map((result, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                              {result.ranking}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="text"
                              value={result.student_name}
                              onChange={(e) => handleStudentResultChange(index, 'student_name', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Ad Soyad"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={result.score}
                              onChange={(e) => handleStudentResultChange(index, 'score', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="0.0"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              value={result.correct_answers}
                              onChange={(e) => handleStudentResultChange(index, 'correct_answers', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="0"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              value={result.wrong_answers}
                              onChange={(e) => handleStudentResultChange(index, 'wrong_answers', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="0"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              value={result.empty_answers}
                              onChange={(e) => handleStudentResultChange(index, 'empty_answers', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="0"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="text"
                              value={result.note}
                              onChange={(e) => handleStudentResultChange(index, 'note', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Açıklama"
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <button
                              onClick={() => removeStudentRow(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                              disabled={studentResults.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    * İşaretli alanlar zorunludur. En az bir öğrenci sonucu girmelisiniz.
                  </p>
                  <button
                    onClick={handleSaveResults}
                    disabled={savingResults}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingResults ? 'Kaydediliyor...' : 'Sonuçları Kaydet'}</span>
                  </button>
                </div>
              </div>

              {/* Mevcut Sonuçların Görüntülendiği Tablo */}
              {selectedItem?.class_exam_results && selectedItem.class_exam_results.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-green-600" />
                    Kayıtlı Öğrenci Sonuçları
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-left">Sıra</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Öğrenci</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Puan</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Doğru</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Yanlış</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Boş</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Not</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItem.class_exam_results
                          .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
                          .map((result: any, index: number) => (
                            <tr key={result.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                  index === 1 ? 'bg-gray-100 text-gray-800' :
                                  index === 2 ? 'bg-orange-100 text-orange-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="border border-gray-300 px-4 py-2 font-medium">
                                {result.student_name || 'Genel Sınav Sonucu'}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 font-semibold text-blue-600">
                                {result.score ? result.score.toFixed(1) : '0'}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-green-600">
                                {result.correct_answers || 0}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-red-600">
                                {result.wrong_answers || 0}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-600">
                                {result.empty_answers || 0}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-600">
                                {result.student_note || '-'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl">
              <button
                type="button"
                onClick={handleCloseForm}
                className="absolute right-4 top-4 text-gray-400 transition hover:text-gray-600"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'assignments' && 'Yeni Ödev'}
                  {activeTab === 'announcements' && 'Yeni Duyuru'}
                  {activeTab === 'exams' && 'Yeni Sınav'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {activeTab === 'assignments' && 'Ödev detaylarını öğrencilerinizle paylaşın.'}
                  {activeTab === 'announcements' && 'Önemli duyurularınızı sınıfla paylaşın.'}
                  {activeTab === 'exams' && 'Yeni bir sınav planlayın ve temel bilgileri girin.'}
                </p>
              </div>
              <div className="px-6 py-6">
                {activeTab === 'assignments' && (
                  <form onSubmit={handleSubmitAssignment} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Ödev Başlığı *</label>
                      <input
                        type="text"
                        value={assignmentForm.title}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Örnek: Paragraf Analizi çalışması"
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Ders *</label>
                        <select
                          value={assignmentForm.subject}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, subject: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Ders seçin</option>
                          {subjects.map((subject) => (
                            <option key={subject} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Son Teslim Tarihi *</label>
                        <input
                          type="date"
                          value={assignmentForm.due_date}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, due_date: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Açıklama</label>
                      <textarea
                        value={assignmentForm.description}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="Ödev hakkında kısa bilgi ekleyin"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCloseForm}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Kaydediliyor...' : 'Ödevi Kaydet'}
                      </button>
                    </div>
                  </form>
                )}
                {activeTab === 'announcements' && (
                  <form onSubmit={handleSubmitAnnouncement} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Duyuru Başlığı *</label>
                      <input
                        type="text"
                        value={announcementForm.title}
                        onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Örn: Veli toplantısı duyurusu"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Tür</label>
                      <select
                        value={announcementForm.type}
                        onChange={(e) => setAnnouncementForm(prev => ({ ...prev, type: e.target.value as 'info' | 'warning' | 'success' | 'error' }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="info">Bilgilendirme</option>
                        <option value="warning">Uyarı</option>
                        <option value="success">Başarı</option>
                        <option value="error">Hata</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">İçerik *</label>
                      <textarea
                        value={announcementForm.content}
                        onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={5}
                        placeholder="Duyuru metnini buraya yazın"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCloseForm}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Kaydediliyor...' : 'Duyuruyu Kaydet'}
                      </button>
                    </div>
                  </form>
                )}
                {activeTab === 'exams' && (
                  <form onSubmit={handleSubmitExam} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Sınav Adı *</label>
                      <input
                        type="text"
                        value={examForm.exam_name}
                        onChange={(e) => setExamForm(prev => ({ ...prev, exam_name: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Örn: TYT Deneme 5"
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Sınav Türü</label>
                        <input
                          type="text"
                          value={examForm.exam_type}
                          onChange={(e) => setExamForm(prev => ({ ...prev, exam_type: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Örn: TYT, AYT, LGS..."
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Sınav Tarihi *</label>
                        <input
                          type="date"
                          value={examForm.exam_date}
                          onChange={(e) => setExamForm(prev => ({ ...prev, exam_date: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Toplam Soru Sayısı</label>
                      <input
                        type="number"
                        min="0"
                        value={examForm.total_questions}
                        onChange={(e) => setExamForm(prev => ({ ...prev, total_questions: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Örn: 120"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCloseForm}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Kaydediliyor...' : 'Sınavı Kaydet'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
