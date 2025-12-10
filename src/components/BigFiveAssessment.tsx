import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Award, RotateCcw } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import {
  getBigFiveQuestions,
  getStudentResponses,
  saveBigFiveResponses,
  calculateBigFiveScores,
  saveBigFiveResults,
  getStudentBigFiveResults,
  hasCompletedAssessment,
  resetAssessment,
  type BigFiveQuestion,
  type BigFiveScores,
  TRAIT_LABELS,
  TRAIT_DESCRIPTIONS,
  type BigFiveTrait,
} from '../lib/bigFiveApi';

interface BigFiveAssessmentProps {
  studentId: string;
  gradeLevel: number;
}

type ViewMode = 'intro' | 'questionnaire' | 'results';

// Kişiselleştirilmiş analiz metinleri
const getTraitAnalysis = (trait: BigFiveTrait, score: number): string => {
  const level = score < 2.5 ? 'low' : score < 3.5 ? 'medium' : 'high';

  const analyses: Record<BigFiveTrait, Record<'low' | 'medium' | 'high', string>> = {
    openness: {
      low: 'Pratik ve geleneksel yaklaşımları tercih ediyorsunuz. Bilinen yöntemleri uygulamada başarılısınız.',
      medium: 'Dengeli bir yaklaşım sergiliyorsunuz - hem yenilikçi hem de pratik olabiliyorsunuz.',
      high: 'Yaratıcı ve yenilikçisiniz! Yeni fikirlere açık olmanız sizi farklı kılıyor. Sanat, bilim gibi yaratıcılık gerektiren alanlarda başarılı olabilirsiniz.',
    },
    conscientiousness: {
      low: 'Esnek ve spontane bir yaklaşımınız var. Rutin olmayan işlerde rahat çalışabilirsiniz.',
      medium: 'Organize olmayı biliyorsunuz, ancak gerektiğinde esneksiniz de. İyi bir denge kurmuşsunuz.',
      high: 'Son derece düzenli ve sorumlusunuz! Hedef odaklı çalışma tarzınız akademik başarınızı destekliyor. Uzun vadeli planlarınızda başarılı olacaksınız.',
    },
    extraversion: {
      low: 'Sessiz ve içe dönüksiniz. Derin düşünme ve tek başına çalışma sizin gücünüz. Konsantre olmayı gerektiren alanlarda parlayabilirsiniz.',
      medium: 'Sosyal ve yalnız kalma arasında iyi bir denge kurmuşsunuz. Hem grup çalışmalarında hem bireysel projelerde başarılısınız.',
      high: 'Enerjik ve sosyalsiniz! İnsanlarla etkileşim kurmayı seviyorsunuz. Takım çalışmaları, liderlik, iletişim gerektiren alanlarda başarılı olacaksınız.',
    },
    agreeableness: {
      low: 'Rekabetçi ve analitiksiniz. Tartışmalarda fikirlerinizi güçlü savunabiliyorsunuz.',
      medium: 'İşbirlikçi ama gerektiğinde fikrinizi savunabiliyorsunuz. Dengeli bir yaklaşım sergiliyorsunuz.',
      high: 'Empatik ve işbirlikçisiniz! İnsanlarla iyi ilişkiler kurma yeteneğiniz var. Danışmanlık, eğitim, sosyal hizmetler gibi alanlarda başarılı olabilirsiniz.',
    },
    neuroticism: {
      low: 'Duygusal olarak dengeli ve sakınsiniz. Stresle başa çıkma konusunda güçlüsünüz. Bu özelliğiniz zorlu durumlarda size avantaj sağlayacak.',
      medium: 'Duygusal tepkileriniz dengeli. Çoğu durumda sakin kalabiliyorsunuz.',
      high: 'Duygusal olarak hassassınız. Bu empati yeteneğinizi güçlendiriyor ancak stres yönetimi tekniklerini öğrenmek size iyi gelebilir.',
    },
  };

  return analyses[trait][level];
};

export default function BigFiveAssessment({ studentId, gradeLevel }: BigFiveAssessmentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('intro');
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<BigFiveQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [scores, setScores] = useState<BigFiveScores | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    loadData();
  }, [studentId, gradeLevel]);

  const loadData = async () => {
    try {
      setLoading(true);
      const completed = await hasCompletedAssessment(studentId, gradeLevel);

      if (completed) {
        const result = await getStudentBigFiveResults(studentId);
        if (result) {
          setScores({
            openness: result.openness_score,
            conscientiousness: result.conscientiousness_score,
            extraversion: result.extraversion_score,
            agreeableness: result.agreeableness_score,
            neuroticism: result.neuroticism_score,
          });
          setViewMode('results');
        }
      } else {
        const [questionsData, responsesData] = await Promise.all([
          getBigFiveQuestions(gradeLevel),
          getStudentResponses(studentId),
        ]);

        setQuestions(questionsData);

        const responsesMap: Record<string, number> = {};
        responsesData.forEach((r) => {
          responsesMap[r.question_id] = r.response_value;
        });
        setResponses(responsesMap);

        const firstUnanswered = questionsData.findIndex((q) => !responsesMap[q.id]);
        if (firstUnanswered !== -1) {
          setCurrentQuestionIndex(firstUnanswered);
        }

        setViewMode('intro');
      }
    } catch (error) {
      console.error('Error loading Big Five data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = () => {
    setViewMode('questionnaire');
  };

  const handleResponse = (value: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const responsesArray = Object.entries(responses).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      await saveBigFiveResponses(studentId, responsesArray);
      const calculatedScores = await calculateBigFiveScores(studentId);

      if (calculatedScores) {
        await saveBigFiveResults(studentId, calculatedScores);
        setScores(calculatedScores);
        setViewMode('results');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Test tamamlanırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = async () => {
    if (!confirm('Önceki cevaplarınız silinecek. Emin misiniz?')) return;

    try {
      setLoading(true);
      await resetAssessment(studentId);
      setResponses({});
      setScores(null);
      setCurrentQuestionIndex(0);
      await loadData();
    } catch (error) {
      console.error('Error resetting assessment:', error);
      alert('Test sıfırlanırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = () => {
    return Math.round((Object.keys(responses).length / questions.length) * 100);
  };

  const isCurrentQuestionAnswered = () => {
    const currentQuestion = questions[currentQuestionIndex];
    return responses[currentQuestion?.id] !== undefined;
  };

  const canSubmit = () => {
    return Object.keys(responses).length === questions.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (questions.length === 0 && viewMode !== 'results') {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
        <Brain className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Big Five Kişilik Envanteri</h2>
        <p className="text-gray-600 mb-4">Bu özellik şu anda kullanılamıyor</p>
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-sm text-indigo-700">
            📋 Big Five kişilik testi henüz aktif değil. Bu özellik yakında eklenecektir.
          </p>
        </div>
      </div>
    );
  }

  if (viewMode === 'intro') {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">🎯 Big Five Kişilik Envanteri</h2>
          <p className="text-lg text-gray-600">Kişiliğinizi 5 temel boyutta keşfedin!</p>
        </div>

        <div className="space-y-4 mb-8">
          {(Object.entries(TRAIT_LABELS) as [BigFiveTrait, string][]).map(([trait, label]) => (
            <div key={trait} className="border-l-4 border-indigo-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-1">• {label}</h4>
              <p className="text-sm text-gray-600">{TRAIT_DESCRIPTIONS[trait]}</p>
            </div>
          ))}
        </div>

        <div className="bg-indigo-50 rounded-lg p-6 mb-6">
          <h4 className="font-bold text-indigo-900 mb-3">📋 Test Bilgileri</h4>
          <ul className="space-y-2 text-sm text-indigo-700">
            <li>• {questions.length} soru</li>
            <li>• Her soru için 1-5 arası derecelendirme</li>
            <li>• Ortalama süre: 10-15 dakika</li>
            <li>• Sonuçlar grafikle gösterilecek</li>
          </ul>
        </div>

        {Object.keys(responses).length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700">İlerleme: {getCompletionPercentage()}%</span>
              <span className="text-sm text-gray-500">
                {Object.keys(responses).length} / {questions.length} soru cevaplandı
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleStartAssessment}
          className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {Object.keys(responses).length > 0 ? 'Devam Et' : 'Teste Başla'}
        </button>
      </div>
    );
  }

  if (viewMode === 'questionnaire') {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
      return <div className="text-center p-12">Soru yükleniyor...</div>;
    }

    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md mb-4 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Soru {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-8 text-center">
            {currentQuestion.question_text}
          </h3>

          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-4">
              <span>Kesinlikle Katılmıyorum</span>
              <span>Kesinlikle Katılıyorum</span>
            </div>

            <div className="flex gap-3 justify-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleResponse(value)}
                  className={`w-16 h-16 rounded-xl font-bold text-xl transition-all ${
                    responses[currentQuestion.id] === value
                      ? 'bg-indigo-600 text-white shadow-lg scale-110'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                currentQuestionIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ◀ Önceki
            </button>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit()}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  canSubmit()
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Tamamla ✓
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!isCurrentQuestionAnswered()}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  isCurrentQuestionAnswered()
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Sonraki ▶
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Results view
  if (!scores) {
    return <div className="text-center p-12">Sonuçlar yükleniyor...</div>;
  }

  const radarData = [
    { trait: 'Deneyime\nAçıklık', value: scores.openness, fullMark: 5 },
    { trait: 'Sorumluluk', value: scores.conscientiousness, fullMark: 5 },
    { trait: 'Dışa\nDönüklük', value: scores.extraversion, fullMark: 5 },
    { trait: 'Uyumluluk', value: scores.agreeableness, fullMark: 5 },
    { trait: 'Duygusal\nDenge', value: 5 - scores.neuroticism, fullMark: 5 }, // Inverted for better interpretation
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-indigo-100 rounded-full p-4">
            <Award className="h-12 w-12 text-indigo-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🎉 Tebrikler!</h2>
        <p className="text-lg text-gray-600">Big Five Kişilik Analizi tamamlandı</p>
      </div>

      {/* Radar Chart */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">📊 Kişilik Profiliniz</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="trait"
                tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
                style={{ whiteSpace: 'pre-line' }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: '#9ca3af' }} />
              <Radar
                name="Puanınız"
                dataKey="value"
                stroke="#4f46e5"
                fill="#4f46e5"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-500 text-center mt-4">
          * Duygusal Denge puanı tersine çevrilmiştir (yüksek puan = daha dengeli)
        </p>
      </div>

      {/* Detailed Analysis */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-indigo-600" />
          Detaylı Kişilik Analizi
        </h3>
        <div className="space-y-6">
          {(Object.entries(scores) as [BigFiveTrait, number][]).map(([trait, score]) => (
            <div key={trait} className="border-l-4 border-indigo-500 pl-4 py-2">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{TRAIT_LABELS[trait]}</h4>
                  <p className="text-sm text-gray-500 italic mt-1">{TRAIT_DESCRIPTIONS[trait]}</p>
                </div>
                <span className="text-2xl font-bold text-indigo-600 ml-4">{score.toFixed(1)}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all"
                  style={{ width: `${(score / 5) * 100}%` }}
                />
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm text-indigo-900 leading-relaxed">
                  💡 {getTraitAnalysis(trait, score)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Career Suggestions */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-md p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Brain className="h-6 w-6 text-indigo-600" />
          Kişilik Profilinize Uygun Alan Önerileri
        </h3>
        <div className="bg-white rounded-lg p-6 space-y-3">
          <p className="text-gray-700 leading-relaxed">
            {scores.openness > 3.5 && scores.conscientiousness > 3.5 && (
              <span className="block mb-2">🎨 <strong>Bilim ve Sanat:</strong> Yüksek açıklık ve sorumluluk puanınız, araştırma, mühendislik, tasarım gibi alanlarda başarılı olabileceğinizi gösteriyor.</span>
            )}
            {scores.extraversion > 3.5 && scores.agreeableness > 3.5 && (
              <span className="block mb-2">👥 <strong>İnsan İlişkileri:</strong> Sosyal becerileriniz danışmanlık, öğretmenlik, satış ve pazarlama alanlarında size avantaj sağlayacak.</span>
            )}
            {scores.conscientiousness > 3.5 && scores.neuroticism < 2.5 && (
              <span className="block mb-2">💼 <strong>Yönetim ve Liderlik:</strong> Organizasyon becerileriniz ve duygusal dengeniz liderlik pozisyonları için ideal.</span>
            )}
            {scores.openness > 3.5 && scores.extraversion < 2.5 && (
              <span className="block mb-2">🔬 <strong>Araştırma ve Analiz:</strong> Bağımsız çalışma ve derinlemesine düşünme yeteneğiniz akademik ve teknik alanlarda parlayacaksınız.</span>
            )}
          </p>
          <p className="text-sm text-gray-500 italic mt-4">
            Not: Bu öneriler genel kişilik eğilimlerinize göre verilmiştir. Kariyer seçiminde ilgi alanlarınızı, yeteneklerinizi ve değerlerinizi de göz önünde bulundurmalısınız.
          </p>
        </div>
      </div>

      {/* Retake Button */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <button
          onClick={handleRetake}
          className="w-full bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="h-5 w-5" />
          Testi Yeniden Yap
        </button>
      </div>
    </div>
  );
}
