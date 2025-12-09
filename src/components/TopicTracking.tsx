import { useState, useEffect } from 'react';
import { Target, BookOpen, CheckCircle } from 'lucide-react';
import {
  getTopicsByGrade,
  getSubjectsByGrade,
  getStudentProgressBySubject,
  upsertTopicProgress,
  addSourceBook,
  getTopicStats,
  type Topic,
  type StudentTopicProgress,
  type TopicStats,
} from '../lib/topicTrackingApi';

interface TopicTrackingProps {
  studentId: string;
  gradeLevel: number;
}

export default function TopicTracking({ studentId, gradeLevel: initialGradeLevel }: TopicTrackingProps) {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<Map<string, StudentTopicProgress>>(new Map());
  const [stats, setStats] = useState<TopicStats | null>(null);
  const [sortBy, setSortBy] = useState<'order' | 'progress'>('order');
  const [selectedGrade, setSelectedGrade] = useState<number>(initialGradeLevel || 9);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editPercentage, setEditPercentage] = useState('0');
  const [editQuestions, setEditQuestions] = useState('0');
  const [editCorrect, setEditCorrect] = useState('0');
  const [editWrong, setEditWrong] = useState('0');
  const [editBook, setEditBook] = useState('');

  useEffect(() => {
    loadData();
  }, [studentId, selectedGrade]);

  useEffect(() => {
    if (selectedSubject) {
      loadTopicsAndProgress();
    }
  }, [selectedSubject, sortBy, selectedGrade]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subjectsData, statsData] = await Promise.all([
        getSubjectsByGrade(selectedGrade),
        getTopicStats(studentId),
      ]);

      setSubjects(subjectsData);
      setStats(statsData);

      if (subjectsData.length > 0 && !selectedSubject) {
        setSelectedSubject(subjectsData[0]);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopicsAndProgress = async () => {
    try {
      const [topicsData, progressData] = await Promise.all([
        getTopicsByGrade(selectedGrade),
        getStudentProgressBySubject(studentId, selectedGrade, selectedSubject),
      ]);

      let filteredTopics = topicsData.filter((t) => t.subject === selectedSubject);

      if (sortBy === 'progress') {
        const progressMap = new Map<string, StudentTopicProgress>();
        progressData.forEach((p) => progressMap.set(p.topic_id, p));
        filteredTopics = filteredTopics.sort((a, b) => {
          const progressA = progressMap.get(a.id)?.completion_percentage || 0;
          const progressB = progressMap.get(b.id)?.completion_percentage || 0;
          return progressB - progressA;
        });
      } else {
        filteredTopics = filteredTopics.sort((a, b) => a.topic_order - b.topic_order);
      }

      setTopics(filteredTopics);

      const progressMap = new Map<string, StudentTopicProgress>();
      progressData.forEach((p) => progressMap.set(p.topic_id, p));
      setProgress(progressMap);
    } catch (error: any) {
      console.error('Error loading topics:', error);
    }
  };

  const handleTopicClick = (topic: Topic) => {
    const currentProgress = progress.get(topic.id);
    setEditingTopic(topic);
    setEditPercentage(currentProgress?.completion_percentage.toString() || '0');
    setEditQuestions(currentProgress?.total_questions_solved.toString() || '0');
    setEditCorrect(currentProgress?.correct_answers.toString() || '0');
    setEditWrong(currentProgress?.wrong_answers.toString() || '0');
    setEditBook('');
  };

  const handleSaveProgress = async () => {
    if (!editingTopic) return;

    try {
      const percentage = parseInt(editPercentage) || 0;
      const totalQuestions = parseInt(editQuestions) || 0;
      const correct = parseInt(editCorrect) || 0;
      const wrong = parseInt(editWrong) || 0;

      await upsertTopicProgress(studentId, editingTopic.id, {
        completion_percentage: Math.min(100, Math.max(0, percentage)),
        total_questions_solved: totalQuestions,
        correct_answers: correct,
        wrong_answers: wrong,
        is_completed: percentage >= 100,
      });

      if (editBook.trim()) {
        await addSourceBook(studentId, editingTopic.id, editBook.trim());
      }

      setEditingTopic(null);
      await loadTopicsAndProgress();
      await loadData();
    } catch (error: any) {
      console.error('Error saving:', error);
    }
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage === 0) return 'bg-gray-200';
    if (percentage < 25) return 'bg-red-500';
    if (percentage < 50) return 'bg-orange-500';
    if (percentage < 75) return 'bg-blue-500';
    if (percentage < 100) return 'bg-purple-500';
    return 'bg-green-500';
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-blue-600';
    if (accuracy >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getExamBadgeColor = (examType: string): string => {
    if (examType === 'LGS') return 'bg-purple-100 text-purple-700';
    if (examType === 'TYT') return 'bg-blue-100 text-blue-700';
    if (examType.startsWith('AYT')) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="text-center p-12">
        <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz konu eklenmemiş</h3>
        <p className="text-gray-500">{selectedGrade}. sınıf için konu bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grade Selector */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 rounded-lg">
        <p className="text-sm font-semibold text-gray-700 mb-2">Sınıf Seçin:</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                selectedGrade === grade
                  ? 'bg-indigo-600 text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-300'
              }`}
            >
              {grade}. Sınıf
            </button>
          ))}
        </div>
      </div>

      {/* Stats Header with Gradient */}
      {stats && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats.completedTopics}</div>
              <div className="text-sm text-indigo-100 mt-1">Tamamlanan</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats.inProgressTopics}</div>
              <div className="text-sm text-indigo-100 mt-1">Devam Eden</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats.totalQuestionsSolved}</div>
              <div className="text-sm text-indigo-100 mt-1">Toplam Soru</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats.accuracy}%</div>
              <div className="text-sm text-indigo-100 mt-1">Doğruluk</div>
            </div>
          </div>
        </div>
      )}

      {/* Subject Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {subjects.map((subject) => (
          <button
            key={subject}
            onClick={() => setSelectedSubject(subject)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
              selectedSubject === subject
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
            }`}
          >
            {subject}
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy('order')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            sortBy === 'order'
              ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-600'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
          }`}
        >
          Sıraya Göre
        </button>
        <button
          onClick={() => setSortBy('progress')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            sortBy === 'progress'
              ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-600'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
          }`}
        >
          İlerlemeye Göre
        </button>
      </div>

      {/* Topics List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.length === 0 ? (
          <div className="col-span-full text-center p-12">
            <Target className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Konu bulunamadı</h3>
            <p className="text-gray-500">{selectedSubject} için konu bulunmuyor</p>
          </div>
        ) : (
          topics.map((topic) => {
            const topicProgress = progress.get(topic.id);
            const percentage = topicProgress?.completion_percentage || 0;
            const totalQ = topicProgress?.total_questions_solved || 0;
            const correct = topicProgress?.correct_answers || 0;
            const wrong = topicProgress?.wrong_answers || 0;
            const books = topicProgress?.source_books || [];
            const accuracy = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
            const isCompleted = percentage === 100;
            const isStarted = percentage > 0;

            return (
              <div
                key={topic.id}
                onClick={() => handleTopicClick(topic)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-4"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{topic.topic_name}</h4>
                    {topic.exam_type && (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getExamBadgeColor(topic.exam_type)}`}>
                        {topic.exam_type}
                      </span>
                    )}
                  </div>
                  {isCompleted && (
                    <div className="flex-shrink-0 ml-2">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">İlerleme</span>
                    <span className="text-sm font-bold text-gray-900">{percentage}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(percentage)} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Statistics */}
                {isStarted ? (
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{totalQ}</div>
                      <div className="text-xs text-gray-500">Soru</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{correct}</div>
                      <div className="text-xs text-gray-500">Doğru</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{wrong}</div>
                      <div className="text-xs text-gray-500">Yanlış</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getAccuracyColor(accuracy)}`}>{accuracy}%</div>
                      <div className="text-xs text-gray-500">Başarı</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 border-t border-gray-100">
                    <p className="text-sm text-gray-400 mb-1">Henüz başlanmadı</p>
                    <p className="text-xs text-indigo-600 font-medium">Başlamak için tıkla 👆</p>
                  </div>
                )}

                {/* Source Books */}
                {books.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">📚 Kaynaklar:</p>
                    <p className="text-xs text-gray-700 truncate">{books.join(', ')}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {editingTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-900">{editingTopic.topic_name}</h3>
                <button
                  onClick={() => setEditingTopic(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamamlanma Yüzdesi (%)
                  </label>
                  <input
                    type="number"
                    value={editPercentage}
                    onChange={(e) => setEditPercentage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0-100"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Toplam Soru Sayısı
                  </label>
                  <input
                    type="number"
                    value={editQuestions}
                    onChange={(e) => setEditQuestions(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Örn: 50"
                    min="0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Doğru
                    </label>
                    <input
                      type="number"
                      value={editCorrect}
                      onChange={(e) => setEditCorrect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yanlış
                    </label>
                    <input
                      type="number"
                      value={editWrong}
                      onChange={(e) => setEditWrong(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kaynak Kitap Ekle
                  </label>
                  <input
                    type="text"
                    value={editBook}
                    onChange={(e) => setEditBook(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Örn: Orijinal Yayınları TYT Matematik"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingTopic(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSaveProgress}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
