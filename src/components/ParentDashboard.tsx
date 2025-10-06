import React, { useState } from 'react';
import { User, TrendingUp, Clock, Award, BookOpen, AlertTriangle, Plus, UserPlus, LogOut } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useParentData } from '../hooks/useParentData';
import { connectParentToStudent, signOut, supabase } from '../lib/supabase';

export default function ParentDashboard() {
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [showAddChild, setShowAddChild] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, clearUser } = useAuth();
  const { parentData, children, loading: dataLoading, refetch } = useParentData(user?.id);

  const handleLogout = async () => {
    // For temp parent, just clear the user
    if (user?.isParentLogin) {
      clearUser();
    } else {
      const { error } = await signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    try {
      // Find student by invite code
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          profiles!inner(*)
        `)
        .eq('invite_code', inviteCode.trim())
        .single();

      if (studentError || !student) {
        throw new Error('Geçersiz davet kodu');
      }

      // For temporary parent login, we'll add the student to the current session
      // Update the user object to include this new child
      const updatedUser = {
        ...user,
        connectedStudents: [...(user.connectedStudents || []), student]
      };
      
      // Update the auth context
      localStorage.setItem('tempParentUser', JSON.stringify(updatedUser));
      window.location.reload(); // Refresh to load new data
      
      alert('Çocuk başarıyla eklendi!');
      setShowAddChild(false);
      setInviteCode('');
    } catch (error) {
      alert('Beklenmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Auto-select first child if none selected
  React.useEffect(() => {
    console.log('Children updated:', children);
    if (children.length > 0 && !selectedChild) {
      console.log('Auto-selecting first child:', children[0].id);
      setSelectedChild(children[0].id);
    }
  }, [children, selectedChild]);

  const selectedChildData = children.find(child => child.id === selectedChild);
  
  console.log('Selected child ID:', selectedChild);
  console.log('Selected child data:', selectedChildData);
  console.log('All children:', children.map(c => ({ id: c.id, name: c.profiles?.full_name })));
  
  // Debug selected child data
  if (selectedChildData) {
    console.log('=== SELECTED CHILD DEBUG ===');
    console.log('Selected child full object:', selectedChildData);
    console.log('Selected child exam_results:', selectedChildData.exam_results);
    console.log('Selected child homeworks:', selectedChildData.homeworks);
    console.log('Selected child study_sessions:', selectedChildData.study_sessions);
    console.log('Exam results type:', typeof selectedChildData.exam_results);
    console.log('Exam results is array:', Array.isArray(selectedChildData.exam_results));
    console.log('Homeworks type:', typeof selectedChildData.homeworks);
    console.log('Homeworks is array:', Array.isArray(selectedChildData.homeworks));
  }

  // Calculate stats for selected child
  const calculateChildStats = () => {
    if (!selectedChildData) return { 
      averageScore: 0, 
      completedHomeworks: 0, 
      totalHomeworks: 0, 
      studyHours: 0, 
      studyPercentage: 0, 
      improvementPercent: 0 
    };
    
    const examResults = selectedChildData.exam_results || [];
    const homeworks = selectedChildData.homeworks || [];
    const studySessions = selectedChildData.study_sessions || [];
    
    console.log('=== CALCULATING STATS FOR CHILD ===');
    console.log('Child ID:', selectedChildData.id);
    console.log('Child name:', selectedChildData.profiles?.full_name);
    console.log('Weekly goal:', selectedChildData.weekly_study_goal);
    console.log('Raw data for calculations:', {
      examResults: examResults.length,
      homeworks: homeworks.length,
      studySessions: studySessions.length,
      examData: examResults.map(e => ({ name: e.exam_name, score: e.total_score, date: e.exam_date })),
      homeworkData: homeworks.map(h => ({ title: h.title, completed: h.completed, due: h.due_date })),
      studyData: studySessions.map(s => ({ subject: s.subject, minutes: s.duration_minutes, date: s.session_date }))
    });
    
    const averageScore = examResults.length > 0 
      ? examResults.reduce((sum: number, exam: any) => sum + (exam.total_score || 0), 0) / examResults.length 
      : 0;
    
    const completedHomeworks = homeworks.filter((hw: any) => hw.completed).length;
    const totalHomeworks = homeworks.length;
    
    // Calculate study hours from actual study sessions
    const studyHours = studySessions.reduce((total: number, session: any) => {
      return total + (session.duration_minutes || 0) / 60; // Convert minutes to hours
    }, 0);
    
    // Get the actual weekly target from the child's goal, or use a reasonable default
    const targetHours = selectedChildData.weekly_study_goal?.weekly_hours_target || 0;
    const studyPercentage = targetHours > 0 ? Math.round((studyHours / targetHours) * 100) : 0;
    
    // Calculate improvement percentage from last two exams
    let improvementPercent = 0;
    if (examResults.length >= 2) {
      const sortedExams = examResults
        .sort((a: any, b: any) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());
      const lastExam = sortedExams[0]; // Most recent
      const previousExam = sortedExams[1]; // Second most recent
      
      if (lastExam.total_score && previousExam.total_score && previousExam.total_score > 0) {
        improvementPercent = ((lastExam.total_score - previousExam.total_score) / previousExam.total_score) * 100;
      }
    }
    
    const calculatedStats = {
      averageScore,
      completedHomeworks,
      totalHomeworks,
      studyHours,
      studyPercentage,
      improvementPercent
    };
    
    console.log('=== FINAL CALCULATED STATS ===', calculatedStats);
    console.log('Target hours from goal:', targetHours);
    console.log('Actual study hours:', studyHours);
    console.log('Study percentage:', studyPercentage);
    return calculatedStats;
  };

  const stats = calculateChildStats();

  // Prepare chart data
  const chartData = selectedChildData?.exam_results && selectedChildData.exam_results.length > 0
    ? selectedChildData.exam_results
      .filter((exam: any) => exam.total_score != null && exam.exam_date) // Filter out invalid data
      .sort((a: any, b: any) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
      .slice(-6) // Son 6 deneme
      .map((exam: any, index: number) => ({
        date: new Date(exam.exam_date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
        puan: Math.round(exam.total_score || 0),
        examType: exam.exam_type,
        examName: exam.exam_name
      }))
    : [];

  console.log('Chart data prepared:', chartData);
  console.log('Selected child exam results:', selectedChildData?.exam_results);
  console.log('Selected child homeworks:', selectedChildData?.homeworks);
  console.log('Selected child study sessions:', selectedChildData?.study_sessions);
  console.log('Selected child full data:', selectedChildData);

  const homeworkCompletion = selectedChildData && selectedChildData.homeworks && selectedChildData.homeworks.length > 0 ? [
    { name: 'Tamamlanan', value: stats.completedHomeworks, color: '#10B981' },
    { name: 'Bekleyen', value: stats.totalHomeworks - stats.completedHomeworks, color: '#F59E0B' }
  ] : [];

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Veli Paneli</h1>
            <p className="text-gray-600">
              Hoş geldiniz, {user?.profile?.full_name}! Çocuğunuzun akademik gelişimini takip edin
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Çıkış Yap</span>
          </button>
        </div>

        {/* Child Selection */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">Çocuklarım:</h3>
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child.id)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedChild === child.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <User className="h-8 w-8 text-blue-600" />
                  <div className="text-left">
                    <p className="font-semibold">{child.profiles?.full_name}</p>
                    <p className="text-sm text-gray-600">{child.grade}. Sınıf • {child.school_name}</p>
                  </div>
                </div>
              </button>
            ))}
            <button
              onClick={() => setShowAddChild(true)}
              className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Plus className="h-8 w-8 text-gray-400" />
                <div className="text-left">
                  <p className="font-semibold text-gray-600">Çocuk Ekle</p>
                  <p className="text-sm text-gray-500">Davet kodu ile</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Selected Child Info */}
        {selectedChildData && (
          <div className="mb-6 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <User className="h-10 w-10 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  {selectedChildData.profiles?.full_name}
                </h3>
                <p className="text-blue-700">
                  {selectedChildData.grade}. Sınıf • {selectedChildData.school_name}
                </p>
                {selectedChildData.target_university && (
                  <p className="text-sm text-blue-600">
                    Hedef: {selectedChildData.target_university} - {selectedChildData.target_department}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {children.length === 0 ? (
          <div className="bg-white rounded-lg p-12 shadow-sm text-center">
            <UserPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz çocuk eklenmemiş</h3>
            <p className="text-gray-600 mb-6">
              Çocuğunuzdan davet kodunu alarak onu takip etmeye başlayabilirsiniz.
            </p>
            <button
              onClick={() => setShowAddChild(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              İlk Çocuğu Ekle
            </button>
          </div>
        ) : selectedChildData ? (
          <>
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Ortalama Puan</p>
                <p className="text-xl font-bold text-blue-600">
                  {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : '0'}
                </p>
                <p className="text-xs text-gray-500">/ 500</p>
              </div>
              <Award className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Tamamlanan Ödev</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completedHomeworks}/{stats.totalHomeworks}
                </p>
                <p className="text-green-600 text-sm">
                  {stats.totalHomeworks > 0 ? Math.round((stats.completedHomeworks / stats.totalHomeworks) * 100) : 0}% başarı
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Bu Hafta Çalışma</p>
                <p className="text-2xl font-bold text-purple-600">{stats.studyHours.toFixed(1)} saat</p>
                <p className="text-purple-600 text-sm">
                  {selectedChildData?.weekly_study_goal?.weekly_hours_target 
                    ? `Hedef: ${selectedChildData.weekly_study_goal.weekly_hours_target} saat (%${stats.studyPercentage})`
                    : 'Hedef belirlenmemiş'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Son Gelişim</p>
                <p className={`text-2xl font-bold ${stats.improvementPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.improvementPercent > 0 ? '+' : ''}{stats.improvementPercent.toFixed(1)}%
                </p>
                <p className="text-orange-600 text-sm">son denemeye göre</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Son Denemeler İlerlemesi</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis domain={[100, 500]} />
                  <Tooltip 
                    formatter={(value, name, props) => [
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
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  {selectedChildData 
                    ? `Henüz deneme sonucu bulunmuyor (${selectedChildData.exam_results?.length || 0} kayıt var)` 
                    : 'Çocuk seçin'
                  }
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Ödev Tamamlama Durumu</h3>
            {homeworkCompletion.length > 0 && stats.totalHomeworks > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={homeworkCompletion}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value}`}
                  >
                    {homeworkCompletion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  {selectedChildData 
                    ? `Henüz ödev bulunmuyor (${selectedChildData.homeworks?.length || 0} kayıt var)` 
                    : 'Çocuk seçin'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h3 className="text-lg font-semibold mb-4">AI Destekli Veli Önerileri</h3>
          {selectedChildData && (selectedChildData.exam_results?.length > 0 || selectedChildData.homeworks?.length > 0) ? (
            <div className="space-y-4">
              {/* Dynamic recommendations based on actual data */}
              {stats.averageScore > 0 && (
                <div className="flex items-start p-4 bg-blue-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-full mr-4">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Akademik Performans</h4>
                    <p className="text-blue-700 text-sm">
                      Ortalama puanı {stats.averageScore.toFixed(1)}. 
                      {stats.improvementPercent > 0 
                        ? `Son denemede %${stats.improvementPercent.toFixed(1)} artış var, tebrikler!`
                        : stats.improvementPercent < 0 
                        ? `Son denemede %${Math.abs(stats.improvementPercent).toFixed(1)} düşüş var, motivasyon desteği verin.`
                        : 'Performans stabil, çalışmaya devam etsin.'
                      }
                    </p>
                  </div>
                </div>
              )}

              {stats.totalHomeworks > 0 && (
                <div className="flex items-start p-4 bg-yellow-50 rounded-lg">
                  <div className="bg-yellow-100 p-2 rounded-full mr-4">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">Ödev Takibi</h4>
                    <p className="text-yellow-700 text-sm">
                      {stats.totalHomeworks} ödevden {stats.completedHomeworks} tanesi tamamlanmış 
                      (%{Math.round((stats.completedHomeworks / stats.totalHomeworks) * 100)} başarı oranı).
                      {stats.completedHomeworks === stats.totalHomeworks 
                        ? ' Harika! Tüm ödevler tamamlanmış.'
                        : ' Kalan ödevleri tamamlaması için destek olun.'
                      }
                    </p>
                  </div>
                </div>
              )}

              {stats.studyHours > 0 && (
                <div className="flex items-start p-4 bg-green-50 rounded-lg">
                  <div className="bg-green-100 p-2 rounded-full mr-4">
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Çalışma Disiplini</h4>
                    <p className="text-green-700 text-sm">
                      Bu hafta {stats.studyHours.toFixed(1)} saat çalışmış.
                      {selectedChildData?.weekly_study_goal?.weekly_hours_target 
                        ? ` Hedef: ${selectedChildData.weekly_study_goal.weekly_hours_target} saat (%${stats.studyPercentage}). ${stats.studyPercentage >= 80 ? 'Mükemmel bir disiplin!' : 'Çalışma saatlerini artırması için teşvik edin.'}`
                        : ' Haftalık çalışma hedefi belirlenmemiş.'
                      }
                    </p>
                  </div>
                </div>
              )}
              
              {!selectedChildData?.weekly_study_goal && (
                <div className="flex items-start p-4 bg-blue-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-full mr-4">
                    <Award className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Hedef Belirleme</h4>
                    <p className="text-blue-700 text-sm">
                      Çocuğunuzun haftalık çalışma hedefi belirlenmemiş. Öğrenci panelinden hedef belirlemesini isteyebilirsiniz.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>AI önerileri için deneme sonucu veya ödev verisi gerekli</p>
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Son Aktiviteler</h3>
          <div className="space-y-3">
            {selectedChildData ? (
              (() => {
                const examResults = selectedChildData.exam_results || [];
                const homeworks = selectedChildData.homeworks || [];
                
                // Combine and sort all activities
                const allActivities = [
                  ...examResults.map((exam: any) => ({
                    type: 'exam',
                    date: exam.exam_date,
                    title: exam.exam_name,
                    subtitle: `${exam.exam_type}: ${exam.total_score ? Math.round(exam.total_score) : 'N/A'} puan`,
                    color: 'blue'
                  })),
                  ...homeworks.map((hw: any) => ({
                    type: 'homework',
                    date: hw.completed_at || hw.due_date,
                    title: hw.title,
                    subtitle: hw.completed ? 'Tamamlandı' : `Son teslim: ${new Date(hw.due_date).toLocaleDateString('tr-TR')}`,
                    color: hw.completed ? 'green' : 'orange'
                  }))
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                return allActivities.length > 0 ? (
                  allActivities.slice(0, 5).map((activity: any, index: number) => (
                    <div key={index} className={`flex items-center justify-between p-3 border-l-4 border-${activity.color}-500 bg-gray-50`}>
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(activity.date).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold text-${activity.color}-600`}>
                        {activity.subtitle}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Henüz aktivite bulunmuyor</p>
                  </div>
                );
              })()
              ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Çocuk seçin</p>
              </div>
            )}
          </div>
        </div>
          </>
        ) : (
          <div className="bg-white rounded-lg p-12 shadow-sm text-center">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Çocuk seçin</h3>
            <p className="text-gray-600">
              Yukarıdan bir çocuk seçerek detaylarını görüntüleyebilirsiniz.
            </p>
          </div>
        )}

        {/* Add Child Modal */}
        {showAddChild && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Çocuk Ekle</h3>
              <p className="text-gray-600 mb-4">
                Çocuğunuzdan aldığınız davet kodunu girin.
              </p>
              <form onSubmit={handleAddChild}>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Davet kodunu girin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                  required
                />
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddChild(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Ekleniyor...' : 'Ekle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}