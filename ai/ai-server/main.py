from fastapi import FastAPI

from app.routers import emergency, recall


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
    recall.router,
    prefix="/api/v1/recall",
    tags=["recall"],
)

