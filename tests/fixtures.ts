/**
 * Canonical API fixtures — mirror the FastAPI demo engine contract exactly
 * (snake_case wire format). One source of truth for every spec + screenshot.
 */

export const HEALTH = {
  status: "ok",
  mode: "demo",
  model: "gemini-2.5-pro",
  brand: "MilkMan Enterprise",
  context_window: 2_097_152,
};

export const CATALOG = {
  categories: [
    {
      id: "compute",
      name: "Compute",
      services: [
        { type: "cloud_run", label: "Cloud Run", icon: "container", blurb: "Serverless containers", tier: "serverless" },
        { type: "gke", label: "GKE Autopilot", icon: "boxes", blurb: "Managed Kubernetes", tier: "managed" },
        { type: "cloud_functions", label: "Cloud Functions", icon: "zap", blurb: "Event-driven functions", tier: "serverless" },
        { type: "compute_engine", label: "Compute Engine", icon: "server", blurb: "Virtual machines", tier: "iaas" },
      ],
    },
    {
      id: "data",
      name: "Data & Storage",
      services: [
        { type: "cloud_sql", label: "Cloud SQL", icon: "database", blurb: "Managed Postgres/MySQL", tier: "managed" },
        { type: "bigquery", label: "BigQuery", icon: "bar-chart-3", blurb: "Serverless warehouse", tier: "serverless" },
        { type: "gcs", label: "Cloud Storage", icon: "hard-drive", blurb: "Object storage", tier: "managed" },
      ],
    },
    {
      id: "ai",
      name: "AI & ML",
      services: [
        { type: "vertex_ai", label: "Vertex AI", icon: "brain-circuit", blurb: "ML platform", tier: "managed" },
        { type: "gemini", label: "Gemini API", icon: "sparkles", blurb: "2M-context multimodal LLM", tier: "serverless" },
      ],
    },
    {
      id: "network",
      name: "Networking",
      services: [
        { type: "load_balancer", label: "Cloud Load Balancing", icon: "share-2", blurb: "Global HTTPS LB", tier: "managed" },
        { type: "vpc", label: "VPC Network", icon: "network", blurb: "Private networking", tier: "managed" },
        { type: "cloud_armor", label: "Cloud Armor", icon: "shield", blurb: "WAF & DDoS defense", tier: "managed" },
      ],
    },
    {
      id: "ops",
      name: "Messaging & Ops",
      services: [
        { type: "pubsub", label: "Pub/Sub", icon: "radio", blurb: "Async messaging", tier: "serverless" },
        { type: "secret_manager", label: "Secret Manager", icon: "key-round", blurb: "Secrets & keys", tier: "managed" },
      ],
    },
  ],
};

export const GENERATE_RUN = {
  run_id: "run-e2e0ffline1",
  model: "gemini-2.5-pro",
  context_window: {
    used: 1_229_431,
    max: 2_097_152,
    sources: [
      { name: "Enterprise Standards Corpus (Discovery Engine)", tokens: 412_019 },
      { name: "Org Policy & IAM Snapshot", tokens: 188_404 },
      { name: "Live Terraform State (entire estate)", tokens: 524_508 },
      { name: "Historical Incident Postmortems", tokens: 96_812 },
      { name: "Architecture Graph + Canvas Intent", tokens: 7_688 },
    ],
  },
  reasoning: [
    { phase: "INGEST", text: "Ingested 1,229,431 tokens in a single pass — full standards corpus, org policy snapshot and live Terraform state. No RAG chunking required at this scale." },
    { phase: "PARSE", text: "Parsed canvas graph: 4 services, 3 connections. Topology classified as tiered web service." },
    { phase: "GROUND", text: "Cross-referenced design against 147 enterprise standards via Discovery Engine grounding. 3 standards directly constrain this topology." },
    { phase: "GROUND", text: "Standard SEC-004 mandates private-IP-only databases — enforcing ipv4_enabled = false and VPC peering on Cloud SQL." },
    { phase: "DESIGN", text: "Cloud Run ingress restricted to the internal load balancer; min instances pinned to 1 to meet RES-011 cold-start SLO." },
    { phase: "DESIGN", text: "Synthesized least-privilege IAM: one runtime service account per workload, no primitive roles (IAM-002)." },
    { phase: "VERIFY", text: "Replayed 12 historical incident postmortems against the proposed design — no recurrence vectors detected." },
    { phase: "EMIT", text: "Emitting 6 Terraform resources with cost annotations and a Cloud Build deployment pipeline." },
  ],
  iac: {
    language: "terraform",
    files: [
      {
        path: "main.tf",
        content: `terraform {
  required_providers {
    google = { source = "hashicorp/google", version = "~> 6.0" }
  }
}

variable "project_id" { type = string }
variable "region"     { type = string, default = "us-central1" }

resource "google_service_account" "runtime" {
  account_id   = "cloudpilot-runtime"
  display_name = "CloudPilot runtime (least privilege)"
}

resource "google_compute_global_forwarding_rule" "edge-lb" {
  name       = "edge-lb"
  target     = google_compute_target_https_proxy.edge-lb_proxy.id
  port_range = "443"
}

resource "google_cloud_run_v2_service" "api-service" {
  name     = "api-service"
  location = var.region
  template {
    containers {
      image = "gcr.io/\${var.project_id}/api-service:latest"
      resources { limits = { cpu = "2", memory = "1Gi" } }
    }
    scaling { min_instance_count = 1, max_instance_count = 20 }
  }
  ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"
}

resource "google_sql_database_instance" "orders-db" {
  name             = "orders-db"
  database_version = "POSTGRES_16"
  region           = var.region
  settings {
    tier = "db-custom-2-8192"
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }
    backup_configuration { enabled = true, point_in_time_recovery_enabled = true }
  }
}

resource "google_pubsub_topic" "event-bus" {
  name = "event-bus"
  message_retention_duration = "86600s"
}
`,
      },
    ],
  },
  compliance: {
    score: 94,
    findings: [
      { id: "f-iam", severity: "PASS", standard: "IAM-002", title: "Least-privilege service accounts", detail: "Dedicated runtime SA generated; zero primitive roles in plan.", autofix: false },
      { id: "f-enc", severity: "PASS", standard: "SEC-001", title: "Encryption at rest", detail: "All stateful services use Google-managed CMEK-ready encryption.", autofix: false },
      { id: "f-sql", severity: "PASS", standard: "SEC-004", title: "Database network isolation", detail: "Cloud SQL pinned to private IP with VPC peering — public path removed by Gemini during synthesis.", autofix: false },
      { id: "f-waf", severity: "WARN", standard: "SEC-009", title: "Edge missing WAF", detail: "Global LB has no Cloud Armor policy attached. Gemini can inject a baseline OWASP rule set.", autofix: true },
    ],
  },
  cost_estimate: {
    monthly_usd: 410.9,
    breakdown: [
      { service: "Edge LB", usd: 36.5 },
      { service: "API Service", usd: 86.4 },
      { service: "Orders DB", usd: 246.3 },
      { service: "Event Bus", usd: 41.7 },
    ],
  },
  summary: "Designed a 4-service architecture grounded in 147 enterprise standards, emitted 6 Terraform resources, projected $410.90/mo.",
};

// ---------------- Flight Deck timelines ----------------
const STEP_PLAN: Array<[string, string, string]> = [
  ["preflight-policy", "Policy gate · org constraints replay", "PREFLIGHT"],
  ["preflight-plan", "terraform plan · drift check", "PREFLIGHT"],
  ["ignition-build", "Cloud Build · container bake", "IGNITION"],
  ["ignition-scan", "Artifact scan · CVE sweep", "IGNITION"],
  ["ascent-apply", "terraform apply · provisioning", "ASCENT"],
  ["ascent-smoke", "Smoke probes · golden signals", "ASCENT"],
  ["orbit-traffic", "Traffic shift · 100% to new revision", "ORBIT"],
];

export function deploymentFrame(deploymentId: string, doneCount: number, opts: { failAt?: string } = {}) {
  const steps = STEP_PLAN.map(([id, name, phase], i) => {
    let status = "pending";
    if (i < doneCount) status = "success";
    else if (i === doneCount) status = "running";
    if (opts.failAt && id === opts.failAt && i <= doneCount) status = "failed";
    return { id, name, phase, status, duration_ms: status === "success" ? 1800 + i * 400 : null, log: null };
  });
  const failed = steps.find((s) => s.status === "failed");
  const allDone = doneCount >= STEP_PLAN.length;
  if (allDone && !failed) steps.forEach((s) => (s.status = "success"));
  const phase = failed ? failed.phase : allDone ? "ORBIT" : STEP_PLAN[Math.min(doneCount, STEP_PLAN.length - 1)][2];
  const progress = failed
    ? Math.round((steps.filter((s) => s.status === "success").length / STEP_PLAN.length) * 100)
    : Math.min(100, Math.round((doneCount / STEP_PLAN.length) * 100));
  const log_tail = steps
    .filter((s) => s.status !== "pending")
    .map((s) =>
      s.status === "success"
        ? `[${s.id}] ✓ ${s.name}`
        : s.status === "failed"
          ? `[${s.id}] ERROR: step failed — see diagnosis`
          : `[${s.id}] … ${s.name}`
    );
  if (allDone && !failed) log_tail.push("[orbit] 🛰  Architecture is live. Telemetry nominal.");
  return { deployment_id: deploymentId, phase, progress, steps, log_tail };
}

export const DIAGNOSIS = {
  root_cause: {
    title: "Cloud SQL instance name collision in region us-central1",
    detail:
      "terraform apply failed because instance name 'orders-db' was used by a deleted instance still inside its 7-day reservation window. Gemini correlated the apply log with the project's audit trail (ingested in-context) and found the deletion event from 2026-06-07.",
    confidence: 0.97,
    error_line: "Error 409: The Cloud SQL instance already exists. When you delete an instance, you can't reuse the name for up to a week.",
    log_excerpt: [
      "google_sql_database_instance.orders-db: Creating...",
      "╷",
      "│ Error: Error, failed to create instance orders-db:",
      "│ googleapi: Error 409: The Cloud SQL instance already exists.",
      "│ When you delete an instance, you can't reuse the name for up to a week.",
      "╵",
    ],
  },
  patch: {
    file: "main.tf",
    diff: [
      { type: "ctx", text: 'resource "google_sql_database_instance" "orders-db" {' },
      { type: "del", text: '  name             = "orders-db"' },
      { type: "add", text: '  name             = "orders-db-${random_id.db_suffix.hex}"' },
      { type: "ctx", text: '  database_version = "POSTGRES_16"' },
      { type: "add", text: "" },
      { type: "add", text: 'resource "random_id" "db_suffix" { byte_length = 2 }' },
    ],
    explanation:
      "Suffix the instance name with a stable random id so re-creations never collide with the 7-day name reservation. Matches naming standard NAM-006 (immutable-resource suffixing).",
  },
  references: [
    { standard: "NAM-006", title: "Immutable resource naming with entropy suffixes" },
    { standard: "RES-002", title: "Recoverable delete windows for stateful services" },
  ],
};

export const VISION = {
  graph: {
    nodes: [
      { id: "v-lb", type: "load_balancer", label: "Edge LB", position: { x: 80, y: 220 }, config: {} },
      { id: "v-armor", type: "cloud_armor", label: "Cloud Armor", position: { x: 80, y: 60 }, config: {} },
      { id: "v-api", type: "cloud_run", label: "API Service", position: { x: 360, y: 220 }, config: {} },
      { id: "v-worker", type: "cloud_run", label: "Worker", position: { x: 360, y: 420 }, config: {} },
      { id: "v-bus", type: "pubsub", label: "Event Bus", position: { x: 640, y: 320 }, config: {} },
      { id: "v-db", type: "cloud_sql", label: "Orders DB", position: { x: 640, y: 120 }, config: {} },
      { id: "v-llm", type: "gemini", label: "Gemini API", position: { x: 920, y: 220 }, config: {} },
    ],
    edges: [
      { id: "ve-1", source: "v-armor", target: "v-lb", label: "WAF" },
      { id: "ve-2", source: "v-lb", target: "v-api", label: "HTTPS" },
      { id: "ve-3", source: "v-api", target: "v-db", label: "private IP" },
      { id: "ve-4", source: "v-api", target: "v-bus", label: "publish" },
      { id: "ve-5", source: "v-bus", target: "v-worker", label: "push sub" },
      { id: "ve-6", source: "v-worker", target: "v-llm", label: "inference" },
    ],
  },
  narrative:
    "Gemini read the whiteboard photo natively — no OCR pipeline. It identified 7 services, inferred the pub/sub fan-out from an arrow annotated 'async', and recognized the box labeled 'magic ai thing' as a Gemini inference call.",
  confidence: 0.94,
};
