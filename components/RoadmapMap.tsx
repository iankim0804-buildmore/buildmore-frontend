"use client"

import { useMemo } from "react"
import type { RoadmapNode, RoadmapEdge } from "@/types/roadmap"

const NODE_W = 240
const NODE_H = 96

const STATUS_STYLE: Record<string, string> = {
  active:  "border-emerald-400 bg-emerald-950/60",
  warning: "border-amber-400  bg-amber-950/60",
  todo:    "border-sky-400    bg-sky-950/60",
  dormant: "border-slate-500  bg-slate-900/60",
  broken:  "border-red-500    bg-red-950/60",
  unknown: "border-slate-600  bg-slate-900/60",
}

const STATUS_BADGE: Record<string, string> = {
  active:  "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
  warning: "bg-amber-500/20  text-amber-300  border border-amber-500/40",
  todo:    "bg-sky-500/20    text-sky-300    border border-sky-500/40",
  dormant: "bg-slate-700/40  text-slate-400  border border-slate-600/40",
  broken:  "bg-red-500/20    text-red-300    border border-red-500/40",
  unknown: "bg-slate-700/40  text-slate-400  border border-slate-600/40",
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
        className="absolute top-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 select-none"
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
      return (
        <g key={edge.edge_id} style={{ opacity: isFiltered ? 0.08 : 0.65 }}>
          <path
            d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
            fill="none" stroke={edge.color} strokeWidth={1.5}
            strokeDasharray={edge.dashed ? "5 4" : undefined}
            markerEnd="url(#arrow)"
          />
          <text x={midX - 28} y={(y1 + y2) / 2 - 6}
            fill="rgba(226,232,240,0.5)" fontSize={9} textAnchor="middle">
            {edge.label}
          </text>
        </g>
      )
    })
  }

  function renderNodes() {
    return nodes.map(node => {
      const isFiltered = filterStatus !== null && node.status !== filterStatus
      const isSelected = node.node_id === selectedId
      return (
        <button
          key={node.node_id}
          onClick={() => onSelect(node)}
          className={[
            "absolute rounded-xl border-2 p-3 text-left transition-all cursor-pointer",
            STATUS_STYLE[node.status] ?? STATUS_STYLE.unknown,
            isSelected ? "ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-950" : "",
          ].join(" ")}
          style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H, opacity: isFiltered ? 0.15 : 1 }}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{node.type}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_BADGE[node.status] ?? STATUS_BADGE.unknown}`}>
              {node.status}
            </span>
          </div>
          <p className="text-[11px] font-bold text-white leading-tight line-clamp-1">{node.label}</p>
          {node.sub && <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{node.sub}</p>}
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-[9px] text-slate-500">impact</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`h-1 w-2.5 rounded-full ${i < Math.ceil(node.user_impact_score / 2) ? "bg-cyan-400" : "bg-slate-700"}`} />
              ))}
            </div>
          </div>
        </button>
      )
    })
  }

  const maxX = Math.max(...nodes.map(n => n.x)) + NODE_W + 60
  const maxY = Math.max(...nodes.map(n => n.y)) + NODE_H + 60

  return (
    <div className="relative overflow-auto flex-1 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.07)_1px,transparent_0)] [background-size:24px_24px]">
      <div className="relative" style={{ width: maxX, height: maxY }}>
        {renderLayerLabels()}
        <svg className="pointer-events-none absolute inset-0" width={maxX} height={maxY} aria-hidden>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L8,3 z" fill="rgba(148,163,184,0.7)" />
            </marker>
          </defs>
          {renderEdges()}
        </svg>
        {renderNodes()}
      </div>
    </div>
  )
}
