import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Admin, Data, type ActivityDay, type Message, type Stats } from '../api';
import { useAuth } from '../auth';
import { Chunked, Status, toast } from '../components';
import { Donut, Volume } from '../charts';

function useToday() {
  const d = new Date();
  return d.toDateString();
}

export function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuper = user?.role === 'super_admin';
  const h = new Date().getHours();
  const greetH = isSuper ? 'Super control room.' : isAdmin ? 'Admin control room.'
    : (h < 12 ? 'Morning flow' : h < 17 ? 'Afternoon flow' : 'Evening flow') + ", let's hit send.";

  return (
    <section>
      <div className="hero">
        <div className="hero-copy">
          <p className="eyebrow light">{useToday()}</p>
          <h1>{greetH}</h1>
          {!isAdmin && <>
            <p className="sub">Here's what's happening across your messaging today.</p>
            <CustChips />
          </>}
        </div>
        {!isAdmin && <HeroDonut />}
      </div>
      {isAdmin ? <AdminDash /> : <CustDash />}
    </section>
  );
}

function CustChips() {
  const [s, setS] = useState<Stats | null>(null);
  const [week, setWeek] = useState({ sent: 0, rate: 0 });
  useEffect(() => {
    Data.stats().then(setS).catch(() => ({}));
    Data.activity().then(a => {
      const sent = a.reduce((x, d) => x + d.outbound, 0);
      const del = a.reduce((x, d) => x + d.delivered, 0);
      setWeek({ sent, rate: sent ? Math.round((del / sent) * 100) : 0 });
    }).catch(() => ({}));
  }, []);
  return (
    <div className="hero-chips">
      <span className="hchip">Balance <b>{s?.balance ?? '–'}</b></span>
      <span className="hchip">Sent · 7d <b>{week.sent}</b></span>
      <span className="hchip">Delivered <b>{week.rate}%</b></span>
    </div>
  );
}

function HeroDonut() {
  const [vals, setVals] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [legend, setLegend] = useState('');
  const [rate, setRate] = useState('–');
  useEffect(() => {
    Data.stats().then(s => {
      setVals([s.delivered, s.failed, s.pending, s.inbound]);
      setLegend(`${s.delivered} delivered · ${s.failed} failed · ${s.pending} queued`);
      setRate(s.outbound ? Math.round((s.delivered / s.outbound) * 100) + '%' : '0%');
    }).catch(() => ({}));
  }, []);
  return (
    <div className="hero-stat"><span>Deliverability</span><b>{rate}</b>
      <div className="ring"><Donut values={vals} /></div><small>{legend}</small></div>
  );
}

function CustDash() {
  const [s, setS] = useState<Stats | null>(null);
  const [act, setAct] = useState<ActivityDay[]>([]);
  const [recent, setRecent] = useState<Message[]>([]);
  useEffect(() => {
    Data.stats().then(setS).catch(() => ({}));
    Data.activity().then(setAct).catch(() => ({}));
    Data.messages('', '', '', 14).then(setRecent).catch(() => ({}));
    const t = setInterval(() => {
      Data.stats().then(setS).catch(() => ({}));
      Data.messages('', '', '', 14).then(setRecent).catch(() => ({}));
    }, 12000);
    return () => clearInterval(t);
  }, []);
  const sum = (k: keyof ActivityDay) => act.reduce((x, d) => x + (d[k] as number), 0);
  return (<>
    <div className="kpis">
      <div className="kpi"><span>Audience</span><b>{s?.contacts ?? '–'}</b><small>contacts</small></div>
      <div className="kpi"><span>Dispatched</span><b>{s?.outbound ?? '–'}</b><small>{sum('outbound')} last 7d</small></div>
      <div className="kpi"><span>Delivered</span><b>{s?.delivered ?? '–'}</b><small className="up">{sum('delivered')} last 7d</small></div>
      <div className="kpi"><span>Needs attention</span><b>{s?.failed ?? '–'}</b><small>{sum('failed')} failed 7d</small></div>
      <div className="kpi ghost"><span>Inbox</span><b>{s?.inbound ?? '–'}</b><small>{sum('inbound')} received 7d</small></div>
      <div className="kpi ghost"><span>Queued</span><b>{s?.pending ?? '–'}</b><small>pending</small></div>
    </div>
    <div className="cols">
      <div className="card grow"><div className="card-h"><b>Volume · last 7 days</b>
        <span className="chip">{sum('outbound')} sent · {sum('delivered')} delivered</span></div>
        <Volume data={act} id="volChart" /></div>
    </div>
    <div className="cols">
      <div className="card grow"><div className="card-h"><b>Latest activity</b><Link className="link" to="/history">Open history →</Link></div>
        <div className="tscroll"><table><thead><tr><th>Route</th><th>Peer</th><th>Copy</th><th>State</th></tr></thead>
          <tbody><Chunked rows={recent} render={m => {
            const peer = m.direction === 'outbound' ? m.to_phone : m.from_phone;
            return (<tr key={m.id}><td>{m.direction === 'outbound' ? '↗ out' : '↙ in'}</td>
              <td>{peer}{m.error && <><br /><small style={{ color: '#b4234a' }}>{m.error}</small></>}</td>
              <td>{(m.body || '').slice(0, 80)}</td><td><Status value={m.status} /></td></tr>);
          }} /></tbody></table></div></div>
    </div>
  </>);
}

function AdminDash() {
  const [o, setO] = useState<Awaited<ReturnType<typeof Admin.overview>> | null>(null);
  const [act, setAct] = useState<ActivityDay[]>([]);
  useEffect(() => {
    Admin.overview().then(setO).catch(e => toast(e.message, 'err'));
    Data.activity().then(setAct).catch(() => ({}));
  }, []);
  if (!o) return <div className="card"><div className="sk">&nbsp;</div></div>;
  const rate = o.outbound ? Math.round((o.delivered / o.outbound) * 100) : 0;
  return (<>
    <div className="kpis">
      <div className="kpi"><span>Users</span><b>{o.users}</b><small>{o.customers} customers</small></div>
      <div className="kpi"><span>Messages</span><b>{o.outbound + o.inbound}</b><small>platform total</small></div>
      <div className="kpi"><span>Delivered</span><b>{o.delivered}</b><small className="up">platform</small></div>
      <div className="kpi"><span>Pending senders</span><b>{o.pending_senders}</b><small>need approval</small></div>
      <div className="kpi ghost"><span>Open tickets</span><b>{o.open_tickets}</b><small>support</small></div>
      <div className="kpi ghost"><span>Blocked</span><b>{o.blocked}</b><small>blocklist</small></div>
    </div>
    <div className="cols">
      <div className="card grow"><div className="card-h"><b>Platform volume · 7 days</b></div>
        <Volume data={act} id="aVolChart" /></div>
      <div className="card side"><div className="card-h"><b>Health</b></div>
        <div className="kv col">
          <div><span>Delivery rate</span><b>{rate}%</b></div>
          <div><span>Failed</span><b>{o.failed}</b></div>
          <div><span>Inbox</span><b>{o.inbound}</b></div>
        </div></div>
    </div>
    <div className="cols">
      <div className="card grow"><div className="card-h"><b>Sender approvals queue</b><Link className="link" to="/senders">Open Sender ID →</Link></div>
        <div className="tscroll"><table><thead><tr><th>Sender</th><th>Owner</th><th>Status</th><th /></tr></thead>
          <tbody><Chunked rows={o.pending_sender_list} render={s => (
            <tr key={s.id}><td><b>{s.value}</b></td><td>{s.owner || '—'}</td>
              <td><Status value={s.status} /></td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button type="button" className="link" onClick={() => approve(s.id)}>approve</button>
                <button type="button" className="link" onClick={() => reject(s.id)}>reject</button>
              </td></tr>)} /></tbody></table></div></div>
      <div className="card grow"><div className="card-h"><b>Newest users</b><Link className="link" to="/users">Open Users →</Link></div>
        <div className="tscroll"><table><thead><tr><th>Name</th><th>Role</th><th>Balance</th></tr></thead>
          <tbody>{o.recent_users.map(u => (
            <tr key={u.id}><td>{u.name}</td><td><span className="chip">{u.role}</span></td><td>{u.balance}</td></tr>))}</tbody></table></div></div>
    </div>
  </>);

  async function approve(id: number) {
    try { await Data.approveSender(id); toast('Approved', 'ok'); Admin.overview().then(setO).catch(() => ({})); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
  }
  async function reject(id: number) {
    try { await Data.rejectSender(id); toast('Rejected', 'ok'); Admin.overview().then(setO).catch(() => ({})); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
  }
}
