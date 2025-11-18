import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  History,
  AlertCircle,
  CheckCircle,
  Loader2,
  Brain,
  MessageSquare,
  Image as ImageIcon,
  X,
  Camera,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAuth } from '../hooks/useAuth';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import {
  getAICredits,
  askAI,
  getAIHistory,
  formatAIDate,
  uploadAIImage,
  getConversations,
  getConversationMessages,
  type AICredits,
  type AIQuestion,
  type AskAIError,
  type Message as APIMessage,
} from '../lib/aiApi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

export default function AIChatPanel() {
  const { user } = useAuth();
  const { planName } = useFeatureAccess();
  const [credits, setCredits] = useState<AICredits | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<AIQuestion[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load credits and history on mount
  useEffect(() => {
    if (user?.id) {
      loadCredits();
      loadHistory();
    }
  }, [user?.id]);

  const loadCredits = async () => {
    if (!user?.id) return;
    const data = await getAICredits(user.id);
    setCredits(data);
  };

  const loadHistory = async () => {
    if (!user?.id) return;
    const data = await getAIHistory(user.id, 20);
    setHistory(data);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Lütfen geçerli bir görsel dosyası seçin');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Görsel dosyası 10MB\'dan küçük olmalıdır');
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || loading) return;

    const userQuestion = question.trim();
    const imageFile = selectedImage;
    const imagePreviewUrl = imagePreview;

    setQuestion('');
    setError(null);

    let uploadedImageUrl: string | null = null;

    // Upload image if present
    if (imageFile && user?.id) {
      setUploadingImage(true);
      uploadedImageUrl = await uploadAIImage(imageFile, user.id);
      setUploadingImage(false);

      if (!uploadedImageUrl) {
        setError('Görsel yüklenirken hata oluştu. Lütfen tekrar deneyin.');
        return;
      }

      // Clear image after upload
      clearImage();
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userQuestion,
      timestamp: new Date(),
      imageUrl: uploadedImageUrl || imagePreviewUrl || undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Build conversation history for API
      const conversationHistory: APIMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
        image_url: m.imageUrl,
      }));

      const response = await askAI(userQuestion, {
        conversationId: conversationId || undefined,
        messages: conversationHistory,
        imageUrl: uploadedImageUrl || undefined,
        imageBase64: !uploadedImageUrl && imagePreviewUrl ? imagePreviewUrl : undefined,
      });

      // Update conversation ID if new
      if (response.conversationId && !conversationId) {
        setConversationId(response.conversationId);
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update credits
      setCredits((prev) =>
        prev
          ? {
              ...prev,
              remaining_credits: response.remainingCredits,
              used_credits: prev.weekly_credits - response.remainingCredits,
            }
          : null
      );

      // Reload history
      loadHistory();
    } catch (err: any) {
      const errorData = err as AskAIError;

      if (errorData.code === 'PLAN_RESTRICTION') {
        setError('AI özelliği sadece Profesyonel ve Gelişmiş paket sahiplerine açıktır.');
      } else if (errorData.code === 'NO_CREDITS') {
        setError(
          `Bu hafta için AI krediniz bitti. Yeni krediler ${new Date(
            errorData.weekEndDate || ''
          ).toLocaleDateString('tr-TR')} tarihinde yüklenecek.`
        );
      } else {
        setError(errorData.error || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }

      // Remove user message if error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryQuestion = (historyItem: AIQuestion) => {
    setMessages([
      {
        id: `history-q-${historyItem.id}`,
        role: 'user',
        content: historyItem.question,
        timestamp: new Date(historyItem.asked_at),
      },
      {
        id: `history-a-${historyItem.id}`,
        role: 'assistant',
        content: historyItem.answer,
        timestamp: new Date(historyItem.asked_at),
      },
    ]);
    setShowHistory(false);
  };

  // Check if user has professional or advanced plan
  const hasAIAccess = planName === 'professional' || planName === 'advanced';

  if (!hasAIAccess) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Yapay Zeka Asistanı
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            AI özelliği sadece <strong>Profesyonel ve Gelişmiş Paket</strong> sahiplerine açıktır.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              AI ile neler yapabilirsiniz?
            </h3>
            <ul className="space-y-2 text-left text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Matematik, Fizik, Kimya sorularınızı çözün</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Fotoğraf çekerek soru sorun, AI analiz edip çözsün</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Konuları detaylı şekilde öğrenin</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Çalışma teknikleri ve motivasyon alın</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Sohbet geçmişi - Konuşmalarınızı hatırlıyor</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Haftalık 10 soru hakkı</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Profesyonel Pakete Geç
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Main Chat Area */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col h-[calc(100vh-12rem)]">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Yapay Zeka Asistanı
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sorularınızı sorun, size yardımcı olalım
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Credits Display */}
            {credits && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900 px-3 py-1.5 rounded-full">
                  <Sparkles className="w-4 h-4 text-green-600 dark:text-green-300" />
                  <span className="font-semibold text-green-700 dark:text-green-200">
                    {credits.remaining_credits} / {credits.weekly_credits} Kredi
                  </span>
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  Yenileme:{' '}
                  {new Date(credits.week_end_date).toLocaleDateString('tr-TR')}
                </span>
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Henüz soru sormadınız
                </h3>
                <p className="text-gray-500 dark:text-gray-500 max-w-md">
                  Matematik, Fizik, Kimya veya diğer derslerle ilgili sorularınızı
                  aşağıdaki kutuya yazın.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Uploaded"
                        className="rounded-lg mb-2 max-w-full max-h-64 object-contain"
                      />
                    )}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          // Custom styling for markdown elements
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0">{children}</p>
                          ),
                          code: ({ className, children }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">
                                {children}
                              </code>
                            ) : (
                              <code className={className}>{children}</code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <p
                      className={`text-xs mt-2 ${
                        message.role === 'user'
                          ? 'text-blue-100'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4">
                  <Loader2 className="w-6 h-6 text-gray-600 dark:text-gray-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleAskQuestion} className="p-6 border-t border-gray-200 dark:border-gray-700">
            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-32 rounded-lg border-2 border-blue-500"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Sorunuzu buraya yazın veya fotoğraf yükleyin..."
                disabled={loading || uploadingImage || (credits !== null && credits.remaining_credits <= 0)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {/* Image Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploadingImage}
                className="px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Fotoğraf Yükle"
              >
                {uploadingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>

              <button
                type="submit"
                disabled={loading || uploadingImage || !question.trim() || (credits !== null && credits.remaining_credits <= 0)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading || uploadingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Gönder
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar - History & Stats */}
        <div
          className={`${
            showHistory ? 'fixed inset-0 z-50 lg:relative' : 'hidden lg:block'
          } bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 overflow-y-auto lg:h-[calc(100vh-12rem)]`}
        >
          {showHistory && (
            <button
              onClick={() => setShowHistory(false)}
              className="lg:hidden mb-4 text-gray-600 dark:text-gray-400"
            >
              Kapat
            </button>
          )}

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5" />
            Geçmiş Sorular
          </h3>

          {history.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Henüz soru geçmişiniz yok
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => loadHistoryQuestion(item)}
                  className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                    {item.question}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatAIDate(item.asked_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
