"""Mock SMS gateway - simulates a real provider (Twilio/Vonage style)."""
import re
import threading
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "sms.db"
PHONE_RE = re.compile(r"^\+?[0-9]{7,15}$")
# Numbers ending in 0000 always "fail" so you can test failure handling.
FAIL_SUFFIX = "0000"

def normalize_phone(phone: str) -> str:
    return phone.strip().replace(" ", "").replace("-", "")

def validate(phone: str, body: str) -> str | None:
    """Return error string or None if OK."""
    if not body or not body.strip():
        return "Message body is empty"
    if len(body) > 1600:
        return "Message body too long (max 1600 chars)"
    if not PHONE_RE.match(phone):
        return "Invalid phone format. Use digits, 7-15 chars, optional leading +"
    if phone.endswith(FAIL_SUFFIX):
        return "Simulated carrier failure (number ends in 0000)"
    return None

def _set_status(message_id: int, status: str, error: str | None = None):
    conn = sqlite3.connect(DB_PATH)
    if error is not None:
        conn.execute(
            "UPDATE messages SET status=?, error=?, updated_at=datetime('now') WHERE id=?",
            (status, error, message_id),
        )
    else:
        conn.execute(
            "UPDATE messages SET status=?, updated_at=datetime('now') WHERE id=?",
            (status, message_id),
        )
    conn.commit()
    conn.close()

def send_async(message_id: int, delay_delivered: float = 1.5):
    """Simulate queued -> sent -> delivered lifecycle in background."""
    def _run():
        _set_status(message_id, "sent")
        t = threading.Timer(delay_delivered, lambda: _set_status(message_id, "delivered"))
        t.daemon = True
        t.start()
    th = threading.Thread(target=_run, daemon=True)
    th.start()
