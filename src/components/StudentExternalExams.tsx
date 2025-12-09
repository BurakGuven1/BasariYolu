import { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Target,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import {
  fetchStudentAssignedExams,
  submitStudentExamAnswers,
  type StudentExamAssignment,
} from '../lib/institutionExternalExamApi';
import StudentExamResultDetail from './StudentExamResultDetail';

interface StudentExternalExamsProps {
  userId: string;
  institutionId?: string;
}

export default function StudentExternalExams({ userId, institutionId }: StudentExternalExamsProps) {
  const [assignments, setAssignments] = useState<StudentExamAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentExamAssignment | null>(null);
  const [showAnswerEntry, setShowAnswerEntry] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, [userId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStudentAssignedExams(userId);
      console.log('📚 Loaded assignments:', data);

      // Check if template data is properly loaded
      data.forEach((assignment, index) => {
        console.log(`📋 Assignment ${index + 1}:`, {
          id: assignment.id,
          template_id: assignment.template_id,
          template: assignment.template,
          totalQuestions: assignment.template?.total_questions,
          answerKey: assignment.template?.answer_key ? Object.keys(assignment.template.answer_key).length : 0
        });
      });

      setAssignments(data);
    } catch (error: any) {
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        setError('Veritabanı tabloları henüz oluşturulmamış. Lütfen yöneticinize migration dosyasını çalıştırmasını söyleyin.');
      } else {
        setError('Sınavlar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (assignment: StudentExamAssignment) => {
    if (assignment.has_submitted) {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          <CheckCircle className="h-4 w-4" />
          Tamamlandı
        </div>
      );
    }

    if (assignment.status === 'expired') {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
          <AlertCircle className="h-4 w-4" />
          Süresi Doldu
        </div>
      );
    }

    // Check deadline
    if (assignment.deadline) {
      const deadline = new Date(assignment.deadline);
      const now = new Date();
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        return (
          <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <AlertCircle className="h-4 w-4" />
            Süresi Doldu
          </div>
        );
      } else if (daysLeft <= 3) {
        return (
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
            <Clock className="h-4 w-4" />
            {daysLeft} Gün Kaldı
          </div>
        );
      }
    }

    return (
      <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
        <Clock className="h-4 w-4" />
        Bekliyor
      </div>
    );
  };

  const handleStartExam = (assignment: StudentExamAssignment) => {
    setSelectedAssignment(assignment);
    setShowAnswerEntry(true);
  };

  const handleAnswerSubmitted = () => {
    setShowAnswerEntry(false);
    setShowResults(true); // Show results after submission
    loadAssignments(); // Reload to update status
  };

  const handleViewResults = (assignment: StudentExamAssignment) => {
    setSelectedAssignment(assignment);
    setShowResults(true);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Sınavlar yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="text-center">
          <div className="p-4 bg-red-100 rounded-full inline-block mb-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Bir Hata Oluştu</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadAssignments}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // Show results view
  if (showResults && selectedAssignment && institutionId) {
    return (
      <StudentExamResultDetail
        userId={userId}
        institutionId={institutionId}
        templateId={selectedAssignment.template_id}
        examDate={selectedAssignment.exam_date}
        onBack={() => {
          setShowResults(false);
          setSelectedAssignment(null);
        }}
      />
    );
  }

  // Show answer entry
  if (showAnswerEntry && selectedAssignment) {
    return (
      <StudentAnswerEntry
        assignment={selectedAssignment}
        userId={userId}
        onSubmitted={handleAnswerSubmitted}
        onCancel={() => {
          setShowAnswerEntry(false);
          setSelectedAssignment(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8" />
          <div>
            <h2 className="text-2xl font-bold">Sınavlarım</h2>
            <p className="text-indigo-100 mt-1">
              Size atanan harici sınavları buradan girebilirsiniz
            </p>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz sınav atanmamış</h3>
          <p className="text-gray-600">
            Öğretmeniniz size sınav atadığında burada görünecektir
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((assignment) => {
            const template = assignment.template as any;
            return (
              <div
                key={assignment.id}
                className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 ${
                  assignment.has_submitted
                    ? 'border-green-500'
                    : assignment.status === 'expired'
                    ? 'border-gray-400'
                    : 'border-indigo-500'
                }`}
              >
                {/* Status Badge */}
                <div className="flex items-start justify-between mb-4">
                  {getStatusBadge(assignment)}
                  <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                    {template?.exam_type}
                  </span>
                </div>

                {/* Exam Info */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {template?.name || 'Sınav'}
                </h3>
                {template?.publisher && (
                  <p className="text-sm text-gray-600 mb-3">
                    📚 {template.publisher}
                  </p>
                )}

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Sınav Tarihi: {new Date(assignment.exam_date).toLocaleDateString('tr-TR')}</span>
                  </div>
                  {assignment.deadline && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Son Giriş: {new Date(assignment.deadline).toLocaleDateString('tr-TR')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Target className="h-4 w-4" />
                    <span>{template?.total_questions} Soru</span>
                  </div>
                </div>

                {/* Action Button */}
                {!assignment.has_submitted && assignment.status !== 'expired' ? (
                  <button
                    onClick={() => handleStartExam(assignment)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Cevaplarını Gir
                    <ChevronRight className="h-5 w-5" />
                  </button>
                ) : assignment.has_submitted ? (
                  <div className="space-y-2">
                    <div className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Cevaplar Kaydedildi
                    </div>
                    <button
                      onClick={() => handleViewResults(assignment)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      <TrendingUp className="h-5 w-5" />
                      Performans Analizini Gör
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium">
                    <AlertCircle className="h-5 w-5" />
                    Süresi Dolmuş
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Öğrenci Cevap Girişi Ekranı
 */
interface StudentAnswerEntryProps {
  assignment: StudentExamAssignment;
  userId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}

function StudentAnswerEntry({
  assignment,
  userId,
  onSubmitted,
  onCancel,
}: StudentAnswerEntryProps) {
  const template = assignment.template as any;
  const totalQuestions = template?.total_questions || 0;

  console.log('StudentAnswerEntry - assignment:', assignment);
  console.log('StudentAnswerEntry - template:', template);
  console.log('StudentAnswerEntry - totalQuestions:', totalQuestions);

  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D' | 'E' | 'X'>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize all answers as X (empty)
  useEffect(() => {
    if (totalQuestions === 0) {
      setError('Sınav bilgileri yüklenemedi. Lütfen sayfayı yenileyin.');
      return;
    }

    const initialAnswers: Record<number, 'A' | 'B' | 'C' | 'D' | 'E' | 'X'> = {};
    for (let i = 1; i <= totalQuestions; i++) {
      initialAnswers[i] = 'X';
    }
    setAnswers(initialAnswers);
  }, [totalQuestions]);

  const updateAnswer = (questionNum: number, answer: 'A' | 'B' | 'C' | 'D' | 'E' | 'X') => {
    setAnswers(prev => ({
      ...prev,
      [questionNum]: answer,
    }));
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter(a => a !== 'X').length;
  };

  const handleSubmit = async () => {
    // Confirm submission
    const answeredCount = getAnsweredCount();
    const emptyCount = totalQuestions - answeredCount;

    if (emptyCount > 0) {
      const confirmed = window.confirm(
        `${emptyCount} soru boş bırakıldı. Cevapları göndermek istediğinizden emin misiniz?`
      );
      if (!confirmed) return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await submitStudentExamAnswers({
        assignmentId: assignment.id,
        answers,
        userId,
      });

      onSubmitted();
    } catch (err: any) {
      console.error('Error submitting answers:', err);
      setError(err.message || 'Cevaplar gönderilirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = getAnsweredCount();
  const progress = (answeredCount / totalQuestions) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{template?.name}</h2>
        <div className="flex items-center gap-4 text-indigo-100">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <span>{totalQuestions} Soru</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>{answeredCount} Cevaplandı</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>İlerleme</span>
            <span className="font-semibold">%{Math.round(progress)}</span>
          </div>
          <div className="h-3 bg-indigo-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Answer Grid */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Cevaplarınızı İşaretleyin</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(questionNum => (
            <div key={questionNum} className="border border-gray-200 rounded-lg p-3">
              <div className="text-center font-semibold text-gray-700 mb-2">
                {questionNum}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['A', 'B', 'C', 'D', 'E', 'X'] as const).map(option => (
                  <button
                    key={option}
                    onClick={() => updateAnswer(questionNum, option)}
                    className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                      answers[questionNum] === option
                        ? option === 'X'
                          ? 'bg-gray-600 text-white'
                          : 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>İpucu:</strong> X = Boş bırakıldı. Cevap vermediyseniz X seçin.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
        >
          İptal
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Gönderiliyor...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              Cevapları Gönder
            </>
          )}
        </button>
      </div>
    </div>
  );
}
