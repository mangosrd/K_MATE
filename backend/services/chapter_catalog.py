"""Server-side validation for chapter IDs and their owning characters."""

import re
from typing import Optional


MAIN_CHAPTER_CHARACTER = {
    "k": "kyuhyun",
    "h": "haneul",
    "s": "sunwoo",
    "g": "sangwoo",
    "j": "yongwoo",
}

_MAIN_CHAPTER_RE = re.compile(r"^ch-([khsgj])(0[1-9]|10)$")
_SPECIAL_STORY_RE = re.compile(
    r"^sp-(?:rom|day|frd)-(kyuhyun|haneul|sunwoo|sangwoo|yongwoo)-(?:0[1-9]|10)$"
)


def chapter_character_id(chapter_id: str) -> Optional[str]:
    """Return the character that owns a valid chapter, or None if it is unknown."""
    main_match = _MAIN_CHAPTER_RE.fullmatch(chapter_id)
    if main_match:
        return MAIN_CHAPTER_CHARACTER[main_match.group(1)]

    story_match = _SPECIAL_STORY_RE.fullmatch(chapter_id)
    if story_match:
        return story_match.group(1)

    return None


def is_special_story(chapter_id: str) -> bool:
    """Return whether the ID is one of the registered special-story chapters."""
    return _SPECIAL_STORY_RE.fullmatch(chapter_id) is not None
