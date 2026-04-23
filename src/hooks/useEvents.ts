import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { EventRecord, Tag, Checkbox, Place } from '../lib/types';

export function useEvents() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    const { data } = await supabase.from('tags').select('*').order('name');
    if (data) setTags(data);
  }, []);

  const fetchPlaces = useCallback(async () => {
    const { data } = await supabase.from('places').select('*').order('name');
    if (data) setPlaces(data);
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);

    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });

    if (!eventsData) {
      setLoading(false);
      return;
    }

    const { data: etData } = await supabase
      .from('event_tags')
      .select('event_id, tag_id, tags(*)');

    const { data: cbData } = await supabase
      .from('checkboxes')
      .select('*')
      .order('label');

    const { data: bandData } = await supabase
      .from('bands')
      .select('*');

    const merged = eventsData.map((ev) => ({
      ...ev,
      tags: (etData ?? [])
        .filter((et: any) => et.event_id === ev.id)
        .map((et: any) => et.tags as Tag),
      checkboxes: (cbData ?? []).filter((cb: any) => cb.event_id === ev.id),
      bands: (bandData ?? []).filter((b: any) => b.event_id === ev.id),
    }));

    setEvents(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTags();
    fetchEvents();
    fetchPlaces();
  }, [fetchTags, fetchEvents, fetchPlaces]);

  const createEvent = async (
    event: Omit<EventRecord, 'id' | 'created_at' | 'tags' | 'checkboxes' | 'bands'>,
    tagIds: string[],
    checkboxLabels: string[],
    bands: { name: string; country: string }[]
  ) => {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();

    if (error || !data) return null;

    if (tagIds.length > 0) {
      await supabase.from('event_tags').insert(
        tagIds.map((tid) => ({ event_id: data.id, tag_id: tid }))
      );
    }

    if (checkboxLabels.length > 0) {
      await supabase.from('checkboxes').insert(
        checkboxLabels.map((label) => ({
          event_id: data.id,
          label,
          checked: false,
        }))
      );
    }

    if (bands.length > 0) {
      await supabase.from('bands').insert(
        bands.map((b) => ({ event_id: data.id, name: b.name, country: b.country }))
      );
    }

    await fetchEvents();
    return data;
  };

  const updateEvent = async (
    id: string,
    event: Partial<Omit<EventRecord, 'id' | 'created_at' | 'tags' | 'checkboxes' | 'bands'>>,
    tagIds?: string[],
    checkboxLabels?: string[],
    bands?: { name: string; country: string }[]
  ) => {
    await supabase.from('events').update(event).eq('id', id);

    if (tagIds !== undefined) {
      await supabase.from('event_tags').delete().eq('event_id', id);
      if (tagIds.length > 0) {
        await supabase.from('event_tags').insert(
          tagIds.map((tid) => ({ event_id: id, tag_id: tid }))
        );
      }
    }

    // Smart checkbox update: preserve checked state for unchanged labels
    if (checkboxLabels !== undefined) {
      const { data: existing } = await supabase
        .from('checkboxes')
        .select('*')
        .eq('event_id', id);

      const existingMap = new Map(
        (existing ?? []).map((cb: Checkbox) => [cb.label, cb])
      );

      const labelsToKeep = new Set(checkboxLabels);
      const idsToDelete = (existing ?? [])
        .filter((cb: Checkbox) => !labelsToKeep.has(cb.label))
        .map((cb: Checkbox) => cb.id);

      if (idsToDelete.length > 0) {
        await supabase.from('checkboxes').delete().in('id', idsToDelete);
      }

      const newLabels = checkboxLabels.filter((label) => !existingMap.has(label));
      if (newLabels.length > 0) {
        await supabase.from('checkboxes').insert(
          newLabels.map((label) => ({
            event_id: id,
            label,
            checked: false,
          }))
        );
      }
    }

    // Band update: insert new first, delete old only on success
    if (bands !== undefined) {
      // Get existing band IDs before inserting new ones
      const { data: existingBands } = await supabase
        .from('bands')
        .select('id')
        .eq('event_id', id);

      const oldIds = (existingBands ?? []).map((b: { id: string }) => b.id);

      if (bands.length > 0) {
        const { error: insertErr } = await supabase.from('bands').insert(
          bands.map((b) => ({ event_id: id, name: b.name, country: b.country }))
        );
        // Only delete old bands if the insert succeeded
        if (!insertErr && oldIds.length > 0) {
          await supabase.from('bands').delete().in('id', oldIds);
        }
      } else {
        // User removed all bands — safe to delete
        if (oldIds.length > 0) {
          await supabase.from('bands').delete().in('id', oldIds);
        }
      }
    }

    await fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    await fetchEvents();
  };

  const toggleCheckbox = async (checkbox: Checkbox) => {
    await supabase
      .from('checkboxes')
      .update({ checked: !checkbox.checked })
      .eq('id', checkbox.id);
    await fetchEvents();
  };

  // --- Tag CRUD ---

  const createTag = async (name: string, color: string) => {
    const { data } = await supabase
      .from('tags')
      .insert({ name, color })
      .select()
      .single();
    await fetchTags();
    return data;
  };

  const updateTag = async (id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>) => {
    await supabase.from('tags').update(updates).eq('id', id);
    await fetchTags();
    await fetchEvents();
  };

  const deleteTag = async (id: string) => {
    await supabase.from('tags').delete().eq('id', id);
    await fetchTags();
    await fetchEvents();
  };

  // --- Places CRUD ---

  const createPlace = async (name: string, address: string, latitude: number | null, longitude: number | null) => {
    const { data } = await supabase
      .from('places')
      .insert({ name, address, latitude, longitude })
      .select()
      .single();
    await fetchPlaces();
    return data;
  };

  const updatePlace = async (id: string, updates: Partial<Omit<Place, 'id'>>) => {
    await supabase.from('places').update(updates).eq('id', id);
    await fetchPlaces();
  };

  const deletePlace = async (id: string) => {
    await supabase.from('places').delete().eq('id', id);
    await fetchPlaces();
  };

  return {
    events,
    tags,
    places,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    toggleCheckbox,
    createTag,
    updateTag,
    deleteTag,
    createPlace,
    updatePlace,
    deletePlace,
    refetch: fetchEvents,
  };
}
