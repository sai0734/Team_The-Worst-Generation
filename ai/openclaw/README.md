# OpenClaw 설정

리콜 자동알림, 정부지원금 매칭처럼 백그라운드에서 스스로 도는(크론/자동 감시) 기능은
OpenClaw를 거쳐서 `../ollama` 쪽에서 준비한 Ollama 모델(`parenting-qwen:8b`)을 사용합니다.
사용자 요청에 즉석으로 답만 하면 되는 기능은 OpenClaw 없이 `/api/chat` 직접 호출로 충분합니다.

## 설치 전 준비물

- Node.js 24.15 이상 (nvm-windows로 설치 추천, 공식 인스톨러로 이미 있다면 버전만 확인)
- `ai/ollama/setup-ollama.cmd`까지 먼저 끝내서 `parenting-qwen:8b`가 `ollama list`에 떠 있어야 함

## 설치

명령 프롬프트에서 `ai` 디렉터리로 이동한 후 다음 스크립트를 실행합니다.

```bat
openclaw\setup-openclaw.cmd
```

스크립트는 다음 작업을 수행합니다.

1. `openclaw` CLI 전역 설치 (`npm install -g openclaw@latest`)
2. Gateway/워크스페이스 준비 (온보딩, 인증은 ollama로)
3. 기본 모델을 `parenting-qwen:8b`로 고정

주의: 2번 온보딩 과정에서 OpenClaw가 자기 기본값으로 `gemma4`라는 모델(약 9.6GB)을
처음 한 번 자동으로 받으려고 시도합니다. 막을 방법이 없어서 정상 동작이니 그냥 기다리면 됩니다.
3번 단계에서 자동으로 `parenting-qwen:8b`로 덮어씌웁니다.

Gateway는 Windows 예약 작업(`OpenClaw Gateway`)으로 등록되어 로그인 시 자동 실행됩니다.

## 설치 확인

```bat
openclaw models status
openclaw gateway status
openclaw agent --agent main --message "안녕"
```

마지막 명령이 정상적으로 한국어 답변을 돌려주면 연결 완료입니다.

## 백엔드 연동값

baby_back의 `application.properties`에 아래 항목이 이미 준비되어 있습니다.

```properties
openclaw.internal-key=${OPENCLAW_INTERNAL_KEY:}
```

`OPENCLAW_INTERNAL_KEY`는 OpenClaw가 baby_back으로 결과를 보고할 때(`/api/openclaw/**` 경로)
본인임을 증명하는 값입니다. 비밀값이라 이 문서에는 적지 않으니, 팀 내 별도 채널로 공유받아
각자 PC에 사용자 환경변수로 설정하세요.
