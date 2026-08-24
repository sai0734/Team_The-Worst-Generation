# BabyCare AI Server

Spring Boot와 분리해서 실행하는 Python FastAPI 서버입니다.
현재는 맞춤 동화 생성 모듈만 제공합니다.

## 처리 원칙

- 이름 끝 글자의 받침을 Python에서 판별해 사람 이름용 조사를 만든 뒤,
  LLM 입력과 생성 결과 후처리에 모두 적용합니다.
- 저작권이 끝난 전래동화·고전 우화의 사건 구조만 골격으로 사용하고,
  실제 문장과 배경은 아이 정보에 맞춰 새로 생성합니다.
- 한 이야기에는 중심 목표 하나, 아이와 말하는 친구 한 명만 둡니다.

- 모든 동화: 로컬 Ollama LLM을 4회 순차 호출해 약 500자씩 이어지는 4부 이야기 생성
- Python: 1부에서 정한 제목·등장인물·전체 줄거리와 앞부분을 2~4부에 전달하고, 부별 분량을 검사한 뒤 하나로 결합
- TTS: Supertonic 3 한국어 ONNX 모델로 인터넷 없이 WAV 생성
- TTS fallback: Supertonic 오류 시 Piper로 자동 전환
- 아이 이름, 취향, 좋아하는 물건 원문은 로그에 기록하지 않음

하드코딩된 동화 문장은 사용하지 않습니다.
별도의 길이 선택 없이 모든 동화를 같은 4부 연속 생성 규칙으로 만듭니다.

## 실행

PowerShell에서 ai-server 디렉터리로 이동한 뒤 실행합니다.

~~~powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 5000
~~~

## API

~~~text
GET  http://127.0.0.1:5000/health
GET  http://127.0.0.1:5000/api/v1/stories/status
POST http://127.0.0.1:5000/api/v1/stories/generate
GET  http://127.0.0.1:5000/api/v1/stories/tts/status
POST http://127.0.0.1:5000/api/v1/stories/tts/synthesize
~~~

생성 요청 예시:

~~~json
{
  "babyName": "서윤",
  "ageMonths": 36,
  "interests": ["토끼", "우주"],
  "favoriteItems": ["분홍 인형"],
  "theme": "BEDTIME"
}
~~~

## 동화 생성 LLM

기본값은 로컬 Ollama를 사용합니다.

~~~env
STORY_LLM_ENABLED=true
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=parenting-qwen:8b
~~~

## TTS

Supertonic 3 한국어 모델을 로컬 CPU에서 실행합니다.
장면과 긴 문장을 나누고 장면 사이에 무음을 넣어 동화 낭독 리듬을 만듭니다.
Supertonic 모델이 없거나 합성에 실패하면 Piper로 자동 전환합니다.
처음 한 번 다음 명령으로 의존성과 모델을 함께 준비합니다.

~~~powershell
cd ai
.\start-dev.cmd --setup-python
~~~

음성 생성 요청:

~~~json
{
  "text": "서윤이는 분홍 인형을 꼭 안고 별빛 숲으로 걸어갔어요."
}
~~~

응답은 audio/wav 파일이며 본문 원문은 로그에 기록하지 않습니다.

~~~env
STORY_TTS_PROVIDER=SUPERTONIC
STORY_TTS_FALLBACK_PROVIDER=PIPER
STORY_TTS_MODEL_DIR=models/tts
STORY_TTS_SPEAKER_ID=0
STORY_TTS_SPEED=0.95
STORY_TTS_NUM_STEPS=8
STORY_TTS_PIPER_VOICE=ko_KR-kss-medium
~~~

생성된 동화는 화자 라벨이 없는 자연스러운 산문과 따옴표 대화로 구성됩니다.
Supertonic은 전체 이야기에 `STORY_TTS_SPEAKER_ID` 한 목소리만 사용합니다.
따옴표 앞뒤의 발화 문맥으로 최대 두 캐릭터를 구분하고, 같은 낭독 목소리
안에서 속도와 감탄·질문 강조만 바꿔 연기합니다.

## 테스트

~~~powershell
python -m unittest discover -s tests -v
~~~
