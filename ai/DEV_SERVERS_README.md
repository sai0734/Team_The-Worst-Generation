# 로컬 개발 서버 통합 실행

기존 터미널이나 IDE에서 실행한 프론트엔드, 백엔드, Python AI, OpenClaw 서버를 먼저 종료합니다.

최초 한 번 Python AI 서버의 가상환경과 의존성을 준비하면서 실행합니다.

```bat
start-dev.cmd --setup-python
```

그다음부터는 아래 명령만 사용합니다.

```bat
start-dev.cmd
```

실행되는 프로젝트 서버:

- 프론트엔드: `http://127.0.0.1:3000`
- Spring 백엔드: `http://127.0.0.1:8080`
- Python AI: `http://127.0.0.1:5000`
- OpenClaw Gateway: `http://127.0.0.1:18789`

상태만 확인하려면 다음 명령을 사용합니다.

```bat
start-dev.cmd --status
```

서버 로그는 사용자 임시 디렉터리의 `babycare-dev-logs`에 저장됩니다. 실행 화면에 정확한 경로가 표시됩니다.

실행 관리자는 기존 프로세스를 강제로 종료하지 않습니다. 필요한 포트가 이미 사용 중이면 시작하지 않고 해당 서버를 알려줍니다. 실행 관리자가 시작한 서버는 `Ctrl+C`를 누르면 함께 종료됩니다.

Ollama와 MariaDB는 공용 인프라이므로 이 실행 관리자가 종료하지 않습니다. OpenClaw를 실행하려면 Ollama가 먼저 실행 중이어야 하고, Spring이 사용하는 MariaDB도 별도로 준비되어 있어야 합니다.

