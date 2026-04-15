import { useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import type { EventRecord, CalendarEvent, CalendarView as ViewType } from '../lib/types';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface Props {
  events: EventRecord[];
  view: ViewType;
  currentDate: Date;
  onNavigate: (date: Date) => void;
  onSelectEvent: (event: EventRecord) => void;
  onSelectSlot: (date?: Date) => void;
}

export default function CalendarView({
  events,
  view,
  currentDate,
  onNavigate,
  onSelectEvent,
  onSelectSlot,
}: Props) {
  const calendarEvents: CalendarEvent[] = useMemo(
    () =>
      events.map((ev) => ({
        id: ev.id,
        title: ev.title,
        start: new Date(ev.start_date),
        end: new Date(ev.end_date),
        allDay: true,
        resource: ev,
      })),
    [events]
  );

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => onSelectEvent(event.resource),
    [onSelectEvent]
  );

  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date }) => onSelectSlot(slotInfo.start),
    [onSelectSlot]
  );

  // Navigation controls
  const goToday = () => onNavigate(new Date());
  const goPrev = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    onNavigate(d);
  };
  const goNext = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    onNavigate(d);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Custom navigation bar */}
      <div className="flex items-center gap-4">
        <button onClick={goToday}
          className="px-3 py-1 rounded-lg text-sm cursor-pointer"
          style={{ border: '1px solid var(--clr-border)', color: 'var(--clr-text-muted)' }}>
          Today
        </button>
        <div className="flex gap-1">
          <button onClick={goPrev}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ border: '1px solid var(--clr-border)', color: 'var(--clr-text-muted)' }}>
            ‹
          </button>
          <button onClick={goNext}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ border: '1px solid var(--clr-border)', color: 'var(--clr-text-muted)' }}>
            ›
          </button>
        </div>
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          {format(currentDate, view === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
        </h2>
      </div>

      {/* Calendar */}
      <div className="flex-1" style={{ minHeight: 500 }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          view={view as View}
          date={currentDate}
          onNavigate={onNavigate}
          onView={() => {}}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          popup
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}
