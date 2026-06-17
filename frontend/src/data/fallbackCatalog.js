// Mirror of the backend catalog — keeps the palette alive if the API is down.
export const FALLBACK_CATALOG = {
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
        { type: "firestore", label: "Firestore", icon: "flame", blurb: "NoSQL documents", tier: "serverless" },
        { type: "gcs", label: "Cloud Storage", icon: "hard-drive", blurb: "Object storage", tier: "managed" },
        { type: "memorystore", label: "Memorystore", icon: "gauge", blurb: "Managed Redis", tier: "managed" },
      ],
    },
    {
      id: "ai",
      name: "AI & ML",
      services: [
        { type: "vertex_ai", label: "Vertex AI", icon: "brain-circuit", blurb: "ML platform", tier: "managed" },
        { type: "gemini", label: "Gemini API", icon: "sparkles", blurb: "2M-context multimodal LLM", tier: "serverless" },
        { type: "discovery_engine", label: "Discovery Engine", icon: "search", blurb: "Enterprise grounding", tier: "managed" },
      ],
    },
    {
      id: "network",
      name: "Networking",
      services: [
        { type: "load_balancer", label: "Cloud Load Balancing", icon: "share-2", blurb: "Global HTTPS LB", tier: "managed" },
        { type: "vpc", label: "VPC Network", icon: "network", blurb: "Private networking", tier: "managed" },
        { type: "cloud_armor", label: "Cloud Armor", icon: "shield", blurb: "WAF & DDoS defense", tier: "managed" },
        { type: "api_gateway", label: "API Gateway", icon: "door-open", blurb: "Managed API front door", tier: "serverless" },
      ],
    },
    {
      id: "ops",
      name: "Messaging & Ops",
      services: [
        { type: "pubsub", label: "Pub/Sub", icon: "radio", blurb: "Async messaging", tier: "serverless" },
        { type: "cloud_tasks", label: "Cloud Tasks", icon: "list-checks", blurb: "Task queues", tier: "serverless" },
        { type: "secret_manager", label: "Secret Manager", icon: "key-round", blurb: "Secrets & keys", tier: "managed" },
        { type: "kms", label: "Cloud KMS", icon: "lock", blurb: "Encryption keys", tier: "managed" },
      ],
    },
  ],
};
