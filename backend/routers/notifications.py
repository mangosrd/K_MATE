"""Native push device registration. Sending is enabled after Firebase service credentials are added."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.models import PushDevice, User
from schemas.schemas import PushDeviceRegisterRequest, PushDeviceRemoveRequest, PushDeviceResponse
from services.session_auth import require_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/devices", response_model=PushDeviceResponse)
def register_device(
    req: PushDeviceRegisterRequest,
    current_user_id: str = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    """Upsert a device token and transfer it safely if the device changed accounts."""
    if not db.query(User.id).filter(User.id == current_user_id, User.is_withdrawn.is_(False)).first():
        return PushDeviceResponse(success=False)

    device = db.query(PushDevice).filter(PushDevice.token == req.token).first()
    if device:
        device.user_id = current_user_id
        device.platform = req.platform
        device.active = True
    else:
        db.add(PushDevice(
            id=str(uuid.uuid4()),
            user_id=current_user_id,
            token=req.token,
            platform=req.platform,
            active=True,
        ))
    db.commit()
    return PushDeviceResponse(success=True)


@router.delete("/devices", response_model=PushDeviceResponse)
def unregister_device(
    req: PushDeviceRemoveRequest,
    current_user_id: str = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    device = db.query(PushDevice).filter(
        PushDevice.user_id == current_user_id,
        PushDevice.token == req.token,
    ).first()
    if device:
        device.active = False
        db.commit()
    return PushDeviceResponse(success=True)
