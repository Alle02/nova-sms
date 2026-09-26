# AGENTS.md — operating guide for AI coding agents on Nova SMS Studio

Read this before touching the repo. Companion: `README.md` (product docs).

## Environment facts (do not assume otherwise)

- **OS:** Windows, PowerShell. No `&&`, `||`, `head`, `which`. Use `;` to chain.
- **No `sleep` polling loops** for background servers; start server, wait once
  with `Start-Sleep`, then verify via HTTP.
- **Never guess tool/command names** — verify with the shell first.
- Temp scripts go in `C:\Users\ankra\AppData\Local\Temp\opencode` (pre-approved),
  never in the repo. Never commit `sms.db`, `__pycache__`, `*.log` (gitignored).
- `python -c` breaks on Windows paths with backslashes and on non-ASCII output
  (cp1252). Prefer writing small `.py` files for non-trivial checks.

## Run / verify loop

```powershell
python -m uvicorn app:app --port 8000   # run in background for servers
python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=8).read().decode())"
npm run build --prefix frontend          # typecheck + rebuild SPA into static/
```

- Port busy? `netstat -ano | Select-String "8000"` → `Stop-Process -Id <pid>`.
- Browser tests: `pip install -r requirements-dev.txt`, then Playwright with
  **system Chrome**: `p.chromium.launch(channel="chrome", headless=True)`
  (no browser download needed). Seeds: login via `/login` with demo accounts
  from `README.md`. Put ad-hoc scripts in the Temp dir, not the repo.
- API checks: `urllib` + `json`, Bearer tokens from `/api/auth/login`.
  Status expectations: wrong role → 403, bad token → 401, unknown id → 404.

## Role model (backend `app.py`)

`customer` < `admin` < `super_admin`. Helpers: `current_user` (optional),
`require_user`, `require_admin` (admin+super), `require_super`.

Key rules enforced server-side (mirror them in UI, never rely on UI alone):
- Sender approve/reject/delete-approved → admin+. Customers request only,
  see own + approved, delete own pending only.
- `/api/send|bulk|scheduled` require login AND an **approved** sender ID.
- Contacts require an existing group (`POST /api/groups` first).
- Users page + `/api/admin/*`: admin+. Role change + user delete: super only,
  no self role-change/delete. Admin login accepts admin/super_admin roles.

## Frontend conventions (`frontend/src/`)

- React + TypeScript (Vite, react-router). Routes in `App.tsx` with `Guard`
  (auth) and `Guard admin` (Users page). Never rely on UI gating alone.
- `api.ts` is the single typed client; `api()` auto-attaches the token and
  redirects to `/login` exactly once on 401.
- Styling: `index.css` holds the blue/white theme + breakpoints
  (1200/1050/760/560/420). Shared bits in `components.tsx` (Modal, Status,
  Select, Chunked lists, Toasts), charts in `charts.tsx`, calendar in
  `calendar.tsx`, shell in `layout.tsx`.
- Workflow: edit source → `npm run build` (runs `tsc -b`, fails on type
  errors) → Vite regenerates `../static` (hashed assets = automatic cache
  busting) → verify served app → commit `frontend/` + `static/`.
- Backend serves the SPA (`/`, `/login`, `/admin`, `/{path}` fallback);
  keep those routes in `app.py` in sync with the router.

## Backend conventions

- SQLite via `database.py` (`get_conn` sets WAL). Schema changes need a
  migration in `init_db()` for the existing local `sms.db`, not just `SCHEMA`.
- Seed accounts/senders/templates live in `init_db()` — keep them working for
  fresh clones (a fresh `sms.db` must boot to a usable demo).
- Passwords: `auth.py` PBKDF2 only. Tokens: 7-day `sessions` rows.
- GZip middleware on; `/api/stats` has a 2s cache invalidated on writes
  (`_stats_cache["t"] = 0`).
- Keep API responses JSON-serializable dicts via `db.row_to_dict`.
