"""backend/services/llm_service.py 에 최종 반영한 extract_word_suggestion 로직을
groq 등 백엔드 전체 의존성 없이 독립적으로 검증하기 위한 스크립트 (BERT 우선, Kiwi 후보 추출)"""
import os
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from kiwi_extract import extract_word_candidates

MODEL_DIR = "model/klue_bert_vocab_level_word_only"
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
model.eval()
LEVEL_RANK = {"초급": 0, "중급": 1, "고급": 2}


def predict_word_levels(words: list[str]) -> dict[str, str]:
    enc = tokenizer(words, truncation=True, max_length=16, padding=True, return_tensors="pt")
    with torch.no_grad():
        logits = model(**enc).logits
    pred_ids = logits.argmax(dim=-1).tolist()
    id2label = model.config.id2label
    return {w: id2label[i] for w, i in zip(words, pred_ids)}


def extract_word_suggestion(reply: str) -> dict | None:
    korean_words = extract_word_candidates(reply)
    if not korean_words:
        return None
    levels = predict_word_levels(korean_words)
    best_word = max(korean_words, key=lambda w: LEVEL_RANK.get(levels[w], 0))
    return {"word": best_word, "meaning": "", "sentence": reply[:60], "level": levels[best_word]}


sample_reply = "승객 여러분, 안녕하세요. 저는 규현 기장입니다. 잠시 후 경복궁 상공을 통과할 예정입니다."
print(extract_word_suggestion(sample_reply))

sample_reply2 = "이 지역은 조선시대 전통 문화의 중심지로 유명합니다. 막걸리와 한지도 유명해요."
print(extract_word_suggestion(sample_reply2))
