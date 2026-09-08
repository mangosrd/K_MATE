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
os.environ.setdefault("INTERNAL_API_SECRET", "test-secret")

from routers.auth import _guest_install_hash, _normalize_email, _oauth_handoff_hash, _password_reset_hash
from schemas.schemas import ForgotPasswordRequest, GuestCreateRequest, GoogleExchangeRequest, GoogleNativeLoginRequest, RegisterRequest, ResetPasswordRequest


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

    def test_guest_installation_identifier_is_bounded(self):
        GuestCreateRequest(installation_id="a" * 32)
        with self.assertRaises(ValidationError):
            GuestCreateRequest(installation_id="short")
        with self.assertRaises(ValidationError):
            GuestCreateRequest(installation_id="a" * 129)
        with self.assertRaises(ValidationError):
            GuestCreateRequest(installation_id="a" * 31 + "!")

    def test_guest_installation_identifier_is_keyed_before_storage(self):
        first = _guest_install_hash("a" * 32)
        second = _guest_install_hash("a" * 32)
        self.assertEqual(first, second)
        self.assertEqual(len(first), 64)
        self.assertNotIn("a" * 32, first)

    def test_oauth_handoff_identifier_is_hashed_before_storage(self):
        jti = "temporary-oauth-handoff"
        digest = _oauth_handoff_hash(jti)
        self.assertEqual(len(digest), 64)
        self.assertNotIn(jti, digest)

    def test_password_reset_inputs_are_bounded(self):
        ForgotPasswordRequest(email="user@example.com")
        ResetPasswordRequest(token="x" * 32, new_password="new-password")
        with self.assertRaises(ValidationError):
            ResetPasswordRequest(token="short", new_password="new-password")
        with self.assertRaises(ValidationError):
            ResetPasswordRequest(token="x" * 513, new_password="new-password")
        with self.assertRaises(ValidationError):
            ResetPasswordRequest(token="x" * 32, new_password="short")

    def test_password_reset_token_is_hashed_before_storage(self):
        token = "secret-reset-token" * 4
        digest = _password_reset_hash(token)
        self.assertEqual(len(digest), 64)
        self.assertNotIn(token, digest)


if __name__ == "__main__":
    unittest.main()
