import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import {
  getBigFiveQuestions,
  getStudentResponses,
  saveBigFiveResponses,
  calculateBigFiveScores,
  saveBigFiveResults,
  getStudentBigFiveResults,
  hasCompletedAssessment,
  resetAssessment,
  BigFiveQuestion,
  BigFiveScores,
  TRAIT_LABELS,
  TRAIT_DESCRIPTIONS,
  type BigFiveTrait,
} from '../../lib/bigFiveApi';

interface BigFiveTabProps {
  studentId: string;
  gradeLevel: number;
}

type ViewMode = 'intro' | 'questionnaire' | 'results';

export const BigFiveTab: React.FC<BigFiveTabProps> = ({ studentId, gradeLevel }) => {
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

      // Check if assessment is completed
      const completed = await hasCompletedAssessment(studentId, gradeLevel);

      if (completed) {
        // Load results
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
        // Load questions and existing responses
        const [questionsData, responsesData] = await Promise.all([
          getBigFiveQuestions(gradeLevel),
          getStudentResponses(studentId),
        ]);

        setQuestions(questionsData);

        // Build responses map
        const responsesMap: Record<string, number> = {};
        responsesData.forEach((r) => {
          responsesMap[r.question_id] = r.response_value;
        });
        setResponses(responsesMap);

        // Find first unanswered question
        const firstUnanswered = questionsData.findIndex((q) => !responsesMap[q.id]);
        if (firstUnanswered !== -1) {
          setCurrentQuestionIndex(firstUnanswered);
        }

        setViewMode('intro');
      }
    } catch (error) {
      console.error('Error loading Big Five data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
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

      // Save all responses
      const responsesArray = Object.entries(responses).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      await saveBigFiveResponses(studentId, responsesArray);

      // Calculate scores
      const calculatedScores = await calculateBigFiveScores(studentId);

      if (calculatedScores) {
        await saveBigFiveResults(studentId, calculatedScores);
        setScores(calculatedScores);
        setViewMode('results');
      } else {
        Alert.alert('Hata', 'Skorlar hesaplanamadı');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      Alert.alert('Hata', 'Test tamamlanırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    Alert.alert(
      'Testi Yeniden Yap',
      'Önceki cevaplarınız silinecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet',
          onPress: async () => {
            try {
              setLoading(true);
              await resetAssessment(studentId);
              setResponses({});
              setScores(null);
              setCurrentQuestionIndex(0);
              await loadData();
            } catch (error) {
              console.error('Error resetting assessment:', error);
              Alert.alert('Hata', 'Test sıfırlanırken bir hata oluştu');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  // If no questions available, show disabled message
  if (questions.length === 0 && viewMode !== 'results') {
    return (
      <View style={styles.container}>
        <Card style={styles.introCard}>
          <Text style={styles.title}>🎯 Big Five Kişilik Envanteri</Text>
          <Text style={styles.subtitle}>
            Bu özellik şu anda kullanılamıyor
          </Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📋 Big Five kişilik testi henüz aktif değil.
              Bu özellik yakında eklenecektir.
            </Text>
          </View>
        </Card>
      </View>
    );
  }

  if (viewMode === 'intro') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card style={styles.introCard}>
          <Text style={styles.title}>🎯 Big Five Kişilik Envanteri</Text>
          <Text style={styles.subtitle}>
            Kişiliğinizi 5 temel boyutta keşfedin!
          </Text>

          <View style={styles.traitsContainer}>
            {(Object.entries(TRAIT_LABELS) as [BigFiveTrait, string][]).map(([trait, label]) => (
              <View key={trait} style={styles.traitItem}>
                <Text style={styles.traitLabel}>• {label}</Text>
                <Text style={styles.traitDescription}>
                  {TRAIT_DESCRIPTIONS[trait]}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>📋 Test Bilgileri</Text>
            <Text style={styles.infoText}>• {questions.length} soru</Text>
            <Text style={styles.infoText}>
              • Her soru için 1-5 arası derecelendirme
            </Text>
            <Text style={styles.infoText}>• Ortalama süre: 10-15 dakika</Text>
            <Text style={styles.infoText}>
              • Sonuçlar radar grafiğinde gösterilecek
            </Text>
          </View>

          {Object.keys(responses).length > 0 && (
            <View style={styles.progressBox}>
              <Text style={styles.progressText}>
                İlerleme: {getCompletionPercentage()}%
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getCompletionPercentage()}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressSubtext}>
                {Object.keys(responses).length} / {questions.length} soru cevaplandı
              </Text>
            </View>
          )}

          <Button
            title={
              Object.keys(responses).length > 0
                ? 'Devam Et'
                : 'Teste Başla'
            }
            onPress={handleStartAssessment}
            style={styles.startButton}
          />
        </Card>
      </ScrollView>
    );
  }

  if (viewMode === 'questionnaire') {
    const currentQuestion = questions[currentQuestionIndex];

    // Safety check: if no question at current index, show loading
    if (!currentQuestion) {
      return (
        <View style={styles.centered}>
          <Text style={styles.infoText}>Soru yükleniyor...</Text>
        </View>
      );
    }

    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.progressLabel}>
            Soru {currentQuestionIndex + 1} / {questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.questionContent}>
          <Card style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQuestion.question_text}</Text>

            <View style={styles.scaleContainer}>
              <View style={styles.scaleLabels}>
                <Text style={styles.scaleLabel}>Kesinlikle Katılmıyorum</Text>
                <Text style={styles.scaleLabel}>Kesinlikle Katılıyorum</Text>
              </View>

              <View style={styles.scaleButtons}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable
                    key={value}
                    style={[
                      styles.scaleButton,
                      responses[currentQuestion.id] === value &&
                        styles.scaleButtonSelected,
                    ]}
                    onPress={() => handleResponse(value)}
                  >
                    <Text
                      style={[
                        styles.scaleButtonText,
                        responses[currentQuestion.id] === value &&
                          styles.scaleButtonTextSelected,
                      ]}
                    >
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Card>

          <View style={styles.navigationButtons}>
            <Button
              title="◀ Önceki"
              onPress={handlePrevious}
              variant="secondary"
              disabled={currentQuestionIndex === 0}
              style={styles.navButton}
            />

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                title="Tamamla ✓"
                onPress={handleSubmit}
                disabled={!canSubmit()}
                style={styles.navButton}
              />
            ) : (
              <Button
                title="Sonraki ▶"
                onPress={handleNext}
                disabled={!isCurrentQuestionAnswered()}
                style={styles.navButton}
              />
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Results view
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.resultsCard}>
        <Text style={styles.title}>📊 Big Five Sonuçlarınız</Text>
        <Text style={styles.subtitle}>
          Kişilik profiliniz başarıyla oluşturuldu!
        </Text>

        <View style={styles.radarPlaceholder}>
          <Text style={styles.radarText}>📈 Radar Grafik</Text>
          <Text style={styles.radarSubtext}>
            (Grafik görselleştirmesi ekleniyor)
          </Text>
        </View>

        {scores && (
          <View style={styles.scoresContainer}>
            {(Object.entries(scores) as [BigFiveTrait, number][]).map(([trait, score]) => (
              <View key={trait} style={styles.scoreRow}>
                <View style={styles.scoreHeader}>
                  <Text style={styles.scoreLabel}>{TRAIT_LABELS[trait]}</Text>
                  <Text style={styles.scoreValue}>{score.toFixed(2)} / 5.00</Text>
                </View>
                <View style={styles.scoreBarContainer}>
                  <View
                    style={[
                      styles.scoreBar,
                      { width: `${(score / 5) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.scoreDescription}>
                  {TRAIT_DESCRIPTIONS[trait]}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Button
          title="Testi Yeniden Yap"
          onPress={handleRetake}
          variant="secondary"
          style={styles.retakeButton}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  introCard: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  traitsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  traitItem: {
    gap: 4,
  },
  traitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  traitDescription: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 16,
  },
  infoBox: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#4F46E5',
    marginBottom: 6,
  },
  progressBox: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 12,
    color: '#64748B',
  },
  startButton: {
    marginTop: 8,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  questionContent: {
    padding: 16,
  },
  questionCard: {
    padding: 20,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 24,
    textAlign: 'center',
  },
  scaleContainer: {
    gap: 16,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleLabel: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  scaleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  scaleButton: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  scaleButtonSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  scaleButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748B',
  },
  scaleButtonTextSelected: {
    color: '#6366F1',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
  resultsCard: {
    padding: 20,
  },
  radarPlaceholder: {
    height: 250,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  radarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
  },
  radarSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  scoresContainer: {
    gap: 20,
    marginBottom: 24,
  },
  scoreRow: {
    gap: 8,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  scoreBarContainer: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 6,
  },
  scoreDescription: {
    fontSize: 12,
    color: '#64748B',
  },
  retakeButton: {
    marginTop: 8,
  },
});
