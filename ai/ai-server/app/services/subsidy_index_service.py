from __future__ import annotations

import logging
import os
import threading
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[4]
load_dotenv(PROJECT_ROOT / ".env")

NATIONAL_URL = (
    "https://apis.data.go.kr/B554287/"
    "NationalWelfareInformationsV001/NationalWelfarelistV001"
)
LOCAL_URL = (
    "https://apis.data.go.kr/B554287/"
    "LocalGovernmentWelfareInformations/LcgvWelfarelist"
)

PAGE_SIZE = 100
INDEX_BATCH_SIZE = 128
MAX_RETRIES = 3
REQUEST_TIMEOUT = (5, 60)
PARENTING_LIFE_CODES = ("001", "002", "007")

logger = logging.getLogger(__name__)
_reindex_lock = threading.Lock()
_last_result: dict[str, Any] = {
    "success": False,
    "running": False,
    "message": "아직 정책 색인을 실행하지 않았습니다.",
    "totalCount": 0,
    "insertedCount": 0,
    "updatedCount": 0,
    "unchangedCount": 0,
    "deletedCount": 0,
    "startedAt": None,
    "completedAt": None,
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_xml_response(xml_text: str) -> tuple[list[dict[str, str]], int]:
    root = ET.fromstring(xml_text)
    result_code = (root.findtext("resultCode") or "0").strip()
    if result_code not in {"0", "00"}:
        result_message = (root.findtext("resultMessage") or "UNKNOWN").strip()
        raise ValueError(f"DATA_GO_KR_{result_code}: {result_message}")

    items = [
        {child.tag: (child.text or "").strip() for child in element}
        for element in root.iter("servList")
    ]
    if not items:
        items = [
            {child.tag: (child.text or "").strip() for child in element}
            for element in root.iter("item")
        ]

    total_text = (root.findtext("totalCount") or str(len(items))).strip()
    return items, int(total_text or len(items))


def _parse_json_response(payload: dict[str, Any]) -> tuple[list[dict[str, Any]], int]:
    container = payload.get("wantedList", payload)
    result_code = str(container.get("resultCode", "0")).strip()
    if result_code not in {"0", "00"}:
        result_message = str(container.get("resultMessage", "UNKNOWN")).strip()
        raise ValueError(f"DATA_GO_KR_{result_code}: {result_message}")

    items = container.get("servList", [])
    if isinstance(items, dict):
        items = [items]
    if not isinstance(items, list):
        items = []

    total = int(container.get("totalCount") or len(items))
    return items, total


def _request_page(
    session: requests.Session,
    url: str,
    params: dict[str, Any],
) -> tuple[list[dict[str, Any]], int]:
    last_error: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = session.get(
                url,
                params=params,
                timeout=REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            body = response.text.strip()
            if body.startswith("<"):
                return _parse_xml_response(body)
            return _parse_json_response(response.json())
        except (requests.RequestException, ValueError, ET.ParseError) as error:
            last_error = error
            logger.warning(
                "SUBSIDY_FETCH_RETRY page=%s attempt=%s/%s reason=%s",
                params.get("pageNo"),
                attempt,
                MAX_RETRIES,
                error,
            )
            if attempt < MAX_RETRIES:
                time.sleep(2 ** (attempt - 1))

    raise RuntimeError("정부지원금 공공데이터 조회에 실패했습니다.") from last_error


def _fetch_all(
    session: requests.Session,
    service_key: str,
    url: str,
    extra_params: dict[str, Any],
) -> list[dict[str, Any]]:
    collected: list[dict[str, Any]] = []
    page_no = 1
    total_count: int | None = None

    while total_count is None or len(collected) < total_count:
        params = {
            "serviceKey": service_key,
            "callTp": "L",
            "srchKeyCode": "001",
            "pageNo": page_no,
            "numOfRows": PAGE_SIZE,
            "type": "json",
            **extra_params,
        }
        items, reported_total = _request_page(session, url, params)
        total_count = reported_total
        collected.extend(items)

        logger.info(
            "SUBSIDY_FETCH_PAGE source=%s page=%s received=%s collected=%s total=%s",
            "NATIONAL" if url == NATIONAL_URL else "LOCAL",
            page_no,
            len(items),
            len(collected),
            total_count,
        )

        if not items:
            break
        page_no += 1

    if total_count and len(collected) < total_count:
        raise RuntimeError(
            f"정부지원금 페이지 수집이 완전하지 않습니다: {len(collected)}/{total_count}"
        )
    return collected


def _fetch_parenting_items(
    session: requests.Session,
    service_key: str,
    url: str,
) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for life_code in PARENTING_LIFE_CODES:
        items.extend(
            _fetch_all(
                session,
                service_key,
                url,
                {"lifeArray": life_code},
            )
        )
    return items


def _stage_flags(life_text: str) -> dict[str, bool]:
    return {
        "is_infant": any(word in life_text for word in ("영유아", "임신", "출산")),
        "is_child": "아동" in life_text,
        "is_teen": "청소년" in life_text,
    }


def _policy_record(
    item: dict[str, Any],
    *,
    prefix: str,
    source: str,
    local: bool,
) -> tuple[str, str, dict[str, Any]] | None:
    service_id = str(item.get("servId") or item.get("servNm") or "").strip()
    title = str(item.get("servNm") or "").strip()
    if not service_id or not title:
        return None

    summary = str(item.get("servDgst") or "복지서비스").strip()
    target = str(item.get("trgterIndvdlArray") or item.get("sprtTrgtCn") or "").strip()
    life_text = str(item.get("lifeArray") or item.get("lifeNmArray") or "").strip()
    sido = str(item.get("ctpvNm") or "").strip() if local else ""
    sigungu = str(item.get("sggNm") or "").strip() if local else ""
    support_cycle = str(item.get("sprtCycNm") or "").strip()
    provision_type = str(item.get("srvPvsnNm") or "").strip()
    application_method = str(item.get("aplyMtdNm") or "").strip()
    organization = str(
        item.get("jurMnofNm")
        or item.get("jurOrgNm")
        or item.get("bizChrDeptNm")
        or ""
    ).strip()
    link = str(item.get("servDtlLink") or "https://www.bokjiro.go.kr").strip()

    document_parts = [f"정책명: {title}", f"내용: {summary}"]
    if target:
        document_parts.append(f"대상: {target}")
    if life_text:
        document_parts.append(f"생애주기: {life_text}")
    region = " ".join(value for value in (sido, sigungu) if value)
    if region:
        document_parts.append(f"지역: {region}")
    if support_cycle:
        document_parts.append(f"지원주기: {support_cycle}")
    if provision_type:
        document_parts.append(f"제공유형: {provision_type}")
    if application_method:
        document_parts.append(f"신청방식: {application_method}")
    if organization:
        document_parts.append(f"담당기관: {organization}")

    metadata: dict[str, Any] = {
        **_stage_flags(life_text),
        "target": target,
        "life_stage": life_text,
        "sido": sido,
        "sigungu": sigungu,
        "title": title,
        "summary": summary,
        "source": source,
        "organization": organization,
        "support_cycle": support_cycle,
        "provision_type": provision_type,
        "application_method": application_method,
        "link": link,
        "last_modified": str(item.get("lastModYmd") or "").strip(),
    }
    return f"{prefix}-{service_id}", ". ".join(document_parts), metadata


def _build_records(
    national_items: list[dict[str, Any]],
    local_items: list[dict[str, Any]],
) -> dict[str, tuple[str, dict[str, Any]]]:
    records: dict[str, tuple[str, dict[str, Any]]] = {}
    for item in national_items:
        record = _policy_record(
            item,
            prefix="national",
            source="복지로 중앙부처",
            local=False,
        )
        if record:
            document_id, document, metadata = record
            records[document_id] = (document, metadata)

    for item in local_items:
        record = _policy_record(
            item,
            prefix="local",
            source="복지로 지자체",
            local=True,
        )
        if record:
            document_id, document, metadata = record
            records[document_id] = (document, metadata)
    return records


def _sync_collection(
    collection: Any,
    records: dict[str, tuple[str, dict[str, Any]]],
) -> dict[str, int]:
    existing_result = collection.get(include=["documents", "metadatas"])
    existing = {
        document_id: (document, metadata)
        for document_id, document, metadata in zip(
            existing_result.get("ids") or [],
            existing_result.get("documents") or [],
            existing_result.get("metadatas") or [],
        )
    }

    inserted_ids = [document_id for document_id in records if document_id not in existing]
    updated_ids = [
        document_id
        for document_id, value in records.items()
        if document_id in existing and existing[document_id] != value
    ]
    changed_ids = inserted_ids + updated_ids

    for offset in range(0, len(changed_ids), INDEX_BATCH_SIZE):
        batch_ids = changed_ids[offset : offset + INDEX_BATCH_SIZE]
        batch_documents = [records[document_id][0] for document_id in batch_ids]
        batch_metadatas = [records[document_id][1] for document_id in batch_ids]
        collection.upsert(
            ids=batch_ids,
            documents=batch_documents,
            metadatas=batch_metadatas,
        )

    stale_ids = list(set(existing) - set(records))
    if stale_ids:
        collection.delete(ids=stale_ids)

    return {
        "insertedCount": len(inserted_ids),
        "updatedCount": len(updated_ids),
        "unchangedCount": len(records) - len(changed_ids),
        "deletedCount": len(stale_ids),
    }


def reindex_subsidies(
    *,
    session: requests.Session | None = None,
    collection: Any | None = None,
) -> dict[str, Any]:
    global _last_result

    if not _reindex_lock.acquire(blocking=False):
        return {
            **_last_result,
            "success": False,
            "running": True,
            "message": "정부지원금 색인이 이미 실행 중입니다.",
        }

    started_at = _now_iso()
    _last_result = {
        **_last_result,
        "success": False,
        "running": True,
        "message": "정부지원금 정책을 수집하고 있습니다.",
        "startedAt": started_at,
        "completedAt": None,
    }

    try:
        service_key = os.environ.get("DATA_GO_KR_SERVICE_KEY", "").strip()
        if not service_key:
            raise RuntimeError("DATA_GO_KR_SERVICE_KEY가 설정되지 않았습니다.")

        active_session = session or requests.Session()
        national_items = _fetch_parenting_items(
            active_session,
            service_key,
            NATIONAL_URL,
        )
        local_items = _fetch_parenting_items(
            active_session,
            service_key,
            LOCAL_URL,
        )
        records = _build_records(national_items, local_items)
        if not records:
            raise RuntimeError("색인할 정부지원금 정책이 없습니다.")

        if collection is None:
            from app.services.subsidy_rag_service import _collection

            collection = _collection

        counts = _sync_collection(collection, records)
        from app.services.subsidy_detail_service import clear_detail_cache

        clear_detail_cache()
        _last_result = {
            "success": True,
            "running": False,
            "message": "정부지원금 정책 색인이 완료되었습니다.",
            "totalCount": len(records),
            **counts,
            "startedAt": started_at,
            "completedAt": _now_iso(),
        }
        logger.info("SUBSIDY_REINDEX_SUCCESS %s", _last_result)
        return dict(_last_result)
    except Exception as error:
        _last_result = {
            **_last_result,
            "success": False,
            "running": False,
            "message": str(error),
            "completedAt": _now_iso(),
        }
        logger.exception("SUBSIDY_REINDEX_FAILED reason=%s", error)
        return dict(_last_result)
    finally:
        _reindex_lock.release()


def get_reindex_status() -> dict[str, Any]:
    return dict(_last_result)
