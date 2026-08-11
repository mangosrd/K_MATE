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
    @patch.object(session_auth, "_read_access_token", return_value="active-user")
    def test_active_account_keeps_access(self, _read_token):
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = ("active-user",)

        user_id = session_auth.require_current_user("Bearer token", db)

        self.assertEqual(user_id, "active-user")

    @patch.object(session_auth, "_read_access_token", return_value="withdrawn-user")
    def test_withdrawn_or_deleted_account_is_rejected(self, _read_token):
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None

        with self.assertRaises(HTTPException) as raised:
            session_auth.require_current_user("Bearer token", db)

        self.assertEqual(raised.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
