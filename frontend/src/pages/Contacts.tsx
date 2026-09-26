import { useEffect, useState } from 'react';
import { Data, type Contact, type Group } from '../api';
import { Modal, toast, useDebounced } from '../components';

const initials = (n: string) =>
  (n || '?').trim().split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();

export function Contacts() {
  const [q, setQ] = useState('');
  const [g, setG] = useState('');
  const dq = useDebounced(q);
  const [cs, setCs] = useState<Contact[]>([]);
  const [gs, setGs] = useState<Group[]>([]);
  const [gName, setGName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [impGroup, setImpGroup] = useState('General');
  const [impOut, setImpOut] = useState('');
  const [fileName, setFileName] = useState('choose file…');

  const load = async () => {
    try {
      const [c, gr] = await Promise.all([
        Data.contacts(dq, g),
        Data.groups(),
      ]);
      setCs(c); setGs(gr);
      if (!gr.find(x => x.name === impGroup) && gr[0]) setImpGroup(gr[0].name);
    } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
  };
  useEffect(() => { load(); }, [dq, g]);

  return (
    <section>
      <div className="page-head"><div><p className="eyebrow">Manage</p><h2>Contacts</h2>
        <p className="sub">Groups first, then people — import Excel anytime.</p></div>
        <div className="frow">
          <label className="btn soft file-btn" style={{ margin: 0 }}>⬆ Import
            <input type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0];
                setFileName(f ? f.name : 'choose file…');
                if (f) upload(f);
              }} /></label>
          <button type="button" className="btn primary" onClick={() => setShowNew(true)}>+ New contact</button>
        </div></div>
      <div className="aud-stats">
        <div className="kpi"><span>Total contacts</span><b>{cs.length}</b><small>across groups</small></div>
        <div className="kpi"><span>Groups</span><b>{gs.length}</b><small>segments</small></div>
        <div className="kpi ghost"><span>Tip</span><b style={{ fontSize: 15 }}>1 → 2 → 3</b><small>group · add · import</small></div>
      </div>
      <div className="aud-grid">
        <aside className="card grp-panel"><div className="card-h"><b>Groups</b><span className="chip">step 1</span></div>
          <div className="frow"><input className="w" value={gName} onChange={e => setGName(e.target.value)}
            placeholder="New group…" maxLength={60} />
            <button type="button" className="btn dark sm" onClick={async () => {
              if (!gName.trim()) return toast('Type a group name', 'err');
              try { await Data.addGroup(gName.trim()); setGName(''); load(); toast('Group created — now add contacts to it', 'ok'); }
              catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
            }}>Create</button></div>
          <div className="grp-list">
            <div className={'grp-item' + (!g ? ' on' : '')} onClick={() => setG('')}>
              <span className="grp-dot" /><b>All contacts</b></div>
            {gs.map(x => (
              <div key={x.id} className={'grp-item' + (g === x.name ? ' on' : '')} onClick={() => setG(x.name)}>
                <span className="grp-dot" /><b>{x.name}</b><span className="count">{x.count}</span>
                {x.name !== 'General' && (
                  <button type="button" className="x" title="delete group" onClick={async e => {
                    e.stopPropagation();
                    if (!confirm(`Delete group '${x.name}'?`)) return;
                    try { await Data.delGroup(x.id); if (g === x.name) setG(''); load(); toast('Group deleted', 'ok'); }
                    catch (err) { toast(err instanceof Error ? err.message : 'Failed', 'err'); }
                  }}>×</button>)}
              </div>))}
          </div></aside>
        <div className="card contacts-panel"><div className="card-h"><b>People</b><span className="chip">step 2</span></div>
          <div className="toolbar"><input className="w" value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search name or number…" autoComplete="off" />
            <select value={g} onChange={e => setG(e.target.value)} aria-label="Segment">
              <option value="">All groups</option>
              {gs.map(x => <option key={x.id}>{x.name}</option>)}
            </select></div>
          <div className="contact-list">
            {!cs.length ? (
              <div className="empty"><b>No contacts yet</b>
                <p className="mut">Create a group, then add your first person — or import Excel below.</p>
                <button type="button" className="btn primary sm" onClick={() => setShowNew(true)}>+ New contact</button></div>
            ) : cs.slice(0, 200).map(c => (
              <div key={c.id} className="contact-row">
                <div className="avatar">{initials(c.name)}</div>
                <div className="cmeta"><b>{c.name}</b><small>{c.phone}</small></div>
                <span className="chip">{c.group_name || 'General'}</span>
                <div className="cact">
                  <Trash onDel={async () => {
                    try { await Data.delContact(c.id); load(); }
                    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
                  }} name={c.name} />
                </div>
              </div>))}
          </div></div>
      </div>
      <div className="card drop-card"><div className="card-h"><b>Import Excel / CSV</b><span className="chip">step 3 · .xlsx · .csv</span></div>
        <p className="mut">Needs <code>name</code> + <code>phone</code> columns. Imports land in the group you pick — it must already exist.</p>
        <div className="frow">
          <select className="w" value={impGroup} onChange={e => setImpGroup(e.target.value)} aria-label="Import group">
            {gs.map(x => <option key={x.id}>{x.name}</option>)}
          </select>
          <label className="file drop">📎 <span>{fileName}</span>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={e => {
              const f = e.target.files?.[0];
              setFileName(f ? f.name : 'choose file…');
              if (f) upload(f);
            }} /></label>
        </div>
        {impOut && <pre className="dump">{impOut}</pre>}</div>
      {showNew && <NewContact groups={gs.map(x => x.name)} onClose={() => setShowNew(false)} onSaved={load} />}
    </section>
  );

  async function upload(f: File) {
    try {
      const j = await Data.importContacts(f, impGroup || 'General');
      setImpOut(`${j.imported} imported → ${j.group} · ${j.skipped} skipped${j.errors?.length ? '\n' + j.errors.join('\n') : ''}`);
      toast(`${j.imported} imported`, 'ok');
      load();
    } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
  }
}

export function Trash({ onDel, name }: { onDel: () => void; name: string }) {
  return (
    <button type="button" className="iconbtn sm danger" title="Delete contact" aria-label={'Delete ' + name} onClick={onDel}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
    </button>
  );
}

function NewContact({ groups, onClose, onSaved }: { groups: string[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState('General');
  return (
    <Modal title="New contact" onClose={onClose}>
      <p className="mut">Group must exist first — create it in Step 1.</p>
      <label>Name<input value={name} onChange={e => setName(e.target.value)} autoComplete="off" /></label>
      <label>Phone<input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" /></label>
      <label>Segment<select value={group} onChange={e => setGroup(e.target.value)}>
        {groups.map(x => <option key={x}>{x}</option>)}
      </select></label>
      <div className="frow"><button type="button" className="btn primary" onClick={async () => {
        try {
          await Data.addContact(name, phone, group);
          onClose(); onSaved(); toast('Saved', 'ok');
        } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
      }}>Save</button>
        <button type="button" className="btn soft" onClick={onClose}>Close</button></div>
    </Modal>
  );
}
