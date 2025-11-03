import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Calendar } from 'lucide-react';

// Ensure Leaflet marker icons load correctly in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

interface Event {
  id: string;
  event_type: string;
  category: string;
  title: string;
  description: string;
  date_start: string | null;
  latitude: number;
  longitude: number;
  importance_level: number;
  exam_frequency: number;
  tags?: string[];
  color: string;
  icon: string;
}

interface InteractiveMapProps {
  events: Event[];
  selectedEvent: Event | null;
  onEventClick: (event: Event) => void;
}

const ICON_MAP: Record<string, string> = {
  crown: 'CR',
  sword: 'SW',
  swords: 'SW',
  shield: 'SH',
  flag: 'FL',
  castle: 'CS',
  star: '*',
  document: 'DOC',
  scroll: 'SCR',
  book: 'BK',
  landmark: 'LM',
  building: 'BLD',
  parliament: 'BLD',
  trophy: 'TR',
  city: 'CT',
  palmtree: 'PL',
  mountain: 'MT',
  sun: 'SUN',
  wheat: 'WH',
  oil: 'OIL',
  grapes: 'GR',
  triangle: 'TRI',
  droplet: 'H2O',
  waves: 'SEA',
  marker: 'MK'
};

function getIconEmoji(icon: string): string {
  return ICON_MAP[icon] ?? ICON_MAP.marker;
}

function createCustomIcon(event: Event) {
  const size = 25 + event.importance_level * 5;
  const html = `
    <div
      style="
        background:${event.color};
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        border:3px solid #ffffff;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        display:flex;
        align-items:center;
        justify-content:center;
        color:#ffffff;
        font-weight:bold;
        font-size:${Math.max(12, size * 0.4)}px;
      "
      class="custom-marker"
    >
      ${getIconEmoji(event.icon)}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-div-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 7, { animate: true });
  }, [center, map]);

  return null;
}

export default function InteractiveMap({ events, selectedEvent, onEventClick }: InteractiveMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([39, 35]);

  useEffect(() => {
    if (selectedEvent) {
      setMapCenter([selectedEvent.latitude, selectedEvent.longitude]);
    }
  }, [selectedEvent]);

  const getImportanceStars = (level: number) => '*'.repeat(level);

  const getFrequencyBadge = (score: number) => {
    if (score >= 90) return { text: 'Cok Sik Cikar', color: 'bg-red-500' };
    if (score >= 70) return { text: 'Sik Cikar', color: 'bg-orange-500' };
    if (score >= 50) return { text: 'Orta Siklik', color: 'bg-yellow-500' };
    return { text: 'Az Cikar', color: 'bg-gray-500' };
  };

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
      <MapContainer
        center={mapCenter}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
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
              click: () => onEventClick(event)
            }}
          >
            <Popup maxWidth={320}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{event.title}</h3>
                    <span className="inline-block px-2 py-1 mt-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                      {event.category}
                    </span>
                    {event.date_start && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {event.date_start}
                      </p>
                    )}
                  </div>
                  <span className="text-base font-semibold">{getIconEmoji(event.icon)}</span>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed">
                  {event.description}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span title="Onem derecesi">{getImportanceStars(event.importance_level)}</span>
                  {event.exam_frequency > 0 && (
                    <span
                      className={`px-2 py-1 rounded-full font-medium text-white ${getFrequencyBadge(event.exam_frequency).color}`}
                    >
                      {getFrequencyBadge(event.exam_frequency).text}
                    </span>
                  )}
                </div>

                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {event.tags.slice(0, 4).map((tag, idx) => (
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

      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-[1000]">
        <h4 className="font-bold text-sm mb-2">Onem Derecesi</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: '#DC2626' }}></div>
            <span>Cok Onemli (*****)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#EA580C' }}></div>
            <span>Onemli (****)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }}></div>
            <span>Orta (***)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
