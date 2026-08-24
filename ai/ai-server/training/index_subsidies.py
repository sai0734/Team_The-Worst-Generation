import sys
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import os

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[3] / ".env")
import requests
from app.services.subsidy_rag_service import _embedder, _collection

SERVICE_KEY = os.environ["DATA_GO_KR_SERVICE_KEY"]


def _stage_flags(life_array_text: str) -> dict:
    return {
        "is_infant": "영유아" in life_array_text,
        "is_child": "아동" in life_array_text,
        "is_teen": "청소년" in life_array_text,
    }

NATIONAL_URL = "https://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001"
LOCAL_URL = "https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfarelist"


def fetch(url: str, extra_params: dict, num_rows: int) -> list[dict]:
    params = {
        "serviceKey": SERVICE_KEY, "callTp": "L", "srchKeyCode": "001",
        "pageNo": 1, "numOfRows": num_rows, "type": "json", **extra_params,
    }
    res = requests.get(url, params=params, timeout=20)
    res.raise_for_status()
    text = res.text.strip()
    if text.startswith("<"):
        return _parse_xml_items(text)
    return res.json().get("wantedList", {}).get("servList", [])


def _parse_xml_items(xml_text: str) -> list[dict]:
    root = ET.fromstring(xml_text)
    items = [
        {child.tag: (child.text or "") for child in serv}
        for serv in root.iter("servList")
    ]
    if items:
        return items
    return [
        {child.tag: (child.text or "") for child in item}
        for item in root.iter("item")
    ]


def index_all() -> None:
    ids, docs, metas = [], [], []

    for item in fetch(NATIONAL_URL, {"lifeArray": "001"}, 100):
        sid = item.get("servId") or item.get("servNm")
        if not sid:
            continue
        title = item.get("servNm", "")
        summary = item.get("servDgst", "") or "복지서비스"
        ids.append("national-" + sid)
        docs.append(f"{title}. {summary}")
        metas.append({
            **_stage_flags(item.get("lifeArray", "")),
            "target": item.get("trgterIndvdlArray", ""),
            "sido": "", "title": title, "summary": summary,
            "source": "복지로 중앙부처",
            "link": item.get("servDtlLink", "") or "https://www.bokjiro.go.kr",
        })

    for item in fetch(LOCAL_URL, {}, 200):
        sid = item.get("servId") or item.get("servNm")
        if not sid:
            continue
        title = item.get("servNm", "")
        summary = item.get("servDgst", "") or "복지서비스"
        ids.append("local-" + sid)
        docs.append(f"{title}. {summary}")
        metas.append({
            **_stage_flags(item.get("lifeArray", "")),
            "target": item.get("trgterIndvdlArray", ""),
            "sido": item.get("ctpvNm", ""), "title": title, "summary": summary,
            "source": "복지로 지자체",
            "link": item.get("servDtlLink", "") or "https://www.bokjiro.go.kr",
        })

    embeddings = _embedder.encode(docs, show_progress_bar=True).tolist()
    _collection.upsert(ids=ids, embeddings=embeddings, documents=docs, metadatas=metas)
    print(f"색인 완료: {len(ids)}건")


if __name__ == "__main__":
    index_all()