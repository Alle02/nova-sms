"""SQLite helper - stdlib only."""
import sqlite3
import threading
from pathlib import Path

DB_PATH = Path(__file__).parent / "sms.db"
_lock = threading.Lock()

SCHEMA = """
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    group_name TEXT DEFAULT 'General',
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    direction TEXT NOT NULL CHECK(direction IN ('outbound','inbound')),
    from_phone TEXT NOT NULL,
    to_phone TEXT NOT NULL,
    body TEXT NOT NULL,
    sender TEXT DEFAULT 'USMS-GH',
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK(status IN ('queued','sent','delivered','failed','received','scheduled')),
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    bulk_id TEXT,
    error TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    reason TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS scheduled (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    to_phones TEXT NOT NULL,
    body TEXT NOT NULL,
    sender TEXT DEFAULT 'USMS-GH',
    send_at TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings (
    k TEXT PRIMARY KEY,
    v TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT DEFAULT '',
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','admin','super_admin')),
    balance REAL DEFAULT 150,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sender_ids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    value TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_phone);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_bulk ON messages(bulk_id);
"""

def get_conn():
    conn = sqlite3.connect(DB_PATH, timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
    except Exception:
        pass
    return conn

def init_db():
    with _lock:
        conn = get_conn()
        conn.executescript(SCHEMA)
        # migrate old contacts table (no group_name)
        try:
            cols = [r[1] for r in conn.execute("PRAGMA table_info(contacts)").fetchall()]
            if "group_name" not in cols:
                conn.execute("ALTER TABLE contacts ADD COLUMN group_name TEXT DEFAULT 'General'")
        except Exception:
            pass
        try:
            cols = [r[1] for r in conn.execute("PRAGMA table_info(messages)").fetchall()]
            if "sender" not in cols:
                conn.execute("ALTER TABLE messages ADD COLUMN sender TEXT DEFAULT 'USMS-GH'")
        except Exception:
            pass
        try:
            cols = [r[1] for r in conn.execute("PRAGMA table_info(sender_ids)").fetchall()]
            if "user_id" not in cols:
                conn.execute("ALTER TABLE sender_ids ADD COLUMN user_id INTEGER REFERENCES users(id)")
        except Exception:
            pass
        # migrate users.role to include super_admin on older DBs
        try:
            sql = (conn.execute("SELECT sql FROM sqlite_master WHERE name='users'").fetchone() or [""])[0]
            if "super_admin" not in sql:
                conn.execute("""CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE, phone TEXT DEFAULT '',
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','admin','super_admin')),
                    balance REAL DEFAULT 150, created_at TEXT DEFAULT (datetime('now')))""")
                conn.execute("""INSERT INTO users_new (id,name,email,phone,password_hash,role,balance,created_at)
                                SELECT id,name,email,phone,password_hash,role,balance,created_at FROM users""")
                conn.execute("DROP TABLE users")
                conn.execute("ALTER TABLE users_new RENAME TO users")
        except Exception:
            pass
        if not conn.execute("SELECT 1 FROM groups WHERE name='General'").fetchone():
            conn.execute("INSERT INTO groups (name) VALUES ('General')")
        try:
            for r in conn.execute("SELECT DISTINCT group_name FROM contacts").fetchall():
                g = (r["group_name"] or "").strip() or "General"
                conn.execute("INSERT OR IGNORE INTO groups (name) VALUES (?)", (g,))
        except Exception:
            pass
        if not conn.execute("SELECT 1 FROM settings WHERE k='balance'").fetchone():
            conn.execute("INSERT INTO settings (k,v) VALUES ('balance','150')")
        # seed sender + template + demo accounts (import here to avoid cycle)
        try:
            import auth as _auth
            if not conn.execute("SELECT 1 FROM sender_ids WHERE value='NOVA'").fetchone():
                conn.execute("INSERT INTO sender_ids (value,status) VALUES ('NOVA','approved')")
            if not conn.execute("SELECT 1 FROM templates").fetchone():
                conn.execute("INSERT INTO templates (name,body) VALUES (?,?)",
                             ("Welcome", "Hello {{name}}, welcome to Nova SMS!"))
            if not conn.execute("SELECT 1 FROM users WHERE email='admin@nova.local'").fetchone():
                conn.execute("INSERT INTO users (name,email,password_hash,role,balance) VALUES (?,?,?,?,?)",
                             ("Admin", "admin@nova.local", _auth.hash_password("admin123"), "admin", 1000))
            if not conn.execute("SELECT 1 FROM users WHERE email='super@nova.local'").fetchone():
                conn.execute("INSERT INTO users (name,email,password_hash,role,balance) VALUES (?,?,?,?,?)",
                             ("Super Admin", "super@nova.local", _auth.hash_password("super123"), "super_admin", 5000))
            if not conn.execute("SELECT 1 FROM users WHERE email='customer@nova.local'").fetchone():
                conn.execute("INSERT INTO users (name,email,password_hash,role,balance) VALUES (?,?,?,?,?)",
                             ("Allen Ankrah", "customer@nova.local", _auth.hash_password("customer123"), "customer", 150))
        except Exception:
            pass
        conn.commit()
        conn.close()

def row_to_dict(row):
    return dict(row) if row else None

def get_setting(k, default=""):
    conn = get_conn()
    r = conn.execute("SELECT v FROM settings WHERE k=?", (k,)).fetchone()
    conn.close()
    return r["v"] if r else default

def set_setting(k, v):
    conn = get_conn()
    conn.execute("INSERT INTO settings (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v", (k, v))
    conn.commit()
    conn.close()
