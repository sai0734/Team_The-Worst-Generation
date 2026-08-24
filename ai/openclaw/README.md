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

## Windows에서 안정적으로 실행

다른 PC에서는 먼저 한 번만 초기 설정을 실행합니다.

```bat
openclaw\setup-openclaw.cmd
```

`launch`를 바로 실행해도 설정 누락을 검사하고 필요한 초기 설정을 자동 복구합니다.
프로젝트 `.env`의 `OPENCLAW_GATEWAY_TOKEN`이 비어 있거나 잘못된 값이면
64자리 난수 토큰을 생성하고 Gateway 설정에도 같은 값을 적용합니다.

CMD 창과 무관하게 계속 실행하려면 Windows 예약 작업 서비스를 설치합니다.

```bat
openclaw\setup-openclaw.cmd install-service
```

운영 확인 명령:

```bat
openclaw\setup-openclaw.cmd status
openclaw\setup-openclaw.cmd doctor
openclaw\setup-openclaw.cmd restart-service
```

`doctor`는 portable Node, Ollama 모델, Gateway 설정,
`message-dispatcher` 에이전트, `android-sms` 플러그인과 연결 상태를 확인합니다.
서비스는 프로젝트의 `.env`를 다시 읽기 때문에 실제 문자 브리지 URL과 키도
CMD 창의 임시 환경변수에 의존하지 않습니다.

## Android 문자 테스트 단계

문자 테스트도 항상 실제 안드로이드 SMS 브리지를 거칩니다.

```text
백엔드 → OpenClaw Agent → android_sms_send → Android SMS 브리지 → 실제 문자
```

브리지 스크립트는 `plugins/android-sms/bridge/sms_bridge.py` 에 있습니다.
Termux에서 이 스크립트를 켜고, PC에 아래 값을 넣습니다.

```env
ANDROID_SMS_BRIDGE_URL=http://폰IP:8787
ANDROID_SMS_BRIDGE_KEY=
```

브리지가 연결되지 않았거나 설정값이 없으면 발송은 실패로 반환됩니다.
상세 절차는 `plugins/android-sms/README.md`를 참고하세요.

## 문자 발송 로그 확인

문자 흐름은 모든 단계에서 같은 `missionId`를 기록합니다.

- 백엔드: 기본 `baby_back/logs/baby-back.log`
- OpenClaw: `%LOCALAPPDATA%\Temp\openclaw\openclaw-YYYY-MM-DD.log`
- 안드로이드 Termux: 기본 `~/sms-bridge.log`

백엔드 로그 경로는 `BACKEND_LOG_FILE`, 휴대폰 로그 경로는
`SMS_BRIDGE_LOG_FILE` 환경변수로 바꿀 수 있습니다.

다른 컴퓨터에서 실패하면 백엔드 로그의 `missionId`를 복사하여
OpenClaw 로그와 휴대폰 로그에서 같은 값을 검색합니다.
