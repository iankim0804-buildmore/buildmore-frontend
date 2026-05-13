"use client"

import { useState, useEffect, useCallback } from "react"
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

const TYPE_ROLE: Record<string, string> = {
  SOURCE:     "공공 또는 민간 원천 데이터를 수집하는 진입점입니다.",
  COLLECTION: "원천 데이터를 정제·분류하여 처리 큐로 전달합니다.",
  PROCESSING: "데이터를 변환·가공하여 DB 및 Wiki에 적재합니다.",
  DATABASE:   "분석과 Wiki 생성에 필요한 정형 데이터를 저장합니다.",
  WIKI:       "LLM이 생성한 지식과 판단 규칙을 누적·관리합니다.",
  DELTA:      "변화량 계산과 시그널 생성을 담당합니다.",
  API:        "분석 결과를 모바일 카드 및 리포트로 서빙합니다.",
  FRONTEND:   "사용자에게 분석 결과와 리포트를 시각화합니다.",
}

const TYPE_EXPANSION: Record<string, string[]> = {
  SOURCE:     ["추가 데이터소스 연동 확대", "실시간 수집 주기 단축", "오류 감지 자동 알림 구축"],
  COLLECTION: ["수집 정확도 향상 및 중복 제거 자동화", "수집 범위 확대 및 분류 체계 고도화"],
  PROCESSING: ["LLM 프롬프트 정교화로 품질 향상", "처리 속도 개선 및 실패 재시도 강화"],
  DATABASE:   ["인덱스 최적화 및 pgvector 유사 검색 활용", "데이터 TTL 정책 수립 및 아카이빙"],
  WIKI:       ["Wiki 품질 lint 자동화", "사용자 피드백 반영 학습 루프", "다국어 지원 확대"],
  DELTA:      ["이상값 탐지 고도화", "예측 모델 연동 및 알림 트리거 정교화"],
  API:        ["응답 캐싱으로 속도 개선", "PDF 리포트 자동생성", "은행 제출용 포맷 연동"],
  FRONTEND:   ["UX 개선 및 반응형 최적화", "실시간 데이터 연동 강화"],
}

function HealthBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="mt-2 h-2 rounded-full bg-zinc-100 overflow-hidden">
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

  const showDetail  = useCallback((node: RoadmapNode) => setSelected(node), [])
  const deselect    = useCallback(() => setSelected(null), [])
  const toggleFilter = (status: NodeStatus | null) => setFilterStatus(prev => prev === status ? null : status)

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

  // Node detail helpers
  const nodeTypeKey = selected?.type?.toUpperCase() ?? ""
  const roleText    = TYPE_ROLE[nodeTypeKey]    ?? `${selected?.type ?? ""} 타입 노드입니다.`
  const expansions  = TYPE_EXPANSION[nodeTypeKey] ?? []

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* ════ Header ════ */}
      <header className="border-b border-zinc-200 bg-white px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-400">BuildMore</p>
            <h1 className="mt-0.5 font-bold text-zinc-900" style={{ fontSize: 20 }}>시스템 DNA맵 대시보드</h1>
            <p className="mt-1 text-zinc-400" style={{ fontSize: 13 }}>
              노드 {graph.nodes.length}개 · 엣지 {graph.edges.length}개 · 레이어 {Object.keys(graph.layer_labels).length}개
            </p>
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <span className="text-sm text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                {error}
              </span>
            )}
            <button
              onClick={handleRefresh} disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 bg-white font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50 transition shadow-sm"
              style={{ fontSize: 13 }}
            >
              {refreshing ? "갱신 중…" : "새로고침"}
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={String(f.value)}
              onClick={() => toggleFilter(f.value)}
              className={[
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium transition",
                filterStatus === f.value
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300",
              ].join(" ")}
              style={{ fontSize: 13 }}
            >
              {/* 10px dot */}
              <span className="flex-shrink-0 rounded-full"
                style={{ width: 10, height: 10, background: filterStatus === f.value ? "#fff" : undefined }}
                {...(filterStatus !== f.value ? { className: `flex-shrink-0 rounded-full ${f.dot}` } : {})}
              />
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
        {/* ════ Left Sidebar ════ */}
        <aside className="w-64 flex-shrink-0 border-r border-zinc-200 bg-white p-4 overflow-y-auto">
          {/* Health Score */}
          <section className="mb-5">
            <p className="font-semibold uppercase tracking-widest text-zinc-400 mb-2" style={{ fontSize: 13 }}>Health Score</p>
            <div className="flex items-end gap-2">
              <span className="font-bold text-zinc-900" style={{ fontSize: 32 }}>{health.health_score.toFixed(1)}</span>
              <span className="text-zinc-400 mb-1" style={{ fontSize: 13 }}>/ 100</span>
            </div>
            <HealthBar score={health.health_score} />
            <p className="text-zinc-400 mt-1.5" style={{ fontSize: 12 }}>{health.last_updated}</p>
            <div className="mt-3 space-y-2">
              {Object.entries(health.by_status).map(([s, cnt]) => (
                <div key={s} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* 10px dot */}
                    <span className="rounded-full flex-shrink-0" style={{ width: 10, height: 10,
                      background: s === "active" ? "#10b981" : s === "warning" ? "#f59e0b" : s === "todo" ? "#3b82f6" : s === "broken" ? "#ef4444" : "#a1a1aa" }} />
                    <span className={`inline-block px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[s] ?? STATUS_COLORS.unknown}`} style={{ fontSize: 13 }}>
                      {s}
                    </span>
                  </div>
                  <span className="font-semibold text-zinc-700" style={{ fontSize: 13 }}>{cnt}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-zinc-100 my-4" />

          {/* Gap Top */}
          <section className="mb-5">
            <p className="font-semibold uppercase tracking-widest text-zinc-400 mb-2" style={{ fontSize: 13 }}>
              Gap Top {Math.min(8, insights.gaps.length)}
            </p>
            <ul className="space-y-1.5">
              {insights.gaps.slice(0, 8).map(g => (
                <li key={g.node_id}
                  className="text-zinc-600 bg-zinc-50 hover:bg-zinc-100 rounded-lg px-2.5 py-2 border border-zinc-100 transition"
                  style={{ fontSize: 14, lineHeight: 1.5 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-full flex-shrink-0" style={{ width: 10, height: 10,
                      background: g.status === "warning" ? "#f59e0b" : g.status === "broken" ? "#ef4444" : g.status === "todo" ? "#3b82f6" : "#a1a1aa" }} />
                    <span className="line-clamp-1 flex-1">{g.label}</span>
                    <span className="text-zinc-400 flex-shrink-0" style={{ fontSize: 12 }}>{g.user_impact_score}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="border-t border-zinc-100 my-4" />

          {/* Recommendations */}
          <section>
            <p className="font-semibold uppercase tracking-widest text-zinc-400 mb-2" style={{ fontSize: 13 }}>Recommendations</p>
            <ul className="space-y-1.5">
              {insights.recommendations.slice(0, 6).map((r, i) => (
                <li key={i} className="text-zinc-500 bg-zinc-50 rounded-lg px-2.5 py-2 border border-zinc-100"
                  style={{ fontSize: 14, lineHeight: 1.6 }}>
                  {r}
                </li>
              ))}
            </ul>
          </section>
        </aside>

        {/* ════ Canvas ════ */}
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
            onDeselect={deselect}
          />
        )}

        {/* ════ Detail Panel ════ */}
        {selected && (
          <aside className="w-80 flex-shrink-0 border-l border-zinc-200 bg-white overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold uppercase tracking-widest text-zinc-400" style={{ fontSize: 13 }}>Selected Node</p>
                <button onClick={() => setSelected(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition"
                  style={{ fontSize: 14 }}>✕</button>
              </div>

              {/* Node summary card */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 mb-4">
                <div className="flex gap-1.5 flex-wrap mb-3">
                  <span className="bg-white border border-zinc-200 text-zinc-500 px-2 py-0.5 rounded-full" style={{ fontSize: 11 }}>
                    {selected.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[selected.status] ?? STATUS_COLORS.unknown}`}
                    style={{ fontSize: 13 }}>
                    {selected.status}
                  </span>
                </div>
                <h2 className="font-semibold text-zinc-900" style={{ fontSize: 15 }}>{selected.label}</h2>
                {selected.sub && <p className="text-zinc-500 mt-1" style={{ fontSize: 13 }}>{selected.sub}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-zinc-400" style={{ fontSize: 12 }}>user impact</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={`h-2 w-3.5 rounded-full ${i < Math.ceil(selected.user_impact_score / 2) ? "bg-blue-400" : "bg-zinc-200"}`} />
                    ))}
                  </div>
                  <span className="font-medium text-zinc-600" style={{ fontSize: 13 }}>{selected.user_impact_score}/10</span>
                </div>
              </div>

              {/* Detail items */}
              {selected.detail && selected.detail.length > 0 && (
                <div className="mb-4">
                  <p className="font-semibold uppercase tracking-widest text-zinc-400 mb-2" style={{ fontSize: 13 }}>세부 항목</p>
                  <ul className="space-y-1.5">
                    {selected.detail.map((d, i) => (
                      <li key={i} className="text-zinc-600 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2"
                        style={{ fontSize: 13 }}>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Section A: 역할 및 기능 ── */}
              <div className="mt-4 pt-4 border-t border-zinc-200 rounded-xl bg-zinc-50/60 px-4 py-3">
                <p className="font-semibold text-zinc-500 mb-2" style={{ fontSize: 13, letterSpacing: "0.04em" }}>
                  역할 및 기능
                </p>
                <p className="text-zinc-600" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  {roleText}
                </p>
              </div>

              {/* ── Section B: 확장 가능성 ── */}
              {expansions.length > 0 && (
                <div className="mt-3 pt-4 border-t border-zinc-200 rounded-xl bg-zinc-50/60 px-4 py-3">
                  <p className="font-semibold text-zinc-500 mb-2" style={{ fontSize: 13, letterSpacing: "0.04em" }}>
                    확장 가능성
                  </p>
                  <ul className="space-y-1.5">
                    {expansions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-zinc-600" style={{ fontSize: 13, lineHeight: 1.6 }}>
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.updated_at && (
                <p className="text-zinc-400 mt-4" style={{ fontSize: 12 }}>
                  업데이트: {new Date(selected.updated_at).toLocaleString("ko-KR")}
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
