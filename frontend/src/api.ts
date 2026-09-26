// Typed client for the Nova SMS FastAPI backend.

export interface User {
  id: number; name: string; email: string; phone: string;
  role: 'customer' | 'admin' | 'super_admin'; balance: number; created_at: string;
}
export interface Contact { id: number; name: string; phone: string; group_name: string; created_at: string }
export interface Group { id: number; name: string; created_at: string; count: number }
export interface Message {
  id: number; direction: 'inbound' | 'outbound'; from_phone: string; to_phone: string;
  body: string; sender: string; status: string; contact_id: number | null;
  bulk_id: string | null; error: string | null; created_at: string; updated_at: string;
}
export interface Sender { id: number; value: string; status: 'pending' | 'approved' | 'rejected'; owner: string | null; created_at: string }
export interface Template { id: number; name: string; body: string; created_at: string }
export interface SchedItem { id: number; to_phones: string; body: string; sender: string; send_at: string; status: string }
export interface Ticket { id: number; subject: string; message: string; status: string; created_at: string }
export interface ApiKey { id: number; name: string; key: string; created_at: string }
export interface BlackEntry { id: number; phone: string; reason: string; created_at: string }
export interface Stats {
  contacts: number; groups: number; outbound: number; inbound: number;
  delivered: number; failed: number; pending: number; blacklist: number;
  scheduled: number; balance: number;
}
export interface ActivityDay { day: string; outbound: number; delivered: number; inbound: number; failed: number }

const TOKEN_KEY = 'nova:token';
export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem('nova:user'); };

let redirected = false;

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const tok = getToken();
  if (tok) headers['Authorization'] = 'Bearer ' + tok;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(path, {
      method, headers, signal: ctrl.signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (r.status === 401 && !path.includes('/api/auth')) {
      if (!redirected) { redirected = true; clearToken(); location.href = '/login'; }
      throw new Error('Session expired — login again');
    }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j as { detail?: string }).detail || 'Request failed');
    return j as T;
  } finally {
    clearTimeout(timer);
  }
}

export const Auth = {
  login: (email: string, password: string, role: string) =>
    api<{ token: string; user: User }>('POST', '/api/auth/login', { email, password, role }),
  register: (name: string, email: string, password: string, phone: string) =>
    api<{ token: string; user: User }>('POST', '/api/auth/register', { name, email, password, phone }),
  me: () => api<User>('GET', '/api/auth/me'),
  logout: () => api('POST', '/api/auth/logout').catch(() => ({})),
  updateProfile: (p: { name: string; email: string; phone: string }) =>
    api<User>('PATCH', '/api/auth/profile', p),
  changePassword: (current: string, next: string) =>
    api<{ token: string }>('POST', '/api/auth/password', { current, new: next }),
  billing: () => api<{ plan: string; price: string; balance: number; outbound: number; delivered: number }>('GET', '/api/billing'),
};

export const Data = {
  stats: () => api<Stats>('GET', '/api/stats'),
  activity: () => api<ActivityDay[]>('GET', '/api/activity?days=7'),
  messages: (q = '', direction = '', status = '', limit = 60) =>
    api<Message[]>('GET', `/api/messages?search=${encodeURIComponent(q)}&direction=${direction}&status=${status}&limit=${limit}`),
  send: (to: string, body: string, sender: string) =>
    api<Message>('POST', '/api/send', { to, body, sender }),
  bulk: (to: string[], body: string, sender: string) =>
    api<{ bulk_id: string; total: number; accepted: number; failed: number }>('POST', '/api/bulk', { to, body, sender }),
  contacts: (q = '', group = '') =>
    api<Contact[]>('GET', `/api/contacts?q=${encodeURIComponent(q)}&group=${encodeURIComponent(group)}`),
  addContact: (name: string, phone: string, group_name: string) =>
    api<Contact>('POST', '/api/contacts', { name, phone, group_name }),
  delContact: (id: number) => api('DELETE', `/api/contacts/${id}`),
  groups: () => api<Group[]>('GET', '/api/groups'),
  addGroup: (name: string) => api<Group>('POST', '/api/groups', { name }),
  delGroup: (id: number) => api('DELETE', `/api/groups/${id}`),
  importContacts: (file: File, group_name: string) => {
    const fd = new FormData();
    fd.append('file', file); fd.append('group_name', group_name);
    const tok = getToken();
    return fetch('/api/contacts/import', {
      method: 'POST',
      headers: tok ? { Authorization: 'Bearer ' + tok } : {},
      body: fd,
    }).then(async r => {
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j as { detail?: string }).detail || 'Import failed');
      return j as { group: string; imported: number; skipped: number; errors: string[] };
    });
  },
  senders: () => api<Sender[]>('GET', '/api/senders'),
  addSender: (value: string) => api<Sender>('POST', '/api/senders', { value }),
  approveSender: (id: number) => api<Sender>('POST', `/api/senders/${id}/approve`),
  rejectSender: (id: number) => api<Sender>('POST', `/api/senders/${id}/reject`),
  delSender: (id: number) => api('DELETE', `/api/senders/${id}`),
  templates: () => api<Template[]>('GET', '/api/templates'),
  addTemplate: (name: string, body: string) => api<Template>('POST', '/api/templates', { name, body }),
  delTemplate: (id: number) => api('DELETE', `/api/templates/${id}`),
  scheduled: () => api<SchedItem[]>('GET', '/api/scheduled'),
  schedule: (to: string[], body: string, sender: string, send_at: string) =>
    api<SchedItem>('POST', '/api/scheduled', { to, body, sender, send_at }),
  delScheduled: (id: number) => api('DELETE', `/api/scheduled/${id}`),
  blacklist: () => api<BlackEntry[]>('GET', '/api/blacklist'),
  addBlack: (phone: string, reason: string) => api<BlackEntry>('POST', '/api/blacklist', { phone, reason }),
  delBlack: (id: number) => api('DELETE', `/api/blacklist/${id}`),
  keys: () => api<ApiKey[]>('GET', '/api/keys'),
  addKey: (name: string) => api<ApiKey>('POST', '/api/keys', { name }),
  delKey: (id: number) => api('DELETE', `/api/keys/${id}`),
  tickets: () => api<Ticket[]>('GET', '/api/tickets'),
  addTicket: (subject: string, message: string) => api<Ticket>('POST', '/api/tickets', { subject, message }),
  topup: (amount: number) => api<{ balance: number }>('POST', '/api/topup', { amount }),
};

export const Admin = {
  overview: () => api<{
    users: number; customers: number; contacts: number; groups: number;
    outbound: number; inbound: number; delivered: number; failed: number;
    pending_senders: number; open_tickets: number; blocked: number;
    recent_users: User[]; pending_sender_list: Sender[];
  }>('GET', '/api/admin/overview'),
  users: () => api<User[]>('GET', '/api/admin/users'),
  updateUser: (id: number, p: { role?: string; balance?: number }) =>
    api<User>('PATCH', `/api/admin/users/${id}`, p),
  topupUser: (id: number, amount: number) =>
    api<{ balance: number }>('POST', `/api/admin/users/${id}/topup`, { amount }),
  delUser: (id: number) => api('DELETE', `/api/admin/users/${id}`),
};
