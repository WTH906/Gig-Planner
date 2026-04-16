import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import type { EventRecord, Checkbox, Place } from '../lib/types';
import { countryToFlag } from '../lib/countries';
import MapPanel from './MapPanel';

interface Props {
  event: EventRecord;
  places: Place[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleCheckbox: (cb: Checkbox) => void;
}

export default function EventDetail({ event, places, onClose, onEdit, onDelete, onToggleCheckbox }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const place = event.place_id ? places.find((p) => p.id === event.place_id) : null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const hasCoords = event.latitude != null && event.longitude != null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}>
      <div ref={ref}
        className="w-full max-w-md h-full flex flex-col"
        style={{ background: 'var(--clr-surface)', borderLeft: '1px solid var(--clr-border)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {event.title}
          </h2>
          <button onClick={onClose} className="text-lg cursor-pointer mt-1"
            style={{ color: 'var(--clr-text-muted)' }}>✕</button>
        </div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {event.tags.map((tag) => (
              <span key={tag.id} className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: tag.color + '22', color: tag.color, border: `1px solid ${tag.color}44` }}>
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Date & time */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: 'var(--clr-text-muted)' }}>📅</span>
            <span>{format(new Date(event.start_date), 'EEEE dd/MM/yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: 'var(--clr-text-muted)' }}>🕐</span>
            <span>
              {format(new Date(event.start_date), 'HH:mm')} — {format(new Date(event.end_date), 'HH:mm')}
            </span>
          </div>
          {place && (
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: 'var(--clr-text-muted)' }}>🏛</span>
              <span className="font-medium">{place.name}</span>
            </div>
          )}
          {event.address && (
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: 'var(--clr-text-muted)' }}>📍</span>
              <span>{event.address}</span>
            </div>
          )}
          {event.price != null && (
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: 'var(--clr-text-muted)' }}>💰</span>
              <span>{parseFloat(String(event.price)).toFixed(2)} €</span>
            </div>
          )}
        </div>

        {/* Lineup */}
        {event.bands && event.bands.length > 0 && (
          <div>
            <span className="text-xs uppercase tracking-wider mb-2 block"
              style={{ color: 'var(--clr-text-muted)' }}>Lineup</span>
            <div className="flex flex-col gap-1">
              {event.bands.map((band) => (
                <div key={band.id} className="flex items-center gap-2 text-sm">
                  <span style={{ color: 'var(--clr-accent)' }}>♪</span>
                  {band.country && (
                    <span className="text-base" title={band.country}>{countryToFlag(band.country)}</span>
                  )}
                  <span className="font-medium">{band.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mini map */}
        {hasCoords && (
          <div className="rounded-xl overflow-hidden flex-shrink-0"
            style={{ height: 220, border: '1px solid var(--clr-border)' }}>
            <MapPanel events={[event]} mini />
          </div>
        )}

        {/* Checkboxes */}
        {event.checkboxes && event.checkboxes.length > 0 && (
          <div>
            <span className="text-xs uppercase tracking-wider mb-2 block"
              style={{ color: 'var(--clr-text-muted)' }}>Checklist</span>
            <div className="flex flex-col gap-1.5">
              {event.checkboxes.map((cb) => (
                <div key={cb.id}
                  onClick={() => onToggleCheckbox(cb)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer select-none transition-colors"
                  style={{
                    background: cb.checked ? 'rgba(192,132,252,0.08)' : 'var(--clr-bg)',
                    border: `1px solid ${cb.checked ? 'var(--clr-accent-dim)' : 'var(--clr-border)'}`,
                  }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                    style={{
                      background: cb.checked ? 'var(--clr-accent-dim)' : 'transparent',
                      border: `2px solid ${cb.checked ? 'var(--clr-accent)' : 'var(--clr-border)'}`,
                    }}>
                    {cb.checked && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-sm" style={{
                    textDecoration: cb.checked ? 'line-through' : 'none',
                    opacity: cb.checked ? 0.6 : 1,
                  }}>
                    {cb.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        </div>
        {/* /scrollable content */}

        {/* Actions footer (always visible) */}
        <div className="flex gap-3 p-6 flex-shrink-0"
          style={{ borderTop: '1px solid var(--clr-border)', background: 'var(--clr-surface)' }}>
          <button onClick={onEdit}
            className="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer"
            style={{ background: 'var(--clr-accent-dim)', color: '#fff' }}>
            Edit
          </button>
          <button onClick={onDelete}
            className="px-4 py-2 rounded-lg text-sm cursor-pointer"
            style={{ border: '1px solid var(--clr-danger)', color: 'var(--clr-danger)' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
