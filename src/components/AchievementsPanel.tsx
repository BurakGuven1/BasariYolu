import React, { useState, useEffect } from 'react';
import { Trophy, Award, Lock, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CertificateGenerator from './CertificateGenerator';

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_title: string;
  achievement_description: string;
  icon: string;
  earned_at: string;
  certificate_issued: boolean;
  certificate_number: string;
  metadata: any;
}

interface AchievementsPanelProps {
  studentId: string;
  studentName: string;
}

export default function AchievementsPanel({ studentId, studentName }: AchievementsPanelProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<Achievement | null>(null);
  const [questionCount, setQuestionCount] = useState(0);

  useEffect(() => {
    fetchAchievements();
    fetchQuestionCount();
  }, [studentId]);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('student_id', studentId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionCount = async () => {
    try {
      // Get REAL question count from student_solved_questions
      const { data, error } = await supabase
        .from('student_question_stats')
        .select('total_questions_solved')
        .eq('student_id', studentId)
        .single();

      if (error) {
        // Fallback: count from student_solved_questions directly
        const { count, error: countError } = await supabase
          .from('student_solved_questions')
          .select('question_id', { count: 'exact', head: true })
          .eq('student_id', studentId);

        if (countError) throw countError;
        setQuestionCount(count || 0);
      } else {
        setQuestionCount(data?.total_questions_solved || 0);
      }
    } catch (error) {
      console.error('Error fetching question count:', error);
      setQuestionCount(0);
    }
  };

  const allAchievements = [
    {
      type: 'questions_500',
      title: '500 Soru Ustası',
      description: '500+ soru çöz',
      icon: '🏆',
      requiredCount: 500,
      color: 'from-yellow-400 to-orange-500',
    },
    {
      type: 'questions_1000',
      title: '1000 Soru Şampiyonu',
      description: '1000+ soru çöz',
      icon: '🎖️',
      requiredCount: 1000,
      color: 'from-purple-400 to-pink-500',
    },
    {
      type: 'questions_2500',
      title: '2500 Soru Efsanesi',
      description: '2500+ soru çöz',
      icon: '🌟',
      requiredCount: 2500,
      color: 'from-blue-400 to-cyan-500',
    },
    {
      type: 'questions_5000',
      title: '5000 Soru Tanrısı',
      description: '5000+ soru çöz',
      icon: '👑',
      requiredCount: 5000,
      color: 'from-indigo-500 to-purple-600',
    },
  ];

  const getProgress = (requiredCount: number) => {
    return Math.min((questionCount / requiredCount) * 100, 100);
  };

  const isUnlocked = (requiredCount: number) => {
    return questionCount >= requiredCount;
  };

  const getAchievement = (type: string) => {
    return achievements.find((a) => a.achievement_type === type);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Başarılarım</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Başarılarım</h2>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-300 font-semibold">
              {achievements.length} Başarı Kazanıldı
            </p>
          </div>
        </div>

        {/* Current Progress */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Toplam Çözülen Soru
            </span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {questionCount}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Bir sonraki başarıya {Math.max(0, 500 - questionCount)} soru kaldı!
          </p>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allAchievements.map((achievement) => {
            const earned = getAchievement(achievement.type);
            const unlocked = isUnlocked(achievement.requiredCount);
            const progress = getProgress(achievement.requiredCount);

            return (
              <div
                key={achievement.type}
                className={`relative rounded-xl p-4 border-2 transition-all ${
                  unlocked
                    ? 'border-yellow-400 bg-gradient-to-br ' + achievement.color
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700'
                }`}
              >
                {/* Lock overlay for locked achievements */}
                {!unlocked && (
                  <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div
                    className={`text-4xl ${
                      unlocked ? 'animate-bounce' : 'grayscale opacity-30'
                    }`}
                  >
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-bold mb-1 ${
                        unlocked
                          ? 'text-white'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {achievement.title}
                    </h3>
                    <p
                      className={`text-sm mb-3 ${
                        unlocked
                          ? 'text-white text-opacity-90'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {achievement.description}
                    </p>

                    {/* Progress bar */}
                    <div className="mb-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            unlocked ? 'bg-white' : 'bg-blue-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          unlocked ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {questionCount} / {achievement.requiredCount}
                      </p>
                    </div>

                    {/* Certificate button */}
                    {earned && earned.certificate_issued && (
                      <button
                        onClick={() => setSelectedCertificate(earned)}
                        className="mt-2 w-full bg-white text-gray-900 py-2 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Award className="w-4 h-4" />
                        Sertifikayı Görüntüle
                      </button>
                    )}
                  </div>
                </div>

                {/* Sparkle effect for unlocked */}
                {unlocked && (
                  <Sparkles className="absolute top-2 right-2 w-5 h-5 text-white animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* Motivational message */}
        {questionCount < 500 && (
          <div className="mt-6 text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              💪 İlk sertifikana sadece {500 - questionCount} soru kaldı!
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
              Sertifikalarını Instagram'da paylaşmayı unutma!
            </p>
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {selectedCertificate && (
        <CertificateGenerator
          certificate={selectedCertificate}
          studentName={studentName}
          isOpen={true}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </>
  );
}
