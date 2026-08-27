from __future__ import annotations

import logging
import os
import time
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, wait
from functools import lru_cache
from html import unescape
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[4]
load_dotenv(PROJECT_ROOT / ".env")

NATIONAL_DETAIL_URL = (
    "https://apis.data.go.kr/B554287/"
    "NationalWelfareInformationsV001/NationalWelfaredetailedV001"
)
LOCAL_DETAIL_URL = (
    "https://apis.data.go.kr/B554287/"
    "LocalGovernmentWelfareInformations/LcgvWelfaredetailed"
)

DETAIL_MAX_WORKERS = 5
DETAIL_MAX_RETRIES = 1
DETAIL_TIMEOUT = (2, 6)
DETAIL_ASK_BUDGET_SECONDS = 4.0

logger = logging.getLogger(__name__)


def _limit_text(value: Any, max_chars: int) -> str:
    text = unescape(str(value or "")).replace("\r", "").strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip() + "…"


def _parse_detail_xml(content: bytes) -> dict[str, str]:
    root = ET.fromstring(content)
    result_code = (root.findtext("resultCode") or "0").strip()
    if result_code not in {"0", "00"}:
        result_message = (root.findtext("resultMessage") or "UNKNOWN").strip()
        raise ValueError(f"DATA_GO_KR_{result_code}: {result_message}")

    values: dict[str, list[str]] = {}
    for element in root.iter():
        text = unescape(element.text or "").strip()
        if len(element) == 0 and text and element.tag not in {"resultCode", "resultMessage"}:
            values.setdefault(element.tag, []).append(text)

    return {
        key: "\n".join(dict.fromkeys(items))
        for key, items in values.items()
    }


@lru_cache(maxsize=1024)
def _fetch_detail(source: str, service_id: str) -> dict[str, str]:
    service_key = os.environ.get("DATA_GO_KR_SERVICE_KEY", "").strip()
    if not service_key:
        return {}

    url = NATIONAL_DETAIL_URL if source == "복지로 중앙부처" else LOCAL_DETAIL_URL
    last_error: Exception | None = None
    for attempt in range(1, DETAIL_MAX_RETRIES + 1):
        try:
            response = requests.get(
                url,
                params={
                    "serviceKey": service_key,
                    "callTp": "D",
                    "servId": service_id,
                },
                timeout=DETAIL_TIMEOUT,
            )
            response.raise_for_status()
            return _parse_detail_xml(response.content)
        except (requests.RequestException, ET.ParseError, ValueError) as error:
            last_error = error
            if attempt < DETAIL_MAX_RETRIES:
                time.sleep(attempt)

    logger.warning(
        "SUBSIDY_DETAIL_FAILED source=%s serviceId=%s reason=%s",
        source,
        service_id,
        last_error,
    )
    return {}


def _indexed_text(document: str, metadata: dict[str, Any]) -> str:
    parts = [
        f"정책명: {metadata.get('title', '')}",
        f"지역: {metadata.get('sido', '')} {metadata.get('sigungu', '')}".strip(),
        f"목록 요약: {_limit_text(document, 700)}",
    ]
    fields = (
        ("지원 대상", _limit_text(metadata.get("target"), 900)),
        ("신청 방식", _limit_text(metadata.get("application_method"), 300)),
        ("담당기관", _limit_text(metadata.get("organization"), 300)),
    )
    parts.extend(f"{label}: {value}" for label, value in fields if value)
    return _with_official_link(parts, metadata)


def _detail_text(
    document_id: str,
    document: str,
    metadata: dict[str, Any],
) -> str:
    service_id = document_id.split("-", 1)[-1]
    source = str(metadata.get("source") or "")
    detail = _fetch_detail(source, service_id)

    target = detail.get("tgtrDtlCn") or detail.get("sprtTrgtCn") or metadata.get("target")
    criteria = detail.get("slctCritCn")
    benefit = detail.get("alwServCn")
    application = detail.get("aplyMtdCn") or detail.get("servSeDetailLink")
    application_type = detail.get("aplyMtdNm") or metadata.get("application_method")
    contact = detail.get("rprsCtadr")

    parts = [
        f"정책명: {metadata.get('title', '')}",
        f"지역: {metadata.get('sido', '')} {metadata.get('sigungu', '')}".strip(),
        f"목록 요약: {_limit_text(document, 700)}",
    ]
    fields = (
        ("지원 대상", _limit_text(target, 900)),
        ("선정 기준", _limit_text(criteria, 1600)),
        ("지원 내용", _limit_text(benefit, 1600)),
        ("신청 방법", _limit_text(application, 1000)),
        ("신청 방식", _limit_text(application_type, 300)),
        ("문의처", _limit_text(contact, 300)),
    )
    parts.extend(f"{label}: {value}" for label, value in fields if value)
    return _with_official_link(parts, metadata)


def _with_official_link(parts: list[str], metadata: dict[str, Any]) -> str:
    link = str(metadata.get("link") or "").strip()
    if link:
        parts.append(f"공식 링크: {link}")
    return "\n".join(parts)


def build_detail_context(
    candidates: list[tuple[str, str, dict[str, Any]]],
    timeout_seconds: float = DETAIL_ASK_BUDGET_SECONDS,
) -> list[str]:
    if not candidates:
        return []

    executor = ThreadPoolExecutor(
        max_workers=min(DETAIL_MAX_WORKERS, len(candidates)),
        thread_name_prefix="subsidy-detail",
    )
    try:
        futures = [executor.submit(_detail_text, *row) for row in candidates]
        done, _not_done = wait(futures, timeout=timeout_seconds)
        contexts: list[str] = []
        for future, (_document_id, document, metadata) in zip(futures, candidates):
            if future in done:
                try:
                    contexts.append(future.result())
                    continue
                except Exception as error:
                    logger.warning("SUBSIDY_DETAIL_CONTEXT_FAILED reason=%s", error)
            contexts.append(_indexed_text(document, metadata))
        return contexts
    finally:
        executor.shutdown(wait=False, cancel_futures=True)


def clear_detail_cache() -> None:
    _fetch_detail.cache_clear()
