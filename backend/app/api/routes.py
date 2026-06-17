"""CloudPilot API surface — the contract the React canvas (and Playwright mocks) speak."""
from fastapi import APIRouter, File, Query, Request, UploadFile

from app.core.config import get_settings
from app.models.schemas import (
    DeployRequest,
    DeploymentState,
    DiagnoseRequest,
    DiagnoseResponse,
    GenerateRequest,
    GenerateResponse,
    VisionImportResponse,
)
from app.services import demo_engine
from app.services.build_service import BuildPilot

router = APIRouter()
_settings = get_settings()
_build = BuildPilot(_settings)


@router.get("/health")
def health(request: Request):
    architect = getattr(request.app.state, "architect", None)
    return {
        "status": "ok",
        "mode": "live" if architect and architect.live else "demo",
        "model": _settings.gemini_model,
        "brand": _settings.org_brand,
        "context_window": _settings.max_context_tokens,
    }


@router.get("/catalog")
def catalog():
    return demo_engine.GCP_CATALOG


@router.post("/architect/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest, request: Request):
    architect = request.app.state.architect
    return architect.generate(req.graph.model_dump(), req.project.model_dump(), req.constraints)


@router.post("/deployments", response_model=DeploymentState)
def start_deployment(req: DeployRequest, chaos: bool = Query(False, description="Inject a failure for the diagnosis demo")):
    return _build.start(req.run_id, fail_step="ascent-apply" if chaos else None)


@router.get("/deployments/{deployment_id}", response_model=DeploymentState)
def deployment_status(deployment_id: str):
    return _build.status(deployment_id)


@router.post("/deployments/{deployment_id}/retry", response_model=DeploymentState)
def retry_deployment(deployment_id: str):
    return _build.retry(deployment_id)


@router.post("/diagnose", response_model=DiagnoseResponse)
def diagnose(req: DiagnoseRequest, request: Request):
    architect = request.app.state.architect
    return architect.diagnose(req.deployment_id, req.step_id)


@router.post("/vision/import", response_model=VisionImportResponse)
async def vision_import(request: Request, image: UploadFile | None = File(default=None)):
    architect = request.app.state.architect
    payload = await image.read() if image else None
    mime = image.content_type if image else "image/png"
    return architect.vision_import(payload, mime)
