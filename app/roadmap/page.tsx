"use client"

import Link from "next/link"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { ArrowLeft, Activity, RefreshCw } from "lucide-react"
import RoadmapMap from "@/components/RoadmapMap"
import type {
  RoadmapGraph, RoadmapNode, NodeStatus, SystemDiagnosis, PulseResponse,
} from "@/types/roadmap"

const EMPTY_DIAGNOSIS: SystemDiagnosis = {
  system_verdict: "아직 심층 감사가 실행되지 않았습니다. 🧠 심층 감사 버튼으로 LLM 종합 진단을 받아보세요.",
  critical_bottlenecks: [],
  pipeline_risk: "",
  immediate_actions: ["심층 감사 버튼 클릭"],
}

const FALLBACK: RoadmapGraph = {
  nodes: [], edges: [], layer_labels: {},
  health: {
    health_score: 0, grade: "F", total: 0, by_status: {}, by_layer: {},
    maturity: { stage: "Pre-MVP", levels: {} }, last_updated: "-",
  },
  pulse_metrics: [],
  node_scores: {},
  system_diagnosis: EMPTY_DIAGNOSIS,
  last_audited_at: null,
  audit_run_id: null,
}

const LAYER_ORDER = ["source", "collection", "processing", "database", "wiki", "delta", "api", "frontend", "ops"]

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
  critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#10b981",
}
const SEV_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

const GROUP_COLOR: Record<string, string> = {
  source: "#60a5fa", collection: "#a78bfa", processing: "#f59e0b",
  wiki: "#c084fc", delta: "#fb923c", serve: "#10b981", ops: "#64748b",
}
const INVERT_WARN: Record<string, number> = { queue: 100, queue_failed: 1, stale_ratio: 20 }

const MATURITY_STAGES = ["Pre-MVP", "MVP", "Beta", "Prod"]

function scoreHex(score: number): string {
  if (score >= 80) return "#10b981"
  if (score >= 65) return "#22c55e"
  if (score >= 45) return "#f59e0b"
  return "#ef4444"
}
function gradeHex(grade: string): string {
  return ({ A: "#10b981", B: "#22c55e", C: "#f59e0b", D: "#f97316", F: "#ef4444" } as Record<string, string>)[grade] ?? "#a1a1aa"
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

function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="font-semibold uppercase tracking-widest text-zinc-400" style={{ fontSize: 11 }}>{children}</p>
      {right}
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
  const [pulse, setPulse]               = useState<PulseResponse | null>(null)
  const [pulseAt, setPulseAt]           = useState<string | null>(null)
  const [pulseRefreshing, setPulseRefreshing] = useState(false)
  const [loading, setLoading]           = useState(true)
  const [filterStatus, setFilterStatus] = useState<NodeStatus | null>(null)
  const [selected, setSelected]         = useState<RoadmapNode | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [verdictOpen, setVerdictOpen]   = useState(false)

  // 심층 감사 (LLM) 관련 상태
  const [auditLoading, setAuditLoading] = useState(false)
  const [, setAuditRunId]               = useState<string | null>(null)
  const [nodeAudit, setNodeAudit]       = useState<NodeAuditData | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pulsePollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [sidebarW, setSidebarW] = useState(300)
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

  const loadPulse = useCallback(async () => {
    setPulseRefreshing(true)
    try {
      const res = await fetch("/api/roadmap/pulse", { cache: "no-store" })
      if (res.ok) {
        const data: PulseResponse = await res.json()
        setPulse(data)
        setPulseAt(data.computed_at ?? new Date().toISOString())
        setError(null)
      }
    } catch { /* 마지막 값 유지 */ } finally { setPulseRefreshing(false) }
  }, [])

  useEffect(() => { loadGraph() }, [])

  // 실시간 맥박 — 45초 주기 폴링 (LLM 비용 없음)
  useEffect(() => {
    loadPulse()
    pulsePollRef.current = setInterval(loadPulse, 45000)
    return () => { if (pulsePollRef.current) clearInterval(pulsePollRef.current) }
  }, [loadPulse])

  // 노드 선택 시 (마지막 심층 감사의) 노드 감사 데이터 조회
  useEffect(() => {
    if (!selected) { setNodeAudit(null); return }
    fetch(`/api/roadmap/audit/node/${selected.node_id}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(d => setNodeAudit(d))
      .catch(() => setNodeAudit(null))
  }, [selected?.node_id])

  // 심층 감사 트리거 (LLM)
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
            if (status.status === "failed") setError("심층 감사 실행 실패")
            await loadGraph()
            await loadPulse()
            setVerdictOpen(true)
            if (selected) {
              const nr = await fetch(`/api/roadmap/audit/node/${selected.node_id}`, { cache: "no-store" })
              if (nr.ok) setNodeAudit(await nr.json())
            }
          }
        } catch { /* ignore */ }
      }, 5000)
    } catch {
      setError("심층 감사 요청 실패")
      setAuditLoading(false)
    }
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  // Panel resize
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current === "left")
        setSidebarW(Math.min(480, Math.max(220, e.clientX)))
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

  // ── 라이브 vs 그래프 병합 ──
  const health       = pulse?.health ?? graph.health
  const pulseMetrics = pulse?.pulse_metrics ?? graph.pulse_metrics ?? []
  const nodeScores   = pulse?.node_scores ?? graph.node_scores ?? {}
  const diagnosis    = graph.system_diagnosis ?? EMPTY_DIAGNOSIS

  const nodeMap = useMemo(() => new Map(graph.nodes.map(n => [n.node_id, n])), [graph.nodes])

  const grade  = health.grade ?? "F"
  const stage  = health.maturity?.stage ?? "MVP"
  const levels = health.maturity?.levels ?? {}
  const stageIdx = Math.max(0, MATURITY_STAGES.indexOf(stage))

  const layerHealth = useMemo(() =>
    LAYER_ORDER
      .filter(l => health.by_layer?.[l])
      .map(l => ({ layer: l, label: graph.layer_labels[l] ?? l, ...health.by_layer![l] })),
    [health.by_layer, graph.layer_labels])

  const criticalIssues = useMemo(() => {
    return Object.entries(nodeScores)
      .filter(([, v]) => v.gap_severity === "critical" || v.gap_severity === "high")
      .map(([nid, v]) => {
        const node = nodeMap.get(nid)
        return {
          node_id: nid,
          label: node?.label ?? nid,
          impact: node?.user_impact_score ?? 5,
          severity: v.gap_severity ?? "medium",
          score: v.score,
          gap: v.gaps?.[0] ?? "",
          node,
        }
      })
      .sort((a, b) => (SEV_RANK[a.severity] - SEV_RANK[b.severity]) || (b.impact - a.impact))
      .slice(0, 6)
  }, [nodeScores, nodeMap])

  const liveScore = selected ? nodeScores[selected.node_id] : undefined

  const fmtDate = (iso: string | null) => iso
    ? new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    : null
  const fmtTime = (iso: string | null) => iso
    ? new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—"

  function metricValueHex(key: string, value: number, invert?: boolean): string {
    if (key === "ops_rate") return value >= 90 ? "#059669" : value >= 70 ? "#d97706" : "#dc2626"
    if (invert) {
      const t = INVERT_WARN[key]
      if (t !== undefined && value >= t) return "#d97706"
    }
    return "#18181b"
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans" style={{ cursor: dragCursor ? "col-resize" : undefined }}>
      {/* ════ Header ════ */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-400">BuildMore</p>
              <h1 className="mt-0.5 font-bold text-zinc-900" style={{ fontSize: 19 }}>시스템 DNA맵 대시보드</h1>
            </div>
            {/* 헤드라인 칩: 등급 · 점수 · 성숙도 */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5"
                style={{ borderColor: gradeHex(grade) + "55", background: gradeHex(grade) + "12" }}>
                <span className="font-extrabold" style={{ fontSize: 16, color: gradeHex(grade) }}>{grade}</span>
                <span className="font-bold text-zinc-800" style={{ fontSize: 15 }}>{health.health_score.toFixed(1)}</span>
                <span className="text-zinc-400" style={{ fontSize: 11 }}>건강도</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-zinc-600" style={{ fontSize: 12 }}>
                <span className="font-semibold text-zinc-800">{stage}</span> 단계
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5" style={{ fontSize: 12 }}>
                <Activity className="h-3.5 w-3.5" style={{ color: pulseRefreshing ? "#10b981" : "#a1a1aa" }} />
                <span className="text-zinc-500">LIVE</span>
                <span className="text-zinc-400">{fmtTime(pulseAt)}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {error && (
              <span className="text-sm text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">{error}</span>
            )}
            <Link
              href="/admin"
              aria-label="Admin으로 돌아가기"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <button
              onClick={loadPulse}
              disabled={pulseRefreshing}
              title="실시간 맥박 새로고침"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-100 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${pulseRefreshing ? "animate-spin" : ""}`} />
            </button>
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
                  심층 감사 중...
                </>
              ) : (
                <>🧠 심층 감사 (LLM)</>
              )}
            </button>
          </div>
        </div>

        {/* Filter pills + 카운트 */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button key={String(f.value)} onClick={() => toggleFilter(f.value)}
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-medium transition",
                filterStatus === f.value
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300",
              ].join(" ")}
              style={{ fontSize: 12 }}>
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
          <span className="ml-auto text-zinc-400" style={{ fontSize: 12 }}>
            노드 {graph.nodes.length} · 엣지 {graph.edges.length} · 레이어 {Object.keys(graph.layer_labels).length}
          </span>
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
            {/* ── 1. Health Score ── */}
            <section className="mb-5">
              <SectionLabel right={
                <span className="inline-flex items-center gap-1 text-zinc-400" style={{ fontSize: 10 }}>
                  <Activity className="h-3 w-3" style={{ color: pulseRefreshing ? "#10b981" : "#cbd5e1" }} />
                  {fmtTime(pulseAt)}
                </span>
              }>종합 건강도</SectionLabel>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-2xl flex-shrink-0"
                  style={{ width: 56, height: 56, background: gradeHex(grade) + "18", border: `2px solid ${gradeHex(grade)}55` }}>
                  <span className="font-extrabold" style={{ fontSize: 28, color: gradeHex(grade) }}>{grade}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-end gap-1.5">
                    <span className="font-bold text-zinc-900" style={{ fontSize: 30 }}>{health.health_score.toFixed(1)}</span>
                    <span className="text-zinc-400 mb-1" style={{ fontSize: 12 }}>/ 100</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${health.health_score}%`, background: scoreHex(health.health_score) }} />
                  </div>
                  <p className="text-zinc-400 mt-1" style={{ fontSize: 10 }}>
                    임팩트 가중 · 실측 데이터 기반
                  </p>
                </div>
              </div>
              {/* 상태 분포 (작게) */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.entries(health.by_status).map(([s, cnt]) => (
                  <span key={s} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${STATUS_COLORS[s] ?? STATUS_COLORS.unknown}`} style={{ fontSize: 11 }}>
                    <span className="rounded-full" style={{ width: 6, height: 6, background: STATUS_DOT[s] ?? "#d4d4d8" }} />
                    {s} {cnt}
                  </span>
                ))}
              </div>
            </section>

            {/* ── 2. 성숙도 단계 ── */}
            <section className="mb-5">
              <SectionLabel>성숙도 단계</SectionLabel>
              <div className="flex gap-1">
                {MATURITY_STAGES.map((st, i) => (
                  <div key={st} className="flex-1 text-center">
                    <div className="h-1.5 rounded-full" style={{ background: i <= stageIdx ? scoreHex(health.health_score) : "#e4e4e7" }} />
                    <span className={`mt-1 block ${i === stageIdx ? "font-bold text-zinc-800" : "text-zinc-400"}`} style={{ fontSize: 10 }}>{st}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-1.5 text-zinc-500" style={{ fontSize: 10 }}>
                <span className="text-emerald-600">prod {levels.prod ?? 0}</span>·
                <span className="text-lime-600">beta {levels.beta ?? 0}</span>·
                <span className="text-amber-600">mvp {levels.mvp ?? 0}</span>·
                <span className="text-red-500">미달 {levels.below ?? 0}</span>
              </div>
            </section>

            {/* ── 3. 파이프라인 맥박 (실측 볼륨) ── */}
            <section className="mb-5">
              <SectionLabel>파이프라인 맥박</SectionLabel>
              <div className="grid grid-cols-2 gap-1.5">
                {pulseMetrics.map(mtr => (
                  <div key={mtr.key} className="rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-1.5"
                    style={{ borderLeft: `3px solid ${GROUP_COLOR[mtr.group] ?? "#cbd5e1"}` }}>
                    <p className="text-zinc-400 truncate" style={{ fontSize: 10 }}>{mtr.label}</p>
                    <p className="font-bold leading-tight" style={{ fontSize: 15, color: metricValueHex(mtr.key, mtr.value, mtr.invert) }}>
                      {mtr.value.toLocaleString()}<span className="font-medium text-zinc-400 ml-0.5" style={{ fontSize: 10 }}>{mtr.unit}</span>
                    </p>
                  </div>
                ))}
                {pulseMetrics.length === 0 && (
                  <p className="col-span-2 text-zinc-400 text-center py-3" style={{ fontSize: 12 }}>맥박 데이터 로딩 중…</p>
                )}
              </div>
            </section>

            {/* ── 4. 레이어별 건강도 ── */}
            <section className="mb-5">
              <SectionLabel>레이어별 건강도</SectionLabel>
              <div className="space-y-1.5">
                {layerHealth.map(l => (
                  <div key={l.layer}>
                    <div className="flex items-center justify-between" style={{ fontSize: 11 }}>
                      <span className="text-zinc-600">{l.label} <span className="text-zinc-300">·{l.count}</span></span>
                      <span className="font-semibold" style={{ color: scoreHex(l.health) }}>{l.health.toFixed(0)}</span>
                    </div>
                    <div className="mt-0.5 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${l.health}%`, background: scoreHex(l.health) }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 5. 즉시 조치: critical/high gap ── */}
            <section className="mb-5">
              <SectionLabel>즉시 조치 필요</SectionLabel>
              {criticalIssues.length === 0 ? (
                <p className="text-zinc-400" style={{ fontSize: 12 }}>critical/high 갭 없음 — 안정적입니다.</p>
              ) : (
                <ul className="space-y-1.5">
                  {criticalIssues.map((it, i) => (
                    <li key={it.node_id}>
                      <button onClick={() => it.node && setSelected(it.node)}
                        className="w-full text-left rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-2 hover:border-zinc-300 transition">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-zinc-400" style={{ fontSize: 11 }}>{i + 1}</span>
                          <span className="rounded-full px-1.5 py-0.5 text-white font-medium" style={{ fontSize: 9, background: SEVERITY_COLOR[it.severity] ?? "#a1a1aa" }}>{it.severity}</span>
                          <span className="font-semibold text-zinc-800 truncate" style={{ fontSize: 12 }}>{it.label}</span>
                          <span className="ml-auto text-zinc-400" style={{ fontSize: 10 }}>i{it.impact}</span>
                        </div>
                        {it.gap && <p className="text-zinc-500 mt-1" style={{ fontSize: 11, lineHeight: 1.45 }}>{it.gap}</p>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── 6. 심층 감사 (LLM) 종합 판정 — collapsible ── */}
            <section className="border-t border-zinc-200 pt-3">
              <button onClick={() => setVerdictOpen(o => !o)} className="w-full flex items-center justify-between">
                <p className="font-semibold uppercase tracking-widest text-zinc-400" style={{ fontSize: 11 }}>심층 감사 (LLM)</p>
                <span className="text-zinc-400" style={{ fontSize: 11 }}>{verdictOpen ? "접기 ▲" : "펼치기 ▼"}</span>
              </button>
              {verdictOpen && (
                <div className="mt-2">
                  {diagnosis.system_verdict && (
                    <DiagSection icon="✅" title="종합 판정"><p>{diagnosis.system_verdict}</p></DiagSection>
                  )}
                  <DiagSection icon="🔴" title="치명적 병목">
                    {diagnosis.critical_bottlenecks.length === 0 ? (
                      <p>심층 감사를 실행하면 LLM이 병목을 진단합니다.</p>
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
                  {diagnosis.pipeline_risk && (
                    <DiagSection icon="⚠️" title="파이프라인 리스크"><p>{diagnosis.pipeline_risk}</p></DiagSection>
                  )}
                  {diagnosis.immediate_actions.length > 0 && (
                    <DiagSection icon="💡" title="권장 액션">
                      <ol className="space-y-1 list-none">
                        {diagnosis.immediate_actions.map((a, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="font-bold text-zinc-400 flex-shrink-0">{i + 1}.</span>{a}
                          </li>
                        ))}
                      </ol>
                    </DiagSection>
                  )}
                </div>
              )}
              {graph.last_audited_at && (
                <p className="text-zinc-400 mt-2" style={{ fontSize: 10 }}>
                  마지막 심층 감사: {fmtDate(graph.last_audited_at)}
                </p>
              )}
            </section>
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
            nodeScores={nodeScores}
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

              {/* 실시간 데이터 충족도 (pulse) */}
              {liveScore && liveScore.score !== null && (
                <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-zinc-600 inline-flex items-center gap-1.5" style={{ fontSize: 13 }}>
                      <Activity className="h-3.5 w-3.5 text-emerald-500" /> 실시간 충족도
                    </p>
                    <div className="flex items-center gap-2">
                      {liveScore.gap_severity && (
                        <span className="px-2 py-0.5 rounded-full font-medium text-white" style={{ fontSize: 11, background: SEVERITY_COLOR[liveScore.gap_severity] ?? "#a1a1aa" }}>
                          {liveScore.gap_severity}
                        </span>
                      )}
                      <span className="font-bold text-zinc-900" style={{ fontSize: 18 }}>{Math.round(liveScore.score)}</span>
                      <span className="text-zinc-400" style={{ fontSize: 12 }}>/100</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${liveScore.score}%`, background: scoreHex(liveScore.score) }} />
                  </div>
                  {liveScore.gaps.length > 0 && (
                    <ul className="mt-2.5 space-y-1">
                      {liveScore.gaps.map((g, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-zinc-600" style={{ fontSize: 12, lineHeight: 1.5 }}>
                          <span className="text-amber-500 flex-shrink-0">›</span>{g}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

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

              {/* LLM 심층 감사 결과 */}
              <div className="mt-4 pt-4 border-t border-zinc-200">
                <p className="font-semibold text-zinc-500 mb-2" style={{ fontSize: 13 }}>🔧 문제점 / 개선점 (LLM)</p>
                <div className="rounded-xl px-4 py-3" style={{ background: "#f4f4f5" }}>
                  {nodeAudit?.issues ? (
                    <p className="text-zinc-600" style={{ fontSize: 13, lineHeight: 1.6 }}>{nodeAudit.issues}</p>
                  ) : (
                    <p className="text-zinc-400 italic" style={{ fontSize: 13 }}>🧠 심층 감사를 실행하면 LLM 분석이 표시됩니다.</p>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-4 border-t border-zinc-200">
                <p className="font-semibold text-zinc-500 mb-2" style={{ fontSize: 13 }}>📈 확장 가능성 (LLM)</p>
                <div className="bg-zinc-50 rounded-xl px-4 py-3">
                  {nodeAudit?.opportunities ? (
                    <p className="text-zinc-600" style={{ fontSize: 13, lineHeight: 1.6 }}>{nodeAudit.opportunities}</p>
                  ) : (
                    <p className="text-zinc-400 italic" style={{ fontSize: 13 }}>🧠 심층 감사를 실행하면 LLM 분석이 표시됩니다.</p>
                  )}
                </div>
              </div>

              {nodeAudit?.audited_at && (
                <p className="text-zinc-400 mt-3" style={{ fontSize: 11 }}>마지막 LLM 분석: {fmtDate(nodeAudit.audited_at)}</p>
              )}
              {selected.updated_at && (
                <p className="text-zinc-400 mt-2" style={{ fontSize: 12 }}>업데이트: {new Date(selected.updated_at).toLocaleString("ko-KR")}</p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
