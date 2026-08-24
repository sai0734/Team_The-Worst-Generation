from fastapi import FastAPI

from app.routers import emergency, subsidy, homecam, recall
from app.routers import health as health_router

from app.routers import sleep

from app.routers import diary

from app.routers import video

app = FastAPI(
    title="BabyCare AI Server",
    version="0.1.0",
)


@app.get("/health", tags=["health"])
def health() -> dict[str, bool]:
    return {"ok": True}

app.include_router(
    emergency.router,
    prefix="/api/v1/emergency",
    tags=["emergency"],
)

app.include_router(
    homecam.router,
    prefix="/api/v1/homecam",
    tags=["homecam"],
)

app.include_router(
    health_router.router,
    prefix="/api/v1/health",
    tags=["health"],
)

app.include_router(
    sleep.router,
    prefix="/api/v1/sleep",
    tags=["sleep"],
)

app.include_router(
    diary.router,
    prefix="/api/v1/diary",
    tags=["diary"],
)

app.include_router(
    video.router,
    prefix="/api/v1/video",
    tags=["video"],
)

app.include_router(
    subsidy.router,
    prefix="/api/v1/subsidy",
    tags=["subsidy"],
)

app.include_router(
    recall.router,
    prefix="/api/v1/recall",
    tags=["recall"],
)