import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  Eye,
  Send,
  Image as ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ArrowUp
} from 'lucide-react';
import {
  getAllQuestions,
  getAnswersForQuestion,
  createQuestion,
  createAnswer,
  toggleQuestionLike,
  toggleAnswerLike,
  markQuestionAsSolved,
  uploadQuestionImage,
  StudentQuestion,
  StudentAnswer,
  CreateQuestionData
} from '../lib/studentQuestionPortalApi';

export default function SoruPortali() {
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<StudentQuestion | null>(null);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterSolved, setFilterSolved] = useState<string>('all');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    // DEBUG: Test insert
    import('../lib/studentQuestionPortalApi').then(module => {
      module.testInsertQuestion();
    });

    loadQuestions();
    getCurrentUserId();
  }, []);

  const getCurrentUserId = async () => {
    const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser());
    if (user) setCurrentUserId(user.id);
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser());
      const data = await getAllQuestions(user?.id);
      setQuestions(data);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnswers = async (questionId: string) => {
    try {
      const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser());
      const data = await getAnswersForQuestion(questionId, user?.id);
      setAnswers(data);
    } catch (error) {
      console.error('Error loading answers:', error);
    }
  };

  const handleQuestionClick = async (question: StudentQuestion) => {
    setSelectedQuestion(question);
    await loadAnswers(question.id);
  };

  const handleLikeQuestion = async (questionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const liked = await toggleQuestionLike(questionId);
      setQuestions(prev =>
        prev.map(q =>
          q.id === questionId
            ? {
                ...q,
                like_count: (q.like_count || 0) + (liked ? 1 : -1),
                user_has_liked: liked
              }
            : q
        )
      );
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion(prev =>
          prev
            ? {
                ...prev,
                like_count: (prev.like_count || 0) + (liked ? 1 : -1),
                user_has_liked: liked
              }
            : null
        );
      }
    } catch (error) {
      console.error('Error liking question:', error);
    }
  };

  const handleLikeAnswer = async (answerId: string) => {
    try {
      const liked = await toggleAnswerLike(answerId);
      setAnswers(prev =>
        prev.map(a =>
          a.id === answerId
            ? {
                ...a,
                like_count: (a.like_count || 0) + (liked ? 1 : -1),
                user_has_liked: liked
              }
            : a
        )
      );
    } catch (error) {
      console.error('Error liking answer:', error);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !answerText.trim()) return;

    try {
      await createAnswer({
        question_id: selectedQuestion.id,
        answer_text: answerText
      });
      setAnswerText('');
      await loadAnswers(selectedQuestion.id);
      await loadQuestions(); // Refresh to update answer count
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleMarkAsSolved = async (questionId: string) => {
    try {
      await markQuestionAsSolved(questionId, true);
      await loadQuestions();
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion(prev => (prev ? { ...prev, is_solved: true } : null));
      }
    } catch (error) {
      console.error('Error marking as solved:', error);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    const matchesSolved =
      filterSolved === 'all' ||
      (filterSolved === 'solved' && q.is_solved) ||
      (filterSolved === 'unsolved' && !q.is_solved);
    return matchesSearch && matchesDifficulty && matchesSolved;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Soru Portalı</h1>
            <p className="text-gray-600 mt-1">Çözemediğin soruları paylaş, diğer öğrencilerden yardım al</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Soru Paylaş
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Soru ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Tüm Zorluklar</option>
            <option value="easy">Kolay</option>
            <option value="medium">Orta</option>
            <option value="hard">Zor</option>
          </select>
          <select
            value={filterSolved}
            onChange={(e) => setFilterSolved(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Tümü</option>
            <option value="unsolved">Çözülmemiş</option>
            <option value="solved">Çözülmüş</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Questions Feed */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Sorular ({filteredQuestions.length})
          </h2>
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Henüz soru paylaşılmamış</p>
              </div>
            ) : (
              filteredQuestions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onClick={() => handleQuestionClick(question)}
                  onLike={(e) => handleLikeQuestion(question.id, e)}
                  isSelected={selectedQuestion?.id === question.id}
                  currentUserId={currentUserId}
                />
              ))
            )}
          </div>
        </div>

        {/* Question Detail & Answers */}
        <div className="lg:sticky lg:top-6 h-fit">
          {selectedQuestion ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Question Detail */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedQuestion.title}</h2>
                      {selectedQuestion.is_solved && (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                    {selectedQuestion.difficulty && (
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          selectedQuestion.difficulty === 'easy'
                            ? 'bg-green-100 text-green-800'
                            : selectedQuestion.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {selectedQuestion.difficulty === 'easy'
                          ? 'Kolay'
                          : selectedQuestion.difficulty === 'medium'
                          ? 'Orta'
                          : 'Zor'}
                      </span>
                    )}
                  </div>
                  {!selectedQuestion.is_solved && selectedQuestion.student_id === currentUserId && (
                    <button
                      onClick={() => handleMarkAsSolved(selectedQuestion.id)}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Çözüldü olarak işaretle
                    </button>
                  )}
                </div>
                <p className="text-gray-700 whitespace-pre-wrap mb-4">{selectedQuestion.description}</p>
                {selectedQuestion.image_url && (
                  <img
                    src={selectedQuestion.image_url}
                    alt="Soru görseli"
                    className="rounded-lg max-w-full h-auto mb-4"
                  />
                )}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {selectedQuestion.view_count} görüntülenme
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {selectedQuestion.answer_count || 0} yanıt
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {selectedQuestion.like_count || 0} beğeni
                  </div>
                </div>
              </div>

              {/* Answers */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Yanıtlar ({answers.length})
                </h3>
                <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                  {answers.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Henüz yanıt yok. İlk yanıtı sen ver!</p>
                  ) : (
                    answers.map((answer) => (
                      <AnswerCard
                        key={answer.id}
                        answer={answer}
                        onLike={() => handleLikeAnswer(answer.id)}
                        currentUserId={currentUserId}
                      />
                    ))
                  )}
                </div>

                {/* Answer Form */}
                <form onSubmit={handleSubmitAnswer} className="border-t border-gray-200 pt-4">
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Yanıtını yaz..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!answerText.trim()}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                      Yanıtla
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Detayları görmek için bir soru seç</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Question Modal */}
      {showCreateModal && (
        <CreateQuestionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={async () => {
            setShowCreateModal(false);
            await loadQuestions();
          }}
        />
      )}
    </div>
  );
}

// Question Card Component
function QuestionCard({
  question,
  onClick,
  onLike,
  isSelected,
  currentUserId
}: {
  question: StudentQuestion;
  onClick: () => void;
  onLike: (e: React.MouseEvent) => void;
  isSelected: boolean;
  currentUserId: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-indigo-500 shadow-md' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 flex-1 line-clamp-2">{question.title}</h3>
        {question.is_solved && <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />}
      </div>
      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{question.description}</p>
      {question.image_url && (
        <img
          src={question.image_url}
          alt="Preview"
          className="rounded mb-3 w-full h-32 object-cover"
        />
      )}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {question.answer_count || 0}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {question.view_count}
          </div>
        </div>
        <button
          onClick={onLike}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            question.user_has_liked
              ? 'text-indigo-600 bg-indigo-50'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ThumbsUp className="h-4 w-4" />
          {question.like_count || 0}
        </button>
      </div>
    </div>
  );
}

// Answer Card Component
function AnswerCard({
  answer,
  onLike,
  currentUserId
}: {
  answer: StudentAnswer;
  onLike: () => void;
  currentUserId: string;
}) {
  const isOwnAnswer = answer.student_id === currentUserId;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
            {isOwnAnswer ? 'Sen' : 'Ö'}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{isOwnAnswer ? 'Sen' : 'Öğrenci'}</p>
            <p className="text-xs text-gray-500">
              {new Date(answer.created_at).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
        {answer.is_accepted && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
            Kabul Edildi
          </span>
        )}
      </div>
      <p className="text-gray-700 whitespace-pre-wrap mb-3">{answer.answer_text}</p>
      {answer.image_url && (
        <img src={answer.image_url} alt="Yanıt görseli" className="rounded-lg max-w-full h-auto mb-3" />
      )}
      <button
        onClick={onLike}
        className={`flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors ${
          answer.user_has_liked ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-200'
        }`}
      >
        <ThumbsUp className="h-4 w-4" />
        {answer.like_count || 0}
      </button>
    </div>
  );
}

// Create Question Modal Component
function CreateQuestionModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<CreateQuestionData>({
    title: '',
    description: '',
    subject: '',
    topic: '',
    difficulty: undefined
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let imageUrl = '';
      if (imageFile) {
        const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser());
        if (user) {
          imageUrl = await uploadQuestionImage(imageFile, user.id);
        }
      }

      await createQuestion({
        ...formData,
        image_url: imageUrl || undefined
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Soru oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Yeni Soru Paylaş</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Başlık <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Sorunun kısa bir özeti"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Sorunun detaylarını açıkla..."
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ders</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Örn: Matematik"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Konu</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Örn: Türev"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zorluk</label>
            <select
              value={formData.difficulty || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  difficulty: e.target.value as 'easy' | 'medium' | 'hard' | undefined
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Seçiniz</option>
              <option value="easy">Kolay</option>
              <option value="medium">Orta</option>
              <option value="hard">Zor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Görsel (opsiyonel)</label>
            <div className="mt-1">
              <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
                <ImageIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Görsel yükle</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
            {imagePreview && (
              <div className="mt-3 relative">
                <img src={imagePreview} alt="Preview" className="rounded-lg max-w-full h-auto" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Paylaşılıyor...' : 'Paylaş'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
