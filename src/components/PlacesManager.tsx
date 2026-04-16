import { useState, useEffect } from 'react';
import type { Place } from '../lib/types';
import { geocodeAddress } from '../lib/geocode';

interface Props {
  places: Place[];
  onClose: () => void;
  onCreate: (name: string, address: string, lat: number | null, lng: number | null) => Promise<Place | null>;
  onUpdate: (id: string, updates: Partial<Omit<Place, 'id'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function PlacesManager({ places, onClose, onCreate, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const startEdit = (place: Place) => {
    setEditingId(place.id);
    setEditName(place.name);
    setEditAddress(place.address);
    setConfirmDeleteId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    const coords = await geocodeAddress(editAddress);
    await onUpdate(editingId, {
      name: editName.trim(),
      address: editAddress.trim(),
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    });
    setEditingId(null);
    setSaving(false);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newAddress.trim()) return;
    setSaving(true);
    const coords = await geocodeAddress(newAddress);
    await onCreate(newName.trim(), newAddress.trim(), coords?.lat ?? null, coords?.lng ?? null);
    setNewName('');
    setNewAddress('');
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
    setConfirmDeleteId(null);
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--clr-bg)',
    border: '1px solid var(--clr-border)',
    color: 'var(--clr-text)',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl p-4 sm:p-6 m-2"
        style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)' }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Manage Places
          </h2>
          <button onClick={onClose} className="text-lg cursor-pointer"
            style={{ color: 'var(--clr-text-muted)' }}>✕</button>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {places.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--clr-text-muted)' }}>No saved places yet.</p>
          )}

          {places.map((place) => (
            <div key={place.id}>
              {editingId === place.id ? (
                <div className="flex flex-col gap-2 p-3 rounded-lg"
                  style={{ background: 'var(--clr-bg)', border: '1px solid var(--clr-border)' }}>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    placeholder="Venue name" style={inputStyle} autoFocus />
                  <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Address" style={inputStyle} />
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setEditingId(null)}
                      className="px-2 py-1 rounded text-xs cursor-pointer"
                      style={{ color: 'var(--clr-text-muted)' }}>
                      Cancel
                    </button>
                    <button onClick={saveEdit} disabled={saving}
                      className="px-2 py-1 rounded text-xs font-semibold cursor-pointer disabled:opacity-40"
                      style={{ background: 'var(--clr-accent-dim)', color: '#fff' }}>
                      {saving ? '…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
                  style={{ background: 'var(--clr-bg)', border: '1px solid var(--clr-border)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{place.name}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--clr-text-muted)' }}>
                      📍 {place.address}
                    </div>
                  </div>

                  <button onClick={() => startEdit(place)}
                    className="px-2 py-1 rounded text-xs cursor-pointer flex-shrink-0"
                    style={{ color: 'var(--clr-text-muted)' }}>
                    ✏️
                  </button>

                  {confirmDeleteId === place.id ? (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleDelete(place.id)}
                        className="px-2 py-1 rounded text-xs font-semibold cursor-pointer"
                        style={{ background: 'var(--clr-danger)', color: '#fff' }}>
                        Yes
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded text-xs cursor-pointer"
                        style={{ color: 'var(--clr-text-muted)' }}>
                        No
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setConfirmDeleteId(place.id); setEditingId(null); }}
                      className="px-2 py-1 rounded text-xs cursor-pointer flex-shrink-0"
                      style={{ color: 'var(--clr-text-muted)' }}>
                      🗑
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Create new place */}
        <div className="pt-4 flex flex-col gap-2" style={{ borderTop: '1px solid var(--clr-border)' }}>
          <span className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--clr-text-muted)' }}>Add new place</span>
          <input value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="Venue name (e.g. Bercy Arena)" style={inputStyle} />
          <input value={newAddress} onChange={(e) => setNewAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Full address" style={inputStyle} />
          <button onClick={handleCreate} disabled={saving || !newName.trim() || !newAddress.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 self-end"
            style={{ background: 'var(--clr-accent)', color: '#0f0f12' }}>
            {saving ? 'Saving…' : 'Add place'}
          </button>
        </div>
      </div>
    </div>
  );
}
