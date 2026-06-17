"""CloudPilot — FastAPI gateway.

Validates UI requests, orchestrates Gemini via Vertex AI, grounds output in
the enterprise standards datastore (Discovery Engine), and drives Cloud Build
deployments. Boots in demo mode automatically when no GCP credentials exist.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import get_settings
from app.services.vertex_service import VertexArchitect


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.architect = VertexArchitect(settings)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=f"{settings.org_brand} CloudPilot API",
        version="1.0.0",
        description="Visual-to-Cloud orchestration powered by Gemini.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router, prefix="/api/v1")
    return app


app = create_app()
