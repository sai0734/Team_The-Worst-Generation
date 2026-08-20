# OpenClaw 로컬 설정

OpenClaw와 Ollama는 Docker가 아닌 Windows 호스트에서 실행합니다.
기본 모델은 `../ollama`에서 준비한 `parenting-qwen:8b`입니다.

## 설치 전 준비

1. Ollama를 설치합니다.
2. `ai/ollama/setup-ollama.cmd`를 실행합니다.
3. `ollama list`에서 `parenting-qwen:8b`를 확인합니다.

시스템 Node.js 버전은 변경할 필요가 없습니다.
설치 스크립트가 OpenClaw 전용 Node.js 24.15.0을 다음 경로에 준비합니다.

```text
%LOCALAPPDATA%\BabyCare\openclaw
```

portable Node는 스크립트 실행 중에만 사용되며 프론트엔드 Node 환경과 사용자 PATH를 변경하지 않습니다.

## 최초 설치

CMD에서 `ai` 디렉터리로 이동한 뒤 실행합니다.

```bat
openclaw\setup-openclaw.cmd
```

스크립트가 수행하는 작업:

1. OpenClaw 전용 portable Node.js 24.15.0 준비
2. OpenClaw 2026.7.1-2 로컬 설치
3. OpenClaw와 `parenting-qwen:8b` 연결
4. `plugins/android-sms` 의존성 설치 및 테스트
5. Android SMS 플러그인 빌드·검증·설치

프로젝트의 `package-lock.json`을 사용하므로 팀원도 동일한 플러그인 의존성을 설치합니다.

## 실행

```bat
openclaw\setup-openclaw.cmd launch
```

이 명령은 같은 portable Node 환경에서 다음 명령을 실행합니다.

```text
ollama launch openclaw --model parenting-qwen:8b
```

## Gateway 상태 확인

```bat
openclaw\setup-openclaw.cmd status
```

기본 Gateway 주소:

```text
http://127.0.0.1:18789
```

## 백엔드 연동값

프로젝트 루트 `.env`에 각 PC의 값을 설정합니다.

```env
OPENCLAW_BASE_URL=http://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=
OPENCLAW_INTERNAL_KEY=
```

- `OPENCLAW_GATEWAY_TOKEN`: 백엔드가 OpenClaw Gateway를 호출할 때 사용
- `OPENCLAW_INTERNAL_KEY`: OpenClaw가 백엔드 콜백을 호출할 때 사용

Gateway Token은 최초 온보딩 후 다음 파일의 `gateway.auth.token`에서 확인할 수 있습니다.

```text
%USERPROFILE%\.openclaw\openclaw.json
```

실제 키는 README나 Git에 저장하지 않습니다.

## Android 문자 테스트 단계

안드로이드폰을 연결하기 전에는 `dryRun=true`로 실행합니다.

```text
백엔드 → OpenClaw Agent → android_sms_send → DRY_RUN
```

최종 시연 PC에서만 Termux SMS 브리지를 연결해 실제 SIM 문자를 발송합니다.
