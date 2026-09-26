import { useEffect, useState } from 'react';
import { Data, type Sender } from '../api';
import { Chunked, Status, toast } from '../components';
import { useAuth } from '../auth';

export function Senders() {
  const { user } = useAuth();
  const admin = user?.role === 'admin' || user?.role === 'super_admin';
  const [name, setName] = useState('');
  const [rows, setRows] = useState<Sender[]>([]);

  const load = () => Data.senders().then(setRows).catch(e => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);

  return (
    <section>
      <div className="page-head"><div><p className="eyebrow">Sending</p><h2>Sender ID</h2>
        <p className="sub">Request branded sender names — admin approves.</p></div></div>
      <div className="cols">
        <div className="card grow">
          <div className="card-h"><b>Request sender</b><span className="chip">approval by admin only</span></div>
          <div className="frow"><input className="w" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. NOVAPAY" maxLength={11} />
            <button type="button" className="btn primary sm" onClick={async () => {
              try { await Data.addSender(name); setName(''); load(); toast('Requested — an admin must approve', 'ok'); }
              catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
            }}>Request</button></div>
          <div className="tscroll"><table><thead><tr><th>Sender</th><th>Owner</th><th>Status</th><th /></tr></thead>
            <tbody><Chunked rows={rows} render={s => (
              <tr key={s.id}><td><b>{s.value}</b></td><td>{s.owner || '—'}</td>
                <td><Status value={s.status} /></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {admin ? (s.status === 'pending' ? (<>
                    <button type="button" className="link" onClick={() => act(Data.approveSender(s.id), 'Approved')}>approve</button>
                    <button type="button" className="link" onClick={() => act(Data.rejectSender(s.id), 'Rejected')}>reject</button>
                  </>) : (
                    <button type="button" className="link" onClick={() => act(Data.delSender(s.id), 'Deleted')}>del</button>
                  )) : (s.status !== 'approved' ? <small className="mut">awaiting admin</small> : null)}
                </td></tr>)} /></tbody></table></div>
        </div>
        <div className="card side"><b>Rules</b>
          <p className="mut">3–11 chars. Customers can request and use approved senders — <b>only admins approve or reject</b>. Approved senders can only be removed by an admin.</p></div>
      </div>
    </section>
  );

  async function act(p: Promise<unknown>, msg: string) {
    try { await p; load(); toast(msg, 'ok'); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
  }
}

export function Templates() {
  const [rows, setRows] = useState<{ id: number; name: string; body: string }[]>([]);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const load = () => Data.templates().then(setRows).catch(e => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);

  return (
    <section>
      <div className="page-head"><div><p className="eyebrow">Sending</p><h2>SMS Template</h2>
        <p className="sub">Save reusable copy, one click to load into Compose.</p></div></div>
      <div className="cols">
        <div className="card grow">
          <div className="card-h"><b>New template</b></div>
          <label>Name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Promo" /></label>
          <label>Body<textarea rows={3} maxLength={1600} value={body} onChange={e => setBody(e.target.value)} placeholder="Hello {{name}}…" /></label>
          <button type="button" className="btn dark wide" onClick={async () => {
            try { await Data.addTemplate(name, body); setName(''); setBody(''); load(); toast('Saved', 'ok'); }
            catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
          }}>Save template</button>
        </div>
        <div className="card grow"><div className="card-h"><b>Saved</b></div>
          <div className="tscroll"><table><thead><tr><th>Name</th><th>Body</th><th /></tr></thead>
            <tbody><Chunked rows={rows} render={t => (
              <tr key={t.id}><td><b>{t.name}</b></td><td>{(t.body || '').slice(0, 80)}</td>
                <td><button type="button" className="link" onClick={async () => {
                  try { await Data.delTemplate(t.id); load(); }
                  catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
                }}>del</button></td></tr>)} /></tbody></table></div>
        </div>
      </div>
    </section>
  );
}
