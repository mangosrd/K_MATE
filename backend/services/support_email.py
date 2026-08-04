"""Email delivery for newly submitted support tickets."""

from email.message import EmailMessage
import smtplib

from database import get_settings


def _header_value(value: str) -> str:
    return value.replace("\r", "").replace("\n", "").strip()


def notify_support_team(*, ticket_id: str, name: str, email: str, category: str, message: str) -> bool:
    """Send the owner a ticket notification. Tickets remain saved even if SMTP is unavailable."""
    settings = get_settings()
    required = (
        settings.support_to_email,
        settings.smtp_host,
        settings.smtp_user,
        settings.smtp_password,
    )
    if not all(required):
        print("[support] SMTP is not configured; ticket was saved without an email notification", flush=True)
        return False

    mail = EmailMessage()
    mail["Subject"] = f"[K-MATE 문의] {_header_value(category)} · {_header_value(name)}"
    mail["From"] = settings.smtp_from_email or settings.smtp_user
    mail["To"] = settings.support_to_email
    mail["Reply-To"] = _header_value(email)
    mail.set_content(
        "새 고객지원 문의가 접수되었습니다.\n\n"
        f"티켓 ID: {ticket_id}\n"
        f"유형: {category}\n"
        f"이름: {name}\n"
        f"이메일: {email}\n\n"
        "문의 내용:\n"
        f"{message}\n"
    )

    try:
        # Daum uses implicit SSL on port 465; Gmail and most other providers
        # use STARTTLS on port 587.
        smtp_client = smtplib.SMTP_SSL if settings.smtp_port == 465 else smtplib.SMTP
        with smtp_client(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_port != 465:
                smtp.starttls()
            smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(mail)
        return True
    except Exception as exc:
        print(f"[support] email notification failed: {type(exc).__name__}: {exc}", flush=True)
        return False
