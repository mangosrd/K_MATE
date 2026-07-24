"""학습된 난이도 분류 모델로 새 단어의 등급을 예측하는 추론 모듈"""
import re
from pathlib import Path

import joblib
import pandas as pd

MODEL_PATH = Path(__file__).parent / "model" / "vocab_level_clf.joblib"
_model = None


def _load_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model


def predict_level(word: str, pos: str = "미상", has_hanja: bool = False) -> dict:
    """단어 하나의 난이도를 예측. 반환: {"level": "중급", "proba": {"초급":..,"중급":..,"고급":..}}"""
    model = _load_model()
    row = pd.DataFrame(
        [{
            "word": word,
            "pos_primary": pos,
            "has_hanja": int(has_hanja),
            "is_bound_morpheme": int(word.startswith("-")),
            "syllable_count": len(word),
        }]
    )
    level = model.predict(row)[0]
    proba = dict(zip(model.classes_, model.predict_proba(row)[0].round(3)))
    return {"level": level, "proba": proba}


if __name__ == "__main__":
    samples = ["안녕", "경복궁", "환율", "고찰하다", "해운대", "막걸리", "제공하다"]
    for w in samples:
        result = predict_level(w)
        print(f"{w:10s} -> {result['level']}  {result['proba']}")
