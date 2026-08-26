import os
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[3] / ".env")
import requests
from app.services.subsidy_rag_service import _embedder, _collection

SERVICE_KEY = os.environ["DATA_GO_KR_SERVICE_KEY"]

NATIONAL_LIST = "https://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001"
LOCAL_LIST = "https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfarelist"
NATIONAL_DETAIL = "https://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfaredetailedV001"
LOCAL_DETAIL = "https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfaredetailed"

NATIONAL_ROWS = 100
LOCAL_ROWS = 200
MAX_CHARS = 840 
#한국어 840자

CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "detail_cache"

def fetch_list(url: str, extra_params: dict, num_rows: int) -> list[dict]:
    """목록 API로 servId 목록을 받아온다."""
    params = {
        "serviceKey": SERVICE_KEY, "callTp": "L", "srchKeyCode": "001",
        "pageNo": 1, "numOfRows": num_rows, "type": "json", **extra_params,
    }
    res = requests.get(url, params=params, timeout=20)
    res.raise_for_status()
    text = res.text.strip()
    if text.startswith("<"):
        root = ET.fromstring(text)
        items = [{c.tag: (c.text or "") for c in s} for s in root.iter("servList")]
        if items:
            return items
        return [{c.tag: (c.text or "") for c in i} for i in root.iter("item")]
    return res.json().get("wantedList", {}).get("servList", [])

def fetch_detail(url: str, serv_id: str) -> ET.Element | None:
    """상세 1건 조회. 응답 XML을 로컬 캐시에 저장해서 재색인때 API를 다시 부르지 않는다."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE_DIR / f"{serv_id}.xml"
    if cache_file.exists():
        try:
            return ET.fromstring(cache_file.read_text(encoding="utf-8"))
        except ET.ParseError:
            cache_file.unlink()
            # 꺠진거는 버리고 다시 받기

    try:
        res = requests.get(url, params={"serviceKey": SERVICE_KEY, "servId": serv_id},
timeout=20)
    except requests.RequestException as e:
        print(f" [skip] {serv_id} {type(e).__name__}")
        return None

    if res.status_code != 200:
        print(f" [skip] {serv_id} HTTP {res.status_code}")
        return None

    try:
        root = ET.fromstring(res.text)
    except ET.ParseError:
        print(f" [skip] {serv_id} XML파싱실패")
        return None

    cache_file.write_text(res.text, encoding="utf-8")
    time.sleep(0.15)
    return root

def _text(root: ET.Element, tag: str) -> str:
    el = root.find(tag)
    return (el.text or "").strip().replace("\r", " ") if el is not None else ""

def _links(root: ET.Element, tag: str, limit: int = 2) -> str:
    """applmetList 같은 중첩리스트에서 serveSeDetailLink만 뽑아 합친다"""
    out = []
    for node in root.findall(tag)[:limit]:
        val = (node.findtext("serveSeDetailLink") or "").strip()
        if val:
            out.append(val)
    return " / ".join(out)

def build_text(root: ET.Element, source: str) -> str:
    """상세필드를 우선순위대로 이어붙여 임베딩용 문서를 만든다."""
    title = _text(root, "servNm")
    if source == "national":
        parts = [
            title,
            _text(root, "wlfareInfoOutlCn"),
            "대상: " + _text(root, "tgtrDtlCn"),
            "선정기준: " + _text(root, "slctCritCn"),
            "지원내용: " + _text(root, "alwServCn"),
            "지역: " + (_text(root, "ctpvNm") + " " + _text(root, "sggNm")).strip(),
            "신청: " + _text(root, "aplyMtdCn"),
        ]
    else:
        parts = [
            title,
            _text(root, "servDgst"),
            "대상: " + _text(root, "sprtTrgtCn"),
            "선정기준: " + _text(root, "slctCritCn"),
            "지원내용: " + _text(root, "alwServCn"),
            "지역: " + (_text(root, "ctpvNm") + " " + _text(root, "sggNm")).strip(),
            "신청: " + _text(root, "aplyMtdCn"),
        ]
    body = ". ".join(p for p in parts if p and not p.endswith(": "))
    return body[:MAX_CHARS]

def build_meta(root: ET.Element, source: str) -> str:
    """ChromaDB 메타데이터는 문자열/숫자/불린만 허용하므로 배열은 콤마 문자열로 저장한다."""
    life = _text(root, "lifeArray")
    if source =="national":
        target = _text(root, "trgterIndvdlArray")
        sido, sigungu = "", ""
    else:
        target = _text(root, "trgterIndvdlNmArray")
        sido, sigungu = _text(root, "ctpvNm"), _text(root, "sggNm")
        if sigungu == "-":
            sigungu = ""

    serv_id = _text(root, "servId")
    return {
         "is_infant": "영유아" in life,
        "is_child": "아동" in life,
        "is_teen": "청소년" in life,
        "title": _text(root, "servNm"),
        "summary": _text(root, "wlfareInfoOutlCn") or _text(root, "servDgst"),
        "target": target,
        "sido": sido,
        "sigungu": sigungu,                          # 신규: 시/군/구 필터용
        "thema": _text(root, "intrsThemaArray"),     # 신규: 보육/임신·출산/입양·위탁
        "srv_pvsn": _text(root, "srvPvsnNm"),        # 신규: 현금/바우처/서비스
        "sprt_cyc": _text(root, "sprtCycNm"),        # 신규: 월/분기/연/1회성
        "amount": _text(root, "alwServCn")[:300],    # 신규: 실제 지원금액 문구
        "source": "복지로 중앙부처" if source == "national" else "복지로 지자체",
        "link": "https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do"
                f"?wlfareInfoId={serv_id}",
                #필터
    }

def index_all() -> None:
    ids, docs, metas = [], [], []
    api_calls = 0

    jobs = [
        ("national", NATIONAL_LIST, {"lifeArray": "001"}, NATIONAL_DETAIL, NATIONAL_ROWS),
        ("local", LOCAL_LIST, {}, LOCAL_DETAIL, LOCAL_ROWS),
    ]
    for source, list_url, params, detail_url,  rows in jobs:
        items = fetch_list(list_url, params, rows)
        print(f"[{source}] 목록 {len(items)}건 -> 상세조회시작")

        for idx, item in enumerate(items, 1):
            serv_id = item.get("servId") or item.get("servNm")
            if not serv_id:
                continue

            cached = (CACHE_DIR / f"{serv_id}.xml").exists()
            root = fetch_detail(detail_url, serv_id)
            if root is None:
                continue
            if not cached:
                api_calls += 1

            ids.append(f"{source}-{serv_id}")
            docs.append(build_text(root, source))
            metas.append(build_meta(root, source))

            if idx % 25 == 0:
                print(f" ...{idx}/{len(items)}")

        print(f"[{source}] 완료 (누적 {len(ids)}건)")

    if not docs: 
        print("색인할 데이터가 없습니다. API키와 응답을 확인하세요")
        return

    tok = _embedder.tokenizer
    lens = [len(tok.encode(d)) for d in docs]
    print(f"\n신규 API 호출:  {api_calls}회 (나머지는 캐시 재사용)")
    print(f"토큰 길이 min/avg/max: {min(lens)} / {sum(lens) // len(lens)} / {max(lens)}")
    print(f"512 초과(잘림): {sum(1 for n in lens if n > 512)}건")

    embeddings = _embedder.encode(docs, show_progress_bar=True).tolist()
    _collection.upsert(ids=ids, embeddings=embeddings, documents=docs, metadatas=metas)
    print(f"색인완료: {len(ids)}건")

if __name__ == "__main__":
     index_all()

