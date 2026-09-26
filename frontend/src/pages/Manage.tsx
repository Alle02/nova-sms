import { useEffect, useState } from 'react';
import { Admin, Data, type BlackEntry } from '../api';
import { useAuth } from '../auth';
import { Chunked, Select, toast } from '../components';

export function Blacklist() {
  const [rows, setRows] = useState<BlackEntry[]>([]);
  const [phone, setPhone] = useState('');
  const [why, setWhy] = useState('');
  const load = () => Data.blacklist().then(setRows).catch(e => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);

  return (
    <section>
      <div className="page-head"><div><p className="eyebrow">Manage</p><h2>Blacklist</h2>
        <p className="sub">STOPs and complainers — sends fail closed, no credits burned.</p></div></div>
      <div className="cols">
        <div className="card grow"><div className="card-h"><b>Blocked numbers</b></div>
          <div className="frow"><input className="w" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+233…" inputMode="tel" />
            <input className="w" value={why} onChange={e => setWhy(e.target.value)} placeholder="reason" />
            <button type="button" className="btn dark sm" onClick={async () => {
              try { await Data.addBlack(phone, why); setPhone(''); setWhy(''); load(); toast('Blocked', 'ok'); }
              catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
            }}>Block</button></div>
          <div className="tscroll"><table><thead><tr><th>Number</th><th>Why</th><th /></tr></thead>
            <tbody><Chunked rows={rows} render={b => (
              <tr key={b.id}><td>{b.phone}</td><td>{b.reason || ''}</td>
                <td><button type="button" className="link" onClick={async () => {
                  try { await Data.delBlack(b.id); load(); } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
                }}>unblock</button></td></tr>)} /></tbody></table></div>
        </div>
        <div className="card side"><b>Policy</b>
          <p className="mut">Numbers here can never receive bulk messages. Unblock anytime.</p></div>
      </div>
    </section>
  );
}

export function Developers() {
  const [rows, setRows] = useState<{ id: number; name: string; key: string }[]>([]);
  const [name, setName] = useState('');
  const load = () => Data.keys().then(setRows).catch(e => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);

  return (
    <section>
      <div className="page-head"><div><p className="eyebrow">Manage</p><h2>Developers</h2>
        <p className="sub">Tokens plus the calls you need.</p></div></div>
      <div className="cols">
        <div className="card grow"><div className="card-h"><b>API tokens</b></div>
          <div className="frow"><input className="w" value={name} onChange={e => setName(e.target.value)} placeholder="token label" />
            <button type="button" className="btn primary sm" onClick={async () => {
              try { await Data.addKey(name || 'default'); setName(''); load(); }
              catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
            }}>Mint</button></div>
          <div className="tscroll"><table><thead><tr><th>Label</th><th>Token</th><th /></tr></thead>
            <tbody><Chunked rows={rows} render={k => (
              <tr key={k.id}><td>{k.name}</td><td><small>{k.key}</small></td>
                <td><button type="button" className="link" onClick={async () => {
                  try { await Data.delKey(k.id); load(); } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
                }}>revoke</button></td></tr>)} /></tbody></table></div>
        </div>
        <div className="card side"><b>Call it</b><pre className="dump">{`POST /api/send
{"to":"+233…","body":"hi"}

POST /api/inbound
{"from":"+233…","body":"STOP"}

GET /api/export.csv · docs /docs`}</pre></div>
      </div>
    </section>
  );
}

export function Support() {
  const [rows, setRows] = useState<{ id: number; subject: string; status: string }[]>([]);
  const [sub, setSub] = useState('');
  const [msg, setMsg] = useState('');
  const load = () => Data.tickets().then(setRows).catch(e => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);

  return (
    <section>
      <div className="page-head"><div><p className="eyebrow">Manage</p><h2>Support</h2>
        <p className="sub">Tickets are tracked locally — we reply fast.</p></div></div>
      <div className="cols">
        <div className="card grow"><div className="card-h"><b>Care desk</b></div>
          <label>Subject<input value={sub} onChange={e => setSub(e.target.value)} placeholder="e.g. Delivery delays" /></label>
          <label>Details<textarea rows={4} value={msg} onChange={e => setMsg(e.target.value)} /></label>
          <button type="button" className="btn primary wide" onClick={async () => {
            try { await Data.addTicket(sub, msg); setSub(''); setMsg(''); load(); toast('Ticket opened', 'ok'); }
            catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
          }}>Open ticket</button></div>
        <div className="card grow"><div className="card-h"><b>Tickets</b></div>
          <div className="tscroll"><table><thead><tr><th>#</th><th>Subject</th><th>State</th></tr></thead>
            <tbody><Chunked rows={rows} render={t => (
              <tr key={t.id}><td>{t.id}</td><td>{t.subject}</td><td><span className="st sent">{t.status}</span></td></tr>)} /></tbody></table></div>
        </div>
      </div>
    </section>
  );
}

export function Users() {
  const { user } = useAuth();
  const isSuper = user?.role === 'super_admin';
  const [rows, setRows] = useState<{ id: number; name: string; email: string; role: string; balance: number }[]>([]);
  const [q, setQ] = useState('');
  const load = () => Admin.users().then(setRows).catch(e => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);
  const filtered = rows.filter(u => !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.includes(q));

  return (
    <section>
      <div className="page-head"><div><p className="eyebrow">Admin</p><h2>Users</h2>
        <p className="sub">Customers at a glance — super admins manage roles.</p></div></div>
      <div className="card">
        <div className="toolbar"><input className="w" value={q} onChange={e => setQ(e.target.value)} placeholder="Filter users…" /></div>
        <div className="tscroll"><table><thead><tr><th>User</th><th>Role</th><th>Balance</th><th /></tr></thead>
          <tbody><Chunked rows={filtered} render={u => (
            <tr key={u.id}><td>{u.name}<br /><small className="mut">{u.email}</small></td>
              <td>{isSuper ? (
                <Select value={u.role} ariaLabel="role" onChange={async role => {
                  try {
                    const upd = await Admin.updateUser(u.id, { role });
                    setRows(rs => rs.map(x => x.id === u.id ? upd : x));
                    toast(`${upd.name} role: ${upd.role}`, 'ok');
                  } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); load(); }
                }} options={['customer', 'admin', 'super_admin'].map(r => ({ value: r, label: r }))} />
              ) : <span className="chip">{u.role}</span>}</td>
              <td>{u.balance}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button type="button" className="link" onClick={async () => {
                  try {
                    const j = await Admin.topupUser(u.id, 100);
                    setRows(rs => rs.map(x => x.id === u.id ? { ...x, balance: j.balance } : x));
                    toast('Topped up: ' + j.balance, 'ok');
                  } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
                }}>+100</button>
                {isSuper && (
                  <button type="button" className="link" onClick={async () => {
                    if (!window.confirm(`Delete ${u.name} permanently?`)) return;
                    try { await Admin.delUser(u.id); setRows(rs => rs.filter(x => x.id !== u.id)); toast('Deleted', 'ok'); }
                    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
                  }}>del</button>)}
              </td></tr>)} /></tbody></table></div>
      </div>
    </section>
  );
}
