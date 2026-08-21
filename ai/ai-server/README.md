# BabyCare AI Server

Spring Boot와 분리해서 실행하는 Python FastAPI 서버입니다.

현재 단계에는 다음 구조만 포함되어 있습니다.

- FastAPI 애플리케이션과 상태 확인 API
- 응급실 AI 라우터, 요청/응답 스키마, 서비스 자리
- 추후 학습 데이터와 모델 파일을 둘 디렉터리
- 응급실 모델 학습 스크립트를 둘 디렉터리

아직 응급실 데이터 저장, 모델 학습, 예측, Spring 연동은 구현하지 않았습니다.

## 실행

PowerShell에서 `ai-server` 디렉터리로 이동한 뒤 실행합니다.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 5000
```

상태 확인:

```text
GET http://127.0.0.1:5000/health
GET http://127.0.0.1:5000/api/v1/emergency/model/status
```

## 예정 흐름

```text
Spring Boot 응급실 API
  -> Python 스냅샷 저장
  -> training/train_emergency.py로 학습
  -> models/emergency_model.joblib 생성
  -> FastAPI 예측 API
```

