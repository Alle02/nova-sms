import { useEffect, useState } from 'react';
import { Auth, Data } from '../api';
import { useAuth } from '../auth';
import { toast } from '../components';

export function Profile() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  useEffect(() => {
    setName(user?.name || ''); setEmail(user?.email || ''); setPhone(user?.phone || '');
  }, [user]);

  return (
    <section>
      <div className="page-head"><div><p className="eyebrow">Account</p><h2>Profile</h2>
        <p className="sub">Update your details and password.</p></div></div>
      <div className="cols">
        <div className="card grow"><div className="card-h"><b>Details</b></div>
          <label>Full name<input value={name} onChange={e => setName(e.target.value)} autoComplete="off" /></label>
          <label>Email<input value={email} onChange={e => setEmail(e.target.value)} inputMode="email" autoComplete="off" /></label>
          <label>Phone<input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" autoComplete="off" /></label>
          <button type="button" className="btn primary wide" onClick={async () => {
            try {
              await Auth.updateProfile({ name, email, phone });
              refresh(); toast('Profile saved', 'ok');
            } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
          }}>Save changes</button></div>
        <div className="card grow"><div className="card-h"><b>Password</b></div>
          <label>Current password<input type="password" value={cur} onChange={e => setCur(e.target.value)} autoComplete="current-password" /></label>
          <label>New password (6+ chars)<input type="password" value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" /></label>
          <button type="button" className="btn dark wide" onClick={async () => {
            try {
              const j = await Auth.changePassword(cur, next);
              localStorage.setItem('nova:token', j.token);
              setCur(''); setNext(''); toast('Password updated', 'ok');
            } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
          }}>Update password</button>
          <p className="mut">Changing password signs out other sessions.</p></div>
      </div>
    </section>
  );
}

export function Billing() {
  const [b, setB] = useState<{ plan: string; price: string; balance: number; outbound: number; delivered: number } | null>(null);
  useEffect(() => { Auth.billing().then(setB).catch(e => toast(e.message, 'err')); }, []);
  return (
    <section>
      <div className="page-head"><div><p className="eyebrow">Account</p><h2>Billing</h2>
        <p className="sub">Plan, balance and usage at a glance.</p></div>
        <div><TopupButton label="Top up" primary /></div></div>
      <div className="cols">
        <div className="card grow"><div className="card-h"><b>Current plan</b>
          <span className="chip">{b ? `${b.plan} · ${b.price}` : '…'}</span></div>
          <div className="kv">
            <div><span>Balance</span><b>{b?.balance ?? '–'}</b></div>
            <div><span>Sent</span><b>{b?.outbound ?? '–'}</b></div>
            <div><span>Delivered</span><b>{b?.delivered ?? '–'}</b></div>
          </div></div>
        <div className="card side"><b>Top up</b>
          <p className="mut">Credits are spent per message segment. Mock billing — no real charge.</p>
          <TopupButton label="Add credits" primary wide /></div>
      </div>
    </section>
  );
}

export function TopupButton({ label, primary, wide }: { label: string; primary?: boolean; wide?: boolean }) {
  const [open, setOpen] = useState(false);
  const [amt, setAmt] = useState(100);
  if (!open) {
    return <button type="button" className={'btn ' + (primary ? 'primary' : 'soft') + (wide ? ' wide' : '')} onClick={() => setOpen(true)}>{label}</button>;
  }
  return (
    <div className="frow">
      {[50, 150, 500].map(a => (
        <button key={a} type="button" className="btn soft sm" onClick={() => topup(a)}>+{a}</button>))}
      <input type="number" value={amt} min={1} onChange={e => setAmt(Number(e.target.value))} style={{ maxWidth: 110 }} aria-label="Amount" />
      <button type="button" className="btn primary sm" onClick={() => topup(amt || 100)}>Confirm</button>
      <button type="button" className="btn soft sm" onClick={() => setOpen(false)}>✕</button>
    </div>
  );

  async function topup(a: number) {
    try {
      const j = await Data.topup(a);
      setOpen(false);
      toast('Balance ' + j.balance, 'ok');
      location.reload();
    } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
  }
}

export function Pricing() {
  return (
    <section>
      <div className="page-head"><div><p className="eyebrow">Account</p><h2>Pricing</h2>
        <p className="sub">Start free, scale when you do.</p></div></div>
      <div className="cols">
        <div className="card grow"><div className="card-h"><b>Free</b><span className="chip">current</span></div>
          <h2 style={{ margin: 0 }}>GH₵0</h2><p className="mut">Never expires.</p>
          <ul className="tips"><li>150 starter credits</li><li>Single + bulk sends</li><li>1 sender ID</li></ul></div>
        <div className="card grow"><div className="card-h"><b>Starter</b><span className="chip">popular</span></div>
          <h2 style={{ margin: 0 }}>GH₵49<small className="mut">/mo</small></h2><p className="mut">For growing senders.</p>
          <ul className="tips"><li>5,000 credits / month</li><li>3 sender IDs</li><li>Priority delivery</li></ul>
          <button type="button" className="btn primary wide" onClick={() => toast('Starter is mock-only for now')}>Choose Starter</button></div>
        <div className="card grow"><div className="card-h"><b>Business</b></div>
          <h2 style={{ margin: 0 }}>GH₵149<small className="mut">/mo</small></h2><p className="mut">For teams & resellers.</p>
          <ul className="tips"><li>20,000 credits / month</li><li>Unlimited senders</li><li>Sub-accounts + support</li></ul>
          <button type="button" className="btn dark wide" onClick={() => toast('Business is mock-only for now')}>Choose Business</button></div>
      </div>
    </section>
  );
}
