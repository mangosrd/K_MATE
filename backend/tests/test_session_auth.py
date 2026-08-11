import os
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("MYSQL_HOST", "localhost")
os.environ.setdefault("MYSQL_USER", "test")
os.environ.setdefault("MYSQL_PASSWORD", "test")
os.environ.setdefault("MYSQL_DB", "test")
os.environ.setdefault("GEMINI_API_KEY", "test")

from fastapi import HTTPException
from services import session_auth


class SessionAccountStateTests(unittest.TestCase):
    @patch.object(session_auth, "_read_access_token", return_value=("active-user", 0))
    def test_active_account_keeps_access(self, _read_token):
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = ("active-user", 0)

        user_id = session_auth.require_current_user("Bearer token", db)

        self.assertEqual(user_id, "active-user")

    @patch.object(session_auth, "_read_access_token", return_value=("withdrawn-user", 0))
    def test_withdrawn_or_deleted_account_is_rejected(self, _read_token):
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None

        with self.assertRaises(HTTPException) as raised:
            session_auth.require_current_user("Bearer token", db)

        self.assertEqual(raised.exception.status_code, 401)

    @patch.object(session_auth, "_read_access_token", return_value=("active-user", 1))
    def test_revoked_token_is_rejected(self, _read_token):
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = ("active-user", 2)

        with self.assertRaises(HTTPException) as raised:
            session_auth.require_current_user("Bearer token", db)

        self.assertEqual(raised.exception.status_code, 401)

    def test_revoking_sessions_increments_auth_version(self):
        user = MagicMock(auth_version=3)

        session_auth.revoke_user_sessions(user)

        self.assertEqual(user.auth_version, 4)


if __name__ == "__main__":
    unittest.main()
