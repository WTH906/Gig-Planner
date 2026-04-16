import { useState, useEffect } from 'react';
import type { Tag } from '../lib/types';

interface Props {
  tags: Tag[];
  onClose: () => void;
  onCreateTag: (name: string, color: string) => Promise<Tag | null>;
  onUpdateTag: (id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>) => Promise<void>;
  onDeleteTag: (id: string) => Promise<void>;
}

function isValidHex(v: string) {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

export default function TagManager({ tags, onClose, onCreateTag, onUpdateTag, onDeleteTag }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
    setConfirmDeleteId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    const color = isValidHex(editColor) ? editColor : '#6366f1';
    await onUpdateTag(editingId, { name: editName.trim(), color });
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const color = isValidHex(newColor) ? newColor : '#6366f1';
    await onCreateTag(newName.trim(), color);
    setNewName('');
    setNewColor('#6366f1');
  };

  const handleDelete = async (id: string) => {
    await onDeleteTag(id);
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
  };

  const hexInputStyle: React.CSSProperties = {
    ...inputStyle,
    width: 90,
    fontFamily: 'monospace',
    fontSize: '0.8rem',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl p-4 sm:p-6 m-2"
        style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)' }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Manage Tags
          </h2>
          <button onClick={onClose} className="text-lg cursor-pointer"
            style={{ color: 'var(--clr-text-muted)' }}>✕</button>
        </div>

        {/* Tag list */}
        <div className="flex flex-col gap-2 mb-5">
          {tags.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--clr-text-muted)' }}>No tags yet.</p>
          )}

          {tags.map((tag) => (
            <div key={tag.id}>
              {editingId === tag.id ? (
                <div className="flex flex-col gap-2 p-3 rounded-lg"
                  style={{ background: 'var(--clr-bg)', border: '1px solid var(--clr-border)' }}>
                  <div className="flex gap-2 items-center">
                    <input value={editName} onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      style={{ ...inputStyle, flex: 1 }} autoFocus />
                    <input value={editColor} onChange={(e) => setEditColor(e.target.value)}
                      placeholder="#ff0000" style={hexInputStyle} />
                    <div className="w-6 h-6 rounded-full flex-shrink-0"
                      style={{ background: isValidHex(editColor) ? editColor : '#666', border: '2px solid var(--clr-border)' }} />
                  </div>
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setEditingId(null)}
                      className="px-2 py-1 rounded text-xs cursor-pointer"
                      style={{ color: 'var(--clr-text-muted)' }}>
                      Cancel
                    </button>
                    <button onClick={saveEdit}
                      className="px-2 py-1 rounded text-xs font-semibold cursor-pointer"
                      style={{ background: 'var(--clr-accent-dim)', color: '#fff' }}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{ background: 'var(--clr-bg)', border: '1px solid var(--clr-border)' }}>
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: tag.color }} />
                  <span className="flex-1 text-sm font-medium">{tag.name}</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--clr-text-muted)' }}>{tag.color}</span>

                  <button onClick={() => startEdit(tag)}
                    className="px-2 py-1 rounded text-xs cursor-pointer transition-colors"
                    style={{ color: 'var(--clr-text-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--clr-text)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--clr-text-muted)')}>
                    ✏️ Edit
                  </button>

                  {confirmDeleteId === tag.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs" style={{ color: 'var(--clr-danger)' }}>Sure?</span>
                      <button onClick={() => handleDelete(tag.id)}
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
                    <button onClick={() => { setConfirmDeleteId(tag.id); setEditingId(null); }}
                      className="px-2 py-1 rounded text-xs cursor-pointer transition-colors"
                      style={{ color: 'var(--clr-text-muted)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--clr-danger)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--clr-text-muted)')}>
                      🗑 Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Create new tag */}
        <div className="pt-4" style={{ borderTop: '1px solid var(--clr-border)' }}>
          <span className="text-xs uppercase tracking-wider mb-2 block"
            style={{ color: 'var(--clr-text-muted)' }}>Add new tag</span>
          <div className="flex gap-2 items-center">
            <input value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Tag name" style={{ ...inputStyle, flex: 1 }} />
            <input value={newColor} onChange={(e) => setNewColor(e.target.value)}
              placeholder="#ff0000" style={hexInputStyle} />
            <div className="w-6 h-6 rounded-full flex-shrink-0"
              style={{ background: isValidHex(newColor) ? newColor : '#666', border: '2px solid var(--clr-border)' }} />
            <button onClick={handleCreate}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              style={{ background: 'var(--clr-accent)', color: '#0f0f12' }}>
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
