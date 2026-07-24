# 한국어 단어 난이도 분류 모델 (초급/중급/고급)

K-MATE의 `extract_word_suggestion`(단어 저장 추천)이 원래는 정규식으로 아무 한글 단어나 뽑는 방식이라
"이 단어가 배울 만큼 유의미한가/난이도가 어느 정도인가"에 대한 판단이 없었다. 이를 개선하기 위해
분류 모델을 직접 학습시켜본 스터디 겸 기능 개선 프로젝트. 3단계로 진행했다:

1. **classical ML 베이스라인** (RandomForest, 피처 엔지니어링)
2. **후보 추출 개선** (정규식 → Kiwi 형태소 분석기)
3. **KLUE-BERT 파인튜닝** (사전학습 언어모델)

## 데이터

- 출처: [julienshim/combined_korean_vocabulary_list](https://github.com/julienshim/combined_korean_vocabulary_list) (`results.tsv`)
  - 국립국어원 "한국어 학습용 어휘 목록"(2003)과 TOPIK 공개 어휘목록을 병합한 데이터
- **주의**: 이 저장소는 컬럼명이 실제 내용과 뒤바뀌어 있다.
  - `nikl_level` 컬럼은 초급/중급 2단계뿐 (TOPIK 공개 목록 특성 — TOPIK은 별도 고급 등급이 없음)
  - `topik_level` 컬럼(A/B/C, 982/2111/2872개)이 국립국어원 원 자료의 1/2/3단계 개수와 정확히 일치 →
    실제로는 NIKL 3단계 등급
  - → **3단계(초급/중급/고급) 분류가 목표이므로 `topik_level`을 라벨로 사용** (`prepare_data.py` 참고)
- 정제 후 5,708개 단어 (초급 894 / 중급 2,028 / 고급 2,786) — **다수결(항상 "고급") 베이스라인 정확도 0.488**

## 결과 요약

| 모델 | 입력 | test accuracy |
|---|---|---|
| 다수결 베이스라인 | - | 0.488 |
| RandomForest (`train.py`) | 단어 char n-gram + 품사 + 한자여부 + 음절수 | 0.496 |
| KLUE-BERT (`train_bert.py`) | 단어 + 사전 용례("단어 - 용례") | 0.671 |
| KLUE-BERT, 용례 없이 평가 (`eval_bert_word_only.py`) | 단어만 (용례 모델에 단어만 입력) | 0.621 |
| **KLUE-BERT, 단어만으로 재학습·배포 (`train_bert_word_only.py`)** | **단어만** | **0.637** ← 채택 |

## 1단계: RandomForest 베이스라인 — 피처 엔지니어링의 한계

`train.py`: char n-gram(`char_wb`, 1~2) + 품사 원-핫 + 한자여부 + 음절수 피처로 LogisticRegression/RandomForest
비교 학습. **의도적으로 뺀 피처: `rank`(사용 빈도 순위)** — 원본 등급 자체가 빈도 조사를 기준으로 매겨졌기
때문에 이걸 피처로 쓰면 답을 미리 알려주는 데이터 누수가 된다. 실제 서비스의 새 단어에는 미리 계산된
빈도 순위도 없다.

**결과**: accuracy 0.496 — 다수결 베이스라인(0.488)을 거의 못 넘음. `inspect_features.py`로 확인한 피처
중요도도 char n-gram 하나하나가 낮고 퍼져 있어(최댓값 4.6%), 뚜렷한 패턴이 아니라 약한 신호들의 조합에
가깝다는 걸 보여준다. 난이도 등급은 사실상 "실생활 사용 빈도"로 매겨졌는데, 단어의 겉모습(음절/한자/품사)
만으로는 그 빈도를 재현하기 어렵다는 뜻 — 이게 다음 두 단계로 이어진 이유.

## 2단계: Kiwi 형태소 분석기로 후보 추출 개선

기존 후보 추출은 정규식(`[가-힣]{2,4}`)이라 조사가 붙은 채로 후보가 나왔다 (예: "이 지역은" → "지역은").
`kiwi_extract.py`가 [Kiwi](https://github.com/bab2min/kiwipiepy)로 형태소 분석 후 내용어 품사(NNG/NNP/VV/VA/MAG)만
골라 사전형(lemma)으로 반환하도록 바꿨다 → "지역은" → "지역", "위해" → "위하다".

이건 분류 모델 자체의 성능과는 무관하지만, 모델에 들어가는 입력 품질을 깨끗하게 만들어서 실제 예측이
믿을 만해지는 전제조건이었다.

## 3단계: KLUE-BERT 파인튜닝 — 실질적 개선

`train_bert.py`로 `klue/bert-base`를 파인튜닝. classical ML과 다르게, 사전 용례(`explanation` 컬럼, 예:
"이 비싸다")를 "단어 - 용례" 형태로 붙여 실제 문맥을 줬다 (용례는 등급 산정 기준이 아니므로 `rank`와
달리 데이터 누수가 아니다). **결과: accuracy 0.671** — RandomForest 대비 +17.5pp.

다만 실제 서비스에서 `extract_word_suggestion`이 뽑는 단어에는 사전 용례가 없다. `eval_bert_word_only.py`로
학습 때와 다르게 단어만 넣어 평가해보니 0.621로 떨어졌다 (train/inference 불일치). 그래서
`train_bert_word_only.py`로 처음부터 단어만으로 재학습한 배포용 모델을 따로 만들었고, 이게 accuracy 0.637로
불일치를 상당 부분 메웠다. **이 모델(`model/klue_bert_vocab_level_word_only`)을 실제 연동에 사용.**

```
              precision    recall  f1-score   support
          초급       0.64      0.64      0.64       179
          중급       0.53      0.59      0.56       406
          고급       0.74      0.67      0.70       557
    accuracy                           0.64      1142
```

RandomForest 대비 +14pp, 다수결 대비 +15pp — 단어 형태만으로는 못 잡던 신호를 사전학습된 한국어 언어모델의
분산 표현이 어느 정도 잡아낸다는 뜻.

**63.7%를 어떻게 평가해야 하나**: 3-클래스 문제에서 63.7%는 "잘한다"고 하기엔 애매한 숫자다. 정직하게
뜯어보면:
- 혼동행렬을 보면 오답의 대부분이 **인접 등급 혼동**(초급↔중급, 중급↔고급)이고, 정반대 극단인 초급↔고급을
  혼동한 경우는 전체 1142건 중 22건(1.9%)뿐이다. 즉 완전히 무작위로 틀리는 게 아니라 등급 경계에서
  흐릿하게 틀리는 패턴 — 서수(ordinal)적인 신호는 어느 정도 학습했다는 뜻.
- 반대로 중급 recall이 0.59로 가장 약해서, 실제 중급 단어 10개 중 4개는 초급/고급으로 잘못 분류된다 —
  세 등급 중 가장 애매한 구간을 가장 못 잡는다.
- 애초에 이 라벨이 "단어가 어떻게 생겼는지"만으로 완전히 재현 가능한 게 아니라 실사용 빈도 기반으로
  매겨진 등급이라, 지금 성능이 "모델의 한계"인지 "이 피처만으로 낼 수 있는 이론적 상한"인지는 구분되지
  않는다. → **이 모델을 "높은 정확도의 등급 판정기"가 아니라 "다수결보다 나은 방향으로 단어를 정렬해주는
  약한 신호"로 취급하고 쓰는 게 맞다.** (다음 단계 후보: 등급의 순서를 활용하는 ordinal loss로 재학습,
  클래스 불균형 보정, BERT+RandomForest 앙상블 — 지금은 여기서 마무리하고 정직한 한계로 문서화.)

## 파일 구성

| 파일 | 역할 |
|---|---|
| `data/raw_combined_vocab.tsv` | 원본 데이터 |
| `prepare_data.py` | 라벨 매핑, 동음이의어 번호 제거, RandomForest용 파생 피처 생성 |
| `explore_data.py` | 라벨 분포/결측치 탐색 |
| `train.py` | RandomForest/LogisticRegression 베이스라인 학습 → `model/vocab_level_clf.joblib` |
| `inspect_features.py` | RandomForest 피처 중요도 확인 |
| `predict.py` | RandomForest 모델로 새 단어 난이도 추론 (CLI 데모) |
| `kiwi_extract.py` | Kiwi 형태소 분석 기반 단어 후보 추출 |
| `train_bert.py` | KLUE-BERT 파인튜닝 (단어+용례) |
| `eval_bert_word_only.py` | 용례 모델을 단어만으로 평가 (train/inference 불일치 확인용) |
| `train_bert_word_only.py` | **KLUE-BERT 파인튜닝 (단어만) → 배포용 모델** |
| `test_integration_logic.py` | 백엔드 연동 로직(Kiwi+BERT)을 백엔드 의존성 없이 검증 |

## K-MATE 연동

`backend/services/llm_service.py`의 `extract_word_suggestion`을 다음과 같이 바꿨다:
1. Kiwi로 AI 응답에서 사전형 단어 후보를 뽑고 (`_get_word_candidates`)
2. 후보들을 KLUE-BERT(word-only) 모델에 배치로 넣어 난이도를 한 번에 예측 (`predict_word_levels`)
3. 후보 중 난이도가 **가장 높은** 단어를 저장 추천 (초급보다 중급/고급을 우선)

`WordSuggestion` 스키마에 `level` 필드를 추가해 프론트에서도 난이도를 표시할 수 있게 함.

**폴백 체인**: BERT 모델(`model/klue_bert_vocab_level_word_only`)이 없으면 → RandomForest
(`model/vocab_level_clf.joblib`)로 폴백 → 그것도 없으면 후보 중 가장 짧은 단어를 고르던 기존 방식으로 폴백.
`_get_word_candidates`도 kiwipiepy가 없으면 예전 정규식으로 폴백한다.

`backend/requirements.txt`에 `scikit-learn`, `joblib`, `pandas`, `kiwipiepy`, `torch`, `transformers` 추가.
**모델 아티팩트(`model/`, ~950MB)는 git에 커밋하지 않음** (`.gitignore`) — 아래 재현 방법으로 다시 생성.

## 재현 방법

```bash
cd ml/vocab_level

# 1) RandomForest 베이스라인
python prepare_data.py
python train.py
python predict.py

# 2) KLUE-BERT (배포용, 단어만)
python train_bert_word_only.py

# 3) 통합 검증
python test_integration_logic.py
```

GPU(CUDA)가 있으면 자동으로 사용한다 (`torch.cuda.is_available()`). Windows에서 OpenMP 충돌
(`OMP: Error #15`)이 나면 `KMP_DUPLICATE_LIB_OK=TRUE` 환경변수를 설정할 것.
