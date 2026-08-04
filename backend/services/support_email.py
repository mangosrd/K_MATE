"""Email delivery for newly submitted support tickets."""

from email.message import EmailMessage
import smtplib

import httpx

from database import get_settings


def _header_value(value: str) -> str:
    return value.replace("\r", "").replace("\n", "").strip()


def _ticket_text(*, ticket_id: str, name: str, email: str, category: str, message: str) -> str:
    return (
        "A new customer-support ticket was received.\n\n"
        f"Ticket ID: {ticket_id}\n"
        f"Category: {category}\n"
        f"Name: {name}\n"
        f"Email: {email}\n\n"
        "Message:\n"
        f"{message}\n"
    )


def _send_via_resend(*, api_key: str, from_email: str, to_email: str, subject: str, reply_to: str, text: str, ticket_id: str) -> None:
    response = httpx.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Idempotency-Key": f"support-ticket-{ticket_id}",
        },
        json={
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "reply_to": reply_to,
            "text": text,
        },
        timeout=15,
    )
    response.raise_for_status()


def notify_support_team(*, ticket_id: str, name: str, email: str, category: str, message: str) -> bool:
    """Send the owner a ticket notification. Tickets remain saved if delivery fails."""
    settings = get_settings()
    subject = f"[K-MATE Support] {_header_value(category)} · {_header_value(name)}"
    reply_to = _header_value(email)
    body = _ticket_text(
        ticket_id=ticket_id,
        name=name,
        email=email,
        category=category,
        message=message,
    )

    # Railway reliably supports outbound HTTPS. Prefer the Resend API over raw
    # SMTP sockets, which can be unavailable from hosted containers.
    if settings.resend_api_key:
        if not (settings.support_to_email and settings.support_from_email):
            print("[support] Resend is missing SUPPORT_TO_EMAIL or SUPPORT_FROM_EMAIL", flush=True)
            return False
        try:
            _send_via_resend(
                api_key=settings.resend_api_key,
                from_email=settings.support_from_email,
                to_email=settings.support_to_email,
                subject=subject,
                reply_to=reply_to,
                text=body,
                ticket_id=ticket_id,
            )
            print(f"[support] Resend notification sent for ticket {ticket_id}", flush=True)
            return True
        except Exception as exc:
            print(f"[support] Resend notification failed: {type(exc).__name__}: {exc}", flush=True)
            return False

    required = (
        settings.support_to_email,
        settings.smtp_host,
        settings.smtp_user,
        settings.smtp_password,
    )
    if not all(required):
        print("[support] email delivery is not configured; ticket was saved without an email notification", flush=True)
        return False

    mail = EmailMessage()
    mail["Subject"] = subject
    mail["From"] = settings.smtp_from_email or settings.smtp_user
    mail["To"] = settings.support_to_email
    mail["Reply-To"] = reply_to
    mail.set_content(body)

    try:
        smtp_client = smtplib.SMTP_SSL if settings.smtp_port == 465 else smtplib.SMTP
        with smtp_client(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_port != 465:
                smtp.starttls()
            smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(mail)
        return True
    except Exception as exc:
        print(f"[support] SMTP notification failed: {type(exc).__name__}: {exc}", flush=True)
        return False
