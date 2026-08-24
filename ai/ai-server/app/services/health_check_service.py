import json
import os
import urllib.error
import urllib.request

from fastapi import HTTPException


class HealthCheckService:
    """Ollama vision-model boundary for baby skin/stool photo checks."""

    def __init__(self) -> None:
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
        self.model = os.getenv("OLLAMA_VISION_MODEL", "baby-vision")

    def check(self, prompt: str, image_base64: str) -> str:
        body = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt, "images": [image_base64]}
            ],
            "think": False,
            "stream": False,
        }
        request = urllib.request.Request(
            f"{self.base_url}/api/chat",
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, urllib.error.HTTPError) as exc:
            raise HTTPException(status_code=502, detail=f"Ollama 호출 실패: {exc}") from exc

        return payload["message"]["content"]