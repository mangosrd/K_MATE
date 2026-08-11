import os
import sys
import unittest
from pathlib import Path

from fastapi import HTTPException
from pydantic import ValidationError


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("MYSQL_HOST", "localhost")
os.environ.setdefault("MYSQL_USER", "test")
os.environ.setdefault("MYSQL_PASSWORD", "test")
os.environ.setdefault("MYSQL_DB", "test")
os.environ.setdefault("GEMINI_API_KEY", "test")

from routers.auth import _normalize_email
from schemas.schemas import GoogleExchangeRequest, GoogleNativeLoginRequest, RegisterRequest


class AuthInputSecurityTests(unittest.TestCase):
    def test_email_is_normalized_before_account_lookup(self):
        self.assertEqual(_normalize_email("  User@Example.COM "), "user@example.com")

    def test_invalid_email_is_rejected(self):
        with self.assertRaises(HTTPException) as raised:
            _normalize_email("not-an-email")
        self.assertEqual(raised.exception.status_code, 422)

    def test_registration_rejects_short_or_oversized_credentials(self):
        with self.assertRaises(ValidationError):
            RegisterRequest(email="user@example.com", password="short", name="Tester")
        with self.assertRaises(ValidationError):
            RegisterRequest(email="user@example.com", password="x" * 129, name="Tester")

    def test_google_payloads_are_bounded(self):
        with self.assertRaises(ValidationError):
            GoogleNativeLoginRequest(id_token="x" * 10001, nonce="n" * 32)
        with self.assertRaises(ValidationError):
            GoogleExchangeRequest(oauth_code="x" * 4097)


if __name__ == "__main__":
    unittest.main()
