from fastapi import APIRouter

from app.schemas.recall import RecallMatchRequest, RecallMatchResponse
from app.services.recall_match_service import RecallMatchService


router = APIRouter()
match_service = RecallMatchService()


@router.post("/match", response_model=RecallMatchResponse)
def match_recall(request: RecallMatchRequest) -> RecallMatchResponse:
    """Score how similar a registered product is to each candidate recall notice."""
    return match_service.match(request)
