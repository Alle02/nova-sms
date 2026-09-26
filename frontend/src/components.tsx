import { useEffect, useRef, useState, type ReactNode } from 'react';

// ---- toast bus (no external deps) ----
type Toast = { id: number; msg: string; kind: '' | 'ok' | 'err' };
let pushToast: (msg: string, kind?: Toast['kind']) => void = () => {};
export const toast = (msg: string, kind: Toast['kind'] = '') => pushToast(msg, kind);

export function Toasts() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    pushToast = (msg, kind = '') => {
      const id = Date.now() + Math.random();
      setItems(prev => [...prev, { id, msg, kind }]);
      setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 3200);
    };
  }, []);
  return (
    <div id="toasts" aria-live="polite">
      {items.map(t => <div key={t.id} className={'toast ' + t.kind}>{t.msg}</div>)}
    </div>
  );
}

// ---- modal ----
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ---- status pill ----
export function Status({ value }: { value: string }) {
  return <span className={'st ' + value}>{value}</span>;
}

// ---- modern select (native control, custom chevron via CSS) ----
export function Select({ value, onChange, options, ariaLabel, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel?: string;
  placeholder?: string;
}) {
  return (
    <select aria-label={ariaLabel} value={value} onChange={e => onChange(e.target.value)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ---- chunked list renderer (keeps big tables at 60fps) ----
export function Chunked<T>({ rows, render, empty }: {
  rows: T[]; render: (row: T) => ReactNode; empty?: ReactNode;
}) {
  const [count, setCount] = useState(60);
  useEffect(() => { setCount(60); }, [rows]);
  useEffect(() => {
    if (count >= rows.length) return;
    const raf = requestAnimationFrame(() => setCount(c => c + 60));
    return () => cancelAnimationFrame(raf);
  }, [count, rows.length]);
  if (!rows.length) return <>{empty ?? <div className="empty"><b>Nothing here yet</b></div>}</>;
  return <>{rows.slice(0, count).map(render)}</>;
}

// ---- debounce hook ----
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// ---- skeleton rows ----
export function Skel({ n = 4 }: { n?: number }) {
  return <>{Array.from({ length: n }).map((_, i) => <div key={i} className="sk">&nbsp;</div>)}</>;
}

// ---- fit canvas for HiDPI ----
export function fitCanvas(c: HTMLCanvasElement, w: number, h: number) {
  const d = Math.min(2, window.devicePixelRatio || 1);
  c.style.width = '100%';
  c.style.maxWidth = w + 'px';
  if (c.width !== w * d) { c.width = w * d; c.height = h * d; }
  const x = c.getContext('2d')!;
  x.setTransform(d, 0, 0, d, 0, 0);
  return x;
}

export function useDropdownClose(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('click', fn);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('click', fn); document.removeEventListener('keydown', esc); };
  }, [onClose]);
  return ref;
}
