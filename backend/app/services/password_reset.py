from __future__ import annotations

import secrets
import threading
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

EMAIL_TOKEN_TTL = timedelta(minutes=30)
SMS_CODE_TTL = timedelta(minutes=10)

_lock = threading.Lock()
_email_tokens: dict[str, tuple[int, datetime]] = {}
_sms_codes: dict[int, tuple[str, datetime]] = {}


@dataclass
class EmailResetRequest:
    token: str
    reset_link: str


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _purge_expired() -> None:
    now = _now()
    expired_email = [
        token
        for token, (_, expires_at) in _email_tokens.items()
        if expires_at <= now
    ]
    for token in expired_email:
        _email_tokens.pop(token, None)

    expired_sms = [
        user_id
        for user_id, (_, expires_at) in _sms_codes.items()
        if expires_at <= now
    ]
    for user_id in expired_sms:
        _sms_codes.pop(user_id, None)


def create_email_reset_token(*, user_id: int, base_url: str) -> EmailResetRequest:
    token = secrets.token_urlsafe(32)
    expires_at = _now() + EMAIL_TOKEN_TTL
    base = base_url.rstrip("/")

    with _lock:
        _purge_expired()
        _email_tokens[token] = (user_id, expires_at)

    return EmailResetRequest(
        token=token,
        reset_link=f"{base}?token={token}",
    )


def create_sms_reset_code(*, user_id: int) -> str:
    code = f"{secrets.randbelow(1_000_000):06d}"
    expires_at = _now() + SMS_CODE_TTL

    with _lock:
        _purge_expired()
        _sms_codes[user_id] = (code, expires_at)

    return code


def verify_email_reset_token(token: str) -> int | None:
    with _lock:
        _purge_expired()
        entry = _email_tokens.get(token)
        if not entry:
            return None
        user_id, expires_at = entry
        if expires_at <= _now():
            _email_tokens.pop(token, None)
            return None
        return user_id


def consume_email_reset_token(token: str) -> int | None:
    with _lock:
        _purge_expired()
        entry = _email_tokens.pop(token, None)
        if not entry:
            return None
        user_id, expires_at = entry
        if expires_at <= _now():
            return None
        return user_id


def verify_sms_reset_code(*, user_id: int, code: str) -> bool:
    normalized = str(code or "").strip()
    if not normalized:
        return False

    with _lock:
        _purge_expired()
        entry = _sms_codes.get(user_id)
        if not entry:
            return False
        expected, expires_at = entry
        if expires_at <= _now():
            _sms_codes.pop(user_id, None)
            return False
        if expected != normalized:
            return False
        _sms_codes.pop(user_id, None)
        return True
