import logging
import os

from fastapi import FastAPI

from app.routers import story


logging.basicConfig(
    level=os.environ.get("AI_LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

app = FastAPI(
    title="BabyCare AI Server",
    version="0.2.0",
)


@app.get("/health", tags=["health"])
def health() -> dict[str, bool]:
    return {"ok": True}


app.include_router(
    story.router,
    prefix="/api/v1/stories",
    tags=["stories"],
)

