import { useState, useEffect } from 'react';
import type { EventRecord, Tag } from '../lib/types';
import { geocodeAddress } from '../lib/geocode';

interface Props {
  event: EventRecord | null;
  defaultDate?: Date | null;
  tags: Tag[];
  onClose: () => void;
  onSave: (
    data: Partial<EventRecord>,
    tagIds: string[],
    checkboxLabels: string[],
    bandNames: string[]
  ) => Promise<void>;
  onCreateTag: (name: string, color: string) => Promise<Tag | null>;
}

export default function EventModal({ event, defaultDate, tags, onClose, onSave, onCreateTag }: Props) {
  const [title, setTitle] = useState(event?.title ?? '');
  const [address, setAddress] = useState(event?.address ?? '');

  const fallback = defaultDate ?? new Date();
  const fallbackEnd = new Date(fallback.getTime() + 2 * 3600000);

  const [startDate, setStartDate] = useState(
    event ? toLocalDatetime(event.start_date) : toLocalDatetime(fallback.toISOString())
  );
  const [endDate, setEndDate] = useState(
    event ? toLocalDatetime(event.end_date) : toLocalDatetime(fallbackEnd.toISOString())
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    event?.tags?.map((t) => t.id) ?? []
  );
  const [checkboxLabels, setCheckboxLabels] = useState<string[]>(
    event?.checkboxes?.map((cb) => cb.label) ?? ['Tickets taken']
  );
  const [bandNames, setBandNames] = useState<string[]>(
    event?.bands?.map((b) => b.name) ?? []
  );
  const [newCbLabel, setNewCbLabel] = useState('');
  const [newBandName, setNewBandName] = useState('');
  const [price, setPrice] = useState<string>(event?.price != null ? String(event.price) : '');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');
  const [showNewTag, setShowNewTag] = useState(false);
  const [saving, setSaving] = useState(false);

  function toLocalDatetime(iso: string) {
    const d = new Date(iso);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  const toggleTag = (id: string) =>
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const addCheckbox = () => {
    if (newCbLabel.trim()) {
      setCheckboxLabels((prev) => [...prev, newCbLabel.trim()]);
      setNewCbLabel('');
    }
  };

  const removeCheckbox = (idx: number) =>
    setCheckboxLabels((prev) => prev.filter((_, i) => i !== idx));

  const addBand = () => {
    if (newBandName.trim()) {
      setBandNames((prev) => [...prev, newBandName.trim()]);
      setNewBandName('');
    }
  };

  const removeBand = (idx: number) =>
    setBandNames((prev) => prev.filter((_, i) => i !== idx));

  const updateBand = (idx: number, value: string) =>
    setBandNames((prev) => prev.map((b, i) => (i === idx ? value : b)));

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const color = /^#[0-9a-fA-F]{6}$/.test(newTagColor) ? newTagColor : '#6366f1';
    const tag = await onCreateTag(newTagName.trim(), color);
    if (tag) {
      setSelectedTags((prev) => [...prev, tag.id]);
      setNewTagName('');
      setNewTagColor('#6366f1');
      setShowNewTag(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const coords = await geocodeAddress(address);

    const data: Partial<EventRecord> = {
      title: title.trim(),
      address: address.trim(),
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      price: price.trim() ? parseFloat(price) : null,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
    };

    await onSave(data, selectedTags, checkboxLabels, bandNames.filter((b) => b.trim()));
    setSaving(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const inputStyle: React.CSSProperties = {
    background: 'var(--clr-bg)',
    border: '1px solid var(--clr-border)',
    color: 'var(--clr-text)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)' }}
        onClick={(e) => e.stopPropagation()}>

        <h2 className="text-xl font-semibold mb-5" style={{ fontFamily: 'var(--font-display)' }}>
          {event ? 'Edit Event' : 'New Event'}
        </h2>

        {/* Title */}
        <label className="block mb-4">
          <span className="text-xs uppercase tracking-wider mb-1 block" style={{ color: 'var(--clr-text-muted)' }}>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Rammstein @ Arena" style={inputStyle} />
        </label>

        {/* Address */}
        <label className="block mb-4">
          <span className="text-xs uppercase tracking-wider mb-1 block" style={{ color: 'var(--clr-text-muted)' }}>Address</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Bercy Arena, Paris" style={inputStyle} />
        </label>

        {/* Dates */}
        <div className="flex gap-3 mb-4">
          <label className="flex-1">
            <span className="text-xs uppercase tracking-wider mb-1 block" style={{ color: 'var(--clr-text-muted)' }}>Start</span>
            <input type="datetime-local" value={startDate}
              onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </label>
          <label className="flex-1">
            <span className="text-xs uppercase tracking-wider mb-1 block" style={{ color: 'var(--clr-text-muted)' }}>End</span>
            <input type="datetime-local" value={endDate}
              onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
          </label>
        </div>

        {/* Bands / Lineup */}
        <div className="mb-4">
          <span className="text-xs uppercase tracking-wider mb-2 block" style={{ color: 'var(--clr-text-muted)' }}>
            Lineup
          </span>
          <div className="flex flex-col gap-1.5 mb-2">
            {bandNames.map((band, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input value={band}
                  onChange={(e) => updateBand(idx, e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder={`Band ${idx + 1}`} />
                <button onClick={() => removeBand(idx)}
                  className="text-xs cursor-pointer w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                  style={{ color: 'var(--clr-danger)', border: '1px solid var(--clr-border)' }}>✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newBandName} onChange={(e) => setNewBandName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addBand()}
              placeholder="Add a band…" style={{ ...inputStyle, flex: 1 }} />
            <button onClick={addBand}
              className="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer flex-shrink-0"
              style={{ background: 'var(--clr-accent-dim)', color: '#fff' }}>
              Add
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-4">
          <span className="text-xs uppercase tracking-wider mb-2 block" style={{ color: 'var(--clr-text-muted)' }}>Tags</span>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <button key={tag.id} onClick={() => toggleTag(tag.id)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer"
                style={{
                  background: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                  border: `1.5px solid ${tag.color}`,
                  color: selectedTags.includes(tag.id) ? '#fff' : tag.color,
                  opacity: selectedTags.includes(tag.id) ? 1 : 0.7,
                }}>
                {tag.name}
              </button>
            ))}
            <button onClick={() => setShowNewTag(!showNewTag)}
              className="px-3 py-1 rounded-full text-xs cursor-pointer"
              style={{ border: '1px dashed var(--clr-border)', color: 'var(--clr-text-muted)' }}>
              + Add tag
            </button>
          </div>

          {showNewTag && (
            <div className="flex gap-2 items-center">
              <input value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name" style={{ ...inputStyle, flex: 1 }} />
              <input value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)}
                placeholder="#ff0000"
                style={{ ...inputStyle, width: 90, fontFamily: 'monospace', fontSize: '0.8rem' }} />
              <div className="w-6 h-6 rounded-full flex-shrink-0"
                style={{ background: /^#[0-9a-fA-F]{6}$/.test(newTagColor) ? newTagColor : '#666', border: '2px solid var(--clr-border)' }} />
              <button onClick={handleCreateTag}
                className="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer flex-shrink-0"
                style={{ background: 'var(--clr-accent-dim)', color: '#fff' }}>
                Add
              </button>
            </div>
          )}
        </div>

        {/* Price */}
        <label className="block mb-4">
          <span className="text-xs uppercase tracking-wider mb-1 block" style={{ color: 'var(--clr-text-muted)' }}>Price (€)</span>
          <input type="number" step="0.01" min="0" value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 65.00" style={inputStyle} />
        </label>

        {/* Checkboxes (participants / tickets) */}
        <div className="mb-6">
          <span className="text-xs uppercase tracking-wider mb-2 block" style={{ color: 'var(--clr-text-muted)' }}>
            Checklist (tickets, participants…)
          </span>
          <div className="flex flex-col gap-1.5 mb-2">
            {checkboxLabels.map((label, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: 'var(--clr-bg)', border: '1px solid var(--clr-border)' }}>
                <span className="flex-1 text-sm">{label}</span>
                <button onClick={() => removeCheckbox(idx)}
                  className="text-xs cursor-pointer" style={{ color: 'var(--clr-danger)' }}>✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newCbLabel} onChange={(e) => setNewCbLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCheckbox()}
              placeholder="e.g. Alice, Bob, Tickets bought…" style={{ ...inputStyle, flex: 1 }} />
            <button onClick={addCheckbox}
              className="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer"
              style={{ background: 'var(--clr-accent-dim)', color: '#fff' }}>
              Add
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm cursor-pointer"
            style={{ border: '1px solid var(--clr-border)', color: 'var(--clr-text-muted)' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving || !title.trim()}
            className="px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-40"
            style={{ background: 'var(--clr-accent)', color: '#0f0f12' }}>
            {saving ? 'Saving…' : event ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
