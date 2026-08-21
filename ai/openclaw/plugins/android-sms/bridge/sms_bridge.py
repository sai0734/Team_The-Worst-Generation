#!/usr/bin/env python3
"""OpenClaw Android SMS 브리지. Termux 표준 라이브러리만 사용합니다."""

from __future__ import annotations

import hmac
import json
import os
import re
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

PHONE_PATTERN = re.compile(r"^01[016789][0-9]{7,8}$")
MAX_CONTENT_LENGTH = 2000
DEFAULT_PORT = 8787

sent_by_mission_id: dict[str, dict[str, Any]] = {}


def env_flag(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in {"1", "true", "yes"}


def require_key() -> str:
    key = os.environ.get("ANDROID_SMS_BRIDGE_KEY", "").strip()
    if not key:
        raise SystemExit("ANDROID_SMS_BRIDGE_KEY 환경변수가 필요합니다.")
    return key


def normalize_phone(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def send_sms(to: str, content: str) -> None:
    if env_flag("SMS_BRIDGE_DRY_RUN"):
        print(f"[DRY_RUN] to={to} content={content}", flush=True)
        return

    completed = subprocess.run(
        ["termux-sms-send", "-n", to, content],
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        detail = (completed.stderr or completed.stdout or "termux-sms-send failed").strip()
        raise RuntimeError(detail)


class SmsBridgeHandler(BaseHTTPRequestHandler):
    bridge_key = ""

    def log_message(self, format: str, *args: Any) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _unauthorized(self) -> bool:
        provided = self.headers.get("X-Android-Sms-Key", "")
        if provided.startswith("Bearer "):
            provided = provided[7:]
        auth = self.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            provided = provided or auth[7:]
        if not hmac.compare_digest(provided, self.bridge_key):
            self._send_json(401, {"error": "UNAUTHORIZED"})
            return True
        return False

    def do_GET(self) -> None:
        if self.path.rstrip("/") == "/health":
            self._send_json(200, {"ok": True, "dryRun": env_flag("SMS_BRIDGE_DRY_RUN")})
            return
        self._send_json(404, {"error": "NOT_FOUND"})

    def do_POST(self) -> None:
        if self.path.rstrip("/") != "/sms":
            self._send_json(404, {"error": "NOT_FOUND"})
            return
        if self._unauthorized():
            return

        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > 32_768:
            self._send_json(400, {"error": "INVALID_BODY"})
            return

        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._send_json(400, {"error": "INVALID_JSON"})
            return

        mission_id = str(payload.get("missionId") or "").strip()
        to = normalize_phone(str(payload.get("to") or ""))
        content = str(payload.get("content") or "").strip()

        if not mission_id or len(mission_id) > 128:
            self._send_json(400, {"error": "INVALID_MISSION_ID"})
            return
        if not PHONE_PATTERN.fullmatch(to):
            self._send_json(400, {"error": "INVALID_PHONE"})
            return
        if not content or len(content) > MAX_CONTENT_LENGTH:
            self._send_json(400, {"error": "INVALID_CONTENT"})
            return

        previous = sent_by_mission_id.get(mission_id)
        if previous:
            self._send_json(200, previous)
            return

        try:
            send_sms(to, content)
        except FileNotFoundError:
            self._send_json(503, {"error": "TERMUX_SMS_SEND_NOT_FOUND"})
            return
        except RuntimeError as error:
            self._send_json(502, {"error": "SMS_SEND_FAILED", "detail": str(error)})
            return

        result = {
            "missionId": mission_id,
            "provider": "ANDROID_SMS",
            "status": "DRY_RUN" if env_flag("SMS_BRIDGE_DRY_RUN") else "SUCCESS",
            "accepted": True,
            "to": to,
        }
        sent_by_mission_id[mission_id] = result
        self._send_json(200, result)


def main() -> None:
    key = require_key()
    port = int(os.environ.get("ANDROID_SMS_BRIDGE_PORT", DEFAULT_PORT))
    SmsBridgeHandler.bridge_key = key
    server = ThreadingHTTPServer(("0.0.0.0", port), SmsBridgeHandler)
    mode = "DRY_RUN" if env_flag("SMS_BRIDGE_DRY_RUN") else "LIVE"
    print(f"Android SMS bridge listening on 0.0.0.0:{port} ({mode})", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
