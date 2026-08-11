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
os.environ.setdefault("GEMINI_API_KEY", "test")

from models.models import Character, MembershipEnum, PremiumStory, User
from routers.backstories import _item
from services.access_control import check_character_access


class BackstorySecurityTests(unittest.TestCase):
    def test_locked_story_never_exposes_body(self):
        story = PremiumStory(
            id="story-1",
            character_id="sunwoo",
            episode_number=1,
            title="Title",
            summary="Summary",
            body="Secret body",
            unlock_cost=1,
        )

        locked = _item(story, False)

        self.assertIsNone(locked.body)
        self.assertEqual(locked.unlock_cost, 1)

    def test_locked_character_requires_entitlement(self):
        user = User(id="user-1", name="Tester", membership=MembershipEnum.free, free_char_slots=[])
        character = Character(
            id="sunwoo",
            region_id="busan",
            name="Sunwoo",
            requires_premium=True,
        )

        with self.assertRaises(HTTPException) as raised:
            check_character_access(user, character)

        self.assertEqual(raised.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
