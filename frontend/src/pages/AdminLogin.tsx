import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export function AdminLogin() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  async function go() {
    setErr('');
    try {
      await login(email, pass, 'admin');
      nav('/');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    }
  }

  return (
    <div className="auth-page admin">
      <div className="wrap">
        <div className="hero"><div className="mark">◉</div><span className="badge">RESTRICTED · STAFF ONLY</span><h1>Admin console</h1>
          <p>Manage users, approve sender IDs, top up balances and watch the whole platform.</p>
          <ul><li>User directory + balances</li><li>Sender ID approvals</li><li>Tickets + reports oversight</li></ul></div>
        <div className="form"><h2>Admin sign in</h2><p className="mut">Staff accounts only.</p>
          <div className="tabs"><Link to="/login">Customer</Link><span className="on">Admin</span></div>
          <label>Work email<input id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@nova.local" autoComplete="username" /></label>
          <label>Password<input id="pass" type="password" value={pass} onChange={e => setPass(e.target.value)}
            placeholder="••••••••" autoComplete="current-password"
            onKeyDown={e => { if (e.key === 'Enter') go(); }} /></label>
          {err && <div className="err" style={{ display: 'block' }}>{err}</div>}
          <button type="button" className="btn" onClick={go}>Unlock console →</button>
          <div className="row"><Link to="/login">← Customer login</Link><span className="mut">v2.1</span></div>
          <div className="demo">Demo admin — <b>admin@nova.local</b> / <b>admin123</b><br />Super admin — <b>super@nova.local</b> / <b>super123</b></div>
        </div>
      </div>
    </div>
  );
}
