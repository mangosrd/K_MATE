import os
import sys
import unittest
from datetime import datetime
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
from routers.diary import (
    MAX_DIARY_EVENTS,
    MAX_DIARY_EVENT_CHARS,
    _diary_response,
    validate_diary_payload,
)
from schemas.schemas import DiaryGenerateRequest


class DiarySecurityTests(unittest.TestCase):
    def test_rejects_too_many_transcript_events(self):
        request = DiaryGenerateRequest(
            user_id="user-1",
            character_id="kyuhyun",
            session_events=["hello"] * (MAX_DIARY_EVENTS + 1),
        )

        with self.assertRaises(HTTPException) as raised:
            validate_diary_payload(request)

        self.assertEqual(raised.exception.status_code, 413)

    def test_rejects_oversized_transcript_event(self):
        request = DiaryGenerateRequest(
            user_id="user-1",
            character_id="kyuhyun",
            session_events=["x" * (MAX_DIARY_EVENT_CHARS + 1)],
        )

        with self.assertRaises(HTTPException) as raised:
            validate_diary_payload(request)

        self.assertEqual(raised.exception.status_code, 413)

    def test_locked_diary_response_does_not_leak_body(self):
        entry = SimpleNamespace(
            id="diary-1",
            body_ko="secret diary body",
            place_name="Seoul",
            unlocked=False,
            created_at=datetime(2026, 8, 11, 12, 0, 0),
        )

        response = _diary_response(entry)

        self.assertEqual(response.body_ko, "")


if __name__ == "__main__":
    unittest.main()
