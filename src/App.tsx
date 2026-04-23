import { useState, useEffect, useMemo, useRef } from 'react';
import { useEvents } from './hooks/useEvents';
import CalendarView from './components/CalendarView';
import EventModal from './components/EventModal';
import EventDetail from './components/EventDetail';
import MapPanel from './components/MapPanel';
import TagManager from './components/TagManager';
import PlacesManager from './components/PlacesManager';
import { countryToFlag } from './lib/countries';
import type { EventRecord, CalendarView as ViewType } from './lib/types';

export default function App() {
  const store = useEvents();
  const [view, setView] = useState<ViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showPlacesManager, setShowPlacesManager] = useState(false);
  const [showCountryStats, setShowCountryStats] = useState(false);
  const [showParticipantStats, setShowParticipantStats] = useState(false);
  const countryStatsRef = useRef<HTMLDivElement>(null);
  const [slotDate, setSlotDate] = useState<Date | null>(null);

  // Country band stats — sorted by count descending, with percentage
  const countryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const ev of store.events) {
      for (const band of ev.bands ?? []) {
        if (band.country) {
          counts[band.country] = (counts[band.country] || 0) + 1;
          total++;
        }
      }
    }
    return Object.entries(counts)
      .map(([code, count]) => ({
        code,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [store.events]);

  // Per-participant stats
  const participantStats = useMemo(() => {
    // Collect all unique participant names (from checked checkboxes)
    const allNames = new Set<string>();
    for (const ev of store.events) {
      for (const cb of ev.checkboxes ?? []) {
        allNames.add(cb.label);
      }
    }

    return Array.from(allNames).map((name) => {
      // Events where this person is checked
      const attendedEvents = store.events.filter((ev) =>
        ev.checkboxes?.some((cb) => cb.label === name && cb.checked)
      );

      // All bands from those events
      const bandCounts: Record<string, { count: number; country: string }> = {};
      const countryCounts: Record<string, number> = {};

      for (const ev of attendedEvents) {
        for (const band of ev.bands ?? []) {
          if (!bandCounts[band.name]) {
            bandCounts[band.name] = { count: 0, country: band.country || '' };
          }
          bandCounts[band.name].count++;
          if (band.country) {
            countryCounts[band.country] = (countryCounts[band.country] || 0) + 1;
          }
        }
      }

      const totalBands = Object.values(bandCounts).reduce((s, b) => s + b.count, 0);
      const topBands = Object.entries(bandCounts)
        .map(([bName, data]) => ({ name: bName, count: data.count, country: data.country }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      const topCountries = Object.entries(countryCounts)
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        name,
        events: attendedEvents.length,
        totalBands,
        topBands,
        topCountries,
      };
    })
      .sort((a, b) => b.totalBands - a.totalBands);
  }, [store.events]);

  // Close country stats on outside click
  useEffect(() => {
    if (!showCountryStats) return;
    const handler = (e: MouseEvent) => {
      if (countryStatsRef.current && !countryStatsRef.current.contains(e.target as Node)) {
        setShowCountryStats(false);
      }
    };
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [showCountryStats]);

  // Keep selectedEvent in sync with the events array after refetches
  useEffect(() => {
    if (selectedEvent) {
      const updated = store.events.find((e) => e.id === selectedEvent.id);
      if (updated) {
        setSelectedEvent(updated);
      } else {
        setSelectedEvent(null);
      }
    }
  }, [store.events]);

  const openCreate = (date?: Date) => {
    setEditingEvent(null);
    setSlotDate(date ?? null);
    setShowModal(true);
  };

  const openEdit = (event: EventRecord) => {
    setEditingEvent(event);
    setShowModal(true);
    setSelectedEvent(null);
  };

  const openDetail = (event: EventRecord) => {
    setSelectedEvent(event);
  };

  // Total spending: price × checked checkboxes per event
  const totalSpent = useMemo(() => {
    return store.events.reduce((sum, ev) => {
      const price = parseFloat(String(ev.price ?? 0));
      if (!price || !ev.checkboxes) return sum;
      const confirmed = ev.checkboxes.filter((cb) => cb.checked).length;
      return sum + price * confirmed;
    }, 0);
  }, [store.events]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b"
        style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}>
        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: 'var(--clr-accent-dim)' }}>
              🎸
            </div>
            <h1 className="text-xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              GigBoard
            </h1>
          </div>

          {/* Spending counter */}
          <div className="px-3 py-1.5 rounded-lg text-xs sm:text-sm whitespace-nowrap"
            style={{ background: 'var(--clr-bg)', border: '1px solid var(--clr-border)' }}>
            <span style={{ color: 'var(--clr-text-muted)' }}>💸 </span>
            <span className="font-semibold" style={{ color: 'var(--clr-accent)' }}>
              {totalSpent.toFixed(2)} €
            </span>
          </div>

          {/* Country stats */}
          <div className="relative" ref={countryStatsRef}>
            <button
              onClick={() => setShowCountryStats(!showCountryStats)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-lg cursor-pointer transition-colors"
              style={{
                background: showCountryStats ? 'var(--clr-accent-dim)' : 'var(--clr-bg)',
                border: '1px solid var(--clr-border)',
              }}
              title="Bands by country"
            >
              🏴‍☠️
            </button>
            {showCountryStats && (
              <div className="absolute top-full mt-2 right-0 z-50 rounded-xl p-4 min-w-[200px]"
                style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
                <div className="text-xs uppercase tracking-wider mb-3"
                  style={{ color: 'var(--clr-text-muted)' }}>Bands by country</div>
                {countryStats.length === 0 ? (
                  <div className="text-sm" style={{ color: 'var(--clr-text-muted)' }}>No bands with countries yet</div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      {countryStats.map(({ code, count, pct }) => (
                        <div key={code} className="flex items-center gap-3">
                          <span className="text-xl">{countryToFlag(code)}</span>
                          <span className="font-semibold text-sm" style={{ color: 'var(--clr-text)' }}>{count}</span>
                          <span className="text-xs ml-auto" style={{ color: 'var(--clr-text-muted)' }}>{pct}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 flex items-center justify-between text-xs"
                      style={{ borderTop: '1px solid var(--clr-border)', color: 'var(--clr-text-muted)' }}>
                      <span>Total bands</span>
                      <span className="font-semibold" style={{ color: 'var(--clr-text)' }}>
                        {countryStats.reduce((s, c) => s + c.count, 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Participant stats */}
          <button
            onClick={() => setShowParticipantStats(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg cursor-pointer transition-colors"
            style={{
              background: 'var(--clr-bg)',
              border: '1px solid var(--clr-border)',
            }}
            title="Stats by participant"
          >
            👥
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Tag manager toggle */}
          <button
            onClick={() => setShowTagManager(true)}
            className="px-3 py-2 sm:py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex-1 sm:flex-none"
            style={{
              background: 'transparent',
              color: 'var(--clr-text-muted)',
              border: '1px solid var(--clr-border)',
            }}
          >
            🏷 Tags
          </button>

          {/* Places manager toggle */}
          <button
            onClick={() => setShowPlacesManager(true)}
            className="px-3 py-2 sm:py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex-1 sm:flex-none"
            style={{
              background: 'transparent',
              color: 'var(--clr-text-muted)',
              border: '1px solid var(--clr-border)',
            }}
          >
            📍 Places
          </button>

          {/* Map toggle */}
          <button
            onClick={() => setShowMap(!showMap)}
            className="px-3 py-2 sm:py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex-1 sm:flex-none"
            style={{
              background: showMap ? 'var(--clr-accent-dim)' : 'transparent',
              color: showMap ? '#fff' : 'var(--clr-text-muted)',
              border: `1px solid ${showMap ? 'var(--clr-accent-dim)' : 'var(--clr-border)'}`,
            }}
          >
            🗺 Map
          </button>

          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--clr-border)' }}>
            {(['month', 'week'] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-2 sm:py-1.5 text-sm font-medium transition-colors capitalize cursor-pointer"
                style={{
                  background: view === v ? 'var(--clr-accent-dim)' : 'transparent',
                  color: view === v ? '#fff' : 'var(--clr-text-muted)',
                }}
              >
                {v}
              </button>
            ))}
          </div>

          {/* New event */}
          <button
            onClick={() => openCreate()}
            className="px-4 py-2 sm:py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer flex-1 sm:flex-none"
            style={{ background: 'var(--clr-accent)', color: '#0f0f12' }}
          >
            + New
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-col md:flex-row flex-1 md:overflow-hidden">
        {/* Calendar area */}
        <div className={`flex-1 p-3 sm:p-6 md:overflow-auto transition-all ${showMap ? 'md:w-1/2' : 'w-full'}`}>
          <CalendarView
            events={store.events}
            view={view}
            currentDate={currentDate}
            onNavigate={setCurrentDate}
            onSelectEvent={openDetail}
            onSelectSlot={openCreate}
          />
        </div>

        {/* Map panel */}
        {showMap && (
          <div className="w-full md:w-1/2 border-t md:border-t-0 md:border-l"
            style={{ borderColor: 'var(--clr-border)', height: 400, flexShrink: 0 }}>
            <MapPanel events={store.events} onSelectEvent={openDetail} />
          </div>
        )}
      </div>

      {/* Event detail drawer */}
      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          places={store.places}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => openEdit(selectedEvent)}
          onDelete={async () => {
            await store.deleteEvent(selectedEvent.id);
            setSelectedEvent(null);
          }}
          onToggleCheckbox={store.toggleCheckbox}
        />
      )}

      {/* Create/Edit modal */}
      {showModal && (
        <EventModal
          event={editingEvent}
          defaultDate={slotDate}
          tags={store.tags}
          places={store.places}
          onClose={() => { setShowModal(false); setEditingEvent(null); }}
          onSave={async (data, tagIds, cbLabels, bands) => {
            if (editingEvent) {
              await store.updateEvent(editingEvent.id, data, tagIds, cbLabels, bands);
            } else {
              await store.createEvent(data as any, tagIds, cbLabels, bands);
            }
            setShowModal(false);
            setEditingEvent(null);
          }}
          onCreateTag={store.createTag}
        />
      )}

      {/* Tag manager modal */}
      {showTagManager && (
        <TagManager
          tags={store.tags}
          onClose={() => setShowTagManager(false)}
          onCreateTag={store.createTag}
          onUpdateTag={store.updateTag}
          onDeleteTag={store.deleteTag}
        />
      )}

      {/* Places manager modal */}
      {showPlacesManager && (
        <PlacesManager
          places={store.places}
          onClose={() => setShowPlacesManager(false)}
          onCreate={store.createPlace}
          onUpdate={store.updatePlace}
          onDelete={store.deletePlace}
        />
      )}

      {/* Participant stats modal */}
      {showParticipantStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowParticipantStats(false)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-4 sm:p-6 m-2"
            style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)' }}
            onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                👥 Stats by Participant
              </h2>
              <button onClick={() => setShowParticipantStats(false)} className="text-lg cursor-pointer"
                style={{ color: 'var(--clr-text-muted)' }}>✕</button>
            </div>

            {participantStats.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--clr-text-muted)' }}>
                No participants yet. Add people as checkboxes in your events.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {participantStats.map((p) => (
                  <div key={p.name} className="rounded-xl p-4"
                    style={{ background: 'var(--clr-bg)', border: '1px solid var(--clr-border)' }}>

                    {/* Name + summary */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-base">{p.name}</span>
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--clr-text-muted)' }}>
                        <span>{p.events} event{p.events !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>{p.totalBands} band{p.totalBands !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {p.totalBands > 0 && (
                      <div className="flex flex-col gap-2.5">
                        {/* Top countries */}
                        {p.topCountries.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {p.topCountries.map(({ code, count }) => (
                              <span key={code} className="flex items-center gap-1 text-sm px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)' }}>
                                <span>{countryToFlag(code)}</span>
                                <span className="font-medium text-xs">{count}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Top bands */}
                        <div className="flex flex-col gap-0.5">
                          {p.topBands.map((b) => (
                            <div key={b.name} className="flex items-center gap-2 text-sm">
                              <span style={{ color: 'var(--clr-accent)', fontSize: '0.7rem' }}>♪</span>
                              {b.country && <span className="text-xs">{countryToFlag(b.country)}</span>}
                              <span style={{ color: 'var(--clr-text)' }}>{b.name}</span>
                              {b.count > 1 && (
                                <span className="text-xs font-medium" style={{ color: 'var(--clr-accent)' }}>
                                  x{b.count}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
