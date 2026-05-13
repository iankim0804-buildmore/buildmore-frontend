"use client"

import { useMemo, useState, useRef, useEffect, useId } from "react"
import type { RoadmapNode, RoadmapEdge } from "@/types/roadmap"

const NODE_W = 232
const NODE_H = 88
const MIN_ZOOM = 0.15
const MAX_ZOOM = 3

const STATUS_STYLE: Record<string, { border: string; bg: string; dot: string; badge: string }> = {
  active:  { border: "border-emerald-200", bg: "bg-emerald-50",  dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  warning: { border: "border-amber-200",   bg: "bg-amber-50",    dot: "bg-amber-500",   badge: "bg-amber-100 text-amber-700 border-amber-200" },
  todo:    { border: "border-blue-200",    bg: "bg-blue-50",     dot: "bg-blue-500",    badge: "bg-blue-100 text-blue-700 border-blue-200" },
  dormant: { border: "border-zinc-200",    bg: "bg-zinc-50",     dot: "bg-zinc-400",    badge: "bg-zinc-100 text-zinc-500 border-zinc-200" },
  broken:  { border: "border-red-200",     bg: "bg-red-50",      dot: "bg-red-500",     badge: "bg-red-100 text-red-700 border-red-200" },
  unknown: { border: "border-zinc-200",    bg: "bg-white",       dot: "bg-zinc-300",    badge: "bg-zinc-100 text-zinc-400 border-zinc-200" },
}

interface EdgePopup {
  edge: RoadmapEdge
  sourceLabel: string
  targetLabel: string
  screenX: number
  screenY: number
}

interface Props {
  nodes: RoadmapNode[]
  edges: RoadmapEdge[]
  layerLabels: Record<string, string>
  filterStatus: string | null
  selectedId: string | null
  onSelect: (node: RoadmapNode) => void
  onDeselect: () => void
}

export default function RoadmapMap({ nodes, edges, layerLabels, filterStatus, selectedId, onSelect, onDeselect }: Props) {
  const rawUid  = useId()
  const uid     = rawUid.replace(/:/g, "")
  const arrowId = `arw-${uid}`
  const arwHlId = `arwhl-${uid}`

  const [zoom, setZoom] = useState(0.6)
  const [panX, setPanX] = useState(20)
  const [panY, setPanY] = useState(32)
  const [panning, setPanning]     = useState(false)
  const [hlEdgeId, setHlEdgeId]   = useState<string | null>(null)
  const [edgePopup, setEdgePopup] = useState<EdgePopup | null>(null)

  const zoomRef  = useRef(0.6)
  const panRef   = useRef({ x: 20, y: 32 })
  const isPanRef = useRef(false)
  const dragRef  = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.node_id, n])), [nodes])
  const edgeMap = useMemo(() => new Map(edges.map(e => [e.edge_id, e])), [edges])

  /** edge IDs connected to selectedId (incoming + outgoing) */
  const connectedEdgeIds = useMemo<Set<string> | null>(() => {
    if (!selectedId) return null
    const s = new Set<string>()
    for (const e of edges) if (e.source === selectedId || e.target === selectedId) s.add(e.edge_id)
    return s
  }, [selectedId, edges])

  /* ── Auto-fit ── */
  useEffect(() => {
    if (!nodes.length || !containerRef.current) return
    const { clientWidth, clientHeight } = containerRef.current
    const maxX = Math.max(...nodes.map(n => n.x + NODE_W)) + 60
    const maxY = Math.max(...nodes.map(n => n.y + NODE_H)) + 60
    const fit  = Math.min(clientWidth / maxX, clientHeight / maxY) * 0.92
    zoomRef.current = fit; panRef.current = { x: 10, y: 32 }
    setZoom(fit); setPanX(10); setPanY(32)
  }, [nodes.length])

  /* ── Wheel zoom (native, passive:false) ── */
  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const fn = (e: WheelEvent) => {
      e.preventDefault()
      const rect  = el.getBoundingClientRect()
      const mx    = e.clientX - rect.left, my = e.clientY - rect.top
      const f     = e.deltaY < 0 ? 1.09 : 0.91
      const oldZ  = zoomRef.current
      const newZ  = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZ * f))
      const ratio = newZ / oldZ
      const nx    = mx + (panRef.current.x - mx) * ratio
      const ny    = my + (panRef.current.y - my) * ratio
      zoomRef.current = newZ; panRef.current = { x: nx, y: ny }
      setZoom(newZ); setPanX(nx); setPanY(ny)
    }
    el.addEventListener("wheel", fn, { passive: false })
    return () => el.removeEventListener("wheel", fn)
  }, [])

  /* ── Global mouse (pan) ── */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isPanRef.current) return
      const nx = dragRef.current.px + e.clientX - dragRef.current.x
      const ny = dragRef.current.py + e.clientY - dragRef.current.y
      panRef.current = { x: nx, y: ny }; setPanX(nx); setPanY(ny)
    }
    const onUp = (e: MouseEvent) => { if (e.button === 1) { isPanRef.current = false; setPanning(false) } }
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp)
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 1) return
    e.preventDefault(); isPanRef.current = true; setPanning(true)
    dragRef.current = { x: e.clientX, y: e.clientY, px: panRef.current.x, py: panRef.current.y }
  }

  const handleCanvasClick = () => {
    if (edgePopup) { setHlEdgeId(null); setEdgePopup(null) }
    onDeselect()
  }

  const handleEdgeClick = (edge: RoadmapEdge, e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = containerRef.current!.getBoundingClientRect()
    setHlEdgeId(edge.edge_id)
    setEdgePopup({
      edge,
      sourceLabel: nodeMap.get(edge.source)?.label ?? edge.source,
      targetLabel: nodeMap.get(edge.target)?.label ?? edge.target,
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top,
    })
  }

  const closePopup = () => { setHlEdgeId(null); setEdgePopup(null) }

  /* ── Layer column x positions ── */
  const layerXMap = useMemo(() => {
    const m: Record<string, number> = {}
    for (const n of nodes) if (!(n.layer in m) || n.x < m[n.layer]) m[n.layer] = n.x
    return m
  }, [nodes])

  const contentW = nodes.length ? Math.max(...nodes.map(n => n.x + NODE_W)) + 80 : 1200
  const contentH = nodes.length ? Math.max(...nodes.map(n => n.y + NODE_H)) + 80 : 800
  const canvasW  = contentW * 4
  const canvasH  = contentH * 4

  function calcPath(edge: RoadmapEdge) {
    const f = nodeMap.get(edge.source), t = nodeMap.get(edge.target)
    if (!f || !t) return null
    const x1 = f.x + NODE_W, y1 = f.y + NODE_H / 2
    const x2 = t.x,          y2 = t.y + NODE_H / 2
    const mx = (x1 + x2) / 2
    return { x1, y1, x2, y2, mx, d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}` }
  }

  /* ── Overlay data: node-connected (black) + edge-clicked (blue) ── */
  const overlayConnected: Array<{ edge: RoadmapEdge; p: NonNullable<ReturnType<typeof calcPath>> }> = []
  if (connectedEdgeIds) {
    for (const id of connectedEdgeIds) {
      if (id === hlEdgeId) continue   // blue overlay takes priority
      const edge = edgeMap.get(id); if (!edge) continue
      const p = calcPath(edge); if (!p) continue
      overlayConnected.push({ edge, p })
    }
  }
  const hlEdgeObj   = hlEdgeId ? (edgeMap.get(hlEdgeId) ?? null) : null
  const hlEdgePath  = hlEdgeObj ? calcPath(hlEdgeObj) : null

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_1px_1px,#e2e8f0_1px,transparent_0)] [background-size:20px_20px] bg-zinc-50"
      style={{ cursor: panning ? "grabbing" : "default", userSelect: "none" }}
      onMouseDown={handleMouseDown}
      onClick={handleCanvasClick}
    >
      {/* ═══ Transform canvas ═══ */}
      <div style={{
        position: "absolute", top: 0, left: 0, width: canvasW, height: canvasH,
        transformOrigin: "0 0",
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
      }}>
        {/* Column headers */}
        {Object.entries(layerXMap).map(([layer, x]) => (
          <div key={layer} style={{
            position: "absolute", top: 8, left: x, width: NODE_W,
            textAlign: "center", fontSize: 14, fontWeight: 800, color: "#000000",
            letterSpacing: "0.14em", textTransform: "uppercase", pointerEvents: "none",
          }}>
            {layerLabels[layer] ?? layer}
          </div>
        ))}

        {/* ── Main edges SVG (z-index 1) ── */}
        <svg style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }} width={canvasW} height={canvasH}>
          <defs>
            <marker id={arrowId} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L7,3 z" fill="#cbd5e1" />
            </marker>
          </defs>
          {edges.map(edge => {
            const p = calcPath(edge); if (!p) return null
            const isClicked    = hlEdgeId === edge.edge_id
            const isConnected  = connectedEdgeIds?.has(edge.edge_id) ?? false

            // opacity rules
            let opacity = 0.9
            if (isClicked || isConnected) opacity = 0   // drawn in overlay
            else if (connectedEdgeIds !== null) opacity = 0.1
            else if (filterStatus !== null) {
              const ss = nodeMap.get(edge.source)?.status, ts = nodeMap.get(edge.target)?.status
              if (ss !== filterStatus && ts !== filterStatus) opacity = 0.06
            }

            return (
              <g key={edge.edge_id} style={{ opacity }}>
                {/* Wide invisible hit target */}
                <path d={p.d} fill="none" stroke="transparent" strokeWidth={14}
                  style={{ pointerEvents: "all", cursor: "pointer" }}
                  onClick={(e) => handleEdgeClick(edge, e as unknown as React.MouseEvent)}
                />
                <path d={p.d} fill="none"
                  stroke={edge.dashed ? "#94a3b8" : "#cbd5e1"} strokeWidth={1.5}
                  strokeDasharray={edge.dashed ? "5 3" : undefined}
                  markerEnd={`url(#${arrowId})`}
                  style={{ pointerEvents: "none" }}
                />
                {edge.label && (
                  <text x={p.mx} y={(p.y1 + p.y2) / 2 - 5} fill="#94a3b8" fontSize={9}
                    textAnchor="middle" fontFamily="ui-sans-serif,system-ui,sans-serif"
                    style={{ pointerEvents: "none" }}>{edge.label}</text>
                )}
              </g>
            )
          })}
        </svg>

        {/* ── Node cards (z-index 2) ── */}
        <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
          {nodes.map(node => {
            const s = STATUS_STYLE[node.status] ?? STATUS_STYLE.unknown
            const isFiltered = connectedEdgeIds === null && filterStatus !== null && node.status !== filterStatus
            const isSelected = node.node_id === selectedId
            return (
              <button key={node.node_id}
                onClick={(e) => { e.stopPropagation(); onSelect(node) }}
                className={[
                  "absolute rounded-xl border bg-white text-left transition-shadow cursor-pointer shadow-sm hover:shadow-md",
                  s.border, s.bg,
                  isSelected ? "ring-2 ring-offset-2 ring-blue-500 shadow-md" : "hover:border-zinc-300",
                ].join(" ")}
                style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H, opacity: isFiltered ? 0.15 : 1 }}
              >
                <div className="h-full flex flex-col justify-between p-3">
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-wide">{node.type}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${s.badge}`}>{node.status}</span>
                  </div>
                  <div>
                    <p className="text-[11.5px] font-semibold text-zinc-900 leading-tight line-clamp-1">{node.label}</p>
                    {node.sub && <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{node.sub}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`h-1 w-2 rounded-full ${i < Math.ceil(node.user_impact_score / 2) ? "bg-blue-400" : "bg-zinc-200"}`} />
                      ))}
                    </div>
                    <span className="text-[9px] text-zinc-400 ml-0.5">{node.user_impact_score}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* ═══ Combined highlight overlay (z-index 10, above nodes) ═══ */}
        {(overlayConnected.length > 0 || hlEdgeObj) && (
          <svg style={{ position: "absolute", top: 0, left: 0, zIndex: 10, pointerEvents: "none" }}
            width={canvasW} height={canvasH}>
            <defs>
              <marker id={arwHlId} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L7,3 z" fill="#3b82f6" />
              </marker>
            </defs>

            {/* Node-connected edges: black, 1.5px + red endpoint dots */}
            {overlayConnected.map(({ edge, p }) => (
              <g key={edge.edge_id}>
                <path d={p.d} fill="none" stroke="#000000" strokeWidth={1.5}
                  strokeDasharray={edge.dashed ? "5 3" : undefined} />
                {/* Red dots at connection points */}
                <circle cx={p.x1} cy={p.y1} r={3} fill="#EF4444" />
                <circle cx={p.x2} cy={p.y2} r={3} fill="#EF4444" />
              </g>
            ))}

            {/* Edge-clicked: blue, 3px */}
            {hlEdgeObj && hlEdgePath && (
              <g>
                <path d={hlEdgePath.d} fill="none" stroke="#3b82f6" strokeWidth={3}
                  strokeDasharray={hlEdgeObj.dashed ? "5 3" : undefined}
                  markerEnd={`url(#${arwHlId})`} />
                {hlEdgeObj.label && (
                  <text x={hlEdgePath.mx} y={(hlEdgePath.y1 + hlEdgePath.y2) / 2 - 7}
                    fill="#3b82f6" fontSize={10} fontWeight="700" textAnchor="middle"
                    fontFamily="ui-sans-serif,system-ui,sans-serif">
                    {hlEdgeObj.label}
                  </text>
                )}
              </g>
            )}
          </svg>
        )}
      </div>

      {/* ═══ Edge-click popup (screen space) ═══ */}
      {edgePopup && (
        <div className="absolute z-50 bg-white border border-zinc-200 rounded-xl shadow-xl p-4 w-72"
          style={{
            left: Math.min(edgePopup.screenX + 16, (containerRef.current?.clientWidth ?? 800) - 300),
            top:  Math.max(Math.min(edgePopup.screenY - 24, (containerRef.current?.clientHeight ?? 600) - 130), 8),
          }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">엣지 연결 정보</p>
            <button onClick={closePopup}
              className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 text-sm transition">✕</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-medium px-2.5 py-1.5 rounded-lg flex-1 truncate">{edgePopup.sourceLabel}</span>
            <span className="text-blue-500 flex-shrink-0 font-bold text-sm">→</span>
            <span className="bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-medium px-2.5 py-1.5 rounded-lg flex-1 truncate">{edgePopup.targetLabel}</span>
          </div>
          {edgePopup.edge.label && (
            <div className="mt-2.5 pt-2.5 border-t border-zinc-100">
              <p className="text-[11px] text-zinc-500"><span className="font-semibold text-zinc-700">label:</span> {edgePopup.edge.label}</p>
            </div>
          )}
        </div>
      )}

      {/* Zoom badge */}
      <div className="absolute bottom-3 right-3 bg-white border border-zinc-200 rounded-lg px-2 py-1 text-[10px] font-medium text-zinc-500 shadow-sm pointer-events-none">
        {Math.round(zoom * 100)}%
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/80 border border-zinc-200 rounded-lg px-3 py-1 text-[10px] text-zinc-400 shadow-sm pointer-events-none whitespace-nowrap">
        휠: 줌 &nbsp;·&nbsp; 휠클릭 + 드래그: 이동
      </div>
    </div>
  )
}
