import { useState, useEffect } from 'react';
import { Map, Clock, Search, BookOpen, Info, X } from 'lucide-react';
import InteractiveMap from './InteractiveMap';
import HistoricalTimeline from './HistoricalTimeline';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useStudentData } from '../hooks/useStudentData';

const TURKEY_CORE_GEO_EVENTS = [
  {
    id: 'geo-mountain-agri',
    event_type: 'cografya',
    category: 'Dağlar',
    title: 'Ağrı Dağı (5105 m)',
    description: 'Türkiye’nin en yüksek noktası olan Ağrı Dağı, Iğdır ve Ağrı illeri sınırında yer alır. Kış turizmi ve dağcılık faaliyetleri ile bilinir.',
    date_start: '',
    latitude: 39.702,
    longitude: 44.298,
    importance_level: 5,
    exam_frequency: 85,
    tags: ['dağ', 'jeomorfoloji', 'turizm'],
    color: '#DC2626',
    icon: 'mountain'
  },
  {
    id: 'geo-mountain-kackar',
    event_type: 'cografya',
    category: 'Dağlar',
    title: 'Kaçkar Dağları',
    description: 'Doğu Karadeniz’de bulunan Kaçkar Dağları, Türkiye’nin en fazla yağış alan bölgesinde yer alır; orman örtüsü ve yaylacılık faaliyetleri ile öne çıkar.',
    date_start: '',
    latitude: 40.946,
    longitude: 40.889,
    importance_level: 4,
    exam_frequency: 70,
    tags: ['dağ', 'iklim', 'yaylacılık'],
    color: '#EF4444',
    icon: 'mountain'
  },
  {
    id: 'geo-mountain-toros',
    event_type: 'cografya',
    category: 'Dağlar',
    title: 'Toros Dağları',
    description: 'Akdeniz kıyısı boyunca uzanan Toroslar, karstik şekillerin (dikit, sarkıt, dolin) yoğun görüldüğü ve yazın yaylacılığın yaygın olduğu dağ sırasıdır.',
    date_start: '',
    latitude: 37.401,
    longitude: 34.043,
    importance_level: 4,
    exam_frequency: 80,
    tags: ['dağ', 'karst', 'yaylacılık'],
    color: '#F97316',
    icon: 'mountain'
  },
  {
    id: 'geo-mountain-uludag',
    event_type: 'cografya',
    category: 'Dağlar',
    title: 'Uludağ Milli Parkı',
    description: 'Marmara Bölgesi’nde bulunan Uludağ, kış turizmi, kayak tesisleri ve endemik bitki çeşitliliği açısından Türkiye’nin önemli bir merkezidir.',
    date_start: '',
    latitude: 40.099,
    longitude: 29.218,
    importance_level: 3,
    exam_frequency: 60,
    tags: ['turizm', 'kış', 'ekoloji'],
    color: '#FB923C',
    icon: 'mountain'
  },
  {
    id: 'geo-agri-hazelnut',
    event_type: 'cografya',
    category: 'Tarım Ürünleri',
    title: 'Fındık: Ordu-Giresun-Rize',
    description: 'Dünya fındık üretiminin %70’inden fazlası Doğu Karadeniz’de gerçekleşir. Nemli iklim ve engebeli alanlar fındık tarımına uygundur.',
    date_start: '',
    latitude: 40.918,
    longitude: 38.389,
    importance_level: 5,
    exam_frequency: 95,
    tags: ['tarım', 'ihracat', 'Karadeniz'],
    color: '#22C55E',
    icon: 'wheat'
  },
  {
    id: 'geo-agri-tea',
    event_type: 'cografya',
    category: 'Tarım Ürünleri',
    title: 'Çay: Rize ve Çevresi',
    description: 'Türkiye’de çay tarımı sadece Doğu Karadeniz’in kıyı kesimlerinde yapılır; bol yağış ve ılıman iklim bu tarımı mümkün kılar.',
    date_start: '',
    latitude: 41.025,
    longitude: 40.517,
    importance_level: 5,
    exam_frequency: 90,
    tags: ['tarım', 'iklim', 'monokültür'],
    color: '#16A34A',
    icon: 'wheat'
  },
  {
    id: 'geo-agri-citrus',
    event_type: 'cografya',
    category: 'Tarım Ürünleri',
    title: 'Turunçgiller: Çukurova ve Antalya',
    description: 'Akdeniz ikliminin hakim olduğu Çukurova ve Antalya ovelerinde portakal, mandalina ve limon üretimi Türkiye’nin en yüksek düzeydedir.',
    date_start: '',
    latitude: 36.851,
    longitude: 34.646,
    importance_level: 4,
    exam_frequency: 75,
    tags: ['tarım', 'iklim', 'Akdeniz'],
    color: '#F97316',
    icon: 'sun'
  },
  {
    id: 'geo-agri-cotton',
    event_type: 'cografya',
    category: 'Tarım Ürünleri',
    title: 'Pamuk: Şanlıurfa Ovası',
    description: 'GAP sulama projeleri sayesinde Şanlıurfa ovası pamuk üretiminde Türkiye’nin lideridir; tekstil sanayisi için kritik öneme sahiptir.',
    date_start: '',
    latitude: 37.167,
    longitude: 38.795,
    importance_level: 4,
    exam_frequency: 85,
    tags: ['tarım', 'GAP', 'sanayi'],
    color: '#F59E0B',
    icon: 'wheat'
  },
  {
    id: 'geo-agri-wheat',
    event_type: 'cografya',
    category: 'Tarım Ürünleri',
    title: 'Buğday: Konya Ovası',
    description: 'Konya Ovası geniş düzlükleri ve kurak-yarı kurak iklimiyle buğday üretiminde Türkiye’nin tahıl ambarıdır.',
    date_start: '',
    latitude: 37.874,
    longitude: 32.493,
    importance_level: 4,
    exam_frequency: 80,
    tags: ['tarım', 'hububat', 'ova'],
    color: '#FACC15',
    icon: 'wheat'
  },
  {
    id: 'geo-agri-olive',
    event_type: 'cografya',
    category: 'Tarım Ürünleri',
    title: 'Zeytin: Ayvalık - Aydın - Mersin',
    description: 'Ege ve Akdeniz kıyılarındaki zeytinlikler, Türkiye zeytinyağı üretiminin büyük kısmını oluşturur. Ayvalık, Aydın ve Mersin başlıca merkezlerdir.',
    date_start: '',
    latitude: 39.313,
    longitude: 26.693,
    importance_level: 3,
    exam_frequency: 70,
    tags: ['tarım', 'Ege', 'Akdeniz'],
    color: '#65A30D',
    icon: 'wheat'
  },
  {
    id: 'geo-natural-oil',
    event_type: 'cografya',
    category: 'Enerji Kaynakları',
    title: 'Batman Petrol Sahası',
    description: 'Türkiye’de petrol üretiminin tarihi merkezi olan Batman, Raman ve Garzan sahaları ile enerji coğrafyasında kritik önem taşır.',
    date_start: '',
    latitude: 37.888,
    longitude: 41.132,
    importance_level: 4,
    exam_frequency: 80,
    tags: ['enerji', 'petrol', 'sanayi'],
    color: '#27272A',
    icon: 'oil'
  },
  {
    id: 'geo-water-goksu',
    event_type: 'cografya',
    category: 'Akarsular',
    title: 'Göksu Deltası',
    description: 'Göksu nehri deltası, tarım (pirinç, sebze) ve kuş göç yolları açısından önemlidir; delta toprakları verimlidir.',
    date_start: '',
    latitude: 36.293,
    longitude: 33.995,
    importance_level: 3,
    exam_frequency: 65,
    tags: ['delta', 'tarım', 'ekosistem'],
    color: '#0EA5E9',
    icon: 'waves'
  },
  {
    id: 'geo-water-cildir',
    event_type: 'cografya',
    category: 'Göller',
    title: 'Çıldır Gölü',
    description: 'Kışın tamamen donan Çıldır Gölü, Doğu Anadolu’nun en büyük ikinci gölüdür. Kış turizmi ve balıkçılık ile bilinir.',
    date_start: '',
    latitude: 41.083,
    longitude: 43.238,
    importance_level: 3,
    exam_frequency: 60,
    tags: ['göl', 'kış', 'balıkçılık'],
    color: '#38BDF8',
    icon: 'droplet'
  },
  {
    id: 'geo-agri-grape',
    event_type: 'cografya',
    category: 'Tarım Ürünleri',
    title: 'Üzüm: Manisa - Denizli',
    description: 'Ege’nin iç kesimleri, çekirdeksiz Sultaniye üzümü ile şarap ve kuru üzüm üretiminde öne çıkar.',
    date_start: '',
    latitude: 38.619,
    longitude: 27.428,
    importance_level: 3,
    exam_frequency: 65,
    tags: ['tarım', 'ihracat', 'Ege'],
    color: '#A855F7',
    icon: 'grapes'
  },
  {
    id: 'geo-agri-apple',
    event_type: 'cografya',
    category: 'Tarım Ürünleri',
    title: 'Elma: Isparta - Eğirdir',
    description: 'Türkiye elma üretiminin önemli bir kısmı Isparta ve Eğirdir çevresinde gerçekleşir; soğuk hava depoları ile desteklenir.',
    date_start: '',
    latitude: 37.948,
    longitude: 30.823,
    importance_level: 3,
    exam_frequency: 60,
    tags: ['tarım', 'meyve', 'Göller Yöresi'],
    color: '#F43F5E',
    icon: 'sun'
  }
] as const;

export default function HistoricalMapsSection() {
  const [events, setEvents] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'timeline'>('map');
  const { user } = useAuth();
  const { studentData} = useStudentData(user?.id);
  
  const [selectedEventType, setSelectedEventType] = useState<'all' | 'tarih' | 'cografya'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const studentId = studentData?.id;

  useEffect(() => {
    loadEvents();
    loadTimelineEvents();
  }, [selectedEventType]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('historical_events')
        .select('*')
        .order('importance_level', { ascending: false });

      if (selectedEventType !== 'all') {
        query = query.eq('event_type', selectedEventType);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const dbEvents = data || [];

      // Prevent duplicates based on title
      const existingTitles = new Set(dbEvents.map((event) => event.title));
      const mergedEvents = [
        ...dbEvents,
        ...TURKEY_CORE_GEO_EVENTS.filter((event) => !existingTitles.has(event.title))
      ];

      setEvents(mergedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimelineEvents = async () => {
    try {
      let query = supabase
        .from('timeline_events')
        .select(`
          *,
          historical_events:historical_event_id (
            id,
            title,
            description,
            category,
            importance_level,
            exam_frequency,
            tags,
            color,
            latitude,
            longitude
          )
        `)
        .order('year', { ascending: true });

      const { data, error } = await query;
      
      if (error) throw error;
      setTimelineEvents(data || []);
    } catch (error) {
      console.error('Error loading timeline events:', error);
    }
  };

  const handleEventClick = async (event: any) => {
    setSelectedEvent(event);
    setShowEventDetail(true);

    // Track interaction
    try {
      await supabase
        .from('user_map_interactions')
        .insert([{ student_id: studentId, event_id: event.id }]);
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  // Filtering
  const categories = Array.from(new Set(events.map(e => e.category)));
  
  const filteredEvents = events.filter(event => {
    if (selectedCategory !== 'all' && event.category !== selectedCategory) return false;
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !event.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredTimelineEvents = timelineEvents.filter(event => {
    if (selectedEventType !== 'all' && event.historical_events?.category) {
      const isHistory = ['Osmanlı Dönemi', 'Kurtuluş Savaşı', 'Cumhuriyet Dönemi'].includes(event.historical_events.category);
      if (selectedEventType === 'tarih' && !isHistory) return false;
      if (selectedEventType === 'cografya' && isHistory) return false;
    }
    if (selectedCategory !== 'all' && event.period !== selectedCategory) return false;
    return true;
  });

  // Statistics
  const stats = {
    total: events.length,
    tarih: events.filter(e => e.event_type === 'tarih').length,
    cografya: events.filter(e => e.event_type === 'cografya').length,
    highImportance: events.filter(e => e.importance_level >= 4).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Map className="h-8 w-8" />
          <h2 className="text-3xl font-bold">Tarih & Coğrafya Haritaları</h2>
        </div>
        <p className="text-green-100 mb-4">
          Türkiye'deki önemli tarihi olayları ve coğrafi özellikleri interaktif harita ve timeline ile keşfet
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <span>{stats.total} Olay</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <span>{stats.tarih} Tarih</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span>{stats.cografya} Coğrafya</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
            <span>{stats.highImportance} Çok Önemli</span>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Map className="h-4 w-4" />
            <span>Harita Görünümü</span>
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'timeline'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Zaman Çizelgesi</span>
          </button>
        </div>

        <div className="text-sm text-gray-600">
          {viewMode === 'map' ? filteredEvents.length : filteredTimelineEvents.length} sonuç
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Olay ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Event Type Filter */}
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tümü ({stats.total})</option>
            <option value="tarih">📜 Tarih ({stats.tarih})</option>
            <option value="cografya">🌍 Coğrafya ({stats.cografya})</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Harita yükleniyor...</p>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'map' && (
            <InteractiveMap
              events={filteredEvents}
              selectedEvent={selectedEvent}
              onEventClick={handleEventClick}
            />
          )}

          {viewMode === 'timeline' && (
            <HistoricalTimeline
              events={filteredTimelineEvents}
              onEventClick={handleEventClick}
            />
          )}
        </>
      )}

      {/* Event Detail Modal */}
      {showEventDetail && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h2>
              <button
                onClick={() => setShowEventDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  {selectedEvent.category}
                </span>
                {selectedEvent.date_start && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                    📅 {selectedEvent.date_start}
                  </span>
                )}
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                  {'⭐'.repeat(selectedEvent.importance_level)}
                </span>
                {selectedEvent.exam_frequency >= 70 && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                    ⚡ Sınavda Sık Çıkar
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Açıklama
                </h3>
                <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
              </div>

              {/* Tags */}
              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Etiketler</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map((tag: string, idx: number) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Info */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Konum Bilgisi
                </h3>
                <div className="text-sm text-blue-800">
                  <p>Enlem: {selectedEvent.latitude}°</p>
                  <p>Boylam: {selectedEvent.longitude}°</p>
                </div>
              </div>

              {/* Study Tips */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Çalışma İpuçları
                </h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Bu olayın tarihini ve yerini ezberle</li>
                  <li>• Olay öncesi ve sonrası gelişmeleri araştır</li>
                  <li>• Harita üzerindeki konumunu görselleştir</li>
                  {selectedEvent.exam_frequency >= 80 && (
                    <li className="font-bold">• Sınavda çok sık çıkıyor, mutlaka çalış!</li>
                  )}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setViewMode('map');
                    setShowEventDetail(false);
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Haritada Göster
                </button>
                <button
                  onClick={() => setShowEventDetail(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
