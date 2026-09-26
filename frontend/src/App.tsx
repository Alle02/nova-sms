import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { Layout } from './layout';
import { Login } from './pages/Login';
import { AdminLogin } from './pages/AdminLogin';
import { Dashboard } from './pages/Dashboard';
import { Sending } from './pages/Sending';
import { Contacts } from './pages/Contacts';
import { History, Reports } from './pages/History';
import { Senders, Templates } from './pages/Senders';
import { Blacklist, Developers, Support, Users } from './pages/Manage';
import { Billing, Pricing, Profile } from './pages/Account';
import type { JSX } from 'react';

function Guard({ children, admin }: { children: JSX.Element; admin?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="canvas"><div className="card"><div className="sk">&nbsp;</div></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin' && user.role !== 'super_admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route element={<Guard><Layout /></Guard>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sending" element={<Sending />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/history" element={<History />} />
            <Route path="/senders" element={<Senders />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/blacklist" element={<Blacklist />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/support" element={<Support />} />
            <Route path="/users" element={<Guard admin><Users /></Guard>} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
