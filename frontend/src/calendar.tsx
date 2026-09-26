import { useEffect, useRef, useState } from 'react';

const MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const pad = (n: number) => String(n).padStart(2, '0');
const toInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtLabel = (v: string) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(+d) ? '' : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Modern calendar + time picker. Controlled via value/onChange (datetime-local string).
export function DateTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const init = value ? new Date(value) : new Date();
  const [vy, setVy] = useState(init.getFullYear());
  const [vm, setVm] = useState(init.getMonth());
  const [hh, setHh] = useState(init.getHours());
  const [mm, setMm] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('click', fn);
    return () => document.removeEventListener('click', fn);
  }, []);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const first = new Date(vy, vm, 1);
  const start = (first.getDay() + 6) % 7;
  const dimPrev = new Date(vy, vm, 0).getDate();
  const days = new Date(vy, vm + 1, 0).getDate();
  const sel = value ? new Date(value) : null;

  const cells: { d: Date; other: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const dn = i - start + 1;
    if (dn < 1) cells.push({ d: new Date(vy, vm - 1, dimPrev + dn), other: true });
    else if (dn > days) cells.push({ d: new Date(vy, vm + 1, dn - days), other: true });
    else cells.push({ d: new Date(vy, vm, dn), other: false });
  }

  const pick = (d: Date) => {
    d.setHours(hh, mm);
    onChange(toInput(d));
  };
  const nav = (n: number) => {
    let m = vm + n, y = vy;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setVm(m); setVy(y);
  };
  const label = fmtLabel(value);

  return (
    <div className="dt-wrap" ref={ref}>
      <button type="button" className="dt-btn" onClick={() => setOpen(o => !o)}>
        <span className="cal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
        <span className={'lbl' + (label ? '' : ' dim')}>{label || 'Pick date & time…'}</span>
      </button>
      {open && (
        <div className="dt-pop" style={{ display: 'block' }} onClick={e => e.stopPropagation()}>
          <div className="dt-head">
            <button type="button" className="dt-nav" onClick={() => nav(-1)}>‹</button>
            <b>{MON[vm]} {vy}</b>
            <button type="button" className="dt-nav" onClick={() => nav(1)}>›</button>
          </div>
          <div className="dt-grid">
            {['M','T','W','T','F','S','S'].map((d, i) => <div key={i} className="dt-dow">{d}</div>)}
            {cells.map((c, i) => {
              const dis = c.d < today;
              const isSel = sel?.toDateString() === c.d.toDateString();
              const isToday = c.d.toDateString() === new Date().toDateString();
              return (
                <button key={i} type="button" disabled={dis}
                  className={'dt-day' + (c.other ? ' dim' : '') + (isToday ? ' today' : '') + (isSel ? ' sel' : '')}
                  onClick={() => pick(new Date(c.d))}>{c.d.getDate()}</button>
              );
            })}
          </div>
          <div className="dt-time">
            <select aria-label="Hour" value={hh} onChange={e => {
              const h = +e.target.value; setHh(h);
              if (sel) { const d = new Date(sel); d.setHours(h, mm); onChange(toInput(d)); }
            }}>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{pad(h)}</option>)}
            </select>
            <select aria-label="Minute" value={mm} onChange={e => {
              const m = +e.target.value; setMm(m);
              if (sel) { const d = new Date(sel); d.setHours(hh, m); onChange(toInput(d)); }
            }}>
              {[0,5,10,15,20,25,30,35,40,45,50,55].map(m => <option key={m} value={m}>{pad(m)}</option>)}
            </select>
          </div>
          <div className="dt-foot">
            <button type="button" className="btn soft" onClick={() => { const t = new Date(); setVy(t.getFullYear()); setVm(t.getMonth()); setHh(t.getHours()); setMm(t.getMinutes() - (t.getMinutes() % 5)); }}>Today</button>
            <button type="button" className="btn soft" onClick={() => onChange('')}>Clear</button>
            <button type="button" className="btn primary" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
