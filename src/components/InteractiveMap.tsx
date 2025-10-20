import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Calendar } from 'lucide-react';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Event {
  id: string;
  event_type: string;
  category: string;
  title: string;
  description: string;
  date_start: string;
  latitude: number;
  longitude: number;
  importance_level: number;
  exam_frequency: number;
  tags: string[];
  color: string;
  icon: string;
}

interface InteractiveMapProps {
  events: Event[];
  selectedEvent: Event | null;
  onEventClick: (event: Event) => void;
}

// Custom markers based on importance
function createCustomIcon(event: Event) {
  const size = 25 + (event.importance_level * 5); // 30-50px based on importance
  
  const iconHtml = `
    <div style="
      background: ${event.color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${size * 0.4}px;
      cursor: pointer;
      transition: transform 0.2s;
    " class="custom-marker">
      ${getIconEmoji(event.icon)}
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function getIconEmoji(icon: string): string {
  const icons: Record<string, string> = {
    crown: '👑',
    sword: '⚔️',
    shield: '🛡️',
    flag: '🚩',
    castle: '🏰',
    swords: '⚔️',
    star: '⭐',
    document: '📜',
    building: '🏛️',
    parliament: '🏛️',
    trophy: '🏆',
    scroll: '📜',
    book: '📚',
    landmark: '🏛️',
    city: '🏙️',
    palmtree: '🌴',
    mountain: '⛰️',
    sun: '☀️',
    wheat: '🌾',
    oil: '🛢️',
    triangle: '▲',
    droplet: '💧',
    waves: '〰️',
    marker: '📍'
  };
  return icons[icon] || '📍';
}

// Map center controller
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 7, { animate: true });
  }, [center, map]);

  return null;
}

export default function InteractiveMap({ events, selectedEvent, onEventClick }: InteractiveMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.0, 35.0]); // Turkey center

  useEffect(() => {
    if (selectedEvent) {
      setMapCenter([selectedEvent.latitude, selectedEvent.longitude]);
    }
  }, [selectedEvent]);

  const getImportanceStars = (level: number) => {
    return '⭐'.repeat(level);
  };

  const getFrequencyBadge = (score: number) => {
    if (score >= 90) return { text: 'Çok Sık Çıkar', color: 'bg-red-500' };
    if (score >= 70) return { text: 'Sık Çıkar', color: 'bg-orange-500' };
    if (score >= 50) return { text: 'Orta Sıklık', color: 'bg-yellow-500' };
    return { text: 'Az Çıkar', color: 'bg-gray-500' };
  };

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
      <MapContainer
        center={mapCenter}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={mapCenter} />

        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={createCustomIcon(event)}
            eventHandlers={{
              click: () => onEventClick(event),
            }}
          >
            <Popup maxWidth={300}>
              <div className="p-2">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{event.title}</h3>
                  <span className="text-xl">{getIconEmoji(event.icon)}</span>
                </div>

                <div className="mb-2">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mb-1">
                    {event.category}
                  </span>
                  {event.date_start && (
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {event.date_start}
                    </p>
                  )}
                </div>

                <p className="text-sm text-gray-700 mb-3">{event.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" title="Önem Derecesi">
                      {getImportanceStars(event.importance_level)}
                    </span>
                  </div>
                  {event.exam_frequency > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getFrequencyBadge(event.exam_frequency).color}`}>
                      {getFrequencyBadge(event.exam_frequency).text}
                    </span>
                  )}
                </div>

                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {event.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-[1000]">
        <h4 className="font-bold text-sm mb-2">Önem Derecesi</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: '#DC2626' }}></div>
            <span>Çok Önemli (⭐⭐⭐⭐⭐)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#EA580C' }}></div>
            <span>Önemli (⭐⭐⭐⭐)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }}></div>
            <span>Orta (⭐⭐⭐)</span>
          </div>
        </div>
      </div>
    </div>
  );
}