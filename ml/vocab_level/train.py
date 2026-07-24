"""
한국어 단어 난이도(초급/중급/고급) 분류 베이스라인 학습

피처:
- word: 음절 char n-gram (char_wb, 1~2) -> 단어 형태 자체의 패턴 학습
- pos_primary: 품사 원-핫
- has_hanja / is_bound_morpheme: 이진 피처
- syllable_count: 음절 수

* rank(빈도 순위)는 원본 데이터에서 등급을 매길 때 쓰인 기준값이라 피처로 넣으면
  "정답을 미리 알려주는" 데이터 누수(data leakage)가 되므로 의도적으로 제외했다.
  실제 서비스에서도 새 단어에는 미리 계산된 순위가 없다.
"""
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

LEVELS = ["초급", "중급", "고급"]


def build_pipeline(classifier):
    preprocess = ColumnTransformer(
        transformers=[
            ("word_ngram", TfidfVectorizer(analyzer="char_wb", ngram_range=(1, 2), min_df=2), "word"),
            ("pos", OneHotEncoder(handle_unknown="ignore"), ["pos_primary"]),
            ("bin", "passthrough", ["has_hanja", "is_bound_morpheme", "syllable_count"]),
        ]
    )
    return Pipeline([("preprocess", preprocess), ("clf", classifier)])


def main():
    df = pd.read_csv("data/processed_vocab.csv")
    df["has_hanja"] = df["has_hanja"].astype(int)
    df["is_bound_morpheme"] = df["is_bound_morpheme"].astype(int)

    X = df[["word", "pos_primary", "has_hanja", "is_bound_morpheme", "syllable_count"]]
    y = df["level"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    candidates = {
        "LogisticRegression": LogisticRegression(max_iter=1000, class_weight="balanced"),
        "RandomForest": RandomForestClassifier(n_estimators=300, random_state=42, class_weight="balanced"),
    }

    best_name, best_pipe, best_acc = None, None, -1
    for name, clf in candidates.items():
        pipe = build_pipeline(clf)
        pipe.fit(X_train, y_train)
        y_pred = pipe.predict(X_test)
        acc = (y_pred == y_test).mean()
        print(f"\n=== {name} (accuracy={acc:.3f}) ===")
        print(classification_report(y_test, y_pred, labels=LEVELS))
        print("혼동행렬 (행=실제, 열=예측):", LEVELS)
        print(confusion_matrix(y_test, y_pred, labels=LEVELS))

        if acc > best_acc:
            best_name, best_pipe, best_acc = name, pipe, acc

    print(f"\n최종 선택 모델: {best_name} (accuracy={best_acc:.3f})")
    joblib.dump(best_pipe, "model/vocab_level_clf.joblib")
    print("저장 완료: model/vocab_level_clf.joblib")


if __name__ == "__main__":
    main()
