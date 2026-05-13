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

export interface RoadmapGraph {
  nodes: RoadmapNode[]
  edges: RoadmapEdge[]
  layer_labels: Record<string, string>
  health: HealthSummary
  insights: InsightPanel
}
