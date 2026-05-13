export type NodeStatus = "active" | "warning" | "todo" | "dormant" | "broken" | "unknown"
export type NodeLayer =
  | "source" | "collection" | "processing" | "database"
  | "wiki" | "delta" | "api" | "frontend" | "ops"

export interface RoadmapNode {
  node_id: string
  label: string
  sub: string | null
  type: string
  layer: NodeLayer
  status: NodeStatus
  risk: string
  detail: string[] | null
  files: string[] | null
  x: number
  y: number
  user_impact_score: number
  updated_at: string | null
  // 지능형 감사 컬럼
  issues: string | null
  opportunities: string | null
  audit_score: number | null
  gap_severity: string | null
  audited_at: string | null
  audit_type: string | null
}

export interface RoadmapEdge {
  edge_id: string
  source: string
  target: string
  label: string | null
  color: string
  dashed: boolean
}

export interface HealthSummary {
  health_score: number
  total: number
  by_status: Record<string, number>
  last_updated: string
}

export interface InsightPanel {
  gaps: Array<{ node_id: string; label: string; status: string; user_impact_score: number }>
  recommendations: string[]
}

export interface SystemDiagnosis {
  system_verdict: string
  critical_bottlenecks: Array<{ rank: number; node_id: string; impact: string }>
  pipeline_risk: string
  immediate_actions: string[]
}

export interface RoadmapGraph {
  nodes: RoadmapNode[]
  edges: RoadmapEdge[]
  layer_labels: Record<string, string>
  health: HealthSummary
  insights?: InsightPanel
  system_diagnosis: SystemDiagnosis
  last_audited_at: string | null
  audit_run_id: string | null
}
