"""Demo engine — a faithful, deterministic simulation of the Gemini brain.

Everything here derives from the ACTUAL architecture graph the user drew,
so the demo feels alive: terraform is emitted per node, compliance findings
react to what's on the canvas, and token counts scale with graph size.
Swap in real credentials and VertexArchitect routes around this module.
"""
import hashlib
import time
import uuid

GCP_CATALOG = {
    "categories": [
        {
            "id": "compute",
            "name": "Compute",
            "services": [
                {"type": "cloud_run", "label": "Cloud Run", "icon": "container", "blurb": "Serverless containers", "tier": "serverless"},
                {"type": "gke", "label": "GKE Autopilot", "icon": "boxes", "blurb": "Managed Kubernetes", "tier": "managed"},
                {"type": "cloud_functions", "label": "Cloud Functions", "icon": "zap", "blurb": "Event-driven functions", "tier": "serverless"},
                {"type": "compute_engine", "label": "Compute Engine", "icon": "server", "blurb": "Virtual machines", "tier": "iaas"},
            ],
        },
        {
            "id": "data",
            "name": "Data & Storage",
            "services": [
                {"type": "cloud_sql", "label": "Cloud SQL", "icon": "database", "blurb": "Managed Postgres/MySQL", "tier": "managed"},
                {"type": "bigquery", "label": "BigQuery", "icon": "bar-chart-3", "blurb": "Serverless warehouse", "tier": "serverless"},
                {"type": "firestore", "label": "Firestore", "icon": "flame", "blurb": "NoSQL documents", "tier": "serverless"},
                {"type": "gcs", "label": "Cloud Storage", "icon": "hard-drive", "blurb": "Object storage", "tier": "managed"},
                {"type": "memorystore", "label": "Memorystore", "icon": "gauge", "blurb": "Managed Redis", "tier": "managed"},
            ],
        },
        {
            "id": "ai",
            "name": "AI & ML",
            "services": [
                {"type": "vertex_ai", "label": "Vertex AI", "icon": "brain-circuit", "blurb": "ML platform", "tier": "managed"},
                {"type": "gemini", "label": "Gemini API", "icon": "sparkles", "blurb": "2M-context multimodal LLM", "tier": "serverless"},
                {"type": "discovery_engine", "label": "Discovery Engine", "icon": "search", "blurb": "Enterprise grounding", "tier": "managed"},
            ],
        },
        {
            "id": "network",
            "name": "Networking",
            "services": [
                {"type": "load_balancer", "label": "Cloud Load Balancing", "icon": "share-2", "blurb": "Global HTTPS LB", "tier": "managed"},
                {"type": "vpc", "label": "VPC Network", "icon": "network", "blurb": "Private networking", "tier": "managed"},
                {"type": "cloud_armor", "label": "Cloud Armor", "icon": "shield", "blurb": "WAF & DDoS defense", "tier": "managed"},
                {"type": "api_gateway", "label": "API Gateway", "icon": "door-open", "blurb": "Managed API front door", "tier": "serverless"},
            ],
        },
        {
            "id": "ops",
            "name": "Messaging & Ops",
            "services": [
                {"type": "pubsub", "label": "Pub/Sub", "icon": "radio", "blurb": "Async messaging", "tier": "serverless"},
                {"type": "cloud_tasks", "label": "Cloud Tasks", "icon": "list-checks", "blurb": "Task queues", "tier": "serverless"},
                {"type": "secret_manager", "label": "Secret Manager", "icon": "key-round", "blurb": "Secrets & keys", "tier": "managed"},
                {"type": "kms", "label": "Cloud KMS", "icon": "lock", "blurb": "Encryption keys", "tier": "managed"},
            ],
        },
    ]
}

_TF_SNIPPETS = {
    "cloud_run": '''resource "google_cloud_run_v2_service" "{name}" {{
  name     = "{name}"
  location = var.region
  template {{
    containers {{
      image = "gcr.io/${{var.project_id}}/{name}:latest"
      resources {{ limits = {{ cpu = "2", memory = "1Gi" }} }}
    }}
    scaling {{ min_instance_count = 1, max_instance_count = 20 }}
  }}
  ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"
}}''',
    "cloud_sql": '''resource "google_sql_database_instance" "{name}" {{
  name             = "{name}"
  database_version = "POSTGRES_16"
  region           = var.region
  settings {{
    tier = "db-custom-2-8192"
    ip_configuration {{
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }}
    backup_configuration {{ enabled = true, point_in_time_recovery_enabled = true }}
  }}
}}''',
    "load_balancer": '''resource "google_compute_global_forwarding_rule" "{name}" {{
  name       = "{name}"
  target     = google_compute_target_https_proxy.{name}_proxy.id
  port_range = "443"
}}''',
    "pubsub": '''resource "google_pubsub_topic" "{name}" {{
  name = "{name}"
  message_retention_duration = "86600s"
}}''',
    "gcs": '''resource "google_storage_bucket" "{name}" {{
  name                        = "${{var.project_id}}-{name}"
  location                    = "US"
  uniform_bucket_level_access = true
  versioning {{ enabled = true }}
}}''',
    "bigquery": '''resource "google_bigquery_dataset" "{name}" {{
  dataset_id    = "{name_snake}"
  location      = "US"
  default_table_expiration_ms = null
}}''',
    "vpc": '''resource "google_compute_network" "vpc" {{
  name                    = "{name}"
  auto_create_subnetworks = false
}}''',
    "gemini": '''# Gemini is consumed via Vertex AI — grant the runtime SA access
resource "google_project_iam_member" "{name}_user" {{
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${{google_service_account.runtime.email}}"
}}''',
}

_TF_GENERIC = '''resource "google_{type}" "{name}" {{
  # Generated by CloudPilot · Gemini architect
  name    = "{name}"
  project = var.project_id
}}'''


def _slug(label: str) -> str:
    return "".join(c if c.isalnum() else "-" for c in label.lower()).strip("-")


def _seed(graph: dict) -> int:
    payload = repr(sorted(n["id"] for n in graph["nodes"])).encode()
    return int(hashlib.sha256(payload).hexdigest()[:8], 16)


def generate(graph: dict, project: dict, model: str, max_tokens: int) -> dict:
    nodes, edges = graph["nodes"], graph["edges"]
    seed = _seed(graph)
    n = max(len(nodes), 1)

    # ---- Context window accounting (the 2M-token flex) ----
    sources = [
        {"name": "Enterprise Standards Corpus (Discovery Engine)", "tokens": 412_019},
        {"name": "Org Policy & IAM Snapshot", "tokens": 188_404},
        {"name": "Live Terraform State (entire estate)", "tokens": 521_337 + seed % 9000},
        {"name": "Historical Incident Postmortems", "tokens": 96_812},
        {"name": "Architecture Graph + Canvas Intent", "tokens": 1_900 * n},
    ]
    used = sum(s["tokens"] for s in sources)

    # ---- Reasoning trace ----
    types = {nd["type"] for nd in nodes}
    reasoning = [
        {"phase": "INGEST", "text": f"Ingested {used:,} tokens in a single pass — full standards corpus, org policy snapshot and live Terraform state. No RAG chunking required at this scale."},
        {"phase": "PARSE", "text": f"Parsed canvas graph: {len(nodes)} services, {len(edges)} connections. Topology classified as " + ("event-driven microservice mesh." if "pubsub" in types else "tiered web service.")},
        {"phase": "GROUND", "text": "Cross-referenced design against 147 enterprise standards via Discovery Engine grounding. 3 standards directly constrain this topology."},
    ]
    if "cloud_sql" in types:
        reasoning.append({"phase": "GROUND", "text": "Standard SEC-004 mandates private-IP-only databases — enforcing ipv4_enabled = false and VPC peering on Cloud SQL."})
    if "cloud_run" in types:
        reasoning.append({"phase": "DESIGN", "text": "Cloud Run ingress restricted to the internal load balancer; min instances pinned to 1 to meet RES-011 cold-start SLO."})
    reasoning += [
        {"phase": "DESIGN", "text": "Synthesized least-privilege IAM: one runtime service account per workload, no primitive roles (IAM-002)."},
        {"phase": "VERIFY", "text": "Replayed 12 historical incident postmortems against the proposed design — no recurrence vectors detected."},
        {"phase": "EMIT", "text": f"Emitting {n + 2} Terraform resources with cost annotations and a Cloud Build deployment pipeline."},
    ]

    # ---- Terraform ----
    blocks = [
        '''terraform {
  required_providers {
    google = { source = "hashicorp/google", version = "~> 6.0" }
  }
}

variable "project_id" { type = string }
variable "region"     { type = string, default = "''' + project.get("region", "us-central1") + '''" }

resource "google_service_account" "runtime" {
  account_id   = "cloudpilot-runtime"
  display_name = "CloudPilot runtime (least privilege)"
}''']
    for nd in nodes:
        name = _slug(nd["label"])
        tpl = _TF_SNIPPETS.get(nd["type"], _TF_GENERIC)
        blocks.append(tpl.format(name=name, name_snake=name.replace("-", "_"), type=nd["type"]))
    main_tf = "\n\n".join(blocks) + "\n"

    # ---- Compliance ----
    findings = [
        {"id": "f-iam", "severity": "PASS", "standard": "IAM-002", "title": "Least-privilege service accounts", "detail": "Dedicated runtime SA generated; zero primitive roles in plan.", "autofix": False},
        {"id": "f-enc", "severity": "PASS", "standard": "SEC-001", "title": "Encryption at rest", "detail": "All stateful services use Google-managed CMEK-ready encryption.", "autofix": False},
    ]
    if "cloud_sql" in types:
        findings.append({"id": "f-sql", "severity": "PASS", "standard": "SEC-004", "title": "Database network isolation", "detail": "Cloud SQL pinned to private IP with VPC peering — public path removed by Gemini during synthesis.", "autofix": False})
    if "load_balancer" in types and "cloud_armor" not in types:
        findings.append({"id": "f-waf", "severity": "WARN", "standard": "SEC-009", "title": "Edge missing WAF", "detail": "Global LB has no Cloud Armor policy attached. Gemini can inject a baseline OWASP rule set.", "autofix": True})
    if "compute_engine" in types:
        findings.append({"id": "f-vm", "severity": "WARN", "standard": "COST-003", "title": "Unattended VM rightsizing", "detail": "Compute Engine without an autoscaler violates cost guardrail COST-003.", "autofix": True})
    if not {"vpc"} & types and ({"cloud_sql", "memorystore"} & types):
        findings.append({"id": "f-vpc", "severity": "BLOCK", "standard": "NET-001", "title": "Private services require a VPC", "detail": "Stateful private services present but no VPC on canvas. Drag a VPC node or accept Gemini's autofix.", "autofix": True})
    score = max(40, 100 - sum(6 if f["severity"] == "WARN" else 25 if f["severity"] == "BLOCK" else 0 for f in findings))

    # ---- Cost ----
    price = {"cloud_run": 86.4, "gke": 292.0, "cloud_functions": 12.8, "compute_engine": 168.7, "cloud_sql": 246.3,
             "bigquery": 121.9, "firestore": 33.2, "gcs": 18.6, "memorystore": 97.1, "vertex_ai": 204.5,
             "gemini": 158.2, "discovery_engine": 88.0, "load_balancer": 36.5, "vpc": 0.0, "cloud_armor": 64.0,
             "api_gateway": 22.4, "pubsub": 41.7, "cloud_tasks": 9.3, "secret_manager": 3.1, "kms": 6.0}
    breakdown = [{"service": nd["label"], "usd": price.get(nd["type"], 25.0)} for nd in nodes]
    monthly = round(sum(b["usd"] for b in breakdown), 2)

    return {
        "run_id": f"run-{uuid.uuid4().hex[:10]}",
        "model": model,
        "context_window": {"used": used, "max": max_tokens, "sources": sources},
        "reasoning": reasoning,
        "iac": {"language": "terraform", "files": [{"path": "main.tf", "content": main_tf}]},
        "compliance": {"score": score, "findings": findings},
        "cost_estimate": {"monthly_usd": monthly, "breakdown": breakdown},
        "summary": f"Designed a {len(nodes)}-service architecture grounded in 147 enterprise standards, emitted {n + 2} Terraform resources, projected ${monthly:,.2f}/mo.",
    }


# ---------------- Deployment simulation (Flight Deck) ----------------
_DEPLOYMENTS: dict[str, dict] = {}

_STEP_PLAN = [
    ("preflight-policy", "Policy gate · org constraints replay", "PREFLIGHT", 2.0),
    ("preflight-plan", "terraform plan · drift check", "PREFLIGHT", 3.0),
    ("ignition-build", "Cloud Build · container bake", "IGNITION", 4.0),
    ("ignition-scan", "Artifact scan · CVE sweep", "IGNITION", 2.5),
    ("ascent-apply", "terraform apply · provisioning", "ASCENT", 5.0),
    ("ascent-smoke", "Smoke probes · golden signals", "ASCENT", 2.5),
    ("orbit-traffic", "Traffic shift · 100% to new revision", "ORBIT", 2.0),
]


def start_deployment(run_id: str, fail_step: str | None = None) -> dict:
    dep_id = f"dep-{uuid.uuid4().hex[:8]}"
    _DEPLOYMENTS[dep_id] = {"t0": time.time(), "run_id": run_id, "fail_step": fail_step, "resumed_at": None}
    return get_deployment(dep_id)


def retry_deployment(dep_id: str) -> dict:
    dep = _DEPLOYMENTS[dep_id]
    dep["fail_step"] = None
    dep["resumed_at"] = time.time()
    failed_elapsed = 0.0
    for sid, _, _, dur in _STEP_PLAN:
        failed_elapsed += dur
        if sid == dep.get("failed_at"):
            break
    dep["t0"] = time.time() - failed_elapsed + 0.5
    return get_deployment(dep_id)


def get_deployment(dep_id: str) -> dict:
    dep = _DEPLOYMENTS[dep_id]
    elapsed = time.time() - dep["t0"]
    steps, log_tail, cursor = [], [], 0.0
    phase, progress, halted = "PREFLIGHT", 0, False
    total = sum(d for *_, d in _STEP_PLAN)
    for sid, name, ph, dur in _STEP_PLAN:
        if halted:
            status = "pending"
        elif elapsed >= cursor + dur:
            if dep["fail_step"] == sid:
                status, halted = "failed", True
                dep["failed_at"] = sid
                log_tail.append(f"[{sid}] ERROR: step failed — see diagnosis")
            else:
                status = "success"
                log_tail.append(f"[{sid}] ✓ {name} ({dur:.1f}s)")
        elif elapsed >= cursor:
            status = "running"
            phase = ph
            log_tail.append(f"[{sid}] … {name}")
        else:
            status = "pending"
        steps.append({"id": sid, "name": name, "phase": ph, "status": status,
                      "duration_ms": int(dur * 1000) if status == "success" else None, "log": None})
        cursor += dur
    done = sum(1 for s in steps if s["status"] == "success")
    progress = int(100 * min(elapsed, total) / total) if not halted else int(100 * done / len(_STEP_PLAN))
    if all(s["status"] == "success" for s in steps):
        phase, progress = "ORBIT", 100
        log_tail.append("[orbit] 🛰  Architecture is live. Telemetry nominal.")
    elif halted:
        phase = next(s["phase"] for s in steps if s["status"] == "failed")
    return {"deployment_id": dep_id, "phase": phase, "progress": progress, "steps": steps, "log_tail": log_tail[-8:]}


def diagnose(deployment_id: str, step_id: str) -> dict:
    return {
        "root_cause": {
            "title": "Cloud SQL instance name collision in region us-central1",
            "detail": "terraform apply failed because instance name 'orders-db' was used by a deleted instance still inside its 7-day reservation window. Gemini correlated the apply log with the project's audit trail (ingested in-context) and found the deletion event from 2026-06-07.",
            "confidence": 0.97,
            "error_line": 'Error 409: The Cloud SQL instance already exists. When you delete an instance, you can\'t reuse the name for up to a week.',
            "log_excerpt": [
                "google_sql_database_instance.orders-db: Creating...",
                "╷",
                "│ Error: Error, failed to create instance orders-db:",
                "│ googleapi: Error 409: The Cloud SQL instance already exists.",
                "│ When you delete an instance, you can't reuse the name for up to a week.",
                "╵",
            ],
        },
        "patch": {
            "file": "main.tf",
            "diff": [
                {"type": "ctx", "text": 'resource "google_sql_database_instance" "orders-db" {'},
                {"type": "del", "text": '  name             = "orders-db"'},
                {"type": "add", "text": '  name             = "orders-db-${random_id.db_suffix.hex}"'},
                {"type": "ctx", "text": '  database_version = "POSTGRES_16"'},
                {"type": "add", "text": ""},
                {"type": "add", "text": 'resource "random_id" "db_suffix" { byte_length = 2 }'},
            ],
            "explanation": "Suffix the instance name with a stable random id so re-creations never collide with the 7-day name reservation. Matches naming standard NAM-006 (immutable-resource suffixing).",
        },
        "references": [
            {"standard": "NAM-006", "title": "Immutable resource naming with entropy suffixes"},
            {"standard": "RES-002", "title": "Recoverable delete windows for stateful services"},
        ],
    }


def vision_import() -> dict:
    nodes = [
        {"id": "v-lb", "type": "load_balancer", "label": "Edge LB", "position": {"x": 80, "y": 220}, "config": {}},
        {"id": "v-armor", "type": "cloud_armor", "label": "Cloud Armor", "position": {"x": 80, "y": 60}, "config": {}},
        {"id": "v-api", "type": "cloud_run", "label": "API Service", "position": {"x": 360, "y": 220}, "config": {}},
        {"id": "v-worker", "type": "cloud_run", "label": "Worker", "position": {"x": 360, "y": 420}, "config": {}},
        {"id": "v-bus", "type": "pubsub", "label": "Event Bus", "position": {"x": 640, "y": 320}, "config": {}},
        {"id": "v-db", "type": "cloud_sql", "label": "Orders DB", "position": {"x": 640, "y": 120}, "config": {}},
        {"id": "v-llm", "type": "gemini", "label": "Gemini API", "position": {"x": 920, "y": 220}, "config": {}},
    ]
    edges = [
        {"id": "ve-1", "source": "v-armor", "target": "v-lb", "label": "WAF"},
        {"id": "ve-2", "source": "v-lb", "target": "v-api", "label": "HTTPS"},
        {"id": "ve-3", "source": "v-api", "target": "v-db", "label": "private IP"},
        {"id": "ve-4", "source": "v-api", "target": "v-bus", "label": "publish"},
        {"id": "ve-5", "source": "v-bus", "target": "v-worker", "label": "push sub"},
        {"id": "ve-6", "source": "v-worker", "target": "v-llm", "label": "inference"},
    ]
    return {
        "graph": {"nodes": nodes, "edges": edges},
        "narrative": "Gemini read the whiteboard photo natively — no OCR pipeline. It identified 7 services, inferred the pub/sub fan-out from an arrow annotated 'async', and recognized the box labeled 'magic ai thing' as a Gemini inference call.",
        "confidence": 0.94,
    }
