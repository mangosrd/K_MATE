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
from routers.learning import LESSON_ENTRY_COST, VERIFIED_LESSON_STEP_DELTA
from routers.progress import update_progress
from schemas.schemas import LessonCompleteRequest


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

    def test_lesson_completion_ignores_client_authored_progress_and_rewards(self):
        forged_request = LessonCompleteRequest(
            user_id="owner",
            session_id="session",
            step_delta=9999,
            add_stamp="forged-chapter",
        )

        self.assertEqual(LESSON_ENTRY_COST, 0)
        self.assertEqual(VERIFIED_LESSON_STEP_DELTA, 1)
        self.assertFalse(hasattr(forged_request, "step_delta"))
        self.assertFalse(hasattr(forged_request, "add_stamp"))


if __name__ == "__main__":
    unittest.main()
