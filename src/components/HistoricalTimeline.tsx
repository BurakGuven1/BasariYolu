import { useState } from 'react';
import { Calendar, ChevronRight, MapPin, Star } from 'lucide-react';

interface TimelineEvent {
  id: string;
  period: string;
  year: number;
  display_date: string;
  historical_events: {
    id: string;
    title: string;
    description: string;
    category: string;
    importance_level: number;
    exam_frequency: number;
    tags: string[];
    color: string;
    latitude: number;
    longitude: number;
  };
}

interface HistoricalTimelineProps {
  events: TimelineEvent[];
  onEventClick: (event: any) => void;
}

export default function HistoricalTimeline({ events, onEventClick }: HistoricalTimelineProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Group events by period
  const periods = Array.from(new Set(events.map(e => e.period)));
  
  const filteredEvents = selectedPeriod === 'all' 
    ? events 
    : events.filter(e => e.period === selectedPeriod);

  // Sort by year
  const sortedEvents = [...filteredEvents].sort((a, b) => a.year - b.year);

  const getImportanceColor = (level: number) => {
    if (level >= 5) return 'bg-red-500';
    if (level >= 4) return 'bg-orange-500';
    if (level >= 3) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedPeriod('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedPeriod === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tümü ({events.length})
        </button>
        {periods.map(period => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {period} ({events.filter(e => e.period === period).length})
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"></div>

        {/* Events */}
        <div className="space-y-8">
          {sortedEvents.map((event) => (
            <div key={event.id} className="relative pl-20">
              {/* Timeline Dot */}
              <div 
                className={`absolute left-5 top-6 w-6 h-6 rounded-full border-4 border-white shadow-lg ${getImportanceColor(event.historical_events.importance_level)}`}
                style={{ background: event.historical_events.color }}
              ></div>

              {/* Year Badge */}
              <div className="absolute left-0 top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-lg font-bold text-sm shadow-md">
                {event.year}
              </div>

              {/* Event Card */}
              <button
                onClick={() => onEventClick(event.historical_events)}
                className="w-full text-left bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-gray-200 hover:border-blue-400 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {event.period}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {event.display_date}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {event.historical_events.title}
                    </h3>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>

                <p className="text-gray-700 mb-4 line-clamp-2">
                  {event.historical_events.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Importance Stars */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: event.historical_events.importance_level }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>Haritada Göster</span>
                    </div>
                  </div>

                  {/* Exam Frequency Badge */}
                  {event.historical_events.exam_frequency > 0 && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                      event.historical_events.exam_frequency >= 90 ? 'bg-red-500' :
                      event.historical_events.exam_frequency >= 70 ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`}>
                      ⚡ Sınavda Çok Çıkar
                    </span>
                  )}
                </div>

                {/* Tags */}
                {event.historical_events.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {event.historical_events.tags.map((tag, tagIdx) => (
                      <span 
                        key={tagIdx}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {sortedEvents.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Bu dönemde olay bulunamadı</p>
        </div>
      )}
    </div>
  );
}