"""Vertex AI connection — the Gemini brain.

Real SDK path: vertexai.GenerativeModel with the full 2M-token context window,
grounded by Discovery Engine and armed with a Cloud Build function tool.
If credentials are absent (or DEMO_MODE=true) we fall back to the demo engine,
which simulates the exact same contract.
"""
from __future__ import annotations

import json
import logging

from app.core.config import Settings
from app.services import demo_engine
from app.services.discovery_service import DiscoveryGrounding

log = logging.getLogger("cloudpilot.vertex")

ARCHITECT_SYSTEM_PROMPT = """You are CloudPilot, an enterprise cloud architect.
You receive: (1) a visual architecture graph drawn by a human, (2) the COMPLETE
enterprise standards corpus, (3) the live Terraform state of the entire estate,
and (4) historical incident postmortems — all in one context window.

Synthesize production-grade Terraform that satisfies every applicable standard.
Return STRICT JSON matching the GenerateResponse schema. Cite standards by id.
Never emit a resource that violates a BLOCK-severity standard; redesign instead."""


class VertexArchitect:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.live = False
        self._model = None
        if not settings.demo_mode:
            self._try_init_live()
        log.info("VertexArchitect mode=%s model=%s", "live" if self.live else "demo", settings.gemini_model)

    def _try_init_live(self) -> None:
        try:
            import vertexai
            from vertexai.generative_models import GenerativeModel

            vertexai.init(project=self.settings.gcp_project_id, location=self.settings.gcp_region)
            self._model = GenerativeModel(self.settings.gemini_model, system_instruction=ARCHITECT_SYSTEM_PROMPT)
            self.grounding = DiscoveryGrounding(self.settings)
            self.live = True
        except Exception as exc:  # noqa: BLE001 — any failure means demo mode
            log.warning("Vertex AI unavailable (%s) — falling back to demo engine", exc)
            self.live = False

    # ------------------------------------------------------------------
    def generate(self, graph: dict, project: dict, constraints: list[str]) -> dict:
        if self.live:
            return self._generate_live(graph, project, constraints)
        return demo_engine.generate(graph, project, self.settings.gemini_model, self.settings.max_context_tokens)

    def _generate_live(self, graph: dict, project: dict, constraints: list[str]) -> dict:
        standards = self.grounding.fetch_corpus()
        prompt = json.dumps({
            "graph": graph,
            "target_project": project,
            "constraints": constraints,
            "standards_corpus": standards,  # entire corpus — this is why 2M tokens matters
        })
        response = self._model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json", "temperature": 0.2},
        )
        return json.loads(response.text)

    # ------------------------------------------------------------------
    def diagnose(self, deployment_id: str, step_id: str, build_log: str | None = None) -> dict:
        if self.live and build_log:
            prompt = (
                "A deployment step failed. Full build log follows. Correlate with the "
                "audit trail and standards corpus already in context; return STRICT JSON "
                f"matching DiagnoseResponse.\n\nLOG:\n{build_log}"
            )
            response = self._model.generate_content(
                prompt, generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        return demo_engine.diagnose(deployment_id, step_id)

    def vision_import(self, image_bytes: bytes | None = None, mime: str = "image/png") -> dict:
        if self.live and image_bytes:
            from vertexai.generative_models import Part

            response = self._model.generate_content([
                Part.from_data(image_bytes, mime_type=mime),
                "Extract the cloud architecture from this whiteboard/diagram photo. "
                "Return STRICT JSON matching VisionImportResponse with canvas positions.",
            ], generation_config={"response_mime_type": "application/json"})
            return json.loads(response.text)
        return demo_engine.vision_import()
