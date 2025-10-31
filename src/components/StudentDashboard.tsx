import React, { useState } from 'react';
import { BookOpen, StickyNote, MapIcon, BookmarkCheck, Plus, TrendingUp, Calendar, Target, Award, Clock, CheckCircle, AlertCircle, LogOut, CreditCard as Edit, Trash2, MoreVertical, Users, X, Brain,Crown, Trophy, Timer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useStudentData } from '../hooks/useStudentData';
import ExamForm from './ExamForm';
import HomeworkForm from './HomeworkForm';
import ExamTopicsSection from './ExamTopicsSection';
import AIInsights from './AIInsights';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import ExamLimitBadge from './ExamLimitBadge';
import FeatureGate from './FeatureGate';
import ExamCountdown from './ExamCountdown';
import UpgradeModal from './UpgradeModal';
import PointsDisplay from './PointsDisplay';
import AIRecommendations from './AIRecommendations';
import HistoricalMapsSection from './HistoricalMapsSection';
import SubscriptionManagement from './SubscriptionManagement';
import { addStudySessionPoints, completeChallenge, isChallengeCompletedToday } from '../lib/pointsSystem';
import { packages } from '../data/packages';
import { generatePerformanceInsights, generateDailyChallenge } from '../lib/ai';
import { getStudentInviteCode, deleteExamResult, updateHomework, deleteHomework, addStudySession, getWeeklyStudyGoal, createWeeklyStudyGoal, updateWeeklyStudyGoal, getWeeklyStudySessions } from '../lib/supabase';
import PomodoroTimer from './PomodoroTimer';
import FormulaCardsSection from './FormulaCardsSection';
import NotesSection from './NotesSection';
import StudentWeeklySchedule from './StudentWeeklySchedule';

export default function StudentDashboard() {
  const [insights, setInsights] = useState<any[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<any>(null);
  const { planName} = useFeatureAccess();
  const { user, clearUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'homeworks' | 'schedule' | 'pomodoro' | 'formulas' | 'maps' | 'notes' | 'analysis' | 'classes' | 'smartplan'| 'subscription'>('overview');
  const [showExamForm, setShowExamForm] = useState(false);
  const [showHomeworkForm, setShowHomeworkForm] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetPlan, setTargetPlan] = useState<any>(null);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [showExamMenu, setShowExamMenu] = useState<string | null>(null);
  const [showHomeworkMenu, setShowHomeworkMenu] = useState<string | null>(null);
  const [badges, setBadges] = useState<string[]>(['İlk Deneme', 'Haftalık Çalışma']);
  const [studyData, setStudyData] = useState([
    { day: 'Pzt', hours: 0 },
    { day: 'Sal', hours: 0 },
    { day: 'Çar', hours: 0 },
    { day: 'Per', hours: 0 },
    { day: 'Cum', hours: 0 },
    { day: 'Cmt', hours: 0 },
    { day: 'Paz', hours: 0 }
  ]);
  const [showStudyForm, setShowStudyForm] = useState(false);
  const [studyFormData, setStudyFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    subject: '',
    notes: ''
  });
  const [chartFilter, setChartFilter] = useState<'all' | 'TYT' | 'AYT' | 'LGS'>('all');
  const [weeklyGoal, setWeeklyGoal] = useState<any>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalFormData, setGoalFormData] = useState({
    weekly_hours_target: '25'
  });
  const [goalLoading, setGoalLoading] = useState(false);
  const [showJoinClassModal, setShowJoinClassModal] = useState(false);
  const [classInviteCodeInput, setClassInviteCodeInput] = useState('');
  const [showExamTopics, setShowExamTopics] = useState(false);
  const { subscription } = useFeatureAccess();

  const handleCreateWeeklyGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData) return;

    setGoalLoading(true);
    try {
      const goalData = {
        student_id: studentData.id,
        weekly_hours_target: parseInt(goalFormData.weekly_hours_target),
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true
      };

      if (weeklyGoal) {
        // Update existing goal
        const { error } = await updateWeeklyStudyGoal(weeklyGoal.id, goalData);
        if (error) throw error;
      } else {
        // Create new goal
        const { error } = await createWeeklyStudyGoal(goalData);
        if (error) throw error;
      }

      setShowGoalForm(false);
      
      const updatedGoal = weeklyGoal ? 
        { ...weeklyGoal, weekly_hours_target: parseInt(goalFormData.weekly_hours_target) } :
        {
          id: 'temp-id',
          student_id: studentData.id,
          weekly_hours_target: parseInt(goalFormData.weekly_hours_target),
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          is_active: true,
          created_at: new Date().toISOString()
        };
      
      setWeeklyGoal(updatedGoal);
      
      // Also reload from database to get the real ID
      setTimeout(async () => {
        const { data: goal } = await getWeeklyStudyGoal(studentData.id);
        if (goal) {
          setWeeklyGoal(goal);
        }
      }, 100);
      
      alert('Haftalık hedef başarıyla kaydedildi!');
    } catch (error) {
      console.error('Error saving weekly goal:', error);
      alert('Hedef kaydedilirken hata oluştu');
    } finally {
      setGoalLoading(false);
    }
  };

  const [weeklyStudyHours, setWeeklyStudyHours] = useState(0);
  
  const { 
    studentData, 
    examResults, 
    homeworks, 
    studentClasses, 
    classAssignments,
    classAnnouncements,
    classExamResults,
    loading,
    refetch 
  } = useStudentData(user?.id);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData || !classInviteCodeInput.trim()) return;

    try {
      const { joinClassWithCode } = await import('../lib/teacherApi');
      await joinClassWithCode(studentData.id, classInviteCodeInput.trim());

      alert('Sınıfa başarıyla katıldınız!');
      setShowJoinClassModal(false);
      setClassInviteCodeInput('');
      refetch();
    } catch (error: any) {
      alert('Sınıfa katılma hatası: ' + error.message);
    }
  };

    React.useEffect(() => {
      if (studentData) {
        const performanceInsights = generatePerformanceInsights(studentData);
        setInsights(performanceInsights);
        
        const challenge = generateDailyChallenge(studentData);
        setDailyChallenge(challenge);
      }
    }, [studentData]);
  // Load weekly study goal and calculate hours
  React.useEffect(() => {
    const loadWeeklyData = async () => {
      if (!studentData) return;

      // Get current weekly goal
      const { data: goal } = await getWeeklyStudyGoal(studentData.id);
      
      if (goal) {
        setWeeklyGoal(goal);
        
        // Update form data with existing goal
        setGoalFormData({
          weekly_hours_target: goal.weekly_hours_target.toString()
        });
        
        // Calculate actual study hours for this week
        const { data: sessions } = await getWeeklyStudySessions(
          studentData.id,
          goal.start_date,
          goal.end_date
        );
        
        const totalHours = sessions?.reduce((sum: number, session: any) => {
          return sum + (session.duration_minutes || 0) / 60;
        }, 0) || 0;
        
        setWeeklyStudyHours(totalHours);
        
        // Update studyData for chart display
        const newStudyData = [
          { day: 'Pzt', hours: 0 },
          { day: 'Sal', hours: 0 },
          { day: 'Çar', hours: 0 },
          { day: 'Per', hours: 0 },
          { day: 'Cum', hours: 0 },
          { day: 'Cmt', hours: 0 },
          { day: 'Paz', hours: 0 }
        ];
        
        sessions?.forEach((session: any) => {
          const dayIndex = new Date(session.session_date).getDay();
          const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
          const dayName = dayNames[dayIndex];
          const dayData = newStudyData.find(d => d.day === dayName);
          if (dayData) {
            dayData.hours += (session.duration_minutes || 0) / 60;
          }
        });
        
        setStudyData(newStudyData);
      }
    };

    loadWeeklyData();
  }, [studentData]);

  const handleLogout = () => {
    console.log('StudentDashboard logout başlatıldı');
    clearUser();
  };

  const handleUpgradeClick = (planName: 'advanced' | 'professional') => {
    const plan = packages.find(p => p.id === planName);
    if (plan) {
      setTargetPlan(plan);
      setShowUpgradeModal(true);
    }
  };

  // FeatureGate'deki onUpgrade prop'unu güncelle
  <FeatureGate
    feature="ai_analysis"
    onUpgrade={() => handleUpgradeClick('advanced')}
  ></FeatureGate>

  const handleShowInviteCode = async () => {
    if (studentData) {
      const { data } = await getStudentInviteCode(studentData.id);
      if (data) {
        setInviteCode(data.invite_code);
        setShowInviteCode(true);
      }
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (confirm('Bu deneme sonucunu silmek istediğiinizden emin misiniz?')) {
      try {
        const { error } = await deleteExamResult(examId);
        if (error) throw error;
        refetch();
        alert('Deneme sonucu silindi');
      } catch (error) {
        console.error('Error deleting exam:', error);
        alert('Silme işlemi başarısız');
      }
    }
  };

  const handleToggleHomework = async (homework: any) => {
    try {
      const updates = {
        completed: !homework.completed,
        completed_at: !homework.completed ? new Date().toISOString() : null
      };
      const { error } = await updateHomework(homework.id, updates);
      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error updating homework:', error);
      alert('Güncelleme başarısız');
    }
  };

  const handleDeleteHomework = async (homeworkId: string) => {
    if (confirm('Bu ödevi silmek istediğinizden emin misiniz?')) {
      try {
        const { error } = await deleteHomework(homeworkId);
        if (error) throw error;
        refetch();
        alert('Ödev silindi');
      } catch (error) {
        console.error('Error deleting homework:', error);
        alert('Silme işlemi başarısız');
      }
    }
  };

  <FeatureGate feature="pomodoro_timer">
    <button
      onClick={() => setActiveTab('pomodoro')}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === 'pomodoro'
          ? 'bg-orange-100 text-orange-700'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Clock className="h-5 w-5" />
      <span className="font-medium">Pomodoro</span>
    </button>
  </FeatureGate>

  // Calculate real statistics from user's data
  const calculateStats = () => {
    const totalExams = examResults.length;
    const averageScore = examResults.length > 0 
      ? examResults.reduce((sum, exam) => sum + (exam.total_score || 0), 0) / examResults.length 
      : 0;
    const pendingHomeworks = homeworks.filter(hw => !hw.completed).length;
    
    // Calculate percentage improvement from last 2 exams
    let improvementPercent = 0;
    if (examResults.length >= 2) {
      const sortedExams = examResults.sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());
      const latest = sortedExams[0].total_score || 0;
      const previous = sortedExams[1].total_score || 0;
      if (previous > 0) {
        improvementPercent = ((latest - previous) / previous) * 100;
      }
      
      // Check for badge earning
      if (latest > previous && !badges.includes('Yükseliş Trendi')) {
        setBadges(prev => [...prev, 'Yükseliş Trendi']);
      }
    }

    const weeklyStudyHours = studyData.reduce((sum, day) => sum + day.hours, 0);

    return { totalExams, averageScore, pendingHomeworks, improvementPercent, weeklyStudyHours };
  };

  const stats = calculateStats();


  const reloadWeeklyStudyHours = async (goal: any) => {
  if (!studentData || !goal) return;

  try {
    // Calculate actual study hours for this week
    const { data: sessions } = await getWeeklyStudySessions(
      studentData.id,
      goal.start_date,
      goal.end_date
    );
    
    const totalHours = sessions?.reduce((sum: number, session: any) => {
      return sum + (session.duration_minutes || 0) / 60;
    }, 0) || 0;
    
    setWeeklyStudyHours(totalHours);
  } catch (error) {
    console.error('Error reloading study hours:', error);
  }
};
  // Add study session handler
const handleAddStudySession = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!studentData || !studyFormData.hours) return;

  try {
    const durationMinutes = parseFloat(studyFormData.hours) * 60;
    
    const sessionData = {
      student_id: studentData.id,
      subject: studyFormData.subject || 'Genel',
      duration_minutes: durationMinutes,
      session_date: studyFormData.date,
      notes: studyFormData.notes
    };

    const { error } = await addStudySession(sessionData);
    if (error) throw error;

    // ���� Puan ekle (1 saat = 10 puan)
    const pointsResult = await addStudySessionPoints(studentData.id, durationMinutes);
    
    // Haftal�-k +�al�-+�ma saatlerini yeniden hesapla
    if (weeklyGoal) {
      await reloadWeeklyStudyHours(weeklyGoal);
    }

    // Update local study data
    const dayIndex = new Date(studyFormData.date).getDay();
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const dayName = dayNames[dayIndex];
    
    setStudyData(prev => prev.map(day => 
      day.day === dayName 
        ? { ...day, hours: day.hours + parseFloat(studyFormData.hours) }
        : day
    ));

    setShowStudyForm(false);
    setStudyFormData({
      date: new Date().toISOString().split('T')[0],
      hours: '',
      subject: '',
      notes: ''
    });
    
    if (pointsResult.pointsEarned > 0) {
      alert(`🎉 Çalışma eklendi! 🎉 +${pointsResult.pointsEarned} puan kazandınız!`);
    } else {
      alert('Çalışma seansı eklendi!');
    }
  } catch (error) {
    console.error('Error adding study session:', error);
    alert('Çalışma seansı eklenirken hata oluştu');
  }
};

  // Prepare chart data from real exam results
const filteredExamResults = chartFilter === 'all' 
  ? examResults 
  : examResults.filter(exam => exam.exam_type === chartFilter);

const chartData = filteredExamResults
  .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
  .slice(-10) // Son 10 deneme
  .map((exam, index) => {
    // Tarihi formatlamak için yeni bir Date objesi oluştur
    const date = new Date(exam.exam_date);
    // Tarihi GG.AA formatında formatla (ör: 25.09)
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Yeni objeyi formatlanmış tarih ile birlikte döndür
    return {
      puan: exam.total_score || 0,
      examType: exam.exam_type,
      examName: exam.exam_name,
      date: formattedDate, // <<< EKLENEN SATIR
      color: `hsl(${(index * 36) % 360}, 70%, 50%)`
    };
  });

  const renderOverview = () => (
    <div className="space-y-6">

      <div className="grid md:grid-cols-2 gap-6">
      {/* AI Insights Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-600" />
          AI Önerileri
        </h3>
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div key={idx} className={`p-4 rounded-lg border-l-4 ${
              insight.type === 'success' ? 'bg-green-50 border-green-500' :
              insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
              insight.type === 'danger' ? 'bg-red-50 border-red-500' :
              'bg-blue-50 border-blue-500'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{insight.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                  <button className="text-sm font-medium mt-2 text-blue-600 hover:underline">
                    {insight.action} için
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Challenge Card */}
      {dailyChallenge && (
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            Günün Görevi
          </h3>
          <div className="space-y-3">
            <h4 className="text-2xl font-bold">{dailyChallenge.title}</h4>
            <p className="text-purple-100">{dailyChallenge.description}</p>
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  {dailyChallenge.difficulty === 'easy' ? '🎉 Kolay' :
                   dailyChallenge.difficulty === 'medium' ? '🎉 Orta' :
                   '🎉 Zor'}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  +{dailyChallenge.points} puan
                </span>
              </div>
                    <button
            onClick={async () => {
              if (!studentData) return;

              // Bugünün tamamlandığını kontrol et
              const completed = await isChallengeCompletedToday(studentData.id, dailyChallenge.id);
              
              if (completed) {
                alert('Bu görevi bugünün zaten tamamladınız!');
                return;
              }
              // Challenge tamamla
              const result = await completeChallenge(
                studentData.id,
                dailyChallenge.id,
                dailyChallenge.points,
                dailyChallenge.title
              );
              
              if (result.success) {
                alert(`🎉 Görev tamamlandı! +${dailyChallenge.points} puan kazandınız!`);
                window.location.reload(); // Points'i güncelle
              } else {
                alert(result.error || 'Görev tamamlanamadı');
              }
            }}
            className="bg-white text-purple-600 px-6 py-2 rounded-full font-semibold hover:bg-purple-50"
          >
            Görevi Tamamladım
          </button>
            </div>
          </div>   
        </div>
      )}
    </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Bu Ay Deneme</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalExams}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Ortalama Puan</p>
              <p className="text-xl font-bold text-green-600">
                {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : '0'}
              </p>
              <p className="text-xs text-gray-500">/ 500</p>
            </div>
            <Award className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Bekleyen Görev</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingHomeworks}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Son Gelişim</p>
              <p className={`text-2xl font-bold ${stats.improvementPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.improvementPercent > 0 ? '+' : ''}{stats.improvementPercent.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">son denemenize göre</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Haftalık Çalışma</p>
              <p className="text-2xl font-bold text-blue-600">{weeklyStudyHours.toFixed(1)} saat</p>
              <p className="text-blue-600 text-sm">
                {weeklyGoal ? `Hedef: ${weeklyGoal.weekly_hours_target} saat (${Math.round((weeklyStudyHours / weeklyGoal.weekly_hours_target) * 100)}%)` : 'Bu hafta'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => setShowStudyForm(true)}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 sm:mt-0"
          >
            +Çalışma Ekle
          </button>
          {!weeklyGoal && (
            <button
              onClick={() => setShowGoalForm(true)}
              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 sm:mt-0"
            >
              Hedef Belirle
            </button>
          )}
          {weeklyGoal && (
            <button
              onClick={() => setShowGoalForm(true)}
              className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 sm:mt-0"
            >
              Hedef Güncelle
            </button>
          )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div className="bg-white rounded-lg p-6 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
      <h3 className="text-lg font-semibold">Deneme İlerlemesi</h3>
      <select
        value={chartFilter}
        onChange={(e) => setChartFilter(e.target.value as any)}
        className="px-3 py-1 border border-gray-300 rounded text-sm"
      >
        <option value="all">Tümü</option>
        <option value="TYT">TYT</option>
        <option value="AYT">AYT</option>
        <option value="LGS">LGS</option>
      </select>
    </div>
  {chartData.length > 0 ? (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        {/* Artık "date" anahtarını veride bulabilmek için bu satır doğru çalışacak */}
        <XAxis dataKey="date" fontSize={12} /> 
        <YAxis domain={[100, 500]} />
        <Tooltip 
          formatter={(value, _name, props) => [
            `${value} puan`,
            `${props.payload.examName} (${props.payload.examType})`
          ]}
        />
        <Line 
          type="monotone" 
          dataKey="puan" 
          stroke="#3B82F6" 
          strokeWidth={3} 
          name="Puan"
          // Bu noktalar artık veri olduğu için görünecek
          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
          activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  ) : (
      <div className="text-center py-16 text-gray-500">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>{chartFilter === 'all' ? 'Grafik için deneme sonucu gerekli' : `${chartFilter} denemesi bulunmuyor`}</p>
      </div>
    )}
  </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Yaklaşan Görevler</h3>
          <div className="space-y-3">
            {homeworks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Henüz görev eklenmemiş</p>
              </div>
            ) : (
              [...homeworks, ...classAssignments].slice(0, 4).map((homework) => (
              <div key={homework.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {homework.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{homework.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(homework.due_date).toLocaleDateString('tr-TR')}
                      {homework.subject && ` • ${homework.subject}`}
                    </p>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderExams = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
        <h3 className="text-lg font-semibold">Deneme Sonuçları</h3>
        <button 
          onClick={() => setShowExamForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4" />
          <span>Yeni Deneme</span>
        </button>
      </div>
      
      <div className="space-y-4">
        {examResults.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Henüz deneme sonucu eklenmemiş</p>
            <button 
              onClick={() => setShowExamForm(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              İlk Deneme Sonucunu Ekle
            </button>
          </div>
        ) : (
          examResults.slice(0, 5).map((exam, index) => (
          <div key={index} className="border rounded-lg p-4 relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-3 pr-8">
              <div>
                <h4 className="font-semibold">{exam.exam_name}</h4>
                <p className="text-sm text-gray-600">{new Date(exam.exam_date).toLocaleDateString('tr-TR')}</p>
              </div>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {exam.exam_type}: {exam.total_score ? Math.round(exam.total_score) : 'N/A'}
              </span>
            </div>
            
            {/* Exam Menu */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowExamMenu(showExamMenu === exam.id ? null : exam.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </button>
              
              {showExamMenu === exam.id && (
                <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={() => {
                      setEditingExam(exam);
                      setShowExamForm(true);
                      setShowExamMenu(null);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Düzenle</span>
                  </button>
                  <button
                    onClick={() => { handleDeleteExam(exam.id); setShowExamMenu(null); }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 text-red-600 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Sil</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Toplam Puan: <span className="font-semibold">{exam.total_score ? Math.round(exam.total_score) : 'N/A'}</span></p>
              {exam.notes && <p className="mt-1 text-xs">{exam.notes}</p>}
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );

    if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const renderAnalysis = () => (
    <AIInsights examResults={examResults} studentData={studentData} />
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Öğrenci Paneli</h1>
            <p className="text-gray-600">
              Hoş geldin, {user?.profile?.full_name || 'öğrencimiz'}! Hedeflerini takip etmeye devam et.
            </p>
            <button
              onClick={handleShowInviteCode}
              className="mt-2 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200"
            >
              Veli Davet Kodu
            </button>
          </div>
          
          {/* Points ve Logout Birlikte */}
          <div className="flex flex-col items-end gap-2">
            {studentData && <PointsDisplay studentId={studentData.id} />}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>


        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'overview', label: 'Genel Bakış', icon: TrendingUp },
            { key: 'exams', label: 'Denemeler', icon: BookOpen },
            { key: 'homeworks', label: 'Ödevler', icon: Calendar },
            { key: 'classes', label: 'Sınıflarım', icon: Users },
            { key: 'analysis', label: 'AI Analiz', icon: Target },
            { key: 'smartplan', label: 'Akıllı Plan', icon: Brain },
            { key: 'formulas', label: 'Formül Kartları', icon: BookmarkCheck },
            { key: 'pomodoro', label: 'Pomodoro', icon: Timer },
            { key: 'maps', label: 'Tarih/Coğrafya', icon: MapIcon },
            { key: 'notes', label: 'Notlarım', icon: StickyNote },
            { key: 'subscription', label: 'Aboneliğim', icon: Crown },

          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:w-auto ${
                activeTab === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {(key === 'pomodoro' || key === 'formulas'|| key === 'maps'|| key === 'notes') && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-full font-bold">
                PRO
              </span>
            )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            activeTab === 'schedule'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Çalışma Programı</span>
        </button>
        <button
          onClick={() => setShowExamTopics(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto"
        >
          <Target className="h-4 w-4" />
          <span>Çıkmış Konular</span>
        </button>
      </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'exams' && renderExams()}
        {activeTab === 'analysis' && renderAnalysis()}
        {activeTab === 'smartplan' && studentData && (
          <AIRecommendations studentId={studentData.id} />
        )}
        {activeTab === 'classes' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
              <h3 className="text-lg font-semibold">Sınıflarım</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowJoinClassModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Sınıfa Katıl</span>
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {studentClasses.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Henüz hiçbir sınıfa katılmadınız</p>
                  {classAnnouncements.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-blue-800 text-sm font-medium">Sınıf Duyuruları</p>
                      <div className="mt-2 space-y-2">
                        {classAnnouncements.slice(0, 3).map((announcement) => (
                          <div key={announcement.id} className="text-left p-2 bg-white rounded border">
                            <p className="font-medium text-sm">{announcement.title}</p>
                            <p className="text-xs text-gray-600">{announcement.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setShowJoinClassModal(true)}
                    className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 sm:w-auto"
                  >
                    İlk Sınıfa Katıl
                  </button>
                </div>
              ) : (
                studentClasses.map((classData) => (
                  <div key={classData.id} className="border rounded-lg p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-4">
                      <div>
                        <h4 className="font-semibold">{classData.classes?.class_name}</h4>
                        <p className="text-sm text-gray-600">
                          Öğretmen: {classData.classes?.teachers?.full_name}
                        </p>
                        {classData.classes?.teachers?.school_name && (
                          <p className="text-xs text-gray-500">
                            {classData.classes.teachers.school_name}
                          </p>
                        )}
                      </div>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        Aktif
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      <p>Katılım Tarihi: {new Date(classData.joined_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                    
                    {/* Show class assignments for this class */}
                    {classAssignments.filter(a => a.class_id === classData.class_id).length > 0 && (
                      <div className="mt-3 p-2 bg-blue-50 rounded">
                        <p className="text-blue-800 text-sm font-medium mb-2">Sınıf Ödevleri:</p>
                        {classAssignments
                          .filter(a => a.class_id === classData.class_id)
                          .slice(0, 3)
                          .map((assignment) => (
                            <div key={assignment.id} className="text-sm text-blue-700 mb-1 p-2 bg-white rounded border-l-2 border-blue-400">
                              <div className="font-medium">{assignment.title}</div>
                              <div className="text-xs text-blue-600">
                                {assignment.subject} - Son teslim: {new Date(assignment.due_date).toLocaleDateString('tr-TR')}
                              </div>
                              {assignment.description && (
                                <div className="text-xs text-blue-500 mt-1">{assignment.description}</div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Show class announcements */}
                    {classAnnouncements.filter(a => a.class_id === classData.class_id).length > 0 && (
                      <div className="mt-3 p-2 bg-purple-50 rounded">
                        <p className="text-purple-800 text-sm font-medium mb-2">Sınıf Duyuruları:</p>
                        {classAnnouncements
                          .filter(a => a.class_id === classData.class_id)
                          .slice(0, 3)
                          .map((announcement) => (
                            <div key={announcement.id} className="text-sm text-purple-700 mb-1 p-2 bg-white rounded border-l-2 border-purple-400">
                              <div className="font-medium">{announcement.title}</div>
                              <div className="text-xs text-purple-600 mt-1">{announcement.content}</div>
                              <div className="text-xs text-purple-500 mt-1">
                                {new Date(announcement.created_at).toLocaleDateString('tr-TR')}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Show class exam results */}
                    {classExamResults.filter(r => r.class_exams?.class_id === classData.class_id).length > 0 && (
                      <div className="mt-3 p-2 bg-orange-50 rounded">
                        <p className="text-orange-800 text-sm font-medium mb-2">Sınıf Sınav Sonuçları:</p>
                        {classExamResults
                          .filter(r => r.class_exams?.class_id === classData.class_id)
                          .slice(0, 3)
                          .map((result) => (
                            <div key={result.id} className="text-sm text-orange-700 mb-1 p-2 bg-white rounded border-l-2 border-orange-400">
                              <div className="font-medium">{result.class_exams?.exam_name}</div>
                              <div className="text-xs text-orange-600">
                                Puan: {result.score?.toFixed(1) || 'N/A'} - 
                                Doğru: {result.correct_answers || 0} - 
                                Yanlış: {result.wrong_answers || 0} - 
                                Boş: {result.empty_answers || 0}
                              </div>
                              <div className="text-xs text-orange-500 mt-1">
                                {new Date(result.class_exams?.exam_date).toLocaleDateString('tr-TR')}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {activeTab === 'schedule' && studentData && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Haftalık Çalışma Programım</h2>
            <StudentWeeklySchedule
              studentId={studentData.id}
              studentName={studentData.profile?.full_name}
            />
          </div>
        )}
        {activeTab === 'homeworks' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
              <h3 className="text-lg font-semibold">Ödev Takibi
                <p> Kendi ödevlerini takip etmek için :</p>
              </h3>
              <button 
                onClick={() => setShowHomeworkForm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Yeni Ödev</span>
              </button>
            </div>
            <div className="space-y-3">
              {homeworks.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Henüz ödev eklenmemiş</p>
                  {classAssignments.length > 0 && (
                    <div className="mt-4">
                      <p className="text-gray-700 font-medium mb-2">Sınıf ödevleri:</p>
                      {classAssignments.slice(0, 3).map((assignment) => (
                        <div key={assignment.id} className="p-3 bg-blue-50 rounded-lg mb-2">
                          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                            <div>
                              <p className="font-medium text-blue-900">{assignment.title}</p>
                              <p className="text-sm text-blue-700">{assignment.subject}</p>
                              {assignment.description && (
                                <p className="text-xs text-blue-600 mt-1">{assignment.description}</p>
                              )}
                            </div>
                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                              {new Date(assignment.due_date).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button 
                    onClick={() => setShowHomeworkForm(true)}
                    className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 sm:w-auto"
                  >
                    Yeni Ödev Ekle
                  </button>
                </div>
              ) : (
                [...homeworks, ...classAssignments.map(a => ({...a, isClassAssignment: true}))].map((homework) => (
                <div key={homework.id} className="flex items-center justify-between p-4 border rounded-lg relative">
                  <div className="flex items-center space-x-3">
                    {!homework.isClassAssignment && (
                      <button
                        onClick={() => handleToggleHomework(homework)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          homework.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {homework.completed && <CheckCircle className="h-3 w-3" />}
                      </button>
                    )}
                    {homework.isClassAssignment && (
                      <div className="w-5 h-5 rounded border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
                        <BookOpen className="h-3 w-3 text-blue-600" />
                      </div>
                    )}
                    <div className={homework.completed ? 'opacity-60' : ''}>
                      <p className={`font-medium ${homework.completed ? 'line-through' : ''}`}>
                        {homework.title}
                        {homework.isClassAssignment && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Sınıf Ödevi
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        Son teslim: {new Date(homework.due_date).toLocaleDateString('tr-TR')}
                        {homework.subject && ` • ${homework.subject}`}
                      </p>
                      {homework.description && (
                        <p className="text-xs text-gray-500 mt-1">{homework.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      homework.isClassAssignment
                        ? 'bg-blue-100 text-blue-800'
                        : homework.completed 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {homework.isClassAssignment 
                        ? 'Sınıf Ödevi' 
                        : homework.completed ? 'Tamamlandı' : 'Bekliyor'
                      }
                    </span>
                    
                    {/* Homework Menu */}
                    {!homework.isClassAssignment && (
                      <div className="relative">
                        <button
                          onClick={() => setShowHomeworkMenu(showHomeworkMenu === homework.id ? null : homework.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </button>
                        
                        {showHomeworkMenu === homework.id && (
                          <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 min-w-[120px]">
                            <button
                              onClick={() => {
                                handleToggleHomework(homework);
                                setShowHomeworkMenu(null);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>{homework.completed ? 'Geri Al' : 'Tamamla'}</span>
                            </button>
                            <button
                              onClick={() => { handleDeleteHomework(homework.id); setShowHomeworkMenu(null); }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 text-red-600 flex items-center space-x-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Sil</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Forms */}
        {studentData && (
          <>
            <ExamForm
              isOpen={showExamForm}
              onClose={() => {
                setShowExamForm(false);
                setEditingExam(null);
              }}
              studentId={studentData.id}
              onSuccess={refetch}
              editData={editingExam}
            />
            <HomeworkForm
              isOpen={showHomeworkForm}
              onClose={() => setShowHomeworkForm(false)}
              studentId={studentData.id}
              onSuccess={refetch}
            />
          </>
        )}

        {showUpgradeModal && targetPlan && (
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => {
              setShowUpgradeModal(false);
              setTargetPlan(null);
            }}
            targetPlanId={targetPlan.id}
            targetPlanName={targetPlan.name}
            targetPlanPrice={{
              monthly: targetPlan.monthlyPrice.toString(),
              yearly: targetPlan.yearlyPrice.toString()
            }}
            currentBillingCycle={subscription?.billing_cycle || 'monthly'}
            onSuccess={() => {
              refetch();
            }}
          />
        )}

        {/* Exam Topics Modal */}
        {showExamTopics && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <h2 className="text-xl font-bold">TYT-AYT-LGS+Çıkmış Konular Analizi</h2>
                <button
                  onClick={() => setShowExamTopics(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <ExamTopicsSection 
                  user={user} 
                  hasClassViewerSession={true}
                  onUpgrade={() => {}}
                />
              </div>
            </div>
          </div>
        )}
        

        {planName === 'basic' && (
          <div className="mb-6">
            <ExamLimitBadge onUpgrade={() => setShowUpgradeModal(true)} />
          </div>
        )}
        

        {activeTab === 'subscription' && (
          <SubscriptionManagement />
        )}
      </div>

      {activeTab === 'pomodoro' && (
        <FeatureGate 
          feature="pomodoro_timer"
          fallback={
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-8 text-center border-2 border-orange-200">
              <Clock className="h-16 w-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 ">
                Pomodoro Timer
              </h3>
              <p className="text-gray-600 mb-6">
                Pomodoro tekniği ile çalışma verimliliğinizi artırın! Bu özellik Gelişmiş ve Profesyonel paketlerde kullanılabilir.
              </p>
              <button
                onClick={() => setActiveTab('subscription')}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Paketi Yükselt
              </button>
            </div>
          }
        >
          <div>
          <PomodoroTimer />
          </div>
        </FeatureGate>
      )}

      {activeTab === 'formulas' && (
      <FeatureGate 
        feature="formula_cards"
        fallback={
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 text-center border-2 border-purple-200">
            <BookmarkCheck className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Formül Kartları
            </h3>
            <p className="text-gray-600 mb-6">
              Sınavda en çok kullanılan formülleri flashcard tarzında öğren! Bu özellik Profesyonel pakette kullanılabilir.
            </p>
            <div className="mb-6">
              <div className="flex items-center justify-center gap-8 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>500+ Formül</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Flashcard Sistemi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>LaTeX Render</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('subscription')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Profesyonel Pakete Yükselt
            </button>
          </div>
        }
      >
        <FormulaCardsSection />
      </FeatureGate>
    )}

    {activeTab === 'maps' && (
      <FeatureGate 
        feature="historical_maps"
        fallback={
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8 text-center border-2 border-green-200">
            <MapIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Tarih & Coğrafya Haritaları
            </h3>
            <p className="text-gray-600 mb-6">
              Türkiye'deki önemli tarihi olayları ve coğrafi özellikleri interaktif harita üzerinde keşfet! Bu özellik Gelişmiş ve Profesyonel paketlerde kullanılabilir.
            </p>
            <div className="mb-6">
              <div className="flex items-center justify-center gap-8 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>50+ Tarihi Olay</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Interaktif Harita</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>Zaman Çizelgesi</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('subscription')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Paketi Yükselt
            </button>
          </div>
        }
      >
        <HistoricalMapsSection />
      </FeatureGate>
    )}

    {activeTab === 'notes' && (
      <FeatureGate 
        feature="student_notes"
        fallback={
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 text-center border-2 border-purple-200">
            <StickyNote className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Not Defteri
            </h3>
            <p className="text-gray-600 mb-6">
              Markdown destekli not editörü ile notlarını organize et! Bu özellik Profesyonel pakette kullanılabilir.
            </p>
            <div className="mb-6">
              <div className="flex items-center justify-center gap-8 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>Markdown Editor</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                  <span>Etiketleme</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Renk Kodlama</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('subscription')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Profesyonel Pakete Yükselt
            </button>
          </div>
        }
      >
        <NotesSection />
      </FeatureGate>
    )}
      {/* Study Session Form */}
      {showStudyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Çalışma Seansı Ekle</h3>
            <form onSubmit={handleAddStudySession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input
                  type="date"
                  value={studyFormData.date}
                  onChange={(e) => setStudyFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Süre (saat)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={studyFormData.hours}
                  onChange={(e) => setStudyFormData(prev => ({ ...prev, hours: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="2.5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ders</label>
                <select
                  value={studyFormData.subject}
                  onChange={(e) => setStudyFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Ders Seçin</option>
                  <option value="Matematik">Matematik</option>
                  <option value="Türkçe">Türkçe</option>
                  <option value="Fen">Fen Bilimleri</option>
                  <option value="Sosyal">Sosyal Bilgiler</option>
                  <option value="Fizik">Fizik</option>
                  <option value="Kimya">Kimya</option>
                  <option value="Biyoloji">Biyoloji</option>
                  <option value="Edebiyat">Edebiyat</option>
                  <option value="Tarih">Tarih</option>
                  <option value="Coğrafya">Coğrafya</option>
                  <option value="Genel">Genel Tekrar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea
                  value={studyFormData.notes}
                  onChange={(e) => setStudyFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="Ne çalıştınız?"
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowStudyForm(false)}
                  className="w-full rounded-lg bg-gray-100 py-2 text-gray-700 hover:bg-gray-200 sm:flex-1"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 sm:flex-1"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weekly Goal Form */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {weeklyGoal ? 'Haftalık Hedefi Güncelle' : 'Haftalık Çalışma Hedefi Belirle'}
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Haftalık çalışma hedefinizi belirleyin. Bu hedef 7 gün sonra yeniden sorulacak.
            </p>
            <form onSubmit={handleCreateWeeklyGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Haftalık Çalışma Hedefi (saat)
                </label>
                <input
                  type="number"
                  min="5"
                  max="70"
                  value={goalFormData.weekly_hours_target}
                  onChange={(e) => setGoalFormData(prev => ({ ...prev, weekly_hours_target: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="25"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Önerilen: Günde 3-4 saat (Haftalık 21-28 saat)
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowGoalForm(false)}
                  className="w-full rounded-lg bg-gray-100 py-2 text-gray-700 hover:bg-gray-200 sm:flex-1"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={goalLoading}
                  className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 sm:flex-1"
                >
                  {goalLoading ? 'Kaydediliyor...' : (weeklyGoal ? 'Güncelle' : 'Belirle')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Class Modal */}
      {showJoinClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Sınıfa Katıl</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Öğretmeninizden aldığınız davet kodunu girin.
            </p>
            <form onSubmit={handleJoinClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Davet Kodu
                </label>
                <input
                  type="text"
                  value={classInviteCodeInput}
                  onChange={(e) => setClassInviteCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-center"
                  placeholder="XXXX-XXXX-XXXX"
                  maxLength={14}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Örnek: 635A-A006-204D
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinClassModal(false);
                    setClassInviteCodeInput('');
                  }}
                  className="w-full rounded-lg bg-gray-100 py-2 text-gray-700 hover:bg-gray-200 sm:flex-1"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-green-600 py-2 text-white hover:bg-green-700 sm:flex-1"
                >
                  Katıl
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Click outside to close menus */}
      {(showExamMenu || showHomeworkMenu) && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => {
            setShowExamMenu(null);
            setShowHomeworkMenu(null);
          }}
        />
      )}

      {/* Invite Code Modal */}
      {showInviteCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Veli Davet Kodu</h3>
            <p className="text-gray-600 mb-4">
              Bu kodu velinizle paylaşın. Veli hesabından bu kodu girerek sizi takip edebilir.
            </p>
            <div className="bg-gray-100 p-4 rounded-lg text-center mb-4">
              <span className="text-2xl font-mono font-bold text-blue-600">{inviteCode}</span>
            </div>
            <button
              onClick={() => setShowInviteCode(false)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
      <ExamCountdown />
    </div>
  );
}