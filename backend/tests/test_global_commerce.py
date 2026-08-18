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

from models.models import Entitlement, Purchase
from services.ads import AD_COIN_REWARD, AD_MAX_WATCHES_PER_DAY


class GlobalCommerceConfigurationTests(unittest.TestCase):
    def test_reward_policy_is_server_owned(self):
        self.assertEqual(AD_COIN_REWARD, 5)
        self.assertEqual(AD_MAX_WATCHES_PER_DAY, 5)

    def test_purchase_audit_fields_are_persisted(self):
        expected = {"order_id", "country_code", "currency", "price_micros", "purchased_at", "verified_at"}
        self.assertTrue(expected.issubset(Purchase.__table__.columns.keys()))

    def test_entitlement_is_scoped_to_user_character_and_content(self):
        unique_sets = {
            tuple(column.name for column in constraint.columns)
            for constraint in Entitlement.__table__.constraints
            if hasattr(constraint, "columns")
        }
        self.assertIn(("user_id", "entitlement_type", "character_id", "content_id"), unique_sets)


if __name__ == "__main__":
    unittest.main()
