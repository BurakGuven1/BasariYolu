import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  LineChart as LineChartIcon,
  TrendingDown,
  Minus
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  getInstitutionAnalyticsSummary,
  getPerformanceTrends,
  getSubjectPerformance,
  getStudentAnalytics,
  getTeacherActivity,
  type AnalyticsFilters,
  type AnalyticsSummary,
  type PerformanceTrend,
  type SubjectPerformance,
  type StudentAnalytics,
  type TeacherActivity,
} from '../lib/institutionAnalyticsApi';

interface InstitutionAnalyticsPanelProps {
  institutionId: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function InstitutionAnalyticsPanel({ institutionId }: InstitutionAnalyticsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers'>('overview');

  // Data states
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [subjectPerf, setSubjectPerf] = useState<SubjectPerformance[]>([]);
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics[]>([]);
  const [teacherActivity, setTeacherActivity] = useState<TeacherActivity[]>([]);

  // Filter states
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const getDateRangeFilter = (): AnalyticsFilters => {
    const endDate = new Date().toISOString();
    let startDate = '';

    switch (dateRange) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'all':
        return {};
    }

    if (customStartDate && customEndDate) {
      return {
        dateRange: {
          startDate: new Date(customStartDate).toISOString(),
          endDate: new Date(customEndDate + 'T23:59:59').toISOString(),
        },
      };
    }

    return startDate ? { dateRange: { startDate, endDate } } : {};
  };

  const fetchAnalytics = async () => {
    try {
      const filters = getDateRangeFilter();

      const [summaryData, trendsData, subjectData, studentsData, teachersData] = await Promise.all([
        getInstitutionAnalyticsSummary(institutionId, filters),
        getPerformanceTrends(institutionId, filters),
        getSubjectPerformance(institutionId, filters),
        getStudentAnalytics(institutionId, filters, 50),
        getTeacherActivity(institutionId),
      ]);

      setSummary(summaryData);
      setTrends(trendsData);
      setSubjectPerf(subjectData);
      setStudentAnalytics(studentsData);
      setTeacherActivity(teachersData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [institutionId, dateRange, customStartDate, customEndDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <RefreshCw className="mx-auto h-12 w-12 animate-spin text-blue-500" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Analitikler yükleniyor...</p>
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analitik Dashboard</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Kurum performans metrikleri ve öğrenci analizleri
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="border-none bg-transparent text-sm focus:outline-none focus:ring-0"
            >
              <option value="7d">Son 7 Gün</option>
              <option value="30d">Son 30 Gün</option>
              <option value="90d">Son 90 Gün</option>
              <option value="all">Tüm Zamanlar</option>
            </select>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
            { id: 'students', label: 'Öğrenci Analizleri', icon: Users },
            { id: 'teachers', label: 'Öğretmen Aktiviteleri', icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group inline-flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && summary && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:border-gray-700 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Öğrenci</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{summary.totalStudents}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {summary.activeStudentsThisWeek} aktif bu hafta
                  </p>
                </div>
                <div className="rounded-lg bg-blue-500 p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 dark:border-gray-700 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ortalama Puan</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{summary.averageScore}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {summary.totalExamsCompleted} sınav tamamlandı
                  </p>
                </div>
                <div className="rounded-lg bg-green-500 p-3">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 dark:border-gray-700 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tamamlanma Oranı</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">%{summary.completionRate}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    En az 1 sınav tamamlayan öğrenci
                  </p>
                </div>
                <div className="rounded-lg bg-purple-500 p-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Trends Chart */}
          {trends.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performans Trendi</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Zaman içinde ortalama sınav puanları
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('tr-TR')}
                  />
                  <Area
                    type="monotone"
                    dataKey="averageScore"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    name="Ortalama Puan"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Subject Performance */}
          {subjectPerf.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ders Bazlı Performans</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ortalama puanlar</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectPerf}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="subject" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="averageScore" fill="#3b82f6" name="Ortalama Puan" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Doğru Cevap Oranı</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ders bazlı başarı</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subjectPerf}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ subject, correctRate }) => `${subject}: %${correctRate}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="correctRate"
                    >
                      {subjectPerf.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 p-6 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Öğrenci Performans Sıralaması</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Top 50 öğrenci performansı</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Sıra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Öğrenci
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Sınav Sayısı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Ortalama Puan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Doğruluk %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Trend
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Son Sınav
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {studentAnalytics.map((student, index) => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{student.fullName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {student.totalExams}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {student.averageScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        %{student.correctRate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {getTrendIcon(student.trend)}
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {student.trend === 'improving' ? 'Yükseliyor' : student.trend === 'declining' ? 'Düşüyor' : 'Stabil'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {student.lastExamDate ? new Date(student.lastExamDate).toLocaleDateString('tr-TR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Teachers Tab */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 p-6 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Öğretmen Aktivite Raporu</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Soru ve sınav oluşturma istatistikleri</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Öğretmen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Oluşturulan Sınav
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Oluşturulan Soru
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Ortalama Zorluk
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {teacherActivity.map((teacher) => (
                    <tr key={teacher.teacherId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{teacher.teacherName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {teacher.examsCreated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {teacher.questionsCreated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          teacher.averageExamDifficulty === 'Kolay'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : teacher.averageExamDifficulty === 'Orta'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {teacher.averageExamDifficulty}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
