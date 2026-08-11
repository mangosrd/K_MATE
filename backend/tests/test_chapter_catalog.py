import os
import sys
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("MYSQL_HOST", "localhost")
os.environ.setdefault("MYSQL_USER", "test")
os.environ.setdefault("MYSQL_PASSWORD", "test")
os.environ.setdefault("MYSQL_DB", "test")
os.environ.setdefault("GEMINI_API_KEY", "test")

from services.chapter_catalog import chapter_character_id, is_special_story


class ChapterCatalogTests(unittest.TestCase):
    def test_main_chapter_owner_is_resolved(self):
        expected = {
            "ch-k01": "kyuhyun",
            "ch-h10": "haneul",
            "ch-s04": "sunwoo",
            "ch-g07": "sangwoo",
            "ch-j09": "yongwoo",
        }
        for chapter_id, character_id in expected.items():
            with self.subTest(chapter_id=chapter_id):
                self.assertEqual(chapter_character_id(chapter_id), character_id)
                self.assertFalse(is_special_story(chapter_id))

    def test_special_story_owner_is_resolved(self):
        for story_type in ("rom", "day", "frd"):
            chapter_id = f"sp-{story_type}-sangwoo-10"
            with self.subTest(chapter_id=chapter_id):
                self.assertEqual(chapter_character_id(chapter_id), "sangwoo")
                self.assertTrue(is_special_story(chapter_id))

    def test_unknown_or_malformed_ids_are_rejected(self):
        invalid_ids = (
            "ch-k00",
            "ch-k11",
            "ch-x01",
            "sp-rom-kyuhyun-99",
            "sp-unknown-kyuhyun-01",
            "sp-rom-attacker-01",
            "fake-chapter-id",
        )
        for chapter_id in invalid_ids:
            with self.subTest(chapter_id=chapter_id):
                self.assertIsNone(chapter_character_id(chapter_id))
                self.assertFalse(is_special_story(chapter_id))


if __name__ == "__main__":
    unittest.main()
