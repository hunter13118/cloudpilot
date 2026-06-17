"""Cloud Build bridge — turns Gemini's plan into running infrastructure.

Live mode triggers the customer's Cloud Build pipeline; demo mode drives the
deterministic Flight Deck simulation so the full deploy/diagnose/retry loop
works anywhere — no GCP project required.
"""
from __future__ import annotations

import logging

from app.core.config import Settings
from app.services import demo_engine

log = logging.getLogger("cloudpilot.build")


class BuildPilot:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client = None
        if not settings.demo_mode:
            try:
                from google.cloud.devtools import cloudbuild_v1 as cb

                self._client = cb.CloudBuildClient()
            except Exception as exc:  # noqa: BLE001
                log.warning("Cloud Build unavailable (%s) — using flight simulator", exc)

    def start(self, run_id: str, fail_step: str | None = None) -> dict:
        if self._client is not None:
            # Trigger the real pipeline (infrastructure/pipelines/cloudbuild.yaml)
            self._client.run_build_trigger(
                project_id=self.settings.gcp_project_id,
                trigger_id=self.settings.build_trigger_id,
                source=None,
            )
        return demo_engine.start_deployment(run_id, fail_step=fail_step)

    def status(self, deployment_id: str) -> dict:
        return demo_engine.get_deployment(deployment_id)

    def retry(self, deployment_id: str) -> dict:
        return demo_engine.retry_deployment(deployment_id)
