"""
캐릭터별 프리미엄 접근 제어.

프론트(lib/db/mock.ts의 canAccessCharacter)가 이미 이 로직을 프론트단에서 하고 있지만,
그건 화면에 잠금 UI를 보여줄지 말지에만 쓰이는 거라 API를 직접 호출하면 그대로
우회됐다(예: 잠긴 캐릭터의 /diary/generate, /letters/send 등을 직접 호출하면 프론트
잠금 화면과 무관하게 콘텐츠가 그대로 생성/저장됐음). 여기서 서버 쪽에서도 똑같은
규칙으로 한 번 더 검증한다.
"""
from fastapi import HTTPException
from sqlalchemy.orm import object_session
from models.models import User, Character
from services.membership import expire_premium_if_needed


def check_character_access(user: User, character: Character) -> None:
    """premium 미가입 + free_char_slots에도 없는 유저가 프리미엄 전용 캐릭터에
    접근하려 하면 403을 던진다. requires_premium이 아닌 캐릭터(규현/하늘 등)는
    항상 통과한다.
    """
    session = object_session(user)
    if session:
        expire_premium_if_needed(session, user)
    if not character.requires_premium:
        return
    if user.membership == "premium":
        return
    if character.id in (user.free_char_slots or []):
        return
    raise HTTPException(
        status_code=403,
        detail=f"'{character.name}' 기장님은 프리미엄 전용입니다.",
    )
