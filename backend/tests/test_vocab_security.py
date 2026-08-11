import os
import sys
import unittest
from pathlib import Path

from pydantic import ValidationError


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("MYSQL_HOST", "localhost")
os.environ.setdefault("MYSQL_USER", "test")
os.environ.setdefault("MYSQL_PASSWORD", "test")
os.environ.setdefault("MYSQL_DB", "test")
os.environ.setdefault("GEMINI_API_KEY", "test")

from routers.vocab import MAX_VOCAB_ITEMS_PER_USER, _clean_optional
from schemas.schemas import VocabItemCreate


class VocabSecurityTests(unittest.TestCase):
    def _valid_payload(self):
        return {
            "user_id": "user-1",
            "character_id": "kyuhyun",
            "word": "기장",
            "meaning": "captain",
        }

    def test_rejects_oversized_vocab_content(self):
        payload = self._valid_payload()
        payload["word"] = "가" * 101

        with self.assertRaises(ValidationError):
            VocabItemCreate(**payload)

    def test_rejects_excessive_tag_count(self):
        payload = self._valid_payload()
        payload["tags"] = [f"tag-{index}" for index in range(11)]

        with self.assertRaises(ValidationError):
            VocabItemCreate(**payload)

    def test_optional_text_is_normalized_and_storage_is_bounded(self):
        self.assertIsNone(_clean_optional("   "))
        self.assertEqual(_clean_optional("  example  "), "example")
        self.assertEqual(MAX_VOCAB_ITEMS_PER_USER, 2000)


if __name__ == "__main__":
    unittest.main()
