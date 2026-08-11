import os
import sys
import unittest
from pathlib import Path

from fastapi import HTTPException


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("MYSQL_HOST", "localhost")
os.environ.setdefault("MYSQL_USER", "test")
os.environ.setdefault("MYSQL_PASSWORD", "test")
os.environ.setdefault("MYSQL_DB", "test")

from services.rate_limit import _reset_for_tests, clear_rate_limit, enforce_rate_limit


class RateLimitTests(unittest.TestCase):
    def setUp(self):
        _reset_for_tests()

    def test_blocks_after_limit_and_returns_retry_after(self):
        enforce_rate_limit("login", "user@example.com", limit=2, window_seconds=60, now=100)
        enforce_rate_limit("login", "user@example.com", limit=2, window_seconds=60, now=101)
        with self.assertRaises(HTTPException) as raised:
            enforce_rate_limit("login", "user@example.com", limit=2, window_seconds=60, now=102)
        self.assertEqual(raised.exception.status_code, 429)
        self.assertIn("Retry-After", raised.exception.headers)

    def test_identifiers_have_independent_limits(self):
        enforce_rate_limit("login", "one@example.com", limit=1, window_seconds=60, now=100)
        enforce_rate_limit("login", "two@example.com", limit=1, window_seconds=60, now=100)

    def test_success_can_clear_login_limit(self):
        enforce_rate_limit("login", "user@example.com", limit=1, window_seconds=60, now=100)
        clear_rate_limit("login", "user@example.com")
        enforce_rate_limit("login", "user@example.com", limit=1, window_seconds=60, now=101)

    def test_old_attempts_expire(self):
        enforce_rate_limit("login", "user@example.com", limit=1, window_seconds=60, now=100)
        enforce_rate_limit("login", "user@example.com", limit=1, window_seconds=60, now=161)


if __name__ == "__main__":
    unittest.main()
