"""데이터 탐색: 원본 TSV의 라벨 분포, 결측치, 품사 분포 확인"""
import pandas as pd

df = pd.read_csv("data/raw_combined_vocab.tsv", sep="\t")
print("전체 행 수:", len(df))
print("\n컬럼:", list(df.columns))

print("\n--- nikl_level 분포 ---")
print(df["nikl_level"].value_counts(dropna=False))

print("\n--- topik_level 분포 ---")
print(df["topik_level"].value_counts(dropna=False))

print("\n--- word 결측 ---")
print(df["word"].isna().sum())

print("\n--- part_of_speech 분포 (상위 10) ---")
print(df["part_of_speech"].value_counts(dropna=False).head(10))

print("\n--- nikl_level 있는 행만 필터링 후 개수 ---")
labeled = df[df["nikl_level"].notna() & (df["nikl_level"] != "")]
print(len(labeled))
print(labeled["nikl_level"].value_counts())

print("\n--- 샘플 5개 (초급/중급/고급 각각) ---")
for lvl in ["초급", "중급", "고급"]:
    sub = labeled[labeled["nikl_level"] == lvl]
    print(f"\n[{lvl}] n={len(sub)}")
    print(sub[["word", "part_of_speech", "hanja"]].head(5).to_string(index=False))
