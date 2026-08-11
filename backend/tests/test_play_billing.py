import os
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("MYSQL_HOST", "localhost")
os.environ.setdefault("MYSQL_USER", "test")
os.environ.setdefault("MYSQL_PASSWORD", "test")
os.environ.setdefault("MYSQL_DB", "test")
os.environ.setdefault("GEMINI_API_KEY", "test")

from fastapi import HTTPException
from routers import billing
from services import play_billing


class PlayBillingFinalizationTests(unittest.TestCase):
    @patch.object(play_billing, "_get_play_service")
    def test_consumable_retry_skips_already_consumed_purchase(self, get_service):
        service = MagicMock()
        products = service.purchases.return_value.products.return_value
        products.get.return_value.execute.return_value = {"consumptionState": 1}
        get_service.return_value = service

        play_billing.consume_product_purchase("coin_pack", "token")

        products.consume.assert_not_called()

    @patch.object(play_billing, "_get_play_service")
    def test_consumable_is_consumed_when_not_finalized(self, get_service):
        service = MagicMock()
        products = service.purchases.return_value.products.return_value
        products.get.return_value.execute.return_value = {"consumptionState": 0}
        get_service.return_value = service

        play_billing.consume_product_purchase("coin_pack", "token")

        products.consume.assert_called_once_with(
            packageName=play_billing.settings.google_play_package_name,
            productId="coin_pack",
            token="token",
        )

    @patch.object(play_billing, "_get_play_service")
    def test_non_consumable_is_acknowledged_not_consumed(self, get_service):
        service = MagicMock()
        products = service.purchases.return_value.products.return_value
        products.get.return_value.execute.return_value = {"acknowledgementState": 0}
        get_service.return_value = service

        play_billing.acknowledge_product_purchase("character_pack", "token")

        products.acknowledge.assert_called_once()
        products.consume.assert_not_called()


class BillingOwnershipTests(unittest.TestCase):
    def test_receipt_cannot_be_reused_by_another_user(self):
        purchase = SimpleNamespace(user_id="owner", product_id="coin_pack")

        with self.assertRaises(HTTPException) as raised:
            billing._validate_existing_purchase(
                purchase, user_id="attacker", product_id="coin_pack"
            )

        self.assertEqual(raised.exception.status_code, 409)

    def test_receipt_reference_is_fixed_length_and_not_raw_token(self):
        token = "secret-google-receipt-token" * 30
        reference = billing._receipt_reference(token)

        self.assertEqual(len(reference), 64)
        self.assertNotEqual(reference, token)
        self.assertEqual(reference, billing._receipt_reference(token))

    @patch.object(billing, "acknowledge_product_purchase")
    @patch.object(billing, "consume_product_purchase")
    def test_character_finalization_never_consumes_purchase(
        self, consume, acknowledge
    ):
        purchase = SimpleNamespace(
            status="verified", product_id="character_pack", purchase_token="token"
        )
        db = MagicMock()

        billing._finalize_google_purchase(db, purchase, "non_consumable")

        acknowledge.assert_called_once_with("character_pack", "token")
        consume.assert_not_called()
        self.assertEqual(purchase.status, "finalized")
        db.commit.assert_called_once()


if __name__ == "__main__":
    unittest.main()
