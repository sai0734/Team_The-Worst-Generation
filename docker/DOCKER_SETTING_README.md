# 도커(Docker) 환경 설정

이 프로젝트는 백엔드(`baby_back`) + 프론트엔드(`baby_front`) + DB(MariaDB) + Python AI 서버(`ai/ai-server`, FastAPI) + AI(Ollama, OpenClaw)를 각자 로컬에 따로 설치/실행하지 않고, **Docker 하나로 한 번에 띄울 수 있게** 구성돼 있습니다.

각자 Java, Node, Gradle, MariaDB를 따로 설치할 필요 없이, Docker Desktop만 설치하면 됩니다.

**예상 소요시간(최초 1회 기준)**: 사람마다/인터넷 속도마다 다르지만 대략 30분~1시간 정도 잡아두세요. AI 모델 이미지/파일이 커서(합쳐서 8~9GB 정도) 시간이 좀 걸립니다. 딱 한 번만 하면 되고, 이후엔 켜고 끄는 데 몇 초밖에 안 걸립니다.

## 1. 사전 준비: WSL2 설치

PowerShell을 **관리자 권한**으로 실행 후 아래 명령 입력.

```bat
wsl --install
```

이미 설치돼 있으면 그냥 넘어가도 됩니다. 상태 확인은 아래 명령으로.

```bat
wsl --status
```

`기본 버전: 2`라고 뜨면 정상입니다.

명령 실행 후 재부팅이 필요할 수 있습니다. **재부팅**하세요.

(주의: `wsl --install` 실행하면 재부팅 후 자동으로 Ubuntu 배포판을 추가로 다운로드하려고 창이 뜰 수 있는데, 이건 Docker랑 상관없는 부분이라 그냥 창을 닫아도 됩니다. 우리한테 필요한 건 WSL2 엔진 자체뿐입니다.)

## 2. Docker Desktop 설치

1. https://www.docker.com/products/docker-desktop/ 접속
2. **AMD64** 버전 다운로드
3. `Docker Desktop Installer` 실행
4. Configuration 화면에서 기본값(Per-user installation) 그대로 두고 진행
5. 설치 후 Docker Desktop 실행 → 계정 로그인(구글 계정 등으로 가능)
6. 좌측 하단에 **"Engine running"**(초록불) 뜨면 정상 설치 완료

확인용으로 터미널에 아래 명령 입력해서 정상 응답 오는지 체크 가능합니다.

```bat
docker --version
```

## 3. 프로젝트 실행

실제 작업 중인 프로젝트 최상위 폴더(`baby_back`, `baby_front`, `docker-compose.yml`이 같이 있는 폴더)에서:

1. 폴더 안 빈 공간에서 **Shift + 우클릭**
2. "여기서 PowerShell 창 열기" (또는 "터미널에서 열기") 클릭
3. 아래 명령 입력

```bat
docker compose up --build
```

처음 실행이면 이미지 6개(backend, frontend, mariadb, ollama, openclaw, **ai-server**)를 받고 빌드하느라 **10~30분 정도** 걸립니다 (`ollama` 이미지가 3GB 넘고, `ai-server`는 torch 등 파이썬 패키지가 무거워서 빌드가 오래 걸림). 이후엔 캐시 덕분에 훨씬 빨라집니다.

이 창은 로그가 계속 흐르면서 "실행 중" 상태로 유지됩니다. 4번(실행 확인)은 Docker Desktop 앱/브라우저로만 확인하면 되고, 5번(AI 최초 설정)에서 명령어를 입력할 때는 **새 터미널 창**을 하나 더 열어서 진행하세요.

## 4. 실행 확인

- Docker Desktop 앱 → **Containers** 탭에 들어가면 `baby_project`라는 그룹으로 `backend`, `frontend`, `mariadb`, `ollama`, `openclaw`, `ai-server` 컨테이너 **6개**가 실행 중으로 보입니다. (`ollama-init`은 모델 준비만 하고 바로 종료(exited)되는 게 정상입니다.)
- 브라우저에서 프론트엔드 확인: `http://localhost:3000`
- 백엔드 API 확인: `http://localhost:8080`
- Python AI 서버 확인: `http://localhost:5000/health` (`{"ok":true}` 나오면 정상)

터미널 창에 로그가 계속 흐르면서 떠 있는 상태가 정상입니다(서버가 계속 돌고 있다는 뜻).

## 5. AI 모델 준비 (대부분 자동)

AI 모델/자산은 git으로 안 넘어오고 **각자 컴퓨터의 도커 볼륨에 로컬로 저장**됩니다. 이 프로젝트 최신 구성에서는 대부분 자동으로 준비됩니다.

### 5-1. Ollama 모델 — `ollama-init`이 자동 처리

첫 `docker compose up` 때 `ollama-init` 서비스가 아래 4개를 자동으로 받고 커스텀 모델을 생성합니다. **수동 명령 불필요.**

| 모델 | 용도 | 대략 시간 |
|---|---|---|
| `qwen3:8b` | 기본 LLM (챗봇·분류·상담 등) | 몇 분 ~ 십몇 분 |
| `parenting-qwen:8b` | `qwen3:8b`에 `ai/ollama/Modelfile` 적용한 커스텀 | 몇 초 |
| `llava` | 응가/피부 체크 비전 | 몇 분 |
| `qwen2.5vl:7b` | 육아일기 AI 자동작성 비전 | 몇 분 (5GB 이상) |

- `ollama-init`은 작업이 끝나면 종료(exited)됩니다 — 정상입니다.
- `ollama_data` 볼륨에 저장되므로 `down`/`up` 반복해도 다시 안 받습니다. (`down -v`로 볼륨까지 지우면 재실행.)
- 실패했거나 다시 받고 싶으면: `docker compose up ollama-init` (또는 `docker compose run --rm ollama-init`).
- 확인: `docker compose exec ollama ollama list` → `parenting-qwen:8b` 보이면 정상.

### 5-2. Python AI 서버 자산 — `ai-server`가 첫 기동 시 자동

`ai-server` 컨테이너는 처음 뜰 때 없는 자산을 스스로 준비합니다 (로그에 `[init]` 표시). **수동 명령 불필요.**

| 자산 | 방식 | 인터넷 |
|---|---|---|
| 수면 이상탐지 모델 (`sleep_anomaly_model.joblib`) | 합성 데이터로 즉시 학습 | 불필요 (수초) |
| 정부지원금 벡터DB (`chroma_subsidies`) | `data.go.kr` 색인 (`.env`의 `DATA_GO_KR_SERVICE_KEY` 필요) | 필요 (수 분) |
| 맞춤 동화 TTS 모델 (Supertonic / Piper) | 다운로드 약 130MB | 필요 |

- `ai_models` / `ai_chroma` 볼륨에 저장 → 이후엔 즉시 기동.
- **첫 `docker compose up`은 ai-server 준비에 3~10분 더 걸립니다.** `docker compose logs -f ai-server`로 진행 상황 확인.
- 색인/TTS가 실패해도 서버는 정상 기동하며 해당 기능만 비활성됩니다 (지원금은 이후 백엔드 `/reindex` 로 채움).

### 5-3. OpenClaw (SMS 발송) — 도커 미지원

리콜 SMS 자동 알림은 도커에서 동작하지 않습니다. `openclaw` 컨테이너는 자리만 잡아둔 상태이고, Gateway는 네이티브(`ai/openclaw/setup-openclaw.cmd`)에서만 실행됩니다. 실제 문자는 Android(Termux) 브리지까지 있어야 합니다.

(참고: `ai/ollama/setup-ollama.cmd`, `ai/openclaw/setup-openclaw.cmd`로 윈도우에 네이티브 설치하는 방법도 별도로 존재하지만 도커와는 **완전히 별개의 저장공간**입니다. 둘 다 포트 11434/18789를 쓰므로, 네이티브가 실행 중이면 도커 컨테이너와 포트 충돌이 납니다. 한쪽만 켜서 사용하세요.)

## 6. 종료 방법

로그가 흐르는 그 터미널 창에서 `Ctrl + C`.

또는 다른 터미널에서:

```bat
docker compose down
```

## 7. 문제 해결 (트러블슈팅)

### 포트 충돌 (3306, 5000, 8080, 11434)

로컬에 이미 MariaDB가 설치돼 있거나, IntelliJ 등에서 백엔드를 직접 실행 중이거나, `start-dev.cmd`로 네이티브 개발 서버를 켜둔 상태면 포트가 이미 사용 중이라 컨테이너가 안 뜰 수 있습니다.

- **3306(MariaDB) 충돌**: `docker-compose.yml`에서 이미 `3307:3306`으로 포트를 바꿔놨기 때문에 기본적으로는 문제 없습니다.
- **8080(백엔드) 충돌**: 로컬에서 IntelliJ 등으로 백엔드를 따로 실행해둔 상태라면, 그 프로세스를 먼저 종료(IntelliJ에서 stop 버튼)한 뒤 다시 `docker compose up --build` 실행하세요.
- **5000(Python AI) 충돌**: `start-dev.cmd`로 네이티브 Python AI 서버(`ai/ai-server`)를 켜둔 상태면 `ai-server` 컨테이너와 충돌합니다. `stop-dev.cmd`로 끄고 도커를 쓰세요.
- **11434(Ollama) 충돌**: 네이티브 Ollama가 실행 중이면 `ollama` 컨테이너와 충돌합니다 (위 5번 참고).

에러 메시지에 `bind: Only one usage of each socket address...`가 보이면 포트 충돌입니다.

### 이미지/컨테이너 정리하고 싶을 때

```bat
docker compose down
docker system prune
```

(주의: `docker system prune`은 사용 안 하는 이미지/캐시를 지우는 명령이라 다음 빌드가 다시 느려질 수 있습니다. 진짜 정리가 필요할 때만 사용하세요.)
