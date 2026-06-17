"""CloudPilot core settings.

Provider-agnostic by design: point CloudPilot at ANY GCP project by swapping
the environment variables below. Nothing in the codebase is hard-wired to a
single org — the branding, project id, region, and datastore are all config.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ---- Branding (placeholder-friendly: MilkMan today, anyone tomorrow) ----
    app_name: str = "CloudPilot"
    org_brand: str = "MilkMan Enterprise"

    # ---- Target GCP environment (bring-your-own-project) ----
    gcp_project_id: str = "your-gcp-project"
    gcp_region: str = "us-central1"

    # ---- Gemini / Vertex AI ----
    gemini_model: str = "gemini-2.5-pro"
    gemini_flash_model: str = "gemini-2.5-flash"
    max_context_tokens: int = 2_097_152  # Gemini's 2M-token context window

    # ---- Discovery Engine (enterprise standards datastore) ----
    discovery_datastore_id: str = "enterprise-standards"
    discovery_location: str = "global"

    # ---- Cloud Build ----
    build_trigger_id: str = "cloudpilot-deploy"

    # ---- Runtime ----
    demo_mode: bool = True  # auto-flips to False when GCP credentials resolve
    cors_origins: str = "http://localhost:5173,http://localhost:4173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
