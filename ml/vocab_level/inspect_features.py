"""RandomForest 피처 중요도 확인 (어떤 피처가 예측에 실제로 기여하는지)"""
import joblib

pipe = joblib.load("model/vocab_level_clf.joblib")
pre = pipe.named_steps["preprocess"]
clf = pipe.named_steps["clf"]

feature_names = pre.get_feature_names_out()
importances = clf.feature_importances_

pairs = sorted(zip(feature_names, importances), key=lambda x: -x[1])
print("상위 20개 피처:")
for name, imp in pairs[:20]:
    print(f"  {name:30s} {imp:.4f}")

# 피처 그룹별 중요도 합
groups = {"word_ngram": 0.0, "pos": 0.0, "bin": 0.0}
for name, imp in pairs:
    for g in groups:
        if name.startswith(g):
            groups[g] += imp
print("\n그룹별 중요도 합:", groups)
