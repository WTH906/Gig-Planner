import { useMemo, useState } from 'react';
import MapGL, { Marker, Popup, NavigationControl } from 'react-map-gl';
import { format } from 'date-fns';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { EventRecord } from '../lib/types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

interface Props {
  events: EventRecord[];
  onSelectEvent?: (event: EventRecord) => void;
  mini?: boolean;
}

// Group events that share the same coordinates
function groupByLocation(events: EventRecord[]) {
  const map = new Map<string, EventRecord[]>();
  for (const ev of events) {
    const key = `${ev.latitude},${ev.longitude}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  // Sort each group: closest to now first
  const now = Date.now();
  for (const group of map.values()) {
    group.sort(
      (a, b) =>
        Math.abs(new Date(a.start_date).getTime() - now) -
        Math.abs(new Date(b.start_date).getTime() - now)
    );
  }
  return Array.from(map.values());
}

export default function MapPanel({ events, onSelectEvent, mini }: Props) {
  const [popupEvents, setPopupEvents] = useState<EventRecord[] | null>(null);

  const geoEvents = useMemo(
    () => events.filter((e) => e.latitude != null && e.longitude != null),
    [events]
  );

  const locationGroups = useMemo(() => groupByLocation(geoEvents), [geoEvents]);

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
    <MapGL
      initialViewState={center}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />

      {locationGroups.map((group) => {
        const first = group[0];
        return (
          <Marker key={`${first.latitude},${first.longitude}`}
            latitude={first.latitude!} longitude={first.longitude!}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (mini) return;
              setPopupEvents(group);
            }}>
            <div className="cursor-pointer" style={{ position: 'relative' }}>
              <div style={{
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
              {!mini && group.length > 1 && (
                <div style={{
                  position: 'absolute',
                  top: -6,
                  right: -8,
                  background: 'var(--clr-accent)',
                  color: '#0f0f12',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {group.length}
                </div>
              )}
            </div>
          </Marker>
        );
      })}

      {popupEvents && popupEvents.length > 0 && (
        <Popup
          latitude={popupEvents[0].latitude!}
          longitude={popupEvents[0].longitude!}
          onClose={() => setPopupEvents(null)}
          closeButton={false}
          anchor="bottom"
          offset={24}
          maxWidth="280px"
        >
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {popupEvents[0].address && (
              <div className="text-xs mb-1.5 pb-1.5"
                style={{ color: 'var(--clr-text-muted)', borderBottom: '1px solid var(--clr-border)' }}>
                📍 {popupEvents[0].address}
              </div>
            )}
            {popupEvents.map((ev) => (
              <div key={ev.id}
                className="cursor-pointer py-1 transition-colors"
                style={{ borderBottom: '1px solid var(--clr-border)' }}
                onClick={() => onSelectEvent?.(ev)}>
                <strong className="text-sm">{ev.title}</strong>
                <span className="text-xs ml-1" style={{ color: 'var(--clr-text-muted)' }}>
                  ({format(new Date(ev.start_date), 'dd/MM/yyyy')})
                </span>
              </div>
            ))}
          </div>
        </Popup>
      )}
    </MapGL>
  );
}
