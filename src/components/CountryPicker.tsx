import { useState, useRef, useEffect } from 'react';
import { COUNTRIES, flagUrl } from '../lib/countries';

interface Props {
  value: string;
  onChange: (code: string) => void;
  style?: React.CSSProperties;
}

export default function CountryPicker({ value, onChange, style }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = search
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : COUNTRIES;

  const selected = COUNTRIES.find((c) => c.code === value);

  return (
    <div ref={ref} className="relative" style={{ width: 130, flexShrink: 0, ...style }}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(''); }}
        className="w-full flex items-center gap-2 cursor-pointer"
        style={{
          background: 'var(--clr-bg)',
          border: '1px solid var(--clr-border)',
          color: 'var(--clr-text)',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: '0.875rem',
        }}
      >
        {selected ? (
          <>
            <img src={flagUrl(selected.code)} alt={selected.code} className="w-5 h-3.5 object-cover rounded-sm" />
            <span className="text-xs truncate">{selected.name}</span>
          </>
        ) : (
          <span style={{ color: 'var(--clr-text-muted)' }} className="text-xs">🌍 Country</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 w-48 z-50 rounded-lg overflow-hidden"
          style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <div className="p-1.5">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full text-xs outline-none"
              style={{
                background: 'var(--clr-bg)',
                border: '1px solid var(--clr-border)',
                color: 'var(--clr-text)',
                borderRadius: 6,
                padding: '5px 8px',
              }}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {/* No country option */}
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors"
              style={{
                background: !value ? 'var(--clr-accent-dim)' : 'transparent',
                color: !value ? '#fff' : 'var(--clr-text-muted)',
              }}
            >
              No country
            </button>
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c.code); setOpen(false); setSearch(''); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors"
                style={{
                  background: value === c.code ? 'var(--clr-accent-dim)' : 'transparent',
                  color: value === c.code ? '#fff' : 'var(--clr-text)',
                }}
                onMouseEnter={(e) => { if (value !== c.code) e.currentTarget.style.background = 'var(--clr-surface-hover)'; }}
                onMouseLeave={(e) => { if (value !== c.code) e.currentTarget.style.background = 'transparent'; }}
              >
                <img src={flagUrl(c.code)} alt={c.code} className="w-5 h-3.5 object-cover rounded-sm" />
                <span>{c.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs" style={{ color: 'var(--clr-text-muted)' }}>No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
