# Python AI 서버 (FastAPI :5000)
# 담당: 수면조언 · 홈캠 이탈감지 · 맞춤동화 · 리콜매칭 · 정부지원금 RAG · 육아일기 사진분석 · 영상생성
FROM python:3.11-slim

WORKDIR /app

# opencv(libGL) / moviepy(ffmpeg) 런타임 라이브러리
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 의존성 먼저 설치해 레이어 캐시 활용
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 앱 복사 (커밋된 자산 data/subsidy_documents 포함. models/, data/chroma_subsidies 는 볼륨)
COPY . .

# 첫 기동 시 런타임 자산 자동 준비 (CRLF 방어 후 실행권한)
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

EXPOSE 5000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
