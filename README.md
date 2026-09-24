# SMS System (Mock Gateway + SQLite)

Full system: contacts, single send, bulk send, inbox/history, delivery status simulation.

## Setup

```powershell
cd C:\Users\ankra\OneDrive\Documentos\sms
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Open http://127.0.0.1:8000 — web UI.
API docs: http://127.0.0.1:8000/docs

## API

- `GET /api/health`, `GET /api/stats`
- `GET/POST /api/contacts`, `DELETE /api/contacts/{id}`
- `POST /api/send` `{"to":"+15551234567","body":"hi"}`
- `POST /api/bulk` `{"to":["+1555..."],"body":"hi"}`
- `POST /api/inbound` `{"from":"+1555...","body":"reply"}` — simulate a reply / provider webhook
- `GET /api/messages?search=&direction=&status=`
- `GET /api/messages/{id}` — poll for `queued -> sent -> delivered`

## Simulation rules (`sms_gateway.py`)

- Phone must be 7–15 digits, optional leading `+`.
- Numbers ending in `0000` always fail (test failure path).
- Outbound lifecycle: `queued -> sent -> delivered` (~1.5s, background thread).
- Inbound inserts with status `received`.

## Files

- `app.py` — FastAPI app + routes
- `database.py` — SQLite init/helpers (`sms.db` auto-created)
- `sms_gateway.py` — mock provider
- `static/` — vanilla web UI
