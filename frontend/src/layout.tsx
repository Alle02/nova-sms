import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { Toasts, toast } from './components';

const I = (paths: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: paths }} />
);
const icons = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  mega: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  id: '<rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5.5 18c.6-1.6 1.5-2.2 2.5-2.2s1.9.6 2.5 2.2"/><path d="M14 9h5M14 13h5"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  chart: '<path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 9 6 6"/>',
  code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
  buoy: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="m5.7 5.7 3 3M18.3 5.7l-3 3M5.7 18.3l3-3M18.3 18.3l-3-3"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
};

function Item({ to, icon, label, badge, match }: {
  to: string; icon: string; label: string; badge?: ReactNode; match?: (loc: { pathname: string; search: string }) => boolean;
}) {
  const loc = useLocation();
  if (match) {
    const on = match(loc);
    return (
      <NavLink to={to} title={label} className={on ? 'on' : ''}>
        <i>{I(icons[icon as keyof typeof icons])}</i><label>{label}</label>{badge}
      </NavLink>
    );
  }
  return (
    <NavLink to={to} title={label} className={({ isActive }) => (isActive ? 'on' : '')}>
      <i>{I(icons[icon as keyof typeof icons])}</i><label>{label}</label>{badge}
    </NavLink>
  );
}

function Group({ id, icon, label, to, children, active }: {
  id: string; icon: string; label: string; to: string;
  children: ReactNode; active: boolean;
}) {
  const nav = useNavigate();
  const [open, setOpen] = useState(true);
  return (
    <div className={'grp' + (open ? ' open' : '')} id={id}>
      <button type="button" className={'grp-h' + (active ? ' on' : '')} aria-expanded={open}
        onClick={() => { setOpen(true); nav(to); }}>
        <i>{I(icons[icon as keyof typeof icons])}</i><label>{label}</label>
        <em>{I(icons.chev)}</em>
      </button>
      <div className="grp-c">{children}</div>
    </div>
  );
}

const TITLES: Record<string, string> = {
  '/': 'Dashboard', '/sending': 'Sending', '/contacts': 'Contacts', '/history': 'History',
  '/senders': 'Sender ID', '/templates': 'SMS Template', '/blacklist': 'Blacklist',
  '/reports': 'Reports', '/developers': 'Developers', '/support': 'Support',
  '/users': 'Users', '/profile': 'Profile', '/billing': 'Billing', '/pricing': 'Pricing',
};

export function Layout() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const [meOpen, setMeOpen] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const h = new Date().getHours();
  const greet = (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + ' · here\'s your studio';
  const initials = (user?.name || 'U').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="shell">
      <div className="nav-veil" onClick={() => document.body.classList.remove('rail-open')} />
      <aside className="rail" aria-label="Primary">
        <div className="logo"><div className="mark">◉</div>
          <div className="brand"><b>Nova SMS</b><span>studio console</span></div>
          <button type="button" className="collapse" onClick={() => document.body.classList.toggle('rail-min')} aria-label="Collapse sidebar">⟨</button>
        </div>
        <div className="sec">Overview</div>
        <nav><Item to="/" icon="grid" label="Dashboard" /></nav>
        <div className="sec">Messaging</div>
        <nav>
          <Group id="grpSending" icon="send" label="Sending" to="/sending?tab=single" active={loc.pathname === '/sending'}>
            <Item to="/sending?tab=single" icon="msg" label="Single Message"
              match={l => l.pathname === '/sending' && new URLSearchParams(l.search).get('tab') !== 'campaign' && new URLSearchParams(l.search).get('tab') !== 'sched'} />
            <Item to="/sending?tab=campaign" icon="mega" label="Bulk Message"
              match={l => l.pathname === '/sending' && new URLSearchParams(l.search).get('tab') === 'campaign'} />
            <Item to="/senders" icon="id" label="Sender ID" />
            <Item to="/templates" icon="file" label="SMS Template" />
          </Group>
          <Item to="/contacts" icon="users" label="Contacts" />
          <Group id="grpReports" icon="chart" label="Reports" to="/reports" active={loc.pathname === '/reports'}>
            <Item to="/reports" icon="clock" label="Overview" />
            <Item to="/history" icon="list" label="History" />
          </Group>
        </nav>
        <div className="sec">Manage</div>
        <nav>
          <Item to="/blacklist" icon="shield" label="Blacklist" />
          <Item to="/developers" icon="code" label="Developers" />
          <Item to="/support" icon="buoy" label="Support" />
          {isAdmin && <Item to="/users" icon="userPlus" label="Users" badge={<span className="pill">admin</span>} />}
        </nav>
        <div className="rail-foot">v2.2 · <span>react</span></div>
      </aside>
      <div className="body">
        <header className="bar">
          <div className="title"><b id="ptitle">{TITLES[loc.pathname] || 'Studio'}</b><span>{greet}</span></div>
          <div className="bar-actions">
            <button type="button" className="iconbtn" title="Toggle theme" onClick={() => document.body.classList.toggle('dark')}>◑</button>
            <button type="button" className="iconbtn" aria-label="Notifications" onClick={() => toast('All caught up ✓')}>🔔<i /></button>
            <div className="me-wrap">
              <button type="button" className="me" aria-haspopup="menu" onClick={e => { e.stopPropagation(); setMeOpen(o => !o); }}>
                <div className="face">{initials}</div>
                <div className="me-txt"><b>{user?.name}</b><small>{user?.role} · online</small></div>
                <span className="chev">▾</span>
              </button>
              {!meOpen ? null : (
                <div className="me-menu" role="menu">
                  <NavLink to="/profile" onClick={() => setMeOpen(false)}>👤 Profile</NavLink>
                  <NavLink to="/billing" onClick={() => setMeOpen(false)}>💳 Billing</NavLink>
                  <NavLink to="/pricing" onClick={() => setMeOpen(false)}>🏷 Pricing</NavLink>
                  <hr />
                  <button type="button" onClick={logout}>⏻ Log out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="canvas"><Outlet /></main>
        <nav className="tabbar" aria-label="Mobile">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'on' : '')}>{I(icons.grid)}<small>Home</small></NavLink>
          <NavLink to="/sending?tab=single" className={({ isActive }) => (isActive ? 'on' : '')}>{I(icons.send)}<small>Send</small></NavLink>
          <NavLink to="/reports" className={({ isActive }) => (isActive ? 'on' : '')}>{I(icons.chart)}<small>Stats</small></NavLink>
          <NavLink to="/contacts" className={({ isActive }) => (isActive ? 'on' : '')}>{I(icons.users)}<small>People</small></NavLink>
          <NavLink to="/history" className={({ isActive }) => (isActive ? 'on' : '')}>{I(icons.list)}<small>Logs</small></NavLink>
          <button type="button" aria-label="More pages" onClick={() => document.body.classList.add('rail-open')}>
            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg><small>More</small>
          </button>
        </nav>
      </div>
      <Toasts />
    </div>
  );
}
