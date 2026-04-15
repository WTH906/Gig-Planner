export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Checkbox {
  id: string;
  event_id: string;
  label: string;
  checked: boolean;
}

export interface Band {
  id: string;
  event_id: string;
  name: string;
}

export interface EventRecord {
  id: string;
  title: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  start_date: string;
  end_date: string;
  created_at: string;
  tags?: Tag[];
  checkboxes?: Checkbox[];
  bands?: Band[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: EventRecord;
}

export type CalendarView = 'month' | 'week';
