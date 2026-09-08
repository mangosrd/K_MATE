"""Password-reset email delivery without leaking secrets or account existence."""

from email.message import EmailMessage
import smtplib
from urllib.parse import quote

import httpx

from database import get_settings


def send_password_reset_email(*, email: str, token: str, request_id: str) -> bool:
    settings = get_settings()
    reset_url = f"{settings.frontend_url.rstrip('/')}/reset-password?token={quote(token)}"
    subject = "K-MATE 비밀번호 재설정"
    body = (
        "K-MATE 비밀번호 재설정 요청을 받았습니다.\n\n"
        f"아래 링크에서 {settings.password_reset_token_minutes}분 이내에 새 비밀번호를 설정해 주세요.\n"
        f"{reset_url}\n\n"
        "본인이 요청하지 않았다면 이 메일을 무시해 주세요."
    )

    if settings.resend_api_key and settings.support_from_email:
        try:
            response = httpx.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                    "Idempotency-Key": f"password-reset-{request_id}",
                },
                json={
                    "from": settings.support_from_email,
                    "to": [email],
                    "subject": subject,
                    "text": body,
                },
                timeout=15,
            )
            response.raise_for_status()
            return True
        except Exception as exc:
            print(f"[password-reset] Resend delivery failed: {type(exc).__name__}", flush=True)
            return False

    if not all((settings.smtp_host, settings.smtp_user, settings.smtp_password)):
        print("[password-reset] email delivery is not configured", flush=True)
        return False

    mail = EmailMessage()
    mail["Subject"] = subject
    mail["From"] = settings.smtp_from_email or settings.smtp_user
    mail["To"] = email
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
        print(f"[password-reset] SMTP delivery failed: {type(exc).__name__}", flush=True)
        return False
