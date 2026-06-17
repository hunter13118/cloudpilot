"""Strict pydantic contracts between the React canvas and the Gemini brain."""
from typing import Literal, Optional

from pydantic import BaseModel, Field

Severity = Literal["PASS", "WARN", "BLOCK"]
StepStatus = Literal["pending", "running", "success", "failed"]
Phase = Literal["PREFLIGHT", "IGNITION", "ASCENT", "ORBIT"]


# ---------- Canvas graph ----------
class GraphNode(BaseModel):
    id: str
    type: str = Field(description="GCP service key, e.g. cloud_run, cloud_sql")
    label: str
    position: Optional[dict] = None
    config: dict = Field(default_factory=dict)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None


class ArchitectureGraph(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class TargetProject(BaseModel):
    project_id: str = "milkman-enterprise-prod"
    region: str = "us-central1"


class GenerateRequest(BaseModel):
    graph: ArchitectureGraph
    project: TargetProject = TargetProject()
    constraints: list[str] = Field(default_factory=list)


# ---------- Gemini generation result ----------
class ContextSource(BaseModel):
    name: str
    tokens: int


class ContextWindow(BaseModel):
    used: int
    max: int
    sources: list[ContextSource]


class ReasoningLine(BaseModel):
    phase: str
    text: str


class IacFile(BaseModel):
    path: str
    content: str


class ComplianceFinding(BaseModel):
    id: str
    severity: Severity
    standard: str
    title: str
    detail: str
    autofix: bool = False


class Compliance(BaseModel):
    score: int
    findings: list[ComplianceFinding]


class CostLine(BaseModel):
    service: str
    usd: float


class CostEstimate(BaseModel):
    monthly_usd: float
    breakdown: list[CostLine]


class GenerateResponse(BaseModel):
    run_id: str
    model: str
    context_window: ContextWindow
    reasoning: list[ReasoningLine]
    iac: dict
    compliance: Compliance
    cost_estimate: CostEstimate
    summary: str


# ---------- Deployment / Flight Deck ----------
class DeployRequest(BaseModel):
    run_id: str
    project: TargetProject = TargetProject()


class DeployStep(BaseModel):
    id: str
    name: str
    phase: Phase
    status: StepStatus = "pending"
    duration_ms: Optional[int] = None
    log: Optional[str] = None


class DeploymentState(BaseModel):
    deployment_id: str
    phase: Phase
    progress: int
    steps: list[DeployStep]
    log_tail: list[str]


# ---------- Diagnosis ----------
class DiagnoseRequest(BaseModel):
    deployment_id: str
    step_id: str


class RootCause(BaseModel):
    title: str
    detail: str
    confidence: float
    error_line: str
    log_excerpt: list[str]


class PatchHunk(BaseModel):
    type: Literal["add", "del", "ctx"]
    text: str


class Patch(BaseModel):
    file: str
    diff: list[PatchHunk]
    explanation: str


class DiagnoseResponse(BaseModel):
    root_cause: RootCause
    patch: Patch
    references: list[dict]


# ---------- Multimodal vision import ----------
class VisionImportResponse(BaseModel):
    graph: ArchitectureGraph
    narrative: str
    confidence: float
