"""Start and supervise the BabyCare local development servers.

This launcher deliberately refuses to take over an occupied port. Stop old
IDE/terminal processes once before using it; after that, Ctrl+C stops only the
processes started by this launcher.
"""

from __future__ import annotations

import argparse
import os
import shutil
import signal
import socket
import subprocess
import sys
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
OPENCLAW_ROOT = AI_ROOT / "openclaw"
ROOT_ENV = PROJECT_ROOT / ".env"
LOG_ROOT = Path(tempfile.gettempdir()) / "babycare-dev-logs"


@dataclass(frozen=True)
class Service:
    name: str
    port: int
    cwd: Path
    command: list[str]
    health_url: str | None = None
    startup_timeout_seconds: int = 120


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
    parser.add_argument(
        "--status",
        action="store_true",
        help="Show local server port status without starting anything.",
    )
    parser.add_argument(
        "--setup-python",
        action="store_true",
        help="Create ai-server/.venv and install its requirements before starting.",
    )
    return parser.parse_args()


def load_root_env() -> dict[str, str]:
    child_env = os.environ.copy()
    if not ROOT_ENV.is_file():
        return child_env

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
        child_env.setdefault(key, value)

    return child_env


def is_port_open(port: int, timeout: float = 0.25) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=timeout):
            return True
    except OSError:
        return False


def is_healthy(service: Service) -> bool:
    if not is_port_open(service.port):
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
    return candidate if candidate.is_file() else Path(sys.executable)


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
    return executable


def python_server_ready(executable: Path) -> bool:
    completed = subprocess.run(
        [str(executable), "-c", "import fastapi, pydantic, uvicorn"],
        cwd=PYTHON_SERVER_ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return completed.returncode == 0


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
            name="openclaw",
            port=18789,
            cwd=AI_ROOT,
            command=windows_batch_command(str(openclaw_script), "launch"),
            startup_timeout_seconds=180,
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
            command=windows_batch_command(
                npm_command,
                "run",
                "dev",
                "--",
                "--host",
                "127.0.0.1",
            ),
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
        print(f"  {service.name:<10} {status:<4} 127.0.0.1:{service.port}")
    ollama_status = "UP" if is_port_open(11434) else "DOWN"
    print(f"  {'ollama':<10} {ollama_status:<4} 127.0.0.1:11434 (prerequisite)")


def create_process(service: Service, child_env: dict[str, str]) -> ManagedProcess:
    LOG_ROOT.mkdir(parents=True, exist_ok=True)
    log_path = LOG_ROOT / f"{service.name}.log"
    log_file = log_path.open("ab", buffering=0)

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
        content = path.read_bytes().decode("utf-8", errors="replace")
    except OSError:
        return ""
    return "\n".join(content.splitlines()[-line_count:])


def wait_for_service(managed: ManagedProcess) -> bool:
    deadline = time.monotonic() + managed.service.startup_timeout_seconds
    while time.monotonic() < deadline:
        if managed.process.poll() is not None:
            return False
        if is_healthy(managed.service):
            return True
        time.sleep(0.5)
    return False


def stop_process(managed: ManagedProcess) -> None:
    process = managed.process
    if process.poll() is not None:
        managed.log_file.close()
        return

    print(f"[stop] {managed.service.name}")
    try:
        if os.name == "nt":
            process.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            process.terminate()
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
    occupied = [service for service in services if is_port_open(service.port)]
    if occupied:
        print("[error] Stop the existing project servers before using this launcher:")
        for service in occupied:
            print(f"  - {service.name}: 127.0.0.1:{service.port}")
        print("No existing process was terminated.")
        return 2

    child_env = load_root_env()
    managed_processes: list[ManagedProcess] = []
    try:
        print(f"[logs] {LOG_ROOT}")
        for service in services:
            print(f"[start] {service.name} -> 127.0.0.1:{service.port}")
            managed = create_process(service, child_env)
            managed_processes.append(managed)
            if not wait_for_service(managed):
                print(f"[error] {service.name} did not become ready.")
                recent_log = tail_log(managed.log_path)
                if recent_log:
                    print(f"\n--- {service.name} log ---\n{recent_log}\n")
                return 1
            print(f"[ready] {service.name}")

        print("\nAll project servers are ready. Press Ctrl+C to stop them.\n")
        print_status(services)

        while True:
            for managed in managed_processes:
                exit_code = managed.process.poll()
                if exit_code is not None:
                    print(
                        f"[error] {managed.service.name} exited unexpectedly "
                        f"with code {exit_code}."
                    )
                    recent_log = tail_log(managed.log_path)
                    if recent_log:
                        print(f"\n--- {managed.service.name} log ---\n{recent_log}\n")
                    return 1
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping BabyCare development servers...")
        return 0
    finally:
        for managed in reversed(managed_processes):
            stop_process(managed)


def main() -> int:
    args = parse_args()
    executable = setup_python_environment() if args.setup_python else python_executable()
    services = build_services(executable)

    if args.status:
        print_status(services)
        return 0

    errors = validate_project_files(services)
    if errors:
        for error in errors:
            print(f"[error] {error}")
        return 2

    if not python_server_ready(executable):
        print("[error] Python AI server dependencies are not installed.")
        print("Run: start-dev.cmd --setup-python")
        return 2

    if not (FRONTEND_ROOT / "node_modules").is_dir():
        print("[error] Frontend dependencies are not installed.")
        print("Run npm install in baby_front first.")
        return 2

    return run(services)


if __name__ == "__main__":
    raise SystemExit(main())

