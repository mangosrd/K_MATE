"""
원본 TSV -> 학습용 CSV 정제

컬럼 주의사항 (탐색 결과):
- 이 저장소(julienshim/combined_korean_vocabulary_list)는 컬럼명이 실제 내용과 반대로 되어 있음.
  - "nikl_level": 초급/중급 두 등급만 존재 (TOPIK 공개 어휘목록 특성 - TOPIK은 고급 별도 등급 없음)
  - "topik_level": A/B/C 세 등급, 개수가 982/2111/2872로 국립국어원 "한국어 학습용 어휘 목록"(2003)의
    1단계/2단계/3단계 개수와 정확히 일치 -> 실제로는 NIKL 3단계 등급임
- 따라서 3단계(초급/중급/고급) 분류를 위해 topik_level(A/B/C)을 라벨로 사용한다.
"""
import re
import pandas as pd

LEVEL_MAP = {"A": "초급", "B": "중급", "C": "고급"}


def clean_word(raw: str) -> str:
    """동음이의어 번호(예: 가구04)와 접사 표시(-, ~) 제거"""
    return re.sub(r"\d+$", "", raw).strip("-~")


def main():
    df = pd.read_csv("data/raw_combined_vocab.tsv", sep="\t")

    df = df[df["topik_level"].isin(LEVEL_MAP.keys())].copy()
    df["level"] = df["topik_level"].map(LEVEL_MAP)

    df["word_clean"] = df["word"].apply(clean_word)
    df = df[df["word_clean"].str.len() > 0]

    df["pos_primary"] = df["part_of_speech"].fillna("미상").str.split("/").str[0]
    df["has_hanja"] = df["hanja"].notna() & (df["hanja"].astype(str).str.strip() != "")
    df["is_bound_morpheme"] = df["word"].astype(str).str.startswith("-")
    df["syllable_count"] = df["word_clean"].str.len()

    out = df[["word_clean", "pos_primary", "has_hanja", "is_bound_morpheme", "syllable_count", "level"]]
    out = out.rename(columns={"word_clean": "word"})

    # 완전 중복 단어+라벨 제거 (동음이의어는 유지하되 동일 단어/라벨 중복만 제거)
    out = out.drop_duplicates(subset=["word", "level"])

    out.to_csv("data/processed_vocab.csv", index=False, encoding="utf-8-sig")
    print(f"저장 완료: {len(out)}행 -> data/processed_vocab.csv")
    print(out["level"].value_counts())


if __name__ == "__main__":
    main()
