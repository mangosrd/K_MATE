"""Kiwi 형태소 분석기 동작 확인 - 어떤 품사 태그로 후보를 뽑을지 설계용"""
from kiwipiepy import Kiwi

kiwi = Kiwi()

samples = [
    "승객 여러분, 안녕하세요. 저는 규현 기장입니다. 잠시 후 경복궁 상공을 통과할 예정입니다.",
    "이 지역은 조선시대 전통 문화의 중심지로 유명합니다. 막걸리와 한지도 유명해요.",
    "안전한 여행을 위해 좌석 벨트를 착용해 주시기 바랍니다.",
]

for s in samples:
    print(f"\n원문: {s}")
    result = kiwi.tokenize(s)
    for token in result:
        print(f"  {token.form:10s} {token.tag:6s} lemma={token.lemma if hasattr(token, 'lemma') else '-'}")
