"""Atomic wallet mutations with an immutable transaction ledger."""

import uuid
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.models import CoinTransaction, Economy


def get_wallet(db: Session, user_id: str, *, lock: bool = True) -> Economy:
    query = db.query(Economy).filter(Economy.user_id == user_id)
    wallet = query.with_for_update().first() if lock else query.first()
    if not wallet:
        wallet = Economy(id=str(uuid.uuid4()), user_id=user_id, coins=0)
        db.add(wallet)
        db.flush()
    return wallet


def change_coins(
    db: Session, user_id: str, amount: int, transaction_type: str,
    *, reference_type: str | None = None, reference_id: str | None = None,
    description: str | None = None,
) -> Economy:
    wallet = get_wallet(db, user_id)
    if wallet.coins + amount < 0:
        raise HTTPException(status_code=400, detail="코인이 부족합니다.")
    wallet.coins += amount
    db.flush()
    db.add(CoinTransaction(
        id=str(uuid.uuid4()), user_id=user_id, amount=amount,
        balance_after=wallet.coins, transaction_type=transaction_type,
        reference_type=reference_type, reference_id=reference_id,
        description=description,
    ))
    db.flush()
    return wallet
