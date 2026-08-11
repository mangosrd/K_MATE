"""Private player notes with delayed, zero-LLM captain comments."""

from datetime import datetime, timedelta, timezone
import secrets
import uuid
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.models import Character, User, UserNote
from schemas.schemas import UserNoteCreateRequest, UserNoteDeleteResponse, UserNoteResponse
from services.session_auth import require_current_user, require_same_user

router = APIRouter(prefix="/notes", tags=["notes"])

KST = ZoneInfo("Asia/Seoul")
DAILY_NOTE_LIMIT = 5
CHARACTER_IDS = ("kyuhyun", "haneul", "sunwoo", "sangwoo", "yongwoo")

COPY = {
    "ko": {
        "kyuhyun": {
            "affection": ["이렇게까지 좋아해 주면 내가 더 잘해야겠네. 고마워요, 아가씨.", "아가씨 마음은 내가 잘 챙겨둘게요. 괜히 여러 번 읽게 되네."],
            "tired": ["오늘 많이 지쳤나 봐요. 여기 적어둔 건 내가 잘 읽었으니 잠깐 쉬어요, 아가씨.", "힘든 날까지 혼자 버틸 필요는 없어요. 내가 보고 있잖아."],
            "daily": ["아가씨 메모는 그냥 지나치기가 어렵네. 오늘 이야기도 잘 읽었어요.", "이런 소소한 이야기까지 남겨줘서 고마워요. 다음 것도 기다릴게."],
        },
        "haneul": {
            "affection": ["고맙습니다. 표현은 서툴지만, 이 마음 오래 기억할게요.", "이런 말을 받으면 조금 부끄럽네요. 그래도 정말 기뻐요."],
            "tired": ["오늘도 수고 많았어요. 무리하지 말고 꼭 쉬었으면 좋겠습니다.", "힘들었던 이야기를 남겨줘서 고마워요. 조용히 곁에 있을게요."],
            "daily": ["오늘 하루 이야기도 잘 읽었습니다. 다음 이야기도 듣고 싶어요.", "소소한 기록이라 더 좋네요. 덕분에 당신의 하루를 조금 알게 됐어요."],
        },
        "sunwoo": {
            "affection": ["뭐야, 갑자기 이런 말 남기면 나 진짜 좋아한다? 책임져 ㅠㅠ", "이거 나 보라고 쓴 거 맞지? 완전 마음에 든다!"],
            "tired": ["오늘 힘들었어? 왜 혼자 끙끙 앓아 ㅠㅠ 다음엔 바로 말해.", "에이, 그런 날도 있지. 내가 웃겨줄 테니까 너무 속상해하지 마!"],
            "daily": ["왜 이런 재밌는 얘기를 이제 적어둔 거야 ㅋㅋ 다음 편 빨리!", "메모 발견! 오늘도 꽤 알차게 보냈네?"],
        },
        "sangwoo": {
            "affection": ["확인했습니다. 이 마음에는 같은 무게의 진심으로 답하겠습니다.", "예상하지 못한 고백이군요. 하지만 피하지 않겠습니다."],
            "tired": ["금일 일정은 여기까지로 하십시오. 휴식도 반드시 지켜야 할 계획입니다.", "상태가 좋지 않아 보입니다. 오늘은 충분히 쉬는 것을 권고합니다."],
            "daily": ["메모 확인했습니다. 오늘의 기록도 빠짐없이 기억하겠습니다.", "잘 읽었습니다. 다음 보고도 기다리고 있겠습니다."],
        },
        "yongwoo": {
            "affection": ["이런 말 아무 데나 적어두지 마. 내가 봤으니까 됐어.", "참 나, 부끄러운 말은 잘도 적어놨네. 그래도 싫진 않아."],
            "tired": ["힘들면 쉬어. 밥은 먹었고? 또 안 챙겼지.", "혼자 버티지 말고 바로 말해. 쓸데없이 걱정시키지 말고."],
            "daily": ["뭐 했는지는 알겠는데, 그래서 밥은 먹었어?", "메모 봤어. 다음엔 중요한 얘기부터 제대로 적어."],
        },
    },
    "en": {
        "kyuhyun": ["I read every word, miss. Thank you for leaving a piece of your day with me.", "You make it difficult to simply pass by a note like this, miss."],
        "haneul": ["Thank you for sharing this. I would like to hear more about your day.", "I may not say much, but I will remember what you wrote."],
        "sunwoo": ["Why did you leave such a fun note so late? I want the next part now!", "Found your note! You really know how to make me smile."],
        "sangwoo": ["Message received. I will keep your words with due care.", "I have reviewed your note. Please remember that rest is also part of the schedule."],
        "yongwoo": ["I read it. Now tell me—did you eat properly today?", "Do not keep everything to yourself. Write it down before I have to ask."],
    },
    "ja": {
        "kyuhyun": ["ちゃんと読んだよ、お嬢さん。今日の話を残してくれてありがとう。", "こんなメモを見つけたら、素通りできないね。"],
        "haneul": ["話してくれてありがとうございます。今日のことをもっと聞きたいです。", "うまく言えませんが、この言葉は大切に覚えておきます。"],
        "sunwoo": ["こんな面白い話、なんで今まで隠してたの？ 次も早く！", "メモ発見！ 今日もちゃんと頑張ったんだね。"],
        "sangwoo": ["確認しました。この言葉は責任を持って記憶します。", "本日の任務はここまでです。休息も計画の一部です。"],
        "yongwoo": ["読んだ。それで、今日はちゃんと食べたのか？", "一人で抱え込むな。次は先に言え。"],
    },
    "zh": {
        "kyuhyun": ["我认真读完了，小姐。谢谢你把今天的故事留给我。", "这样的留言让我没办法装作没看见。"],
        "haneul": ["谢谢你告诉我这些。我还想听听你今天的故事。", "虽然我不太会表达，但我会好好记住这些话。"],
        "sunwoo": ["这么有趣的事怎么现在才写？下一篇快点！", "发现留言！你今天也很努力嘛。"],
        "sangwoo": ["已确认。我会认真保管这份心意。", "今天的任务到此为止。休息也是计划的一部分。"],
        "yongwoo": ["看完了。所以你今天好好吃饭了吗？", "别什么都自己扛着，下次早点说。"],
    },
    "zh-TW": {
        "kyuhyun": ["我仔細讀完了，小姐。謝謝妳把今天的故事留給我。", "這樣的留言讓我沒辦法裝作沒看見。"],
        "haneul": ["謝謝妳告訴我這些。我還想聽聽妳今天的故事。", "雖然我不太會表達，但我會好好記住這些話。"],
        "sunwoo": ["這麼有趣的事怎麼現在才寫？下一篇快點！", "發現留言！妳今天也很努力嘛。"],
        "sangwoo": ["已確認。我會認真保管這份心意。", "今天的任務到此為止。休息也是計畫的一部分。"],
        "yongwoo": ["看完了。所以妳今天有好好吃飯嗎？", "別什麼都自己扛著，下次早點說。"],
    },
    "ru": {
        "kyuhyun": ["Я внимательно всё прочитал, мисс. Спасибо, что оставили мне частичку своего дня.", "Мимо такой записки я просто не мог пройти."],
        "haneul": ["Спасибо, что поделились. Мне хотелось бы узнать о вашем дне больше.", "Я не мастер красивых слов, но обязательно запомню написанное."],
        "sunwoo": ["Почему ты так долго скрывала такую интересную историю? Жду продолжение!", "Записка найдена! Похоже, день у тебя был насыщенный."],
        "sangwoo": ["Сообщение принято. Я сохраню ваши слова с должным вниманием.", "На сегодня задачи окончены. Отдых также является частью плана."],
        "yongwoo": ["Прочитал. А теперь скажи: ты сегодня нормально поела?", "Не держи всё в себе. В следующий раз говори сразу."],
    },
    "th": {
        "kyuhyun": ["ผมอ่านทุกคำแล้วนะครับ คุณหนู ขอบคุณที่ฝากเรื่องราวของวันนี้ไว้กับผม", "เจอโน้ตแบบนี้แล้ว ผมคงเดินผ่านไปเฉย ๆ ไม่ได้หรอก"],
        "haneul": ["ขอบคุณที่เล่าให้ฟังครับ ผมอยากรู้เรื่องวันนี้ของคุณมากกว่านี้", "ผมอาจพูดไม่เก่ง แต่จะจำข้อความนี้ไว้อย่างดีครับ"],
        "sunwoo": ["เรื่องสนุกขนาดนี้ทำไมเพิ่งเขียนล่ะ? รอตอนต่อไปอยู่นะ!", "เจอโน้ตแล้ว! วันนี้ก็ตั้งใจมากเลยนี่นา"],
        "sangwoo": ["รับทราบข้อความแล้ว ผมจะเก็บรักษาความรู้สึกนี้อย่างดี", "ภารกิจวันนี้สิ้นสุดแล้ว การพักผ่อนก็เป็นส่วนหนึ่งของแผนเช่นกัน"],
        "yongwoo": ["อ่านแล้ว แล้ววันนี้กินข้าวดี ๆ หรือยัง?", "อย่าเก็บทุกอย่างไว้คนเดียว คราวหน้าบอกให้เร็วกว่านี้"],
    },
}


def _bounds_for_today() -> tuple[datetime, datetime]:
    now = datetime.now(KST)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    return (
        start.astimezone(timezone.utc).replace(tzinfo=None),
        end.astimezone(timezone.utc).replace(tzinfo=None),
    )


def _mood(content: str) -> str:
    lowered = content.lower()
    affection = ("좋아", "사랑", "보고 싶", "멋있", "귀여", "love", "miss you", "好き", "愛", "喜欢", "รัก")
    tired = ("힘들", "피곤", "속상", "슬퍼", "지쳐", "tired", "sad", "つら", "疲", "累", "груст", "เหนื่อย")
    if any(word in lowered for word in affection):
        return "affection"
    if any(word in lowered for word in tired):
        return "tired"
    return "daily"


def _pick_comment(language: str, character_id: str, content: str) -> str:
    language_copy = COPY.get(language, COPY["en"])
    character_copy = language_copy[character_id]
    if language == "ko":
        choices = character_copy[_mood(content)]
    else:
        choices = character_copy
    return secrets.choice(choices)


def _response(note: UserNote) -> UserNoteResponse:
    ready = datetime.now() >= note.comment_ready_at
    return UserNoteResponse(
        id=note.id,
        content=note.content,
        comment_character_id=note.comment_character_id,
        comment_content=note.comment_content if ready else None,
        comment_ready_at=note.comment_ready_at,
        is_comment_ready=ready,
        is_comment_read=note.is_comment_read,
        created_at=note.created_at,
    )


@router.post("", response_model=UserNoteResponse)
def create_note(
    req: UserNoteCreateRequest,
    current_user_id: str = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    require_same_user(current_user_id, req.user_id)
    content = req.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="메모 내용을 입력해 주세요.")
    if len(content) > 500:
        raise HTTPException(status_code=400, detail="메모는 500자까지 작성할 수 있어요.")

    start, end = _bounds_for_today()
    count = db.query(UserNote.id).filter(
        UserNote.user_id == req.user_id,
        UserNote.created_at >= start,
        UserNote.created_at < end,
    ).count()
    if count >= DAILY_NOTE_LIMIT:
        raise HTTPException(status_code=429, detail="오늘은 메모를 5개까지 남길 수 있어요.")

    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    available_ids = [row[0] for row in db.query(Character.id).filter(Character.id.in_(CHARACTER_IDS)).all()]
    if not available_ids:
        raise HTTPException(status_code=503, detail="Captains are getting ready")
    character_id = secrets.choice(available_ids)
    delay_minutes = secrets.randbelow(111) + 10
    note = UserNote(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        content=content,
        comment_character_id=character_id,
        comment_content=_pick_comment(user.language, character_id, content),
        comment_ready_at=datetime.now() + timedelta(minutes=delay_minutes),
        is_comment_read=False,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return _response(note)


@router.get("/{user_id}", response_model=list[UserNoteResponse])
def list_notes(
    user_id: str,
    current_user_id: str = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    require_same_user(current_user_id, user_id)
    notes = db.query(UserNote).filter(UserNote.user_id == user_id).order_by(UserNote.created_at.desc()).limit(100).all()
    return [_response(note) for note in notes]


@router.post("/{note_id}/read", response_model=UserNoteResponse)
def read_comment(
    note_id: str,
    current_user_id: str = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(UserNote).filter(UserNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    require_same_user(current_user_id, note.user_id)
    if datetime.now() < note.comment_ready_at:
        raise HTTPException(status_code=409, detail="Comment is not ready")
    note.is_comment_read = True
    db.commit()
    db.refresh(note)
    return _response(note)


@router.delete("/{note_id}", response_model=UserNoteDeleteResponse)
def delete_note(
    note_id: str,
    current_user_id: str = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(UserNote).filter(UserNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    require_same_user(current_user_id, note.user_id)
    db.delete(note)
    db.commit()
    return UserNoteDeleteResponse(success=True)
