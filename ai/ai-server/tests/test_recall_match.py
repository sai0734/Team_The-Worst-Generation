from fastapi.testclient import TestClient

from app.services.recall_match_service import RecallMatchService
from main import app

client = TestClient(app)


def test_match_normal_request_ranks_same_category_higher():
    """정상 요청 처리: 같은 제품군(패딩)이 전혀 다른 제품(세탁기)보다 유사도 점수가 높아야 함."""

    response = client.post(
        "/api/v1/recall/match",
        json={
            "itemName": "패딩 점퍼",
            "brandName": "노스페이스",
            "candidates": [
                {"recallId": "R1", "title": "노스훼이스 아동용 패딩", "brandName": "THE NORTH FACE"},
                {"recallId": "R2", "title": "삼성 드럼 세탁기", "brandName": "삼성전자"},
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["modelStatus"] in ("READY", "NOT_READY")

    if body["modelStatus"] == "READY":
        scores = {m["recallId"]: m["score"] for m in body["matches"]}
        assert scores["R1"] > scores["R2"]


def test_match_empty_candidates_returns_empty_list():
    """후보가 없으면 모델을 부르지 않고 바로 빈 매칭 목록을 반환."""

    response = client.post(
        "/api/v1/recall/match",
        json={"itemName": "패딩", "candidates": []},
    )

    assert response.status_code == 200
    assert response.json() == {"modelStatus": "READY", "matches": []}


def test_match_invalid_request_missing_item_name():
    """잘못된 요청(필수값 누락)은 422로 거부되어야 함."""

    response = client.post("/api/v1/recall/match", json={"candidates": []})

    assert response.status_code == 422


def test_match_returns_not_ready_when_model_unavailable(monkeypatch):
    """모델 로딩이 실패한 상태(모델 파일/패키지 준비 안 됨)에서는 임의의 점수를 만들지 않고
    NOT_READY 상태를 그대로 반환해야 함."""

    service = RecallMatchService()
    monkeypatch.setattr(service, "_get_model", lambda: None)

    from app.schemas.recall import RecallCandidate, RecallMatchRequest

    result = service.match(
        RecallMatchRequest(
            item_name="패딩",
            candidates=[RecallCandidate(recall_id="R1", title="아무 리콜")],
        )
    )

    assert result.model_status == "NOT_READY"
    assert result.matches == []
