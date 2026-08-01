from __future__ import annotations

import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(os.environ.get("SMTP_HOST") and os.environ.get("SMTP_FROM"))


def send_password_reset_email(*, to_email: str, reset_link: str) -> bool:
    subject = "IntelliPark password reset"
    body = (
        "You requested to reset your IntelliPark password.\n\n"
        f"Open this link to choose a new password:\n{reset_link}\n\n"
        "If you did not request this, you can ignore this email."
    )

    if not _smtp_configured():
        logger.info(
            "Password reset email for %s (SMTP not configured): %s",
            to_email,
            reset_link,
        )
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = os.environ["SMTP_FROM"]
    message["To"] = to_email
    message.set_content(body)

    host = os.environ["SMTP_HOST"]
    port = int(os.environ.get("SMTP_PORT", "587"))
    username = os.environ.get("SMTP_USERNAME")
    password = os.environ.get("SMTP_PASSWORD")

    with smtplib.SMTP(host, port, timeout=20) as smtp:
        smtp.starttls()
        if username and password:
            smtp.login(username, password)
        smtp.send_message(message)

    return True


def send_password_reset_sms(*, to_phone: str, code: str) -> bool:
    if os.environ.get("TWILIO_ACCOUNT_SID") and os.environ.get("TWILIO_AUTH_TOKEN"):
        logger.info(
            "Twilio SMS hook not implemented yet; code for %s logged server-side.",
            to_phone,
        )

    logger.info("Password reset SMS for %s: %s", to_phone, code)
    return False
