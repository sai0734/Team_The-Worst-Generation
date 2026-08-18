# 도커(Docker) 환경 설정

이 프로젝트는 백엔드(`baby_back`) + 프론트엔드(`baby_front`) + DB(MariaDB) + AI(Ollama, OpenClaw)를 각자 로컬에 따로 설치/실행하지 않고, **Docker 하나로 한 번에 띄울 수 있게** 구성돼 있습니다.

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

처음 실행이면 이미지 5개(backend, frontend, mariadb, ollama, openclaw)를 받고 빌드하느라 **10~20분 정도** 걸립니다 (특히 `ollama` 이미지가 3GB 넘어서 오래 걸림). 이후엔 캐시 덕분에 훨씬 빨라집니다.

이 창은 로그가 계속 흐르면서 "실행 중" 상태로 유지됩니다. 4번(실행 확인)은 Docker Desktop 앱/브라우저로만 확인하면 되고, 5번(AI 최초 설정)에서 명령어를 입력할 때는 **새 터미널 창**을 하나 더 열어서 진행하세요.

## 4. 실행 확인

- Docker Desktop 앱 → **Containers** 탭에 들어가면 `baby_project`라는 그룹으로 `backend`, `frontend`, `mariadb`, `ollama`, `openclaw` 컨테이너 **5개**가 실행 중으로 보입니다.
- 브라우저에서 프론트엔드 확인: `http://localhost:3000`
- 백엔드 API 확인: `http://localhost:8080`

터미널 창에 로그가 계속 흐르면서 떠 있는 상태가 정상입니다(서버가 계속 돌고 있다는 뜻).

## 5. AI(Ollama, OpenClaw) 최초 설정 (컴퓨터마다 최초 1회 필요)

AI 모델/설정 데이터는 git으로 안 넘어오고 **각자 컴퓨터의 도커 볼륨에 로컬로 저장**되는 구조입니다. 그래서 이 프로젝트를 처음 받은 사람은 컴퓨터마다 아래 과정을 한 번은 거쳐야 합니다. **로그가 흐르지 않는 새 터미널 창**에서 순서대로 실행하세요.

```bat
docker compose exec ollama ollama pull qwen3:8b
docker compose exec ollama ollama create parenting-qwen:8b -f /modelfiles/Modelfile
docker compose exec ollama ollama pull llava
docker compose exec ollama ollama pull qwen2.5vl:7b
docker compose exec openclaw openclaw onboard --auth-choice ollama --custom-base-url "http://ollama:11434" --skip-health --skip-channels --non-interactive --accept-risk
docker compose exec openclaw openclaw models set ollama/parenting-qwen:8b
```

**각 줄이 하는 일 / 소요시간**

| 줄 | 하는 일 | 대략 시간 |
|---|---|---|
| 1번째 | `qwen3:8b` 기본 모델 다운로드 (5GB 이상) | 몇 분 ~ 십몇 분 (인터넷 속도에 따라 다름) |
| 2번째 | `ai/ollama/Modelfile` 설정을 적용해 `parenting-qwen:8b` 커스텀 모델 생성 | 몇 초 (다운로드 아님) |
| 3번째 | 응가체크/피부체크용 비전 모델 `llava` 다운로드 | 몇 분 |
| 4번째 | 육아일기 AI 자동작성 전용 비전 모델 `qwen2.5vl:7b` 다운로드 | 몇 분 (5GB 이상) |
| 5번째 | OpenClaw 초기 설정(onboard), 기본 모델 다운로드 포함 | 몇 분 |
| 6번째 | OpenClaw 기본 모델을 `parenting-qwen:8b`로 지정 | 몇 초 (다운로드 아님) |

한 번 완료하면 `ollama_data`, `openclaw_data` 볼륨에 저장되기 때문에, 이후 `docker compose down`/`up`을 반복해도 다시 할 필요 없습니다. (단, `docker compose down -v`처럼 볼륨까지 지우면 다시 해야 합니다.)

**설치 확인**

```bat
docker compose exec ollama ollama list
```

`parenting-qwen:8b`가 목록에 보이면 정상입니다.

간단히 대화 테스트해보고 싶으면:

```bat
docker compose exec ollama ollama run parenting-qwen:8b
```

종료는 `/bye` 입력 또는 `Ctrl+D`.

(참고: `ai/ollama/setup-ollama.cmd`, `ai/openclaw/setup-openclaw.cmd`로 윈도우에 네이티브로 설치하는 방법도 별도로 존재합니다만, 도커 방식과는 **완전히 별개의 저장공간**입니다. 둘 다 포트 11434를 쓰기 때문에, 네이티브 Ollama가 이미 실행 중인 상태에서 도커의 `ollama` 컨테이너를 띄우면 포트 충돌이 날 수 있습니다. 네이티브 Ollama를 끄고 도커 쪽을 쓰거나, 둘 중 하나만 켜서 사용하세요.)

## 6. 종료 방법

로그가 흐르는 그 터미널 창에서 `Ctrl + C`.

또는 다른 터미널에서:

```bat
docker compose down
```

## 7. 문제 해결 (트러블슈팅)

### 포트 충돌 (3306, 8080)

로컬에 이미 MariaDB가 설치돼 있거나, IntelliJ 등에서 백엔드를 직접 실행 중이면 포트가 이미 사용 중이라 컨테이너가 안 뜰 수 있습니다.

- **3306(MariaDB) 충돌**: `docker-compose.yml`에서 이미 `3307:3306`으로 포트를 바꿔놨기 때문에 기본적으로는 문제 없습니다.
- **8080(백엔드) 충돌**: 로컬에서 IntelliJ 등으로 백엔드를 따로 실행해둔 상태라면, 그 프로세스를 먼저 종료(IntelliJ에서 stop 버튼)한 뒤 다시 `docker compose up --build` 실행하세요.

에러 메시지에 `bind: Only one usage of each socket address...`가 보이면 포트 충돌입니다.

### 이미지/컨테이너 정리하고 싶을 때

```bat
docker compose down
docker system prune
```

(주의: `docker system prune`은 사용 안 하는 이미지/캐시를 지우는 명령이라 다음 빌드가 다시 느려질 수 있습니다. 진짜 정리가 필요할 때만 사용하세요.)
