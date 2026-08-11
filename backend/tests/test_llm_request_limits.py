import os
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("MYSQL_HOST", "localhost")
os.environ.setdefault("MYSQL_USER", "test")
os.environ.setdefault("MYSQL_PASSWORD", "test")
os.environ.setdefault("MYSQL_DB", "test")
os.environ.setdefault("GEMINI_API_KEY", "test")

from fastapi import HTTPException
from routers.chat import (
    FREE_CHAT_LIMIT,
    MAX_CHAT_MESSAGE_CHARS,
    ensure_chat_is_affordable,
    validate_chat_payload,
)
from routers.translate import MAX_TRANSLATION_ITEMS, validate_translation_items
from schemas.schemas import ChatRequest, TranslateItem


class LlmRequestLimitTests(unittest.TestCase):
    def test_chat_rejects_oversized_message(self):
        request = ChatRequest(
            character_id="kyuhyun",
            user_id="user-1",
            user_message="x" * (MAX_CHAT_MESSAGE_CHARS + 1),
        )

        with self.assertRaises(HTTPException) as raised:
            validate_chat_payload(request)

        self.assertEqual(raised.exception.status_code, 413)

    def test_paid_chat_rejects_before_llm_when_wallet_is_empty(self):
        user = SimpleNamespace(id="user-1", membership="free", free_chat_count=FREE_CHAT_LIMIT)
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None

        with self.assertRaises(HTTPException) as raised:
            ensure_chat_is_affordable(db, user)

        self.assertEqual(raised.exception.status_code, 402)

    def test_translation_rejects_oversized_batch(self):
        items = [TranslateItem(text="word") for _ in range(MAX_TRANSLATION_ITEMS + 1)]

        with self.assertRaises(HTTPException) as raised:
            validate_translation_items(items)

        self.assertEqual(raised.exception.status_code, 413)


if __name__ == "__main__":
    unittest.main()
