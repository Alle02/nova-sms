"""Auth helpers - stdlib only (PBKDF2 + secrets tokens)."""
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta

ITERATIONS = 120_000

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), ITERATIONS)
    return f"pbkdf2${ITERATIONS}${salt}${dk.hex()}"

def verify_password(password: str, stored: str) -> bool:
    try:
        _, it, salt, hexdk = stored.split("$")
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), int(it))
        return hmac.compare_digest(dk.hex(), hexdk)
    except Exception:
        return False

def new_token() -> str:
    return secrets.token_hex(32)

def expiry(days: int = 7) -> str:
    return (datetime.utcnow() + timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
