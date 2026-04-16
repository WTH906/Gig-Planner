import { useState, useEffect, useMemo } from 'react';
import { useEvents } from './hooks/useEvents';
import CalendarView from './components/CalendarView';
import EventModal from './components/EventModal';
import EventDetail from './components/EventDetail';
import MapPanel from './components/MapPanel';
import TagManager from './components/TagManager';
import PlacesManager from './components/PlacesManager';
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
  const [slotDate, setSlotDate] = useState<Date | null>(null);

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
          onSave={async (data, tagIds, cbLabels, bandNames) => {
            if (editingEvent) {
              await store.updateEvent(editingEvent.id, data, tagIds, cbLabels, bandNames);
            } else {
              await store.createEvent(data as any, tagIds, cbLabels, bandNames);
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
    </div>
  );
}
