from app.schemas.recall import RecallMatchRequest, RecallMatchResponse, RecallMatchResult

# 다국어 지원 사전학습 문장 임베딩 모델 - 한국어 제품명/브랜드명 비교에 별도 학습 없이 사용 가능
_MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"


class RecallMatchService:
    """등록 제품과 리콜 공고 텍스트 사이의 의미적 유사도를 계산하는 서비스.

    학습된 모델 파일을 쓰는 게 아니라 사전학습된 문장 임베딩 모델을 그대로 사용하므로,
    이 모델은 "학습(training)"이 아니라 "모델 로딩"만 필요하다.
    """

    def __init__(self) -> None:
        self._model = None  # 아직 로딩 안 함(지연 로딩) / False = 로딩 실패

    def _get_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer

                self._model = SentenceTransformer(_MODEL_NAME)
            except Exception:
                self._model = False
        return self._model or None

    def match(self, request: RecallMatchRequest) -> RecallMatchResponse:

        if not request.candidates:
            return RecallMatchResponse(model_status="READY", matches=[])

        model = self._get_model()
        if model is None:
            return RecallMatchResponse(model_status="NOT_READY", matches=[])

        from sentence_transformers import util

        item_text = self._compose_text(request.brand_name, request.item_name, request.model_name)
        candidate_texts = [
            self._compose_text(c.brand_name, c.title) for c in request.candidates
        ]

        item_embedding = model.encode(item_text, convert_to_tensor=True)
        candidate_embeddings = model.encode(candidate_texts, convert_to_tensor=True)

        scores = util.cos_sim(item_embedding, candidate_embeddings)[0]

        matches = [
            RecallMatchResult(recall_id=candidate.recall_id, score=float(scores[i]))
            for i, candidate in enumerate(request.candidates)
        ]
        matches.sort(key=lambda m: m.score, reverse=True)

        return RecallMatchResponse(model_status="READY", matches=matches)

    @staticmethod
    def _compose_text(*parts: str | None) -> str:
        return " ".join(p for p in parts if p)
