"use client"

import { useMemo, useState } from "react"

type NodeStatus = "active" | "seed" | "unknown" | "danger" | "planned"
type NodeType = "source" | "processing" | "database" | "llm" | "delta" | "api" | "ui" | "result"

type RoadmapNode = {
  id: string
  title: string
  type: NodeType
  status: NodeStatus
  x: number
  y: number
  summary: string
  items: string[]
}

type RoadmapEdge = {
  id: string
  from: string
  to: string
  label: string
}

const nodes: RoadmapNode[] = [
  {
    id: "source-public",
    title: "공공데이터 / 실거래가",
    type: "source",
    status: "unknown",
    x: 80,
    y: 120,
    summary: "정형 부동산 원천 데이터. 실제 유입 주기, 실패 처리, 중복 방지를 검수해야 한다.",
    items: ["외부 API", "거래/인허가/가격 데이터", "수집 주기 확인 필요"],
  },
  {
    id: "source-docs",
    title: "문서 / Wiki / 사용자 입력",
    type: "source",
    status: "unknown",
    x: 80,
    y: 430,
    summary: "비정형 LLM Wiki 원천 데이터. chunk, embedding, retrieval 연결 여부가 핵심이다.",
    items: ["문서 업로드", "Wiki 문서", "사용자 질문/메모"],
  },
  {
    id: "queue",
    title: "Ingestion / Processing Queue",
    type: "processing",
    status: "active",
    x: 430,
    y: 270,
    summary: "수집·정제·재처리 작업을 queue 기반으로 처리해야 하는 핵심 구간.",
    items: ["processing_queue", "threading.Thread 금지", "실패/재시도 정책 검수"],
  },
  {
    id: "commerce-properties",
    title: "commerce_properties",
    type: "database",
    status: "active",
    x: 790,
    y: 110,
    summary: "상업용 부동산 물건 기준 테이블. 거래 테이블과 JOIN 기준이 된다.",
    items: ["property id 기준", "프론트 사용 경로 검수", "분석 API 연결 확인"],
  },
  {
    id: "commerce-transactions",
    title: "commerce_property_transactions",
    type: "database",
    status: "danger",
    x: 790,
    y: 310,
    summary: "상업용 부동산 거래 테이블. 컬럼명 혼동 위험이 높아 우선 검수 대상이다.",
    items: ["deal_type 사용", "deal_date 사용", "area_m2 Decimal → float()"],
  },
  {
    id: "documents",
    title: "Document / Source Store",
    type: "database",
    status: "unknown",
    x: 790,
    y: 520,
    summary: "비정형 원문, source registry, 정제 결과가 저장되는 후보 영역.",
    items: ["원문 저장", "source_id 연결", "삭제/갱신 정책 확인"],
  },
  {
    id: "llm-wiki",
    title: "LLM Wiki Index",
    type: "llm",
    status: "unknown",
    x: 1160,
    y: 470,
    summary: "문서 chunk와 embedding이 실제 검색·프롬프트에 들어가는지 확인할 핵심 노드.",
    items: ["chunk", "embedding", "pgvector", "retrieval API"],
  },
  {
    id: "delta-engine",
    title: "Delta Engine",
    type: "delta",
    status: "unknown",
    x: 1160,
    y: 190,
    summary: "이전 상태와 현재 상태의 차이를 감지하는 엔진. snapshot 기준과 활용처 검수가 필요하다.",
    items: ["baseline", "comparison", "delta result", "Analysis 연결"],
  },
  {
    id: "analysis-api",
    title: "Analysis API / Service",
    type: "api",
    status: "active",
    x: 1530,
    y: 260,
    summary: "정형 데이터, LLM Wiki, Delta 결과가 실제 분석에 결합되는지 확인할 중심 노드.",
    items: ["/api/analysis", "deal panel", "feedback loop", "근거 source"],
  },
  {
    id: "chat-api",
    title: "LLM Chat API",
    type: "api",
    status: "active",
    x: 1530,
    y: 520,
    summary: "대화창 질문에 RAG context와 analysis context가 들어가는지 확인한다.",
    items: ["conversation", "analysis_context", "sources_used", "model"],
  },
  {
    id: "analysis-ui",
    title: "Analysis 화면",
    type: "ui",
    status: "active",
    x: 1890,
    y: 280,
    summary: "사용자가 보는 딜 분석 화면. 어떤 backend 결과를 실제 사용하는지 검수한다.",
    items: ["KPI", "chat", "deal insight", "지도"],
  },
  {
    id: "roadmap-ui",
    title: "Admin Roadmap Board",
    type: "ui",
    status: "seed",
    x: 1890,
    y: 540,
    summary: "BuildMore 시스템맵을 시각화하는 관리자 페이지. React Flow 도입 전 샘플 HTML 단계.",
    items: ["/admin/roadmap", "Update 버튼", "graph JSON 기반 확장 예정"],
  },
]

const edges: RoadmapEdge[] = [
  { id: "e1", from: "source-public", to: "queue", label: "FETCH / ENQUEUE" },
  { id: "e2", from: "source-docs", to: "queue", label: "UPLOAD / ENQUEUE" },
  { id: "e3", from: "queue", to: "commerce-properties", label: "WRITES_TO" },
  { id: "e4", from: "queue", to: "commerce-transactions", label: "WRITES_TO" },
  { id: "e5", from: "queue", to: "documents", label: "WRITES_TO" },
  { id: "e6", from: "documents", to: "llm-wiki", label: "CHUNK / EMBED" },
  { id: "e7", from: "commerce-properties", to: "delta-engine", label: "READS_FROM" },
  { id: "e8", from: "commerce-transactions", to: "delta-engine", label: "READS_FROM" },
  { id: "e9", from: "commerce-properties", to: "analysis-api", label: "READS_FROM" },
  { id: "e10", from: "commerce-transactions", to: "analysis-api", label: "READS_FROM" },
  { id: "e11", from: "llm-wiki", to: "analysis-api", label: "RETRIEVES" },
  { id: "e12", from: "delta-engine", to: "analysis-api", label: "FEEDS" },
  { id: "e13", from: "llm-wiki", to: "chat-api", label: "RETRIEVES" },
  { id: "e14", from: "analysis-api", to: "analysis-ui", label: "DISPLAYS" },
  { id: "e15", from: "chat-api", to: "analysis-ui", label: "DISPLAYS" },
  { id: "e16", from: "analysis-api", to: "roadmap-ui", label: "MAPS" },
]

const statusLabel: Record<NodeStatus, string> = {
  active: "Active",
  seed: "Seed",
  unknown: "Unknown",
  danger: "Danger",
  planned: "Planned",
}

const typeLabel: Record<NodeType, string> = {
  source: "Source",
  processing: "Processing",
  database: "DB",
  llm: "LLM Wiki",
  delta: "Delta",
  api: "API",
  ui: "UI",
  result: "Result",
}

const nodeClass: Record<NodeType, string> = {
  source: "border-sky-300 bg-sky-50",
  processing: "border-amber-300 bg-amber-50",
  database: "border-emerald-300 bg-emerald-50",
  llm: "border-violet-300 bg-violet-50",
  delta: "border-orange-300 bg-orange-50",
  api: "border-blue-300 bg-blue-50",
  ui: "border-slate-300 bg-white",
  result: "border-zinc-300 bg-zinc-50",
}

const statusClass: Record<NodeStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  seed: "bg-blue-100 text-blue-700 border-blue-200",
  unknown: "bg-slate-100 text-slate-700 border-slate-200",
  danger: "bg-red-100 text-red-700 border-red-200",
  planned: "bg-zinc-100 text-zinc-700 border-zinc-200",
}

export default function AdminRoadmapPage() {
  const [selectedId, setSelectedId] = useState("llm-wiki")
  const [filter, setFilter] = useState<NodeType | "all">("all")
  const [message, setMessage] = useState("Seed graph loaded. GitHub 자동 스캔 연결 전 샘플 보드입니다.")

  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0]

  const visibleNodes = useMemo(() => {
    if (filter === "all") return nodes
    return nodes.filter((node) => node.type === filter)
  }, [filter])

  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id))
  const visibleEdges = edges.filter((edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to))

  async function handleRefresh() {
    setMessage("Update requested. 다음 단계에서 최신 GitHub scan → graph JSON 생성 → 보드 반영으로 연결합니다.")
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/90 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">BuildMore Admin</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">데이터 · LLM Wiki · Delta Roadmap Board</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Miro/ComfyUI처럼 모든 source, processing, DB, LLM Wiki, Delta Engine, API, UI를 연결해서 보는 관리자용 시스템맵 샘플입니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRefresh}
              className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300"
            >
              Update from Git
            </button>
            <a
              href="/"
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Home
            </a>
          </div>
        </div>
      </header>

      <section className="grid min-h-[calc(100vh-97px)] grid-cols-1 lg:grid-cols-[260px_1fr_360px]">
        <aside className="border-b border-white/10 bg-slate-900/70 p-5 lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Filters</p>
          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {(["all", "source", "processing", "database", "llm", "delta", "api", "ui"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                  filter === item
                    ? "border-cyan-300 bg-cyan-300/15 text-cyan-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {item === "all" ? "All Nodes" : typeLabel[item]}
              </button>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-slate-200">현재 상태</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{message}</p>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-slate-200">다음 구현</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-400">
              <li>1. GitHub scan API 연결</li>
              <li>2. graph JSON 저장</li>
              <li>3. React Flow / ELK.js 도입</li>
              <li>4. Notion 요약 업데이트</li>
            </ul>
          </div>
        </aside>

        <section className="relative overflow-auto bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:28px_28px]">
          <div className="relative h-[820px] w-[2250px]">
            <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="rgba(125, 211, 252, 0.75)" />
                </marker>
              </defs>
              {visibleEdges.map((edge) => {
                const from = nodes.find((node) => node.id === edge.from)
                const to = nodes.find((node) => node.id === edge.to)
                if (!from || !to) return null
                const x1 = from.x + 260
                const y1 = from.y + 58
                const x2 = to.x
                const y2 = to.y + 58
                const midX = (x1 + x2) / 2
                const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`
                return (
                  <g key={edge.id}>
                    <path d={d} fill="none" stroke="rgba(125, 211, 252, 0.65)" strokeWidth="2" markerEnd="url(#arrow)" />
                    <text x={midX - 36} y={(y1 + y2) / 2 - 8} fill="rgba(226,232,240,0.65)" fontSize="11">
                      {edge.label}
                    </text>
                  </g>
                )
              })}
            </svg>

            {visibleNodes.map((node) => (
              <button
                key={node.id}
                onClick={() => setSelectedId(node.id)}
                className={`absolute w-[260px] rounded-2xl border-2 p-4 text-left text-slate-950 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl ${nodeClass[node.type]} ${
                  selectedId === node.id ? "ring-4 ring-cyan-300/70" : ""
                }`}
                style={{ left: node.x, top: node.y }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-semibold text-white">{typeLabel[node.type]}</span>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass[node.status]}`}>
                    {statusLabel[node.status]}
                  </span>
                </div>
                <h2 className="mt-3 text-base font-bold leading-tight">{node.title}</h2>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-700">{node.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {node.items.slice(0, 3).map((item) => (
                    <span key={item} className="rounded-full bg-white/70 px-2 py-1 text-[11px] text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </section>

        <aside className="border-t border-white/10 bg-slate-900 p-5 lg:border-l lg:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Selected Node</p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-semibold text-cyan-200">{typeLabel[selected.type]}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass[selected.status]}`}>
                {statusLabel[selected.status]}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">{selected.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{selected.summary}</p>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold text-white">세부 리스트</p>
            <ul className="mt-3 space-y-2">
              {selected.items.map((item) => (
                <li key={item} className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold text-white">연결된 흐름</p>
            <div className="mt-3 space-y-2 text-sm text-slate-400">
              {edges
                .filter((edge) => edge.from === selected.id || edge.to === selected.id)
                .map((edge) => {
                  const from = nodes.find((node) => node.id === edge.from)?.title ?? edge.from
                  const to = nodes.find((node) => node.id === edge.to)?.title ?? edge.to
                  return (
                    <div key={edge.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                      <p className="text-xs font-semibold text-cyan-200">{edge.label}</p>
                      <p className="mt-1">{from} → {to}</p>
                    </div>
                  )
                })}
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}
