from fastapi import FastAPI

from app.routers import emergency, subsidy, homecam


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
    subsidy.router,
    prefix="/api/v1/subsidy",
    tags=["subsidy"],
)