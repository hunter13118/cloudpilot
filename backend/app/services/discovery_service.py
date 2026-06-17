"""Discovery Engine — enterprise standards grounding.

In live mode this queries the customer's own datastore (bring-your-own-GCP:
just set DISCOVERY_DATASTORE_ID). In demo mode it serves the bundled corpus
from infrastructure/standards/.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path

from app.core.config import Settings

log = logging.getLogger("cloudpilot.discovery")
_BUNDLED = Path(__file__).resolve().parents[3] / "infrastructure" / "standards"


class DiscoveryGrounding:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client = None
        if not settings.demo_mode:
            try:
                from google.cloud import discoveryengine_v1 as de

                self._client = de.SearchServiceClient()
            except Exception as exc:  # noqa: BLE001
                log.warning("Discovery Engine unavailable (%s) — using bundled corpus", exc)

    def fetch_corpus(self) -> list[dict]:
        """Return the FULL standards corpus — Gemini's 2M window means we never chunk."""
        if self._client is not None:
            serving_config = (
                f"projects/{self.settings.gcp_project_id}/locations/{self.settings.discovery_location}"
                f"/dataStores/{self.settings.discovery_datastore_id}/servingConfigs/default_search"
            )
            from google.cloud import discoveryengine_v1 as de

            results = self._client.search(de.SearchRequest(serving_config=serving_config, query="*", page_size=100))
            return [dict(r.document.struct_data) for r in results]
        corpus = []
        for f in sorted(_BUNDLED.glob("*.json")):
            corpus.extend(json.loads(f.read_text(encoding="utf-8")))
        return corpus
