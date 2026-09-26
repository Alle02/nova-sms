import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Data, type SchedItem } from '../api';
import { Chunked, Status, toast } from '../components';
import { DateTimePicker } from '../calendar';

export function Sending() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'single';
  const setTab = (t: string) => setParams({ tab: t });

  const [senders, setSenders] = useState<string[]>([]);
  useEffect(() => {
    Data.senders()
      .then(s => setSenders(s.filter(x => x.status === 'approved').map(x => x.value)))
      .catch(() => ({}));
  }, [tab]);

  return (
    <section>
      <div className="page-head"><div><p className="eyebrow">Messaging</p><h2>Compose</h2>
        <p className="sub">Single, bulk and scheduled sends — same validation as production.</p></div></div>
      <div className="seg" role="tablist">
        {([['single', 'Single'], ['campaign', 'Bulk'], ['sched', 'Scheduled']] as const).map(([t, l]) => (
          <button key={t} type="button" className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>
      <div className="cols">
        {tab === 'single' && <Single senders={senders} />}
        {tab === 'campaign' && <Bulk senders={senders} />}
        {tab === 'sched' && <Queue />}
        <div className="card side"><b>Playbook</b><ul className="tips">
          <li>Ending <code>0000</code> forces a carrier fail.</li>
          <li>Blocklisted numbers auto-reject.</li>
          <li>Status path: <code>queued → sent → delivered</code>.</li></ul></div>
      </div>
    </section>
  );
}

function SenderPick({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [opts, setOpts] = useState<string[]>([]);
  useEffect(() => {
    Data.senders()
      .then(s => {
        const ok = s.filter(x => x.status === 'approved').map(x => x.value);
        setOpts(ok);
        if (ok.length && !ok.includes(value)) onChange(ok[0]);
      })
      .catch(() => ({}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <select aria-label="Sender ID" value={value} onChange={e => onChange(e.target.value)}>
      {opts.length ? opts.map(v => <option key={v}>{v}</option>)
        : <option value="">No approved sender — request one</option>}
    </select>
  );
}

function Single({ senders }: { senders: string[] }) {
  const [sender, setSender] = useState(senders[0] || '');
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [sched, setSched] = useState(false);
  const [when, setWhen] = useState('');
  const [out, setOut] = useState('');
  useEffect(() => { if (senders.length && !senders.includes(sender)) setSender(senders[0]); }, [senders, sender]);

  async function go() {
    try {
      if (!to.trim() || !body.trim()) return toast('Add recipient + message', 'err');
      if (sched) {
        if (!when) return toast('Pick a date + time first', 'err');
        const w = fmtWhen(when);
        await Data.schedule([to.trim()], body, sender || 'NOVA', w);
        setWhen(''); toast('Single scheduled for ' + w, 'ok');
      } else {
        const j = await Data.send(to, body, sender || 'NOVA');
        setOut(`→ ${j.to_phone} · ${j.status}`);
        setBody(''); toast('Queued · ' + j.status, 'ok');
      }
    } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
  }

  return (
    <div className="card grow">
      <div className="card-h"><b>Compose single</b><span className="chip">1 credit / segment</span></div>
      <div className="f2">
        <label>Sender<SenderPick value={sender} onChange={setSender} /></label>
        <label>To<input id="sTo" value={to} onChange={e => setTo(e.target.value)} placeholder="+233 24 412 3456" inputMode="tel" autoComplete="off" /></label>
      </div>
      <label>Message<textarea id="sBody" rows={5} maxLength={1600} value={body} onChange={e => setBody(e.target.value)} placeholder="Write something worth reading…" /></label>
      <div className="foot"><span>{body.length} / 1600 · {Math.max(1, Math.ceil(body.length / 160))} seg</span><span>≈ 1 credit</span>
        <button type="button" className="btn primary" id="sGoBtn" onClick={go}>{sched ? 'Schedule ➤' : 'Send ➤'}</button></div>
      <label className="check"><input type="checkbox" id="sSched" checked={sched} onChange={e => setSched(e.target.checked)} /> Schedule for later</label>
      {sched && <DateTimePicker value={when} onChange={setWhen} />}
      {out && <pre className="dump">{out}</pre>}
    </div>
  );
}

function Bulk({ senders }: { senders: string[] }) {
  const [sender, setSender] = useState(senders[0] || '');
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [tpls, setTpls] = useState<{ id: number; name: string; body: string }[]>([]);
  const [sched, setSched] = useState(false);
  const [when, setWhen] = useState('');
  const [out, setOut] = useState('');
  const list = to.split('\n').map(s => s.trim()).filter(Boolean);
  useEffect(() => { if (senders.length && !senders.includes(sender)) setSender(senders[0]); }, [senders, sender]);
  useEffect(() => { Data.templates().then(setTpls).catch(() => ({})); }, []);

  async function go() {
    try {
      if (!list.length || !body.trim()) return toast('Add recipients + message', 'err');
      if (sched) {
        if (!when) return toast('Pick a date + time first', 'err');
        const w = fmtWhen(when);
        await Data.schedule(list, body, sender || 'NOVA', w);
        setWhen(''); toast(`Bulk scheduled for ${w} (${list.length})`, 'ok');
      } else {
        const j = await Data.bulk(list, body, sender || 'NOVA');
        setOut(`bulk ${j.bulk_id} · ${j.accepted}/${j.total} accepted`);
        toast(`Launched ${j.accepted}/${j.total}`, 'ok');
      }
    } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
  }

  return (
    <div className="card grow">
      <div className="card-h"><b>Bulk message</b><span className="chip">{list.length} recipients</span></div>
      <label>Sender<SenderPick value={sender} onChange={setSender} /></label>
      <label>Audience (one per line)<textarea id="bTo" rows={6} value={to} onChange={e => setTo(e.target.value)} placeholder="+233…" /></label>
      <label>Template<select value="" aria-label="SMS template" onChange={e => {
        const t = tpls.find(x => String(x.id) === e.target.value);
        if (t) { setBody(t.body); toast('Template loaded', 'ok'); }
      }}><option value="">No template — write custom</option>
        {tpls.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <label>Message<textarea id="bBody" rows={4} value={body} onChange={e => setBody(e.target.value)} /></label>
      <div className="foot"><span>Bulk sends fan out instantly</span>
        <button type="button" className="btn dark" id="bGoBtn" onClick={go}>{sched ? 'Schedule ▸' : 'Launch ▸'}</button></div>
      <label className="check"><input type="checkbox" id="bSched" checked={sched} onChange={e => setSched(e.target.checked)} /> Schedule for later</label>
      {sched && <DateTimePicker value={when} onChange={setWhen} />}
      {out && <pre className="dump">{out}</pre>}
    </div>
  );
}

function Queue() {
  const [rows, setRows] = useState<SchedItem[]>([]);
  const load = () => Data.scheduled().then(setRows).catch(e => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);
  return (
    <div className="card grow">
      <div className="card-h"><b>Scheduled queue</b><button type="button" className="link" onClick={load}>↻ refresh</button></div>
      <div className="tscroll"><table><thead><tr><th>Targets</th><th>When</th><th>State</th><th /></tr></thead>
        <tbody><Chunked rows={rows} render={s => (
          <tr key={s.id}><td>{(s.to_phones || '').slice(0, 44)}</td><td>{s.send_at}</td>
            <td><Status value={s.status} /></td>
            <td><button type="button" className="link" onClick={async () => {
              try { await Data.delScheduled(s.id); load(); toast('Cancelled', 'ok'); }
              catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
            }}>cancel</button></td></tr>)} /></tbody></table></div>
    </div>
  );
}

export function fmtWhen(v: string): string {
  const d = new Date(v);
  if (isNaN(+d)) return (v || '').trim();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
