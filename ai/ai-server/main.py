from fastapi import FastAPI

<<<<<<< HEAD
from app.routers import emergency
from app.routers import health as health_router
=======
from app.routers import emergency, subsidy
>>>>>>> a307bc6ae32be3e757e3d3fe16f30c714a064ac9

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
<<<<<<< HEAD
    health_router.router,
    prefix="/api/v1/health",
    tags=["health"],
)
=======
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

app.include_router(
    subsidy.router,
    prefix="/api/v1/subsidy",
    tags=["subsidy"],
)

>>>>>>> a307bc6ae32be3e757e3d3fe16f30c714a064ac9
