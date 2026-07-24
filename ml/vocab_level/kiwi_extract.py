"""Kiwi 형태소 분석기로 문장에서 '배울 만한 단어' 후보를 뽑는다.

기존 정규식(`[가-힣]{2,4}`) 방식은 조사가 붙은 채로 후보가 나오는 문제가 있었다
(예: "지역은"). 형태소 분석으로 조사/어미를 떼고 사전형(lemma)만 남긴다.
"""
from kiwipiepy import Kiwi

# 학습에 의미 있는 내용어만: 일반명사, 고유명사, 동사, 형용사, 부사
CONTENT_TAGS = {"NNG", "NNP", "VV", "VA", "MAG"}

_kiwi = None


def _get_kiwi() -> Kiwi:
    global _kiwi
    if _kiwi is None:
        _kiwi = Kiwi()
    return _kiwi


def extract_word_candidates(text: str, min_len: int = 2, max_len: int = 5) -> list[str]:
    """텍스트에서 사전형 단어 후보 리스트를 순서 유지 + 중복 제거해서 반환"""
    kiwi = _get_kiwi()
    candidates: list[str] = []
    seen: set[str] = set()
    for token in kiwi.tokenize(text):
        if token.tag not in CONTENT_TAGS:
            continue
        word = token.lemma
        if not (min_len <= len(word) <= max_len):
            continue
        if word in seen:
            continue
        seen.add(word)
        candidates.append(word)
    return candidates


if __name__ == "__main__":
    samples = [
        "승객 여러분, 안녕하세요. 저는 규현 기장입니다. 잠시 후 경복궁 상공을 통과할 예정입니다.",
        "이 지역은 조선시대 전통 문화의 중심지로 유명합니다. 막걸리와 한지도 유명해요.",
        "안전한 여행을 위해 좌석 벨트를 착용해 주시기 바랍니다.",
    ]
    for s in samples:
        print(s, "->", extract_word_candidates(s))
