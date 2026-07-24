"""실제 서비스 상황(단어만 주어지고 용례 없음)에서도 KLUE-BERT 모델이 잘 동작하는지 검증

학습은 "단어 - 용례" 형식으로 했지만, extract_word_suggestion에서 AI 응답 문장에서 뽑는
단어에는 사전 용례가 없다. 그 train/inference 불일치가 정확도를 얼마나 깎아먹는지 확인한다.
"""
import os
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

import numpy as np
import torch
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from train_bert import LEVELS, load_texts

MODEL_DIR = "model/klue_bert_vocab_level"


def main():
    df = load_texts()
    _, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df["label"])

    # 용례 부분("단어 - 용례")을 떼고 단어만 남김 -> 실제 서비스와 동일한 입력
    test_df = test_df.copy()
    test_df["word_only"] = test_df["text"].str.split(" - ").str[0]

    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device).eval()

    enc = tokenizer(list(test_df["word_only"]), truncation=True, max_length=32,
                     padding=True, return_tensors="pt").to(device)
    with torch.no_grad():
        logits = model(**enc).logits
    preds = logits.argmax(dim=-1).cpu().numpy()

    y_true = test_df["label"].to_numpy()
    acc = accuracy_score(y_true, preds)
    print(f"단어만 입력했을 때 accuracy: {acc:.3f}  (용례 포함 학습 시 test accuracy: 0.671)")
    print(classification_report(y_true, preds, target_names=LEVELS))


if __name__ == "__main__":
    main()
