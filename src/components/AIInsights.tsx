import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Target, Lightbulb, TrendingDown, Minus } from 'lucide-react';
import { analyzeExamResults, generateMotivationalMessage, detectTopicWeaknesses } from '../lib/ai';

interface AIInsightsProps {
  examResults: any[];
  studentData: any;
}

export default function AIInsights({ examResults, studentData }: AIInsightsProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [motivationalMessage, setMotivationalMessage] = useState('');

  useEffect(() => {
    const performAnalysis = async () => {
      setLoading(true);
      try {
        const aiAnalysis = await analyzeExamResults(examResults);
        setAnalysis(aiAnalysis);
        setMotivationalMessage(generateMotivationalMessage(studentData));
      } catch (error) {
        console.error('AI analysis error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (examResults.length > 0) {
      performAnalysis();
    } else {
      setLoading(false);
    }
  }, [examResults, studentData]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">AI analizi yapılıyor...</span>
        </div>
      </div>
    );
  }

  if (!analysis || !analysis.hasEnoughData) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analizi</h3>
          <p className="text-gray-600 mb-4">
            AI destekli analiz için en az 2 deneme sonucu gereklidir.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 text-sm">
              Şu anda {analysis?.totalExams || 0} deneme sonucunuz var. 
              {analysis?.totalExams === 1 ? ' 1 deneme daha ekleyin.' : ' En az 2 deneme sonucu ekleyin.'}
            </p>
          </div>
          {analysis?.recommendations && analysis.recommendations.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-yellow-800 text-sm">{analysis.recommendations[0]}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Motivational Message */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-start">
          <div className="bg-blue-100 p-2 rounded-full mr-4">
            <Lightbulb className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Günün Motivasyonu</h3>
            <p className="text-blue-800">{motivationalMessage}</p>
            <div className="mt-2 text-xs text-blue-600">
              Analiz edilen deneme sayısı: {analysis.totalExams} | Kullanılan: {Math.min(5, analysis.totalExams)}
            </div>
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      {analysis.trends && analysis.trends.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-start mb-4">
            <div className="bg-indigo-100 p-2 rounded-full mr-4">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-indigo-900 mb-4">Son Denemelerinizde Trend Analizi</h3>
              <div className="space-y-3">
                {analysis.trends.map((trend: any, index: number) => (
                  <div key={index} className={`p-3 rounded-lg flex items-center ${
                    trend.trend === 'increasing' ? 'bg-green-50 border border-green-200' :
                    trend.trend === 'decreasing' ? 'bg-red-50 border border-red-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="mr-3">
                      {trend.trend === 'increasing' && <TrendingUp className="h-5 w-5 text-green-600" />}
                      {trend.trend === 'decreasing' && <TrendingDown className="h-5 w-5 text-red-600" />}
                      {trend.trend === 'stable' && <Minus className="h-5 w-5 text-gray-600" />}
                    </div>
                    <p className={`text-sm ${
                      trend.trend === 'increasing' ? 'text-green-800' :
                      trend.trend === 'decreasing' ? 'text-red-800' :
                      'text-gray-800'
                    }`}>
                      {trend.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty Answer Warnings */}
      {analysis.emptyAnswerWarnings && analysis.emptyAnswerWarnings.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-start mb-4">
            <div className="bg-orange-100 p-2 rounded-full mr-4">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-900 mb-2">Boş Bırakma Analizi</h3>
              <div className="space-y-2">
                {analysis.emptyAnswerWarnings.map((warning: string, index: number) => (
                  <div key={index} className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-orange-800 text-sm">{warning}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weaknesses */}
      {analysis.weaknesses.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-start mb-4">
            <div className="bg-red-100 p-2 rounded-full mr-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Geliştirilmesi Gereken Alanlar</h3>
              <div className="space-y-2">
                {analysis.weaknesses.map((weakness: string, index: number) => (
                  <div key={index} className="flex items-center text-red-800 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    {weakness}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-start mb-4">
            <div className="bg-green-100 p-2 rounded-full mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900 mb-2">Güçlü Olduğunuz Alanlar</h3>
              <div className="space-y-2">
                {analysis.strengths.map((strength: string, index: number) => (
                  <div key={index} className="flex items-center text-green-800 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    {strength}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-start mb-4">
            <div className="bg-blue-100 p-2 rounded-full mr-4">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">AI Önerileri</h3>
              <div className="space-y-3">
                {analysis.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-800 text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Study Plan */}
      {analysis.studyPlan.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-start mb-4">
            <div className="bg-purple-100 p-2 rounded-full mr-4">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-4">Kişiselleştirilmiş Çalışma Planı</h3>
              <div className="space-y-3">
                {analysis.studyPlan.map((item: any, index: number) => (
                  <div key={index} className="border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-purple-900">{item.subject} - {item.topic}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.priority === 'high' ? 'bg-red-100 text-red-800' :
                        item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.priority === 'high' ? 'Yüksek' : 
                         item.priority === 'medium' ? 'Orta' : 'Düşük'} Öncelik
                      </span>
                    </div>
                    <p className="text-purple-700 text-sm mb-2">{item.description}</p>
                    <div className="text-xs text-purple-600">
                      Önerilen süre: {item.estimatedHours} saat/hafta
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}