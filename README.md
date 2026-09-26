# Nova SMS Studio

Mock-gateway SMS platform: FastAPI + SQLite backend, vanilla-JS dashboard.
Contacts (group-first + Excel import), single/bulk sends with approved sender IDs,
scheduling with background dispatcher, delivery tracking, tickets, API keys,
customer / admin / super-admin roles.

Live: `http://127.0.0.1:8000` · API docs: `http://127.0.0.1:8000/docs`

## Quickstart (Windows PowerShell)

```powershell
cd C:\Users\ankra\OneDrive\Documentos\sms
pip install -r requirements.txt
python -m uvicorn app:app --port 8000
```

Open `http://127.0.0.1:8000`. You land on `/login` if not signed in.
`sqlite` file `sms.db` is auto-created + seeded on first boot.

Demo accounts (seeded):

| Role        | Email                | Password      | Login page |
|-------------|----------------------|---------------|------------|
| Customer    | customer@nova.local  | customer123   | `/login`   |
| Admin       | admin@nova.local     | admin123      | `/admin`   |
| Super admin | super@nova.local     | super123      | `/admin`   |

## Project structure

| Path                    | What it is                                            |
|-------------------------|-------------------------------------------------------|
| `app.py`                | FastAPI app: all routes, auth guards, dispatcher      |
| `database.py`           | SQLite schema, migrations, seed data, settings        |
| `auth.py`               | PBKDF2 password hashing, session tokens               |
| `sms_gateway.py`        | Mock provider (validation, async delivery simulation) |
| `static/`               | Built React SPA (`index.html` + `assets/`, committed) |
| `frontend/`             | React + TypeScript source (Vite, react-router)        |
| `frontend/src/api.ts`   | Typed API client mirroring every backend route        |
| `frontend/src/pages/`   | One component per page (Dashboard, Sending, …)        |
| `frontend/src/layout.tsx` | Glass sidebar, topbar, mobile tab-bar, account menu |
| `requirements.txt`      | Runtime deps · `requirements-dev.txt` = test deps     |
| `AGENTS.md`             | Operating guide for AI coding agents                  |

Auth: `Authorization: Bearer <token>` (7-day sessions). See `AGENTS.md`
for the role model and endpoint auth matrix.

## API reference

Meta: `GET /api/health`, `GET /api/stats` (2s cache), `GET /api/activity?days=7`

Auth: `POST /api/auth/register`, `POST /api/auth/login {email,password,role}`,
`GET /api/auth/me`, `PATCH /api/auth/profile`, `POST /api/auth/password`,
`POST /api/auth/logout`, `GET /api/billing`

Messaging: `POST /api/send {to,body,sender}`, `POST /api/bulk {to[],body,sender}`
(sender must be an **approved** sender ID), `POST /api/inbound` (webhook sim),
`GET /api/messages?search=&direction=&status=&limit=&offset=`,
`GET /api/messages/{id}`, `GET /api/export.csv`

Contacts/groups: `GET/POST /api/groups`, `DELETE /api/groups/{id}`,
`GET/POST /api/contacts` (group must already exist),
`POST /api/contacts/import` (multipart `.csv`/`.xlsx` + `group_name`),
`DELETE /api/contacts/{id}`

Sending setup: `GET/POST /api/senders`, `POST /api/senders/{id}/approve|reject`
(admin+), `DELETE /api/senders/{id}`, `GET/POST /api/templates`,
`DELETE /api/templates/{id}`, `GET/POST /api/scheduled`, `DELETE /api/scheduled/{id}`

Support/dev: `GET/POST /api/tickets`, `GET/POST /api/keys`, `DELETE /api/keys/{id}`,
`GET/POST /api/blacklist`, `DELETE /api/blacklist/{id}`,
`GET /api/conversations`, `GET /api/conversations/{phone}`,
`POST /api/topup`, `GET /api/admin/overview` (admin+),
`GET /api/admin/users`, `PATCH /api/admin/users/{id} {role?,balance?}`,
`POST /api/admin/users/{id}/topup`, `DELETE /api/admin/users/{id}` (super only)

## Simulation rules (`sms_gateway.py`)

- Phone: 7–15 digits, optional leading `+`.
- Numbers ending `0000` always fail (failure-path testing).
- Outbound lifecycle `queued → sent → delivered` (~1.5s, background thread).
- Scheduled dispatcher runs every 30s and fires due `pending` rows.
- Blacklisted numbers are rejected before send.

## Frontend pages (React Router paths)

`/`, `/sending?tab=single|campaign|sched`, `/senders`, `/templates`,
`/contacts`, `/history`, `/blacklist`, `/reports`, `/developers`, `/support`,
`/users` (admin+), `/profile`, `/billing`, `/pricing`, `/login`, `/admin`.
Dashboard role-splits customer / admin. Mobile bottom tab-bar + drawer.

## Frontend development (React + TypeScript)

```powershell
cd frontend
npm install
npm run dev      # Iterate with hot reload (proxies nothing; point it at :8000 API or run the built copy)
npm run build    # Typechecks (tsc) and regenerates ../static — commit the result
```

FastAPI serves the built SPA from `static/` (including the `/login`, `/admin`
and SPA-fallback routes in `app.py`), so a normal `uvicorn` run serves the
whole system with no node process. Theme lives in `frontend/src/index.css`
(same blue/white system, same breakpoints).

## Troubleshooting

- **Stale UI after a change:** HTML shell is `no-store`, and Vite hashes
  asset filenames on every `npm run build`, so rebuilds bust caches
  automatically. Always rebuild + commit `static/` after frontend edits.
- **Port busy:** `netstat -ano | Select-String "8000"` then
  `Stop-Process -Id <pid>`.
- **Kicked to login:** session expired/invalid — sign in again (7-day tokens).
- **JS check:** `node --check static/app.js`.
- **Python check:** `python -c "import ast; ..."` per `AGENTS.md` (beware
  backslash paths in `python -c`; prefer script files).
