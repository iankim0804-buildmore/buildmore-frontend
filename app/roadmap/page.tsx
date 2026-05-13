"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import RoadmapMap from "@/components/RoadmapMap"
import type { RoadmapGraph, RoadmapNode, NodeStatus, SystemDiagnosis } from "@/types/roadmap"

const EMPTY_DIAGNOSIS: SystemDiagnosis = {
  system_verdict: "아직 감사가 실행되지 않았습니다. 🔍 시스템 감사 버튼을 눌러 분석을 시작하세요.",
  critical_bottlenecks: [],
  pipeline_risk: "",
  immediate_actions: ["시스템 감사 버튼 클릭"],
}

const FALLBACK: RoadmapGraph = {
  nodes: [], edges: [], layer_labels: {},
  health: { health_score: 0, total: 0, by_status: {}, last_updated: "-" },
  system_diagnosis: EMPTY_DIAGNOSIS,
  last_audited_at: null,
  audit_run_id: null,
}

const STATUS_FILTERS: Array<{ value: NodeStatus | null; label: string; color: string }> = [
  { value: null,      label: "전체",    color: "#a1a1aa" },
  { value: "active",  label: "active",  color: "#10b981" },
  { value: "warning", label: "warning", color: "#f59e0b" },
  { value: "todo",    label: "todo",    color: "#3b82f6" },
  { value: "dormant", label: "dormant", color: "#a1a1aa" },
  { value: "broken",  label: "broken",  color: "#ef4444" },
]

const STATUS_COLORS: Record<string, string> = {
  active:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  todo:    "bg-blue-100 text-blue-700 border-blue-200",
  dormant: "bg-zinc-100 text-zinc-500 border-zinc-200",
  broken:  "bg-red-100 text-red-700 border-red-200",
  unknown: "bg-zinc-100 text-zinc-400 border-zinc-200",
}

const STATUS_DOT: Record<string, string> = {
  active: "#10b981", warning: "#f59e0b", todo: "#3b82f6",
  dormant: "#a1a1aa", broken: "#ef4444", unknown: "#d4d4d8",
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#f59e0b",
  low:      "#10b981",
}

function HealthBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="mt-2 h-2 rounded-full bg-zinc-100 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
    </div>
  )
}

function AuditScoreBar({ score, severity }: { score: number; severity: string }) {
  const color = SEVERITY_COLOR[severity] ?? "#a1a1aa"
  return (
    <div className="mt-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
    </div>
  )
}

function DiagSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-t border-zinc-100 first:border-t-0 first:pt-0">
      <p className="flex items-center gap-1.5 font-semibold text-zinc-700 mb-1.5" style={{ fontSize: 13 }}>
        <span>{icon}</span>{title}
      </p>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: "#52525b" }}>{children}</div>
    </div>
  )
}

interface NodeAuditData {
  node_id: string
  label: string
  issues: string | null
  opportunities: string | null
  audit_score: number | null
  gap_severity: string | null
  audited_at: string | null
  audit_type: string | null
}

export default function RoadmapPage() {
  const [graph, setGraph]               = useState<RoadmapGraph>(FALLBACK)
  const [loading, setLoading]           = useState(true)
  const [filterStatus, setFilterStatus] = useState<NodeStatus | null>(null)
  const [selected, setSelected]         = useState<RoadmapNode | null>(null)
  const [error, setError]               = useState<string | null>(null)

  // 감사 관련 상태
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditRunId,   setAuditRunId]   = useState<string | null>(null)
  const [nodeAudit,    setNodeAudit]    = useState<NodeAuditData | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [sidebarW, setSidebarW] = useState(268)
  const [rightW,   setRightW]   = useState(340)
  const dragging    = useRef<null | "left" | "right">(null)
  const [dragCursor, setDragCursor] = useState(false)

  const sidebarScrollRef = useRef<HTMLDivElement>(null)
  const sidebarHovered   = useRef(false)

  useEffect(() => {
    const el = sidebarScrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!sidebarHovered.current) return
      e.preventDefault(); e.stopPropagation()
      el.scrollTop += e.deltaY
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  async function loadGraph() {
    try {
      const res = await fetch("/api/roadmap/graph", { cache: "no-store" })
      if (!res.ok) throw new Error(`status ${res.status}`)
      setGraph(await res.json()); setError(null)
    } catch { setError("백엔드 연결 실패") } finally { setLoading(false) }
  }

  useEffect(() => { loadGraph() }, [])

  // 노드 선택 시 감사 데이터 조회
  useEffect(() => {
    if (!selected) { setNodeAudit(null); return }
    fetch(`/api/roadmap/audit/node/${selected.node_id}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(d => setNodeAudit(d))
      .catch(() => setNodeAudit(null))
  }, [selected?.node_id])

  // 감사 트리거
  async function triggerAudit() {
    if (auditLoading) return
    setAuditLoading(true)
    try {
      const res = await fetch("/api/roadmap/audit/run", { method: "POST", cache: "no-store" })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const { audit_run_id } = await res.json()
      if (!audit_run_id) throw new Error("audit_run_id missing")
      setAuditRunId(audit_run_id)
      setError(null)

      // 5초 간격 폴링 (최대 3분)
      let elapsed = 0
      pollRef.current = setInterval(async () => {
        elapsed += 5
        if (elapsed > 180) {
          clearInterval(pollRef.current!); setAuditLoading(false); return
        }
        try {
          const pr = await fetch(`/api/roadmap/audit/run/${audit_run_id}`, { cache: "no-store" })
          if (!pr.ok) return
          const status = await pr.json()
          if (status.status === "success" || status.status === "failed") {
            clearInterval(pollRef.current!); setAuditLoading(false); setAuditRunId(null)
            if (status.status === "failed") setError("감사 실행 실패")
            // 그래프 + 노드 감사 갱신
            await loadGraph()
            if (selected) {
              const nr = await fetch(`/api/roadmap/audit/node/${selected.node_id}`, { cache: "no-store" })
              if (nr.ok) setNodeAudit(await nr.json())
            }
          }
        } catch { /* ignore */ }
      }, 5000)
    } catch {
      setError("감사 실행 요청 실패")
      setAuditLoading(false)
    }
  }

  // cleanup on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  // Panel resize
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current === "left")
        setSidebarW(Math.min(480, Math.max(160, e.clientX)))
      if (dragging.current === "right")
        setRightW(Math.min(520, Math.max(200, window.innerWidth - e.clientX)))
    }
    const onUp = () => { dragging.current = null; setDragCursor(false) }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
  }, [])

  const showDetail   = useCallback((node: RoadmapNode) => setSelected(node), [])
  const deselect     = useCallback(() => setSelected(null), [])
  const toggleFilter = (s: NodeStatus | null) => setFilterStatus(p => p === s ? null : s)

  const { health } = graph
  const diagnosis  = graph.system_diagnosis ?? EMPTY_DIAGNOSIS

  const activeCount  = health.by_status["active"]  ?? 0
  const warningCount = health.by_status["warning"] ?? 0
  const todoCount    = health.by_status["todo"]    ?? 0
  const brokenCount  = health.by_status["broken"]  ?? 0
  const totalCount   = health.total || graph.nodes.length || 1

  const warnList   = graph.nodes.filter(n => n.status === "warning").slice(0, 3)
  const todoList   = graph.nodes.filter(n => n.status === "todo").slice(0, 3)
  const brokenList = graph.nodes.filter(n => n.status === "broken")
  const topImpact  = [...graph.nodes].sort((a, b) => b.user_impact_score - a.user_impact_score).slice(0, 3)

  const edgeCnt: Record<string, number> = {}
  for (const e of graph.edges) {
    edgeCnt[e.source] = (edgeCnt[e.source] || 0) + 1
    edgeCnt[e.target] = (edgeCnt[e.target] || 0) + 1
  }
  const spofList = graph.nodes
    .filter(n => (edgeCnt[n.node_id] || 0) >= 4)
    .sort((a, b) => (edgeCnt[b.node_id] || 0) - (edgeCnt[a.node_id] || 0))
    .slice(0, 3)

  // legacy fallback actions
  const nextActions: string[] = diagnosis.immediate_actions.length > 0
    ? diagnosis.immediate_actions.slice(0, 3)
    : (() => {
        const a: string[] = []
        if (brokenList[0])  a.push(`${brokenList[0].label} 즉시 복구`)
        if (warnList[0])    a.push(`${warnList[0].label} 경고 원인 분석`)
        if (topImpact[0] && topImpact[0].status !== "active")
          a.push(`${topImpact[0].label} 활성화로 임팩트 극대화`)
        if (a.length === 0 && topImpact[0])
          a.push(`${topImpact[0].label} 확장 개선 집중`)
        return a
      })()

  const fmtDate = (iso: string | null) => iso
    ? new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    : null

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans" style={{ cursor: dragCursor ? "col-resize" : undefined }}>
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
          <div className="flex items-center gap-3">
            {error && (
              <span className="text-sm text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">{error}</span>
            )}
            {/* 🔍 시스템 감사 버튼 */}
            <button
              onClick={triggerAudit}
              disabled={auditLoading}
              className={[
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition",
                auditLoading
                  ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                  : "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-700",
              ].join(" ")}
            >
              {auditLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-200 rounded-full animate-spin" />
                  감사 중...
                </>
              ) : (
                <>🔍 시스템 감사</>
              )}
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button key={String(f.value)} onClick={() => toggleFilter(f.value)}
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-medium transition",
                filterStatus === f.value
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300",
              ].join(" ")}
              style={{ fontSize: 13 }}>
              <span className="rounded-full flex-shrink-0"
                style={{ width: 7, height: 7, background: filterStatus === f.value ? "#ffffff" : f.color }} />
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
        <aside
          className="flex-shrink-0 border-r border-zinc-200 bg-white relative flex flex-col"
          style={{ width: sidebarW }}
        >
          <div
            ref={sidebarScrollRef}
            className="flex-1 p-4"
            style={{ overflowY: "auto", scrollbarWidth: "none" }}
            onMouseEnter={() => { sidebarHovered.current = true }}
            onMouseLeave={() => { sidebarHovered.current = false }}
          >
            {/* Health Score */}
            <section className="mb-4">
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
                      <span className="rounded-full flex-shrink-0"
                        style={{ width: 7, height: 7, background: STATUS_DOT[s] ?? "#d4d4d8" }} />
                      <span className={`inline-block px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[s] ?? STATUS_COLORS.unknown}`}
                        style={{ fontSize: 13 }}>{s}</span>
                    </div>
                    <span className="font-semibold text-zinc-700" style={{ fontSize: 13 }}>{cnt}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* System Diagnostic Panel — LLM 감사 결과 기반 */}
            <div className="border-t border-zinc-200 pt-4">
              <p className="font-semibold uppercase tracking-widest text-zinc-400 mb-3" style={{ fontSize: 13 }}>
                시스템 종합 진단
              </p>
              <div>
                {/* 종합 판정 */}
                {diagnosis.system_verdict && (
                  <DiagSection icon="✅" title="종합 판정">
                    <p>{diagnosis.system_verdict}</p>
                  </DiagSection>
                )}

                {/* 즉시 조치 — critical_bottlenecks */}
                <DiagSection icon="🔴" title="즉시 조치 필요">
                  {diagnosis.critical_bottlenecks.length === 0 ? (
                    <p>장애 노드 없음.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {diagnosis.critical_bottlenecks.map(b => (
                        <li key={b.node_id} className="flex items-start gap-1.5">
                          <span className="font-bold text-zinc-400 flex-shrink-0">{b.rank}.</span>
                          <span><strong className="text-red-600">[{b.node_id}]</strong> {b.impact}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </DiagSection>

                {/* 파이프라인 리스크 */}
                {diagnosis.pipeline_risk && (
                  <DiagSection icon="⚠️" title="파이프라인 리스크">
                    <p>{diagnosis.pipeline_risk}</p>
                  </DiagSection>
                )}

                {/* 확장 우선순위 */}
                <DiagSection icon="📈" title="확장 우선순위">
                  {topImpact.length === 0 ? <p>데이터 없음</p> : (
                    <ul className="space-y-1">
                      {topImpact.map(n => (
                        <li key={n.node_id} className="flex items-start gap-1.5">
                          <span className="mt-2 rounded-full flex-shrink-0" style={{ width: 5, height: 5, background: "#93c5fd", display: "inline-block" }} />
                          <span><strong>{n.label}</strong> (impact {n.user_impact_score}/10)</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </DiagSection>

                {/* 아키텍처 인사이트 */}
                <DiagSection icon="🧠" title="아키텍처 인사이트">
                  {spofList.length === 0 ? (
                    <p>단일 장애점 후보 없음.</p>
                  ) : (
                    <>
                      <p className="mb-1">연결 수 多 — <strong>SPOF 위험</strong>:</p>
                      <ul className="space-y-1">
                        {spofList.map(n => (
                          <li key={n.node_id} className="flex items-start gap-1.5">
                            <span className="mt-2 rounded-full flex-shrink-0" style={{ width: 5, height: 5, background: "#fbbf24", display: "inline-block" }} />
                            <span><strong>{n.label}</strong> — 연결 {edgeCnt[n.node_id]}개</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </DiagSection>

                {/* 다음 개발 액션 */}
                <DiagSection icon="💡" title="다음 개발 액션">
                  {nextActions.length === 0 ? (
                    <p>전체 정상. 신규 데이터소스 확장을 검토하세요.</p>
                  ) : (
                    <ol className="space-y-1 list-none">
                      {nextActions.map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="font-bold text-zinc-400 flex-shrink-0">{i + 1}.</span>
                          {a}
                        </li>
                      ))}
                    </ol>
                  )}
                </DiagSection>
              </div>

              {/* 마지막 감사 시각 */}
              {graph.last_audited_at && (
                <p className="text-zinc-400 mt-3 pt-3 border-t border-zinc-100" style={{ fontSize: 11 }}>
                  마지막 감사: {fmtDate(graph.last_audited_at)}
                </p>
              )}
            </div>
          </div>

          {/* Drag handle */}
          <div
            className="absolute right-0 top-0 h-full w-1.5 hover:bg-blue-300 transition-colors z-20"
            style={{ cursor: "col-resize" }}
            onMouseDown={(e) => { e.preventDefault(); dragging.current = "left"; setDragCursor(true) }}
          />
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

        {/* ════ Right Detail Panel ════ */}
        {selected && (
          <aside className="flex-shrink-0 border-l border-zinc-200 bg-white relative overflow-y-auto" style={{ width: rightW }}>
            <div
              className="absolute left-0 top-0 h-full w-1.5 hover:bg-blue-300 transition-colors z-20"
              style={{ cursor: "col-resize" }}
              onMouseDown={(e) => { e.preventDefault(); dragging.current = "right"; setDragCursor(true) }}
            />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold uppercase tracking-widest text-zinc-400" style={{ fontSize: 13 }}>Selected Node</p>
                <button onClick={() => setSelected(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition"
                  style={{ fontSize: 14 }}>✕</button>
              </div>

              {/* Summary card */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 mb-4">
                <div className="flex gap-1.5 flex-wrap mb-3">
                  <span className="bg-white border border-zinc-200 text-zinc-500 px-2 py-0.5 rounded-full" style={{ fontSize: 11 }}>
                    {selected.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[selected.status] ?? STATUS_COLORS.unknown}`}
                    style={{ fontSize: 13 }}>{selected.status}</span>
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

              {/* 감사 점수 게이지 */}
              {nodeAudit && nodeAudit.audit_score !== null ? (
                <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-zinc-600" style={{ fontSize: 13 }}>감사 점수</p>
                    <div className="flex items-center gap-2">
                      {nodeAudit.gap_severity && (
                        <span className="px-2 py-0.5 rounded-full font-medium text-white" style={{ fontSize: 11, background: SEVERITY_COLOR[nodeAudit.gap_severity] ?? "#a1a1aa" }}>
                          {nodeAudit.gap_severity}
                        </span>
                      )}
                      <span className="font-bold text-zinc-900" style={{ fontSize: 18 }}>{nodeAudit.audit_score.toFixed(0)}</span>
                      <span className="text-zinc-400" style={{ fontSize: 12 }}>/100</span>
                    </div>
                  </div>
                  <AuditScoreBar score={nodeAudit.audit_score} severity={nodeAudit.gap_severity ?? "medium"} />
                </div>
              ) : nodeAudit === null ? null : (
                <div className="mb-4 rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-center text-zinc-400" style={{ fontSize: 13 }}>
                  🔄 시스템 감사를 실행하면 분석 결과가 표시됩니다.
                </div>
              )}

              {/* Detail items */}
              {selected.detail && selected.detail.length > 0 && (
                <div className="mb-4">
                  <p className="font-semibold uppercase tracking-widest text-zinc-400 mb-2" style={{ fontSize: 13 }}>세부 항목</p>
                  <ul className="space-y-1.5">
                    {selected.detail.map((d, i) => (
                      <li key={i} className="text-zinc-600 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2"
                        style={{ fontSize: 13 }}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Section A: 문제점 / 개선점 (LLM 감사 결과) */}
              <div className="mt-4 pt-4 border-t border-zinc-200">
                <p className="font-semibold text-zinc-500 mb-2" style={{ fontSize: 13 }}>🔧 문제점 / 개선점</p>
                <div className="rounded-xl px-4 py-3" style={{ background: "#f4f4f5" }}>
                  {nodeAudit?.issues ? (
                    <p className="text-zinc-600" style={{ fontSize: 13, lineHeight: 1.6 }}>{nodeAudit.issues}</p>
                  ) : (
                    <p className="text-zinc-400 italic" style={{ fontSize: 13 }}>
                      🔄 시스템 감사를 실행하면 분석 결과가 표시됩니다.
                    </p>
                  )}
                </div>
              </div>

              {/* Section B: 확장 가능성 (LLM 감사 결과) */}
              <div className="mt-3 pt-4 border-t border-zinc-200">
                <p className="font-semibold text-zinc-500 mb-2" style={{ fontSize: 13 }}>📈 확장 가능성</p>
                <div className="bg-zinc-50 rounded-xl px-4 py-3">
                  {nodeAudit?.opportunities ? (
                    <p className="text-zinc-600" style={{ fontSize: 13, lineHeight: 1.6 }}>{nodeAudit.opportunities}</p>
                  ) : (
                    <p className="text-zinc-400 italic" style={{ fontSize: 13 }}>
                      🔄 시스템 감사를 실행하면 분석 결과가 표시됩니다.
                    </p>
                  )}
                </div>
              </div>

              {/* 감사 타임스탬프 */}
              {nodeAudit?.audited_at && (
                <p className="text-zinc-400 mt-3" style={{ fontSize: 11 }}>
                  마지막 분석: {fmtDate(nodeAudit.audited_at)}
                </p>
              )}

              {selected.updated_at && (
                <p className="text-zinc-400 mt-2" style={{ fontSize: 12 }}>
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
