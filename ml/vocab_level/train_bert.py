"""KLUE-BERT(klue/bert-base) 파인튜닝으로 단어 난이도(초급/중급/고급) 분류

RandomForest 베이스라인(train.py)과 같은 3단계 라벨을 쓰되, 입력을 "단어" 하나가 아니라
"단어 - 용례" 형태로 만들어 BERT가 실제로 활용할 수 있는 문맥을 준다.
(용례(explanation)는 예: "이 비싸다" 처럼 사전 뜻풀이용 짧은 구문. rank처럼 등급 산정 기준이 아니므로
데이터 누수가 아니다.)
"""
import os
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

import numpy as np
import pandas as pd
import torch
from datasets import Dataset
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
)

from prepare_data import LEVEL_MAP, clean_word

MODEL_NAME = "klue/bert-base"
LEVELS = ["초급", "중급", "고급"]
LABEL2ID = {l: i for i, l in enumerate(LEVELS)}
ID2LABEL = {i: l for i, l in enumerate(LEVELS)}


def load_texts() -> pd.DataFrame:
    df = pd.read_csv("data/raw_combined_vocab.tsv", sep="\t")
    df = df[df["topik_level"].isin(LEVEL_MAP.keys())].copy()
    df["level"] = df["topik_level"].map(LEVEL_MAP)
    df["word_clean"] = df["word"].apply(clean_word)
    df = df[df["word_clean"].str.len() > 0]
    df["explanation"] = df["explanation"].fillna("").astype(str).str.strip()
    df["text"] = df["word_clean"] + df["explanation"].apply(lambda e: f" - {e}" if e else "")
    df = df.drop_duplicates(subset=["word_clean", "level"])
    df["label"] = df["level"].map(LABEL2ID)
    return df[["text", "label"]].reset_index(drop=True)


def main():
    print("CUDA available:", torch.cuda.is_available())
    df = load_texts()
    train_df, test_df = train_test_split(
        df, test_size=0.2, random_state=42, stratify=df["label"]
    )
    print(f"train={len(train_df)} test={len(test_df)}")

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    def tokenize(batch):
        return tokenizer(batch["text"], truncation=True, max_length=32)

    train_ds = Dataset.from_pandas(train_df).map(tokenize, batched=True)
    test_ds = Dataset.from_pandas(test_df).map(tokenize, batched=True)

    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME, num_labels=len(LEVELS), id2label=ID2LABEL, label2id=LABEL2ID
    )

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        preds = np.argmax(logits, axis=-1)
        return {"accuracy": accuracy_score(labels, preds)}

    args = TrainingArguments(
        output_dir="model/bert_ckpt",
        per_device_train_batch_size=32,
        per_device_eval_batch_size=64,
        num_train_epochs=5,
        learning_rate=3e-5,
        eval_strategy="epoch",
        save_strategy="no",
        logging_steps=20,
        report_to=[],
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=test_ds,
        data_collator=DataCollatorWithPadding(tokenizer),
        compute_metrics=compute_metrics,
    )
    trainer.train()

    preds = trainer.predict(test_ds)
    y_pred = np.argmax(preds.predictions, axis=-1)
    y_true = preds.label_ids
    print("\n=== KLUE-BERT test 결과 ===")
    print(classification_report(y_true, y_pred, target_names=LEVELS))
    print("혼동행렬:", LEVELS)
    print(confusion_matrix(y_true, y_pred))

    save_dir = "model/klue_bert_vocab_level"
    trainer.save_model(save_dir)
    tokenizer.save_pretrained(save_dir)
    print(f"저장 완료: {save_dir}")


if __name__ == "__main__":
    main()
