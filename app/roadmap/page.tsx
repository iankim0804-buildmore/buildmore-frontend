"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import RoadmapMap from "@/components/RoadmapMap"
import type { RoadmapGraph, RoadmapNode, NodeStatus } from "@/types/roadmap"

const FALLBACK: RoadmapGraph = {
  nodes: [], edges: [], layer_labels: {},
  health: { health_score: 0, total: 0, by_status: {}, last_updated: "-" },
  insights: { gaps: [], recommendations: [] },
}

const STATUS_FILTERS: Array<{ value: NodeStatus | null; label: string; color: string }> = [
  { value: null,      label: "전체",    color: "border-slate-600 text-slate-300" },
  { value: "active",  label: "active",  color: "border-emerald-500 text-emerald-300" },
  { value: "warning", label: "warning", color: "border-amber-500 text-amber-300" },
  { value: "todo",    label: "todo",    color: "border-sky-500 text-sky-300" },
  { value: "dormant", label: "dormant", color: "border-slate-500 text-slate-400" },
  { value: "broken",  label: "broken",  color: "border-red-500 text-red-300" },
]

function HealthBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
    </div>
  )
}

export default function RoadmapPage() {
  const [graph, setGraph]               = useState<RoadmapGraph>(FALLBACK)
  const [loading, setLoading]           = useState(true)
  const [refreshing, setRefreshing]     = useState(false)
  const [filterStatus, setFilterStatus] = useState<NodeStatus | null>(null)
  const [selected, setSelected]         = useState<RoadmapNode | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  async function loadGraph() {
    try {
      const res = await fetch("/api/roadmap/graph", { cache: "no-store" })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data: RoadmapGraph = await res.json()
      setGraph(data)
      setError(null)
    } catch {
      setError("백엔드 연결 실패 — fallback seed 표시 중")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadGraph() }, [])

  function filterNodes(status: NodeStatus | null) {
    setFilterStatus(prev => prev === status ? null : status)
  }

  const showDetail = useCallback((node: RoadmapNode) => { setSelected(node) }, [])
  function closePanel() { setSelected(null) }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res = await fetch("/api/roadmap/refresh", { method: "POST" })
      if (!res.ok) throw new Error(`audit 실패: ${res.status}`)
      await loadGraph()
    } catch (e) {
      setError(String(e))
    } finally {
      setRefreshing(false)
    }
  }

  const { health, insights } = graph

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-white/10 bg-slate-950/95 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">BuildMore</p>
            <h1 className="text-xl font-bold tracking-tight mt-1">시스템 DNA맵 대시보드</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              노드 {graph.nodes.length}개 · 엣지 {graph.edges.length}개 · 레이어 {Object.keys(graph.layer_labels).length}개
            </p>
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <span className="text-xs text-amber-400 bg-amber-950/50 border border-amber-700 px-2 py-1 rounded">
                {error}
              </span>
            )}
            <button
              onClick={handleRefresh} disabled={refreshing}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-sm font-bold transition"
            >
              {refreshing ? "갱신 중…" : "새로고침"}
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={String(f.value)}
              onClick={() => filterNodes(f.value)}
              className={[
                "px-3 py-1 rounded-full border text-xs font-semibold transition",
                f.color,
                filterStatus === f.value ? "bg-white/15" : "bg-white/5 hover:bg-white/10",
              ].join(" ")}
            >
              {f.label}
              {f.value && health.by_status[f.value] !== undefined && (
                <span className="ml-1 opacity-70">({health.by_status[f.value]})</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-slate-900/60 p-4 overflow-y-auto">
          <section className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Health Score</p>
            <div className="text-3xl font-bold text-white">{health.health_score.toFixed(1)}</div>
            <HealthBar score={health.health_score} />
            <p className="text-[10px] text-slate-500 mt-1">업데이트: {health.last_updated}</p>
            <div className="mt-3 space-y-1">
              {Object.entries(health.by_status).map(([s, cnt]) => (
                <div key={s} className="flex justify-between text-xs">
                  <span className="text-slate-400 capitalize">{s}</span>
                  <span className="text-white font-semibold">{cnt}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Gap Top {Math.min(8, insights.gaps.length)}
            </p>
            <ul className="space-y-1.5">
              {insights.gaps.slice(0, 8).map(g => (
                <li key={g.node_id} className="text-[11px] text-slate-300 bg-white/5 rounded px-2 py-1.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                    g.status === "warning" ? "bg-amber-400" : g.status === "broken" ? "bg-red-400" : g.status === "todo" ? "bg-sky-400" : "bg-slate-500"
                  }`} />
                  {g.label}
                  <span className="ml-1 text-[10px] text-slate-500">({g.user_impact_score})</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Recommendations</p>
            <ul className="space-y-1.5">
              {insights.recommendations.slice(0, 8).map((r, i) => (
                <li key={i} className="text-[11px] text-slate-400 bg-white/5 rounded px-2 py-1.5">{r}</li>
              ))}
            </ul>
          </section>
        </aside>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">그래프 로딩 중…</div>
        ) : (
          <RoadmapMap
            nodes={graph.nodes} edges={graph.edges}
            layerLabels={graph.layer_labels}
            filterStatus={filterStatus}
            selectedId={selected?.node_id ?? null}
            onSelect={showDetail}
          />
        )}

        {selected && (
          <aside ref={panelRef} className="w-72 flex-shrink-0 border-l border-white/10 bg-slate-900 p-5 overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Selected Node</p>
              <button onClick={closePanel} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-4">
              <div className="flex gap-2 flex-wrap mb-2">
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{selected.type}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  selected.status === "active"  ? "bg-emerald-900 text-emerald-300" :
                  selected.status === "warning" ? "bg-amber-900 text-amber-300" :
                  selected.status === "broken"  ? "bg-red-900 text-red-300" :
                  selected.status === "todo"    ? "bg-sky-900 text-sky-300" :
                                                  "bg-slate-800 text-slate-400"
                }`}>{selected.status}</span>
              </div>
              <h2 className="text-base font-bold text-white">{selected.label}</h2>
              {selected.sub && <p className="text-xs text-slate-400 mt-1">{selected.sub}</p>}
              <p className="text-xs text-slate-500 mt-2">user impact: {selected.user_impact_score}/10</p>
            </div>
            {selected.detail && selected.detail.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">세부 항목</p>
                <ul className="space-y-1.5">
                  {selected.detail.map((d, i) => (
                    <li key={i} className="text-xs text-slate-300 bg-white/5 rounded px-3 py-2">{d}</li>
                  ))}
                </ul>
              </div>
            )}
            {selected.updated_at && (
              <p className="text-[10px] text-slate-600 mt-2">
                마지막 업데이트: {new Date(selected.updated_at).toLocaleString("ko-KR")}
              </p>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
