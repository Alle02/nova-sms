import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Data, type Message } from '../api';
import { Chunked, Select, Skel, Status, useDebounced } from '../components';

export function History() {
  const [q, setQ] = useState('');
  const [dir, setDir] = useState('');
  const [st, setSt] = useState('');
  const dq = useDebounced(q);
  const [rows, setRows] = useState<Message[] | null>(null);

  useEffect(() => {
    setRows(null);
    Data.messages(dq, dir, st).then(setRows).catch(() => setRows([]));
  }, [dq, dir, st]);

  return (
    <section>
      <div className="page-head"><div><p className="eyebrow">Messaging</p><h2>History</h2>
        <p className="sub">Every send and reply, filterable and exportable.</p></div>
        <div><a className="btn soft" href="/api/export.csv">⬇ Export</a></div></div>
      <div className="card">
        <div className="toolbar">
          <input className="w" value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search copy or number…" autoComplete="off" />
          <Select value={dir} onChange={setDir} ariaLabel="Direction" options={[
            { value: 'outbound', label: 'Out' }, { value: 'inbound', label: 'In' },
          ]} placeholder="Both ways" />
          <Select value={st} onChange={setSt} ariaLabel="State" options={
            ['queued', 'sent', 'delivered', 'failed', 'received'].map(s => ({ value: s, label: s }))
          } placeholder="Any state" />
        </div>
        <div className="tscroll"><table><thead><tr><th>#</th><th>Route</th><th>Path</th><th>Copy</th><th>State</th><th>At</th></tr></thead>
          <tbody>{rows === null ? <tr><td colSpan={6}><Skel n={5} /></td></tr> : (
            <Chunked rows={rows} render={m => (
              <tr key={m.id}><td>{m.id}</td><td>{m.direction}</td>
                <td>{m.from_phone} → {m.to_phone}{m.error && <><br /><small style={{ color: '#b4234a' }}>{m.error}</small></>}</td>
                <td>{(m.body || '').slice(0, 90)}</td><td><Status value={m.status} /></td>
                <td>{(m.updated_at || '').slice(0, 16)}</td></tr>)} />
          )}</tbody></table></div>
      </div>
    </section>
  );
}

export function Reports() {
  const [s, setS] = useState<{ outbound: number; delivered: number; failed: number; inbound: number } | null>(null);
  const [feed, setFeed] = useState<Message[]>([]);
  useEffect(() => {
    Data.stats().then(setS).catch(() => ({}));
    Data.messages('', '', '', 15).then(setFeed).catch(() => ({}));
  }, []);
  return (
    <section>
      <div className="page-head"><div><p className="eyebrow">Overview</p><h2>Reports</h2>
        <p className="sub">Funnel, totals and a live stream.</p></div>
        <div><a className="btn soft" href="/api/export.csv">⬇ CSV</a></div></div>
      <div className="cols">
        <div className="card"><b>Totals</b>
          <div className="kv col">
            <div><span>Outbound</span><b>{s?.outbound ?? '–'}</b></div>
            <div><span>Delivered</span><b>{s?.delivered ?? '–'}</b></div>
            <div><span>Failed</span><b>{s?.failed ?? '–'}</b></div>
            <div><span>Inbox</span><b>{s?.inbound ?? '–'}</b></div>
          </div></div>
        <div className="card grow"><b>Stream</b>
          <div className="feed">{feed.map(m => (
            <div key={m.id}><b>{m.direction}</b> {(m.body || '').slice(0, 60)} <Status value={m.status} /></div>))}</div></div>
      </div>
      <div className="card"><div className="card-h"><b>Need the full log?</b><Link className="link" to="/history">Open History →</Link></div></div>
    </section>
  );
}
