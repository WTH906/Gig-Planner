import { useMemo, useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { EventRecord } from '../lib/types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

interface Props {
  events: EventRecord[];
  onSelectEvent?: (event: EventRecord) => void;
  mini?: boolean;
}

export default function MapPanel({ events, onSelectEvent, mini }: Props) {
  const [popup, setPopup] = useState<EventRecord | null>(null);

  const geoEvents = useMemo(
    () => events.filter((e) => e.latitude != null && e.longitude != null),
    [events]
  );

  // Center map on events, default to Europe
  const center = useMemo(() => {
    if (geoEvents.length === 0) return { latitude: 46.5, longitude: 10, zoom: 4 };
    if (geoEvents.length === 1) {
      return { latitude: geoEvents[0].latitude!, longitude: geoEvents[0].longitude!, zoom: 13 };
    }
    const avgLat = geoEvents.reduce((s, e) => s + e.latitude!, 0) / geoEvents.length;
    const avgLng = geoEvents.reduce((s, e) => s + e.longitude!, 0) / geoEvents.length;
    return { latitude: avgLat, longitude: avgLng, zoom: 5 };
  }, [geoEvents]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex items-center justify-center h-full text-sm"
        style={{ color: 'var(--clr-text-muted)' }}>
        Add VITE_MAPBOX_TOKEN to .env.local to enable the map
      </div>
    );
  }

  return (
    <Map
      initialViewState={center}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />

      {geoEvents.map((ev) => (
        <Marker key={ev.id} latitude={ev.latitude!} longitude={ev.longitude!}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            if (mini) return;
            setPopup(ev);
          }}>
          <div className="cursor-pointer" style={{
            width: mini ? 12 : 18,
            height: mini ? 12 : 18,
            background: 'var(--clr-accent)',
            borderRadius: '50%',
            border: '2.5px solid #fff',
            boxShadow: '0 2px 8px rgba(124,58,237,0.5)',
            transition: 'transform 0.15s',
          }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </Marker>
      ))}

      {popup && (
        <Popup
          latitude={popup.latitude!}
          longitude={popup.longitude!}
          onClose={() => setPopup(null)}
          closeButton={false}
          anchor="bottom"
          offset={24}
        >
          <div className="cursor-pointer" onClick={() => onSelectEvent?.(popup)}>
            <strong className="block text-sm">{popup.title}</strong>
            {popup.address && (
              <span className="text-xs" style={{ color: 'var(--clr-text-muted)' }}>{popup.address}</span>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
}
