"""Start and supervise the BabyCare local development servers.

This launcher deliberately refuses to take over an occupied port. Stop old
IDE/terminal processes once before using it; after that, Ctrl+C stops only the
processes started by this launcher.
"""

from __future__ import annotations

import argparse
import os
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import venv
from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO


AI_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = AI_ROOT.parent
BACKEND_ROOT = PROJECT_ROOT / "baby_back"
FRONTEND_ROOT = PROJECT_ROOT / "baby_front"
PYTHON_SERVER_ROOT = AI_ROOT / "ai-server"
SUBSIDY_INDEX_SCRIPT = PYTHON_SERVER_ROOT / "training" / "index_subsidies.py"
OPENCLAW_ROOT = AI_ROOT / "openclaw"
ROOT_ENV = PROJECT_ROOT / ".env"
LOG_ROOT = Path(tempfile.gettempdir()) / "babycare-dev-logs"
STOP_REQUEST_FILE = LOG_ROOT / "stop-requested"


@dataclass(frozen=True)
class Service:
    name: str
    port: int
    cwd: Path
    command: list[str]
    host: str = "127.0.0.1"
    health_url: str | None = None
    startup_timeout_seconds: int = 120
    required: bool = True


@dataclass
class ManagedProcess:
    service: Service
    process: subprocess.Popen[bytes]
    log_file: BinaryIO
    log_path: Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Start the BabyCare backend, frontend, Python AI, and OpenClaw servers.",
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--status",
        action="store_true",
        help="Show local server port status without starting anything.",
    )
    mode.add_argument(
        "--stop",
        action="store_true",
        help="Stop project servers listening on the four configured ports.",
    )
    mode.add_argument(
        "--restart",
        action="store_true",
        help="Stop project servers on the configured ports, then start them.",
    )
    parser.add_argument(
        "--setup-python",
        action="store_true",
        help="Create ai-server/.venv and install its requirements before starting.",
    )
    return parser.parse_args()


def read_root_env() -> dict[str, str]:
    values: dict[str, str] = {}
    if not ROOT_ENV.is_file():
        return values

    for raw_line in ROOT_ENV.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            continue
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        values[key] = value

    return values


def load_root_env() -> dict[str, str]:
    child_env = os.environ.copy()
    child_env.update(read_root_env())

    return child_env


def is_port_open(
    port: int,
    timeout: float = 0.25,
    host: str = "127.0.0.1",
) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def is_healthy(service: Service) -> bool:
    if not is_port_open(service.port, host=service.host):
        return False
    if service.health_url is None:
        return True

    try:
        with urllib.request.urlopen(service.health_url, timeout=1.5) as response:
            return 200 <= response.status < 400
    except (OSError, urllib.error.URLError):
        return False


def python_executable() -> Path:
    if os.name == "nt":
        candidate = PYTHON_SERVER_ROOT / ".venv" / "Scripts" / "python.exe"
    else:
        candidate = PYTHON_SERVER_ROOT / ".venv" / "bin" / "python"
    return candidate


def setup_python_environment() -> Path:
    environment_root = PYTHON_SERVER_ROOT / ".venv"
    if not environment_root.exists():
        print("[setup] Creating Python virtual environment...")
        venv.EnvBuilder(with_pip=True).create(environment_root)

    executable = python_executable()
    print("[setup] Installing Python AI server requirements...")
    subprocess.run(
        [
            str(executable),
            "-m",
            "pip",
            "install",
            "-r",
            str(PYTHON_SERVER_ROOT / "requirements.txt"),
        ],
        cwd=PYTHON_SERVER_ROOT,
        check=True,
    )
    print("[setup] Preparing local Korean TTS model...")
    subprocess.run(
        [
            str(executable),
            str(PYTHON_SERVER_ROOT / "scripts" / "setup_tts.py"),
        ],
        cwd=PYTHON_SERVER_ROOT,
        env=load_root_env(),
        check=True,
    )
    return executable


def python_server_dependency_error(executable: Path) -> str | None:
    if not executable.is_file():
        return f"Python virtual environment is missing: {executable}"
    completed = subprocess.run(
        [
            str(executable),
            "-c",
            (
                "import importlib, sys; "
                "modules=sys.argv[1:]; errors=[]; "
                "exec(\"for module in modules:\\n"
                " try:\\n  importlib.import_module(module)\\n"
                " except Exception as error:\\n"
                "  errors.append(f'{module}: {type(error).__name__}: {error}')\"); "
                "print('\\n'.join(errors)); sys.exit(bool(errors))"
            ),
            "fastapi",
            "piper",
            "pydantic",
            "sherpa_onnx",
            "uvicorn",
        ],
        cwd=PYTHON_SERVER_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    if completed.returncode == 0:
        return None
    details = completed.stdout.strip() or completed.stderr.strip()
    return details or "Unknown Python dependency error"

def subsidy_index_is_empty(executable: Path) -> bool:
    completed = subprocess.run(
        [
            str(executable),
            "-c",
            (
                "import chromadb; "
                "client = chromadb.PersistentClient(path='data/chroma_subsidies');"
                "print(client.get_or_create_collection('subsidies').count())"
            ),
        ],
        cwd=PYTHON_SERVER_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    if completed.returncode != 0:
        return True
    return completed.stdout.strip() in("", "0")

def ensure_subsidy_index(executable: Path, child_env: dict[str, str]) -> None:
    if not subsidy_index_is_empty(executable):
        return
    # 정부지원금 데이터 비었으면 이 명령어 자동실행시켜서 채워넣음
    print("[index] Subsidy vector DB is empty. Running training/index_subsidies.py once...")
    completed = subprocess.run(
        [str(executable), str(SUBSIDY_INDEX_SCRIPT)],
        cwd=PYTHON_SERVER_ROOT,
        env=child_env,
        check=False,
    )
    if completed.returncode != 0:
        print("[warining] Subsidy indexing failed; subsidy search wil return empty results until it succeeds.")
    else:
        print("[index] Subsidy vector DB indexed.")


def windows_batch_command(script_or_command: str, *arguments: str) -> list[str]:
    if os.name != "nt":
        return [script_or_command, *arguments]
    command_shell = os.environ.get("COMSPEC", "cmd.exe")
    return [command_shell, "/d", "/c", script_or_command, *arguments]


def build_services(executable: Path) -> list[Service]:
    gradle_wrapper = (
        BACKEND_ROOT / ("gradlew.bat" if os.name == "nt" else "gradlew")
    )
    npm_command = shutil.which("npm.cmd" if os.name == "nt" else "npm") or "npm"
    openclaw_script = OPENCLAW_ROOT / "setup-openclaw.cmd"

    return [
        Service(
            name="python-ai",
            port=5000,
            cwd=PYTHON_SERVER_ROOT,
            command=[
                str(executable),
                "-m",
                "uvicorn",
                "main:app",
                "--reload",
                "--host",
                "127.0.0.1",
                "--port",
                "5000",
            ],
            health_url="http://127.0.0.1:5000/health",
        ),
        Service(
            name="backend",
            port=8080,
            cwd=BACKEND_ROOT,
            command=windows_batch_command(str(gradle_wrapper), "bootRun"),
            startup_timeout_seconds=180,
        ),
        Service(
            name="frontend",
            port=3000,
            cwd=FRONTEND_ROOT,
            command=windows_batch_command(npm_command, "run", "dev"),
            host="localhost",
        ),
        Service(
            name="openclaw",
            port=18789,
            cwd=AI_ROOT,
            command=windows_batch_command(str(openclaw_script), "launch"),
            startup_timeout_seconds=180,
            required=False,
        ),
    ]


def validate_project_files(services: list[Service]) -> list[str]:
    errors: list[str] = []
    required_paths = [
        BACKEND_ROOT / ("gradlew.bat" if os.name == "nt" else "gradlew"),
        FRONTEND_ROOT / "package.json",
        PYTHON_SERVER_ROOT / "main.py",
        OPENCLAW_ROOT / "setup-openclaw.cmd",
    ]
    for required_path in required_paths:
        if not required_path.exists():
            errors.append(f"Required file is missing: {required_path}")

    for service in services:
        if not service.cwd.is_dir():
            errors.append(f"Working directory is missing: {service.cwd}")
    return errors


def print_status(services: list[Service]) -> None:
    print("BabyCare local server status")
    for service in services:
        status = "UP" if is_healthy(service) else "DOWN"
        print(f"  {service.name:<10} {status:<4} {service.host}:{service.port}")
    ollama_status = "UP" if is_port_open(11434) else "DOWN"
    print(f"  {'ollama':<10} {ollama_status:<4} 127.0.0.1:11434 (prerequisite)")


def windows_listener_pids(port: int) -> set[int]:
    if os.name != "nt":
        return set()

    completed = subprocess.run(
        ["netstat", "-ano"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    process_ids: set[int] = set()
    for line in completed.stdout.splitlines():
        columns = line.split()
        if len(columns) < 5 or columns[0].upper() != "TCP":
            continue
        if columns[3].upper() != "LISTENING":
            continue
        if columns[1].rsplit(":", 1)[-1] != str(port):
            continue
        try:
            process_id = int(columns[4])
        except ValueError:
            continue
        if process_id > 0 and process_id != os.getpid():
            process_ids.add(process_id)
    return process_ids


def terminate_windows_process_tree(process_id: int) -> None:
    subprocess.run(
        ["taskkill", "/PID", str(process_id), "/T", "/F"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )


def stop_existing_services(services: list[Service]) -> bool:
    if os.name != "nt":
        print("[error] --stop and --restart are currently supported on Windows only.")
        return False

    listeners: list[tuple[Service, set[int]]] = []
    for service in services:
        process_ids = windows_listener_pids(service.port)
        if process_ids:
            listeners.append((service, process_ids))

    if not listeners:
        print("No project servers are running.")
        return True

    LOG_ROOT.mkdir(parents=True, exist_ok=True)
    STOP_REQUEST_FILE.write_text("stop\n", encoding="utf-8")
    for service, process_ids in listeners:
        print(
            f"[stop] {service.name} {service.host}:{service.port} "
            f"pid={','.join(map(str, sorted(process_ids)))}"
        )
        for process_id in process_ids:
            terminate_windows_process_tree(process_id)

    deadline = time.monotonic() + 8
    while time.monotonic() < deadline:
        if not any(
            is_port_open(service.port, host=service.host)
            for service in services
        ):
            time.sleep(1.25)
            print("All project servers are stopped.")
            return True
        time.sleep(0.25)

    print("[error] Some project server ports are still occupied:")
    for service in services:
        if is_port_open(service.port, host=service.host):
            print(f"  - {service.name}: {service.host}:{service.port}")
    return False


def create_process(service: Service, child_env: dict[str, str]) -> ManagedProcess:
    LOG_ROOT.mkdir(parents=True, exist_ok=True)
    log_path = LOG_ROOT / f"{service.name}.log"
    log_file = log_path.open("wb", buffering=0)

    creation_flags = 0
    if os.name == "nt":
        creation_flags = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW

    process = subprocess.Popen(
        service.command,
        cwd=service.cwd,
        env=child_env,
        stdin=subprocess.DEVNULL,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        creationflags=creation_flags,
    )
    return ManagedProcess(service, process, log_file, log_path)


def tail_log(path: Path, line_count: int = 20) -> str:
    try:
        raw_content = path.read_bytes()
        try:
            content = raw_content.decode("utf-8")
        except UnicodeDecodeError:
            content = raw_content.decode("cp949", errors="replace")
    except OSError:
        return ""
    return "\n".join(content.splitlines()[-line_count:])


def wait_for_service(managed: ManagedProcess) -> bool:
    deadline = time.monotonic() + managed.service.startup_timeout_seconds
    next_progress = time.monotonic() + 10
    while time.monotonic() < deadline:
        if managed.process.poll() is not None:
            return False
        if is_healthy(managed.service):
            return True
        if time.monotonic() >= next_progress:
            print(f"[wait] {managed.service.name} is still starting...")
            next_progress = time.monotonic() + 10
        time.sleep(0.5)
    return False


def stop_process(managed: ManagedProcess) -> None:
    process = managed.process
    print(f"[stop] {managed.service.name}")
    try:
        if os.name == "nt":
            if process.poll() is None:
                terminate_windows_process_tree(process.pid)
            for process_id in windows_listener_pids(managed.service.port):
                terminate_windows_process_tree(process_id)
        else:
            if process.poll() is None:
                process.terminate()
        if process.poll() is None:
            process.wait(timeout=8)
    except (OSError, subprocess.TimeoutExpired):
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/PID", str(process.pid), "/T", "/F"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        else:
            process.kill()
    finally:
        managed.log_file.close()


def run(services: list[Service]) -> int:
    STOP_REQUEST_FILE.unlink(missing_ok=True)
    occupied = [
        service
        for service in services
        if is_port_open(service.port, host=service.host)
    ]
    if occupied:
        print("[error] Stop the existing project servers before using this launcher:")
        for service in occupied:
            print(f"  - {service.name}: {service.host}:{service.port}")
        print("No existing process was terminated.")
        return 2

    child_env = load_root_env()
    root_env_values = read_root_env()
    if ROOT_ENV.is_file():
        print(f"[env] Loaded {len(root_env_values)} variables from {ROOT_ENV}")
    else:
        print(f"[env] Root environment file is missing: {ROOT_ENV}")
        ensure_subsidy_index(python_executable(), child_env)
    managed_processes: list[ManagedProcess] = []
    try:
        print(f"[logs] {LOG_ROOT}")
        for service in services:
            print(f"[start] {service.name} -> {service.host}:{service.port}")
            managed = create_process(service, child_env)
            managed_processes.append(managed)
            if not wait_for_service(managed):
                level = "error" if service.required else "warning"
                print(f"[{level}] {service.name} did not become ready.")
                recent_log = tail_log(managed.log_path)
                if recent_log:
                    print(f"\n--- {service.name} log ---\n{recent_log}\n")
                if service.required:
                    return 1
                managed_processes.pop()
                stop_process(managed)
                continue
            print(f"[ready] {service.name}")

        print("\nAll project servers are ready. Press Ctrl+C to stop them.\n")
        print_status(services)

        while True:
            if STOP_REQUEST_FILE.is_file():
                print("\nStop requested by stop-dev.cmd.")
                return 0
            for managed in list(managed_processes):
                exit_code = managed.process.poll()
                if exit_code is not None:
                    level = "error" if managed.service.required else "warning"
                    print(f"[{level}] {managed.service.name} exited unexpectedly with code {exit_code}.")
                    recent_log = tail_log(managed.log_path)
                    if recent_log:
                        print(f"\n--- {managed.service.name} log ---\n{recent_log}\n")
                    if managed.service.required:
                        return 1
                    managed.log_file.close()
                    managed_processes.remove(managed)
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping BabyCare development servers...")
        return 0
    finally:
        for managed in reversed(managed_processes):
            stop_process(managed)
        STOP_REQUEST_FILE.unlink(missing_ok=True)


def main() -> int:
    args = parse_args()
    executable = setup_python_environment() if args.setup_python else python_executable()
    services = build_services(executable)

    if args.status:
        print_status(services)
        return 0

    if args.stop:
        return 0 if stop_existing_services(services) else 1

    if args.restart and not stop_existing_services(services):
        return 1

    errors = validate_project_files(services)
    if errors:
        for error in errors:
            print(f"[error] {error}")
        return 2

    dependency_error = python_server_dependency_error(executable)
    if dependency_error:
        print("[error] Python AI server dependencies are not installed.")
        print(dependency_error)
        print("Run: start-dev.cmd --setup-python")
        return 2

    if not (FRONTEND_ROOT / "node_modules").is_dir():
        print("[error] Frontend dependencies are not installed.")
        print("Run npm install in baby_front first.")
        return 2

    return run(services)


if __name__ == "__main__":
    raise SystemExit(main())

