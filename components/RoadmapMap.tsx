"use client"

import { useMemo } from "react"
import type { RoadmapNode, RoadmapEdge } from "@/types/roadmap"

const NODE_W = 232
const NODE_H = 88

const STATUS_STYLE: Record<string, { border: string; bg: string; dot: string; badge: string }> = {
  active:  { border: "border-emerald-200", bg: "bg-emerald-50",  dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  warning: { border: "border-amber-200",   bg: "bg-amber-50",    dot: "bg-amber-500",   badge: "bg-amber-100 text-amber-700 border-amber-200" },
  todo:    { border: "border-blue-200",    bg: "bg-blue-50",     dot: "bg-blue-500",    badge: "bg-blue-100 text-blue-700 border-blue-200" },
  dormant: { border: "border-zinc-200",    bg: "bg-zinc-50",     dot: "bg-zinc-400",    badge: "bg-zinc-100 text-zinc-500 border-zinc-200" },
  broken:  { border: "border-red-200",     bg: "bg-red-50",      dot: "bg-red-500",     badge: "bg-red-100 text-red-700 border-red-200" },
  unknown: { border: "border-zinc-200",    bg: "bg-white",       dot: "bg-zinc-300",    badge: "bg-zinc-100 text-zinc-400 border-zinc-200" },
}

interface Props {
  nodes: RoadmapNode[]
  edges: RoadmapEdge[]
  layerLabels: Record<string, string>
  filterStatus: string | null
  selectedId: string | null
  onSelect: (node: RoadmapNode) => void
}

export default function RoadmapMap({
  nodes, edges, layerLabels, filterStatus, selectedId, onSelect,
}: Props) {
  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.node_id, n])), [nodes])

  const layerXMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const n of nodes) {
      if (!(n.layer in map) || n.x < map[n.layer]) map[n.layer] = n.x
    }
    return map
  }, [nodes])

  function renderLayerLabels() {
    return Object.entries(layerXMap).map(([layer, x]) => (
      <div
        key={layer}
        className="absolute top-3 text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-400 select-none"
        style={{ left: x, width: NODE_W, textAlign: "center" }}
      >
        {layerLabels[layer] ?? layer}
      </div>
    ))
  }

  function renderEdges() {
    return edges.map(edge => {
      const from = nodeMap.get(edge.source)
      const to   = nodeMap.get(edge.target)
      if (!from || !to) return null
      const x1 = from.x + NODE_W, y1 = from.y + NODE_H / 2
      const x2 = to.x,            y2 = to.y   + NODE_H / 2
      const midX = (x1 + x2) / 2
      const isFiltered = filterStatus !== null && from.status !== filterStatus && to.status !== filterStatus
      const strokeColor = edge.dashed ? "#94a3b8" : "#cbd5e1"
      return (
        <g key={edge.edge_id} style={{ opacity: isFiltered ? 0.08 : 0.9 }}>
          <path
            d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
            fill="none" stroke={strokeColor} strokeWidth={1.5}
            strokeDasharray={edge.dashed ? "5 3" : undefined}
            markerEnd="url(#arrow)"
          />
          {edge.label && (
            <text x={midX} y={(y1 + y2) / 2 - 5}
              fill="#94a3b8" fontSize={9} textAnchor="middle"
              fontFamily="ui-sans-serif, system-ui, sans-serif">
              {edge.label}
            </text>
          )}
        </g>
      )
    })
  }

  function renderNodes() {
    return nodes.map(node => {
      const s = STATUS_STYLE[node.status] ?? STATUS_STYLE.unknown
      const isFiltered = filterStatus !== null && node.status !== filterStatus
      const isSelected = node.node_id === selectedId
      return (
        <button
          key={node.node_id}
          onClick={() => onSelect(node)}
          className={[
            "absolute rounded-xl border bg-white text-left transition-all cursor-pointer shadow-sm hover:shadow-md",
            s.border, s.bg,
            isSelected ? "ring-2 ring-offset-2 ring-blue-500 shadow-md" : "hover:border-zinc-300",
          ].join(" ")}
          style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H, opacity: isFiltered ? 0.18 : 1 }}
        >
          <div className="h-full flex flex-col justify-between p-3">
            <div className="flex items-start justify-between gap-1">
              <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-wide">{node.type}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${s.badge}`}>
                {node.status}
              </span>
            </div>
            <div>
              <p className="text-[11.5px] font-semibold text-zinc-900 leading-tight line-clamp-1">{node.label}</p>
              {node.sub && <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{node.sub}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`h-1 w-2 rounded-full ${
                    i < Math.ceil(node.user_impact_score / 2) ? "bg-blue-400" : "bg-zinc-200"
                  }`} />
                ))}
              </div>
              <span className="text-[9px] text-zinc-400 ml-0.5">{node.user_impact_score}</span>
            </div>
          </div>
        </button>
      )
    })
  }

  const maxX = Math.max(...nodes.map(n => n.x), 0) + NODE_W + 80
  const maxY = Math.max(...nodes.map(n => n.y), 0) + NODE_H + 80

  return (
    <div className="relative overflow-auto flex-1 bg-[radial-gradient(circle_at_1px_1px,#e2e8f0_1px,transparent_0)] [background-size:20px_20px] bg-zinc-50">
      <div className="relative" style={{ width: maxX, height: maxY }}>
        {renderLayerLabels()}
        <svg className="pointer-events-none absolute inset-0" width={maxX} height={maxY} aria-hidden>
          <defs>
            <marker id="arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L7,3 z" fill="#cbd5e1" />
            </marker>
          </defs>
          {renderEdges()}
        </svg>
        {renderNodes()}
      </div>
    </div>
  )
}
