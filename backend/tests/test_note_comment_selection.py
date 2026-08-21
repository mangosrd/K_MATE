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

from routers.notes import CHARACTER_IDS, _captain_pool


class NoteCommentSelectionTests(unittest.TestCase):
    def test_all_five_captains_are_eligible_for_a_first_comment(self):
        self.assertEqual(_captain_pool(list(CHARACTER_IDS), None), list(CHARACTER_IDS))

    def test_most_recent_captain_is_excluded_when_others_are_available(self):
        pool = _captain_pool(list(CHARACTER_IDS), "kyuhyun")

        self.assertNotIn("kyuhyun", pool)
        self.assertEqual(set(pool), set(CHARACTER_IDS) - {"kyuhyun"})

    def test_only_available_captain_remains_eligible(self):
        self.assertEqual(_captain_pool(["haneul"], "haneul"), ["haneul"])


if __name__ == "__main__":
    unittest.main()
