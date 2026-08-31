#!/bin/sh
# ai-server 첫 기동 시 런타임 자산을 스스로 준비한다.
# 전부 "없을 때만" 실행하고, 실패해도 서버는 뜬다.
set -e
cd /app

echo "[init] ai-server 초기화 점검..."

# 1) 수면 이상탐지 모델 (합성 데이터 학습 · 오프라인 · 수초)
if [ ! -f models/sleep_anomaly_model.joblib ]; then
  echo "[init] 수면 이상탐지 모델 생성..."
  python training/train_sleep_anomaly.py || echo "[init][warn] 수면 모델 학습 실패 - 이상탐지 없이 계속"
fi

# 2) 정부지원금 벡터DB (data.go.kr API · 인터넷 + DATA_GO_KR_SERVICE_KEY 필요 · 수 분)
if python - <<'PY'
import os, sqlite3, sys
p = "data/chroma_subsidies/chroma.sqlite3"
n = 0
if os.path.exists(p):
    try:
        n = sqlite3.connect(p).execute("select count(*) from embeddings").fetchone()[0]
    except Exception:
        pass
sys.exit(0 if n == 0 else 1)   # exit 0 = 색인 필요
PY
then
  echo "[init] 정부지원금 벡터DB 색인... (수 분 소요)"
  python training/index_subsidies.py || echo "[init][warn] 색인 실패 - 이후 백엔드 /reindex 로 재시도"
fi

# 3) 맞춤 동화 TTS 모델 (다운로드 약 130MB · 인터넷 필요)
if [ ! -d models/tts ] || [ -z "$(ls -A models/tts 2>/dev/null)" ]; then
  echo "[init] TTS 모델 다운로드..."
  python scripts/setup_tts.py || echo "[init][warn] TTS 셋업 실패 - 동화 음성만 비활성(텍스트는 정상)"
fi

echo "[init] 완료 -> uvicorn 시작"
exec "$@"
