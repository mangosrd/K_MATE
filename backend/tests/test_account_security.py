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

from models.models import MembershipEnum, User
from routers.account import SUPPORT_USER_HOURLY_LIMIT, _to_profile_response, enforce_support_ticket_rate_limits
from schemas.schemas import ChangePasswordRequest, PreferencesUpdateRequest, ProfileUpdateRequest
from services.rate_limit import _reset_for_tests


class AccountSecurityTests(unittest.TestCase):
    def setUp(self):
        _reset_for_tests()

    def test_support_ticket_rate_limit_blocks_email_flood(self):
        for _ in range(SUPPORT_USER_HOURLY_LIMIT):
            enforce_support_ticket_rate_limits("user-1")

        with self.assertRaises(HTTPException) as raised:
            enforce_support_ticket_rate_limits("user-1")

        self.assertEqual(raised.exception.status_code, 429)

    def test_profile_response_does_not_require_or_rotate_login_token(self):
        user = User(
            id="user-1",
            name="Tester",
            email="user@example.com",
            language="ko",
            membership=MembershipEnum.free,
        )

        response = _to_profile_response(user)

        self.assertEqual(response.email, "user@example.com")
        self.assertFalse(hasattr(response, "access_token"))

    def test_profile_and_password_inputs_are_bounded(self):
        with self.assertRaises(ValidationError):
            ProfileUpdateRequest(
                user_id="user-1",
                name="x" * 101,
                email="user@example.com",
            )
        with self.assertRaises(ValidationError):
            ChangePasswordRequest(
                user_id="user-1",
                current_password="old-password",
                new_password="short",
            )

    def test_timezone_name_is_bounded(self):
        with self.assertRaises(ValidationError):
            PreferencesUpdateRequest(user_id="user-1", timezone_name="x" * 65)


if __name__ == "__main__":
    unittest.main()
