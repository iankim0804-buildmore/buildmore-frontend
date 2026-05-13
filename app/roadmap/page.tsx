"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import RoadmapMap from "@/components/RoadmapMap"
import type { RoadmapGraph, RoadmapNode, NodeStatus } from "@/types/roadmap"

const FALLBACK: RoadmapGraph = {
  nodes: [], edges: [], layer_labels: {},
  health: { health_score: 0, total: 0, by_status: {}, last_updated: "-" },
  insights: { gaps: [], recommendations: [] },
}

const STATUS_FILTERS: Array<{ value: NodeStatus | null; label: string; dot: string }> = [
  { value: null,      label: "전체",    dot: "bg-zinc-400" },
  { value: "active",  label: "active",  dot: "bg-emerald-500" },
  { value: "warning", label: "warning", dot: "bg-amber-500" },
  { value: "todo",    label: "todo",    dot: "bg-blue-500" },
  { value: "dormant", label: "dormant", dot: "bg-zinc-400" },
  { value: "broken",  label: "broken",  dot: "bg-red-500" },
]

const STATUS_COLORS: Record<string, string> = {
  active:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  todo:    "bg-blue-100 text-blue-700 border-blue-200",
  dormant: "bg-zinc-100 text-zinc-500 border-zinc-200",
  broken:  "bg-red-100 text-red-700 border-red-200",
  unknown: "bg-zinc-100 text-zinc-400 border-zinc-200",
}

function HealthBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="mt-1.5 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
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

  async function loadGraph() {
    try {
      const res = await fetch("/api/roadmap/graph", { cache: "no-store" })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data: RoadmapGraph = await res.json()
      setGraph(data)
      setError(null)
    } catch {
      setError("백엔드 연결 실패 — 새로고침을 눌러 재시도하세요")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadGraph() }, [])

  function toggleFilter(status: NodeStatus | null) {
    setFilterStatus(prev => prev === status ? null : status)
  }

  const showDetail = useCallback((node: RoadmapNode) => setSelected(node), [])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await fetch("/api/roadmap/refresh", { method: "POST" })
      await loadGraph()
    } catch {
      setError("새로고침 실패")
    } finally {
      setRefreshing(false)
    }
  }

  const { health, insights } = graph

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* ── Header ── */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400">BuildMore</p>
            <h1 className="text-lg font-semibold text-zinc-900 mt-0.5">시스템 DNA맵 대시보드</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              노드 {graph.nodes.length}개 · 엣지 {graph.edges.length}개 · 레이어 {Object.keys(graph.layer_labels).length}개
            </p>
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                {error}
              </span>
            )}
            <button
              onClick={handleRefresh} disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50 transition shadow-sm"
            >
              {refreshing ? "갱신 중…" : "새로고침"}
            </button>
          </div>
        </div>

        {/* ── Filter pills ── */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={String(f.value)}
              onClick={() => toggleFilter(f.value)}
              className={[
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition",
                filterStatus === f.value
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300",
              ].join(" ")}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${f.dot} ${filterStatus === f.value ? "opacity-100 bg-white" : ""}`} />
              {f.label}
              {f.value && health.by_status[f.value] !== undefined && (
                <span className={filterStatus === f.value ? "text-zinc-300" : "text-zinc-400"}>
                  {health.by_status[f.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* ── Left Sidebar ── */}
        <aside className="w-60 flex-shrink-0 border-r border-zinc-200 bg-white p-4 overflow-y-auto">
          {/* Health Score */}
          <section className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Health Score</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-zinc-900">{health.health_score.toFixed(1)}</span>
              <span className="text-xs text-zinc-400 mb-1">/ 100</span>
            </div>
            <HealthBar score={health.health_score} />
            <p className="text-[10px] text-zinc-400 mt-1.5">{health.last_updated}</p>
            <div className="mt-3 space-y-1.5">
              {Object.entries(health.by_status).map(([s, cnt]) => (
                <div key={s} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded-full border text-[9px] font-medium ${STATUS_COLORS[s] ?? STATUS_COLORS.unknown}`}>
                      {s}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-700">{cnt}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-zinc-100 my-4" />

          {/* Gap Top */}
          <section className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">
              Gap Top {Math.min(8, insights.gaps.length)}
            </p>
            <ul className="space-y-1.5">
              {insights.gaps.slice(0, 8).map(g => (
                <li key={g.node_id}
                  className="text-[11px] text-zinc-600 bg-zinc-50 hover:bg-zinc-100 rounded-lg px-2.5 py-2 border border-zinc-100 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      g.status === "warning" ? "bg-amber-400" :
                      g.status === "broken"  ? "bg-red-400" :
                      g.status === "todo"    ? "bg-blue-400" : "bg-zinc-300"
                    }`} />
                    <span className="line-clamp-1">{g.label}</span>
                    <span className="ml-auto text-[10px] text-zinc-400 flex-shrink-0">{g.user_impact_score}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="border-t border-zinc-100 my-4" />

          {/* Recommendations */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Recommendations</p>
            <ul className="space-y-1.5">
              {insights.recommendations.slice(0, 6).map((r, i) => (
                <li key={i} className="text-[11px] text-zinc-500 bg-zinc-50 rounded-lg px-2.5 py-2 border border-zinc-100">
                  {r}
                </li>
              ))}
            </ul>
          </section>
        </aside>

        {/* ── Canvas ── */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
              그래프 로딩 중…
            </div>
          </div>
        ) : (
          <RoadmapMap
            nodes={graph.nodes} edges={graph.edges}
            layerLabels={graph.layer_labels}
            filterStatus={filterStatus}
            selectedId={selected?.node_id ?? null}
            onSelect={showDetail}
          />
        )}

        {/* ── Detail Panel ── */}
        {selected && (
          <aside className="w-72 flex-shrink-0 border-l border-zinc-200 bg-white p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Selected Node</p>
              <button
                onClick={() => setSelected(null)}
                className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition text-sm"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 mb-4">
              <div className="flex gap-1.5 flex-wrap mb-2.5">
                <span className="text-[10px] bg-white border border-zinc-200 text-zinc-500 px-2 py-0.5 rounded-full">
                  {selected.type}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[selected.status] ?? STATUS_COLORS.unknown}`}>
                  {selected.status}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-zinc-900">{selected.label}</h2>
              {selected.sub && <p className="text-xs text-zinc-500 mt-1">{selected.sub}</p>}
              <div className="mt-3 flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-400">user impact</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`h-1.5 w-3 rounded-full ${
                      i < Math.ceil(selected.user_impact_score / 2) ? "bg-blue-400" : "bg-zinc-200"
                    }`} />
                  ))}
                </div>
                <span className="text-[10px] font-medium text-zinc-600">{selected.user_impact_score}/10</span>
              </div>
            </div>

            {selected.detail && selected.detail.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">세부 항목</p>
                <ul className="space-y-1.5">
                  {selected.detail.map((d, i) => (
                    <li key={i} className="text-xs text-zinc-600 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selected.updated_at && (
              <p className="text-[10px] text-zinc-400 mt-3">
                업데이트: {new Date(selected.updated_at).toLocaleString("ko-KR")}
              </p>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
