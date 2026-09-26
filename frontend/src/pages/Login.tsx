import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth, setToken } from '../api';
import { useAuth } from '../auth';

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [reg, setReg] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div className="auth-page">
      <div className="wrap">
        <div className="hero"><div className="mark">◉</div><h1>Customer studio</h1>
          <p>Send singles, launch bulk SMS and track delivery — from any device.</p>
          <ul><li>Single + bulk composer</li><li>Live queued → sent → delivered</li><li>Inbox threads + flows</li></ul></div>
        <div className="form"><h2>Welcome back</h2><p className="mut">Log in to your customer workspace.</p>
          <div className="tabs"><span className="on">Customer</span><Link to="/admin">Admin</Link></div>
          {reg && (<><label>Full name<input value={name} onChange={e => setName(e.target.value)} placeholder="Allen Ankrah" /></label>
          <label>Phone<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+233…" /></label></>)}
          <label>Email<input id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
          <label>Password<input id="pass" type="password" value={pass} onChange={e => setPass(e.target.value)}
            placeholder="••••••••" autoComplete="current-password"
            onKeyDown={e => { if (e.key === 'Enter') go(); }} /></label>
          {err && <div className="err" style={{ display: 'block' }}>{err}</div>}
          <button type="button" className="btn p" id="goBtn" onClick={go}>{reg ? 'Create account →' : 'Log in →'}</button>
          <button type="button" className="btn g" onClick={() => setReg(r => !r)}>{reg ? 'Back to login' : 'New here? Create account'}</button>
          <div className="row"><Link to="/admin">Admin login →</Link><span className="mut">v2.1</span></div>
          <div className="demo">Demo customer — <b>customer@nova.local</b> / <b>customer123</b></div>
        </div>
      </div>
    </div>
  );

  async function go() {
    setErr('');
    try {
      if (reg) {
        const j = await Auth.register(name || 'Customer', email, pass, phone);
        setToken(j.token);
        await login(email, pass, 'customer');
        nav('/');
      } else {
        await login(email, pass, 'customer');
        nav('/');
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    }
  }
}
