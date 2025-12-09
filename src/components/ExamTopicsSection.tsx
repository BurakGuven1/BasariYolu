import { useState, useMemo } from 'react';
import { Search, Filter, Crown, TrendingUp, Award, BarChart3, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import FeatureGate from './FeatureGate';
import { examData } from '../data/examTopics';

interface ExamTopicsSectionProps {
  user?: any;
  hasClassViewerSession?: boolean;
  onUpgrade: () => void;
}

const allYears = ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
const freeYears = ['2018', '2019', '2020'];
const premiumYears = ['2021', '2022', '2023', '2024', '2025'];

export default function ExamTopicsSection({ user, hasClassViewerSession = false, onUpgrade }: ExamTopicsSectionProps) {
  const { canAccessExamTopics } = useFeatureAccess();
  const [selectedSubject, setSelectedSubject] = useState<string>('AYT Matematik');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYears, setSelectedYears] = useState<string[]>(freeYears);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'total'>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const hasAccess = user || hasClassViewerSession;

  const subjects = Object.keys(examData);
  const currentSubjectData = examData[selectedSubject] || { konular: [], toplamSoru: {} };

  // Filter and sort topics
  const filteredTopics = useMemo(() => {
    const topics = currentSubjectData.konular.filter(topic =>
      topic.konu.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const topicsWithTotals = topics.map(topic => {
      const total = selectedYears.reduce((sum, year) => sum + (topic.yillar[year] || 0), 0);
      return { ...topic, total };
    });

    topicsWithTotals.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.konu.localeCompare(b.konu, 'tr')
          : b.konu.localeCompare(a.konu, 'tr');
      } else {
        return sortOrder === 'asc' ? a.total - b.total : b.total - a.total;
      }
    });

    return topicsWithTotals;
  }, [currentSubjectData, searchTerm, selectedYears, sortBy, sortOrder]);

  const totalTopics = filteredTopics.length;
  const totalQuestions = filteredTopics.reduce((sum, topic) => sum + topic.total, 0);

  const toggleYear = (year: string) => {
  const isPremium = premiumYears.includes(year);
  
  if (isPremium && !canAccessExamTopics(year)) {
    onUpgrade();
    return;
  }
  
  if (selectedYears.includes(year)) {
    if (selectedYears.length > 1) {
      setSelectedYears(selectedYears.filter(y => y !== year));
    }
  } else {
    setSelectedYears([...selectedYears, year].sort());
  }
};

  const chartData = selectedTopic
  ? allYears
      .filter(year => canAccessExamTopics(year))
      .map(year => ({
        year,
        soru: currentSubjectData.konular.find(k => k.konu === selectedTopic)?.yillar[year] || 0,
      }))
  : [];

  const handleSort = (field: 'name' | 'total') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div id="exam-topics" className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            TYT-AYT Çıkmış Konular
          </h2>
          <p className="text-gray-600">
            2018-2025 yılları arasındaki tüm sınav konularını inceleyin
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                Ders Seçimi
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedTopic(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline h-4 w-4 mr-1" />
                Konu Ara
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Konu adı yazın..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Year Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yıl Filtreleri
            </label>
            <div className="flex flex-wrap gap-2">
              {allYears.map(year => {
                const isPremium = premiumYears.includes(year);
                const hasYearAccess = canAccessExamTopics(year); // Hook'tan kontrol
                const isLocked = isPremium && !hasYearAccess;
                const isSelected = selectedYears.includes(year);

                return (
                  <button
                    key={year}
                    onClick={() => toggleYear(year)}
                    disabled={isLocked}
                    className={`relative px-4 py-2 rounded-lg font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : isLocked
                        ? 'bg-gray-100 text-gray-400 border-2 border-gray-300 border-dashed cursor-not-allowed opacity-60'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={isLocked ? 'Bu yıl için premium paket gereklidir' : ''}
                  >
                    <span className="flex items-center gap-1">
                      {year}
                      {isLocked && <Lock className="h-4 w-4" />}
                    </span>
                    {isPremium && !isLocked && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        PRO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💎 2021-2025 yılları Gelişmiş ve Profesyonel paketler için 👑 (LGS'de son 3 yıl verisi önemli olduğu için 2023-2025 verileri sunulmaktadır.)
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{totalTopics}</div>
            <div className="text-gray-700 font-medium">Toplam Konu</div>
          </div>
          <div className="bg-green-50 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">{totalQuestions}</div>
            <div className="text-gray-700 font-medium">Toplam Soru</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">{selectedYears.length}</div>
            <div className="text-gray-700 font-medium">Seçili Yıl</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Topics Table */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              {selectedSubject} Konuları
            </h3>

            <div className="hidden md:block">
              {/* Table Header */}
              <div className="flex items-center text-sm font-medium text-gray-700 border-b pb-2 mb-2">
                <div
                  className="flex-1 cursor-pointer hover:text-blue-600 flex items-center"
                  onClick={() => handleSort('name')}
                >
                  KONU
                  {sortBy === 'name' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>
                  )}
                </div>
                <div
                  className="w-32 text-center cursor-pointer hover:text-blue-600 flex items-center justify-center"
                  onClick={() => handleSort('total')}
                >
                  TOPLAM SORU
                  {sortBy === 'total' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>
                  )}
                </div>
                <div className="w-48 text-center">YILLIK DAĞILIM</div>
              </div>

              {/* Table Body */}
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {filteredTopics.map((topic) => (
                  <div
                    key={topic.konu}
                    onClick={() => setSelectedTopic(topic.konu)}
                    className={`flex items-center py-2 px-2 rounded cursor-pointer transition-colors ${
                      selectedTopic === topic.konu
                        ? 'bg-blue-100 border-l-4 border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 text-sm font-medium text-gray-900">
                      {topic.konu}
                    </div>
                    <div className="w-32 text-center">
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                        {topic.total}
                      </span>
                    </div>
                    <div className="w-48 flex flex-wrap justify-center gap-1">
                      {selectedYears.map(year => {
                        const count = topic.yillar[year] || 0;
                        return (
                          <div
                            key={year}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              count > 0
                                ? count >= 4
                                  ? 'bg-green-500 text-white'
                                  : count >= 2
                                  ? 'bg-green-300 text-green-900'
                                  : 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {year.slice(2)}: {count}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Topic List */}
            <div className="md:hidden space-y-3">
              {filteredTopics.map((topic) => (
                <button
                  key={topic.konu}
                  onClick={() => setSelectedTopic(topic.konu)}
                  className={`w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-4 transition-colors ${
                    selectedTopic === topic.konu ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-gray-900">{topic.konu}</span>
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                        {topic.total}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedYears.map(year => {
                        const count = topic.yillar[year] || 0;
                        return (
                          <span
                            key={year}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              count > 0
                                ? count >= 4
                                  ? 'bg-green-500 text-white'
                                  : count >= 2
                                  ? 'bg-green-300 text-green-900'
                                  : 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {year.slice(2)}: {count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Konu Seçin
            </h3>
            {selectedTopic ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>{selectedTopic}</strong> konusunun yıllara göre dağılımı
                </p>
                {chartData.length > 0 ? (
                  <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="soru" fill="#3B82F6" name="Soru Sayısı" />
                    </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-gray-400">
                    <div className="text-center">
                      <Lock className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p>Premium yıllar için giriş yapın</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-400">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Grafik görmek için bir konu seçin</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Premium CTA */}
        {!hasAccess && (
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200">
          <div className="text-center mb-6">
            <Crown className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Tüm Yılları Görmek İster misin?
            </h3>
            <p className="text-gray-600">
              2021-2025 yıllarını görüntülemek ve detaylı analiz yapmak için kayıt olun.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 mb-6">
            {/* Temel Paket */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <div className="text-center mb-4">
                <span className="text-2xl">📘</span>
                <h4 className="text-lg font-semibold mt-2">Temel Paket</h4>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  2018-2020 yılları
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Temel konu analizi
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span className="text-gray-400">2021-2025 yılları</span>
                </li>
              </ul>
            </div>

            {/* Gelişmiş Paket */}
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-6 border-2 border-purple-400">
              <div className="text-center mb-4">
                <span className="text-2xl">⭐</span>
                <h4 className="text-lg font-semibold mt-2">Gelişmiş Paket</h4>
                <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                  Önerilen
                </span>
              </div>
              <ul className="space-y-2 text-sm text-gray-900 font-medium">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  2018-2020 yılları
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <strong>2021-2025 yılları</strong>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Detaylı trend analizi
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  AI destekli öneriler
                </li>
              </ul>
            </div>

            {/* Profesyonel Paket */}
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-6 border-2 border-amber-400">
              <div className="text-center mb-4">
                <span className="text-2xl">👑</span>
                <h4 className="text-lg font-semibold mt-2">Profesyonel</h4>
              </div>
              <ul className="space-y-2 text-sm text-gray-900 font-medium">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Tüm yıllar (2018-2025)
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Sınırsız analiz
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Gelişmiş filtreleme
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  Öncelikli destek
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={onUpgrade}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Paketleri İncele
            </button>
          </div>
        </div>
      )}

        {/* How to Use */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2 text-blue-600" />
            Nasıl Kullanılır?
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div>
              <strong>• Ders seçin:</strong> Analiz etmek istediğiniz dersi dropdown'dan seçin
            </div>
            <div>
              <strong>• Yıl filtreleri:</strong> Hangi yılları görüntülemek istediğinizi seçin (2021-2025 premium)
            </div>
            <div>
              <strong>• Konu seçimi:</strong> Belirli bir konunun trendini görüntüleyin ve öncelikli çalışın
            </div>
          </div>
        </div>
      </div>

      <FeatureGate
        feature="exam_topics"
        onUpgrade={onUpgrade}
      >
        {/* Chart ve premium içerik */}
        <div style={{ width: '100%', height: 300, minHeight: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              {/* ... */}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </FeatureGate>
    </div>
  );
}

export { examData };

