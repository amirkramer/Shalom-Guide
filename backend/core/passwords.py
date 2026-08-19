"""Password hashing for local email/password accounts.

Uses PBKDF2-HMAC-SHA256 from the standard library (no extra dependency like
bcrypt/passlib needed). Format stored in User.password_hash:
    pbkdf2_sha256$<iterations>$<salt_hex>$<hash_hex>
"""

import hashlib
import hmac
import secrets

_ALGORITHM = "pbkdf2_sha256"
_ITERATIONS = 260_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), _ITERATIONS)
    return f"{_ALGORITHM}${_ITERATIONS}${salt}${derived.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations_str, salt, hash_hex = stored_hash.split("$", 3)
        if algorithm != _ALGORITHM:
            return False
        iterations = int(iterations_str)
    except (ValueError, AttributeError):
        return False

    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), iterations)
    return hmac.compare_digest(derived.hex(), hash_hex)
