import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Auth, clearToken, getToken, setToken, type User } from './api';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try {
      const me = await Auth.me();
      setUser(me);
      localStorage.setItem('nova:user', JSON.stringify(me));
    } catch {
      const cached = localStorage.getItem('nova:user');
      setUser(cached ? (JSON.parse(cached) as User) : null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const login = async (email: string, password: string, role: string) => {
    const j = await Auth.login(email, password, role);
    setToken(j.token);
    setUser(j.user);
    localStorage.setItem('nova:user', JSON.stringify(j.user));
  };

  const logout = () => {
    Auth.logout().catch(() => ({}));
    clearToken();
    setUser(null);
    location.href = '/login';
  };

  return <Ctx.Provider value={{ user, loading, login, logout, refresh }}>{children}</Ctx.Provider>;
}
