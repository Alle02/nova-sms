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
| `static/index.html`     | Dashboard SPA (all pages as `.view` sections)         |
| `static/app.js`         | All frontend logic (Bootstrap `BUILD` const at top)   |
| `static/style.css`      | Full theme (CSS vars in `:root`, 1200/1050/760/560/420 breakpoints) |
| `static/login.html`     | Customer login + registration                         |
| `static/admin-login.html` | Staff login (admin + super admin)                   |
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

## Frontend pages (`static/index.html` sections)

Dashboard (role-split customer / admin), Sending (Single / Bulk / Scheduled tabs),
Sender ID, SMS Template, Contacts (groups → people → Excel import), History
(under Reports), Blacklist, Reports, Developers, Support, Users (admin+),
Profile, Billing, Pricing. Mobile bottom tab-bar + drawer; see `AGENTS.md`.

## Troubleshooting

- **Stale UI after a change:** HTML shell is `no-store`, but bump `?v=` on
  `style.css`/`app.js` in `index.html` when editing them.
- **Port busy:** `netstat -ano | Select-String "8000"` then
  `Stop-Process -Id <pid>`.
- **Kicked to login:** session expired/invalid — sign in again (7-day tokens).
- **JS check:** `node --check static/app.js`.
- **Python check:** `python -c "import ast; ..."` per `AGENTS.md` (beware
  backslash paths in `python -c`; prefer script files).
