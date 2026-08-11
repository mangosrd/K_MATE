import os
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("MYSQL_HOST", "localhost")
os.environ.setdefault("MYSQL_USER", "test")
os.environ.setdefault("MYSQL_PASSWORD", "test")
os.environ.setdefault("MYSQL_DB", "test")
os.environ.setdefault("GEMINI_API_KEY", "test")

from fastapi import HTTPException
from routers.progress import update_progress


class ProgressMutationSecurityTests(unittest.TestCase):
    def test_legacy_arbitrary_progress_updates_are_disabled(self):
        forged_request = SimpleNamespace(user_id="owner")

        with self.assertRaises(HTTPException) as raised:
            update_progress(
                req=forged_request,
                current_user_id="owner",
                db=None,
            )

        self.assertEqual(raised.exception.status_code, 410)


if __name__ == "__main__":
    unittest.main()
