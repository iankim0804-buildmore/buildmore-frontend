'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, GitBranch, Network, RefreshCw, Search, Sparkles } from 'lucide-react'
import {
  fetchWikiGraph,
  generateWikiGraphLinks,
  runWikiGraphLint,
  type AdminWikiGraph,
  type AdminWikiGraphEdge,
  type AdminWikiGraphNode,
} from '@/lib/api/admin'

const relationColor: Record<string, string> = {
  supports: '#22c55e',
  contrasts: '#ef4444',
  same_region: '#38bdf8',
  same_asset: '#a78bfa',
  same_metric: '#f59e0b',
  same_policy: '#f472b6',
  source_overlap: '#14b8a6',
  updates: '#84cc16',
  parent_child: '#eab308',
  related: '#94a3b8',
}

type PositionedNode = AdminWikiGraphNode & { x: number; y: number; r: number }

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function nodeTone(node: AdminWikiGraphNode) {
  if (node.degree === 0) return '#ef4444'
  if (node.freshness_status === 'stale') return '#f59e0b'
  if (node.review_status === 'hold') return '#a78bfa'
  return '#10b981'
}

function makePositions(nodes: AdminWikiGraphNode[], clusters: AdminWikiGraph['clusters']): PositionedNode[] {
  const clusterIndex = new Map<number, number>()
  clusters.forEach((cluster, index) => {
    cluster.note_ids.forEach((id) => clusterIndex.set(id, index))
  })

  return nodes.map((node, index) => {
    const group = clusterIndex.get(node.id) ?? 7
    const angle = index * 2.399963 + group * 0.45
    const radius = Math.min(270, 90 + group * 28 + (index % 5) * 12)
    return {
      ...node,
      x: 500 + Math.cos(angle) * radius,
      y: 310 + Math.sin(angle) * radius * 0.82,
      r: Math.max(5, Math.min(16, 5 + Math.sqrt(Math.max(node.degree, 1)) * 2.2)),
    }
  })
}

export default function WikiGraphPage() {
  const [graph, setGraph] = useState<AdminWikiGraph | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [relationFilter, setRelationFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadGraph = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchWikiGraph()
      setGraph(data)
      if (data?.nodes.length) setSelectedId((current) => current ?? data.nodes[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '그래프 데이터를 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialFetch = setTimeout(loadGraph, 0)
    return () => clearTimeout(initialFetch)
  }, [loadGraph])

  const relationTypes = useMemo(() => {
    if (!graph) return []
    return Object.keys(graph.stats.relation_counts).sort()
  }, [graph])

  const visibleNodes = useMemo(() => {
    if (!graph) return []
    const needle = query.trim().toLowerCase()
    const relatedIds = new Set<number>()
    graph.edges.forEach((edge) => {
      if (relationFilter === 'all' || edge.relation_type === relationFilter) {
        relatedIds.add(edge.source)
        relatedIds.add(edge.target)
      }
    })
    return graph.nodes.filter((node) => {
      const matchesQuery = !needle || node.title.toLowerCase().includes(needle) || node.summary.toLowerCase().includes(needle)
      const matchesRelation = relationFilter === 'all' || relatedIds.has(node.id)
      return matchesQuery && matchesRelation
    })
  }, [graph, query, relationFilter])

  const positionedNodes = useMemo(() => {
    if (!graph) return []
    return makePositions(visibleNodes, graph.clusters)
  }, [graph, visibleNodes])

  const nodeById = useMemo(() => new Map(positionedNodes.map((node) => [node.id, node])), [positionedNodes])

  const visibleEdges = useMemo(() => {
    if (!graph) return []
    return graph.edges.filter((edge) => {
      const matchesRelation = relationFilter === 'all' || edge.relation_type === relationFilter
      return matchesRelation && nodeById.has(edge.source) && nodeById.has(edge.target)
    })
  }, [graph, nodeById, relationFilter])

  const selectedNode = useMemo(() => {
    if (!graph || selectedId == null) return null
    return graph.nodes.find((node) => node.id === selectedId) ?? null
  }, [graph, selectedId])

  const selectedEdges = useMemo(() => {
    if (!graph || selectedId == null) return []
    return graph.edges.filter((edge) => edge.source === selectedId || edge.target === selectedId)
  }, [graph, selectedId])

  async function runMutation(kind: 'links' | 'lint') {
    setIsMutating(true)
    setError(null)
    try {
      if (kind === 'links') {
        await generateWikiGraphLinks(selectedId ?? undefined)
      } else {
        await runWikiGraphLint()
      }
      await loadGraph()
    } catch (err) {
      setError(err instanceof Error ? err.message : '작업에 실패했습니다.')
    } finally {
      setIsMutating(false)
    }
  }

  return (
    <div className="admin-shadcn-surface min-h-screen bg-sidebar pb-10 text-sidebar-foreground">
      <header className="border-b border-sidebar-border bg-sidebar/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="grid size-9 place-items-center rounded-md border border-sidebar-border bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground"
              aria-label="관리자 대시보드로 이동"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">BuildMore Wiki Graph</p>
              <h1 className="text-xl font-semibold text-sidebar-foreground">LLM Wiki Graph Console</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => runMutation('lint')}
              disabled={isMutating}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent px-3 text-sm font-medium text-sidebar-foreground disabled:opacity-50"
            >
              <AlertTriangle className="size-4" />
              Lint
            </button>
            <button
              type="button"
              onClick={() => runMutation('links')}
              disabled={isMutating}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-medium text-white disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              Link
            </button>
            <button
              type="button"
              onClick={loadGraph}
              disabled={isLoading || isMutating}
              className="grid size-9 place-items-center rounded-md border border-sidebar-border bg-sidebar-accent text-muted-foreground hover:text-sidebar-foreground disabled:opacity-50"
              aria-label="새로고침"
            >
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <section className="grid gap-3 md:grid-cols-5">
          {[
            ['Notes', graph?.stats.nodes ?? 0],
            ['Edges', graph?.stats.edges ?? 0],
            ['Clusters', graph?.stats.clusters ?? 0],
            ['Orphans', graph?.stats.orphan_notes ?? 0],
            ['Findings', graph?.stats.open_findings ?? 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-sidebar-border bg-sidebar-accent p-4">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-sidebar-foreground">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent">
            <div className="flex flex-col gap-3 border-b border-sidebar-border p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Network className="size-4 text-emerald-400" />
                <span className="text-sm font-semibold">Graph View</span>
                <span className="text-xs text-muted-foreground">{visibleNodes.length} nodes / {visibleEdges.length} edges</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-9 w-full rounded-md border border-sidebar-border bg-sidebar px-9 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-emerald-500 sm:w-64"
                    placeholder="노트 검색"
                  />
                </label>
                <select
                  value={relationFilter}
                  onChange={(event) => setRelationFilter(event.target.value)}
                  className="h-9 rounded-md border border-sidebar-border bg-sidebar px-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="all">All relations</option>
                  {relationTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="h-[620px] overflow-hidden bg-[#090c11]">
              {isLoading && !graph ? (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">로딩 중...</div>
              ) : (
                <svg viewBox="0 0 1000 620" className="h-full w-full">
                  <defs>
                    <radialGradient id="nodeGlow">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  {visibleEdges.map((edge: AdminWikiGraphEdge) => {
                    const source = nodeById.get(edge.source)
                    const target = nodeById.get(edge.target)
                    if (!source || !target) return null
                    const color = relationColor[edge.relation_type] ?? relationColor.related
                    return (
                      <line
                        key={edge.id}
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={color}
                        strokeOpacity={selectedId && edge.source !== selectedId && edge.target !== selectedId ? 0.13 : 0.42}
                        strokeWidth={Math.max(0.8, Math.min(3.5, (edge.weight || 1) / 35))}
                      />
                    )
                  })}
                  {positionedNodes.map((node) => {
                    const selected = selectedId === node.id
                    return (
                      <g key={node.id} onClick={() => setSelectedId(node.id)} className="cursor-pointer">
                        {selected ? <circle cx={node.x} cy={node.y} r={node.r + 12} fill="url(#nodeGlow)" opacity="0.55" /> : null}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={node.r}
                          fill={nodeTone(node)}
                          stroke={selected ? '#ffffff' : '#0f172a'}
                          strokeWidth={selected ? 2.5 : 1}
                          opacity={selectedId && !selected ? 0.74 : 1}
                        />
                        {node.degree >= 8 || selected ? (
                          <text x={node.x + node.r + 5} y={node.y + 4} fill="#dbeafe" fontSize="11">
                            {node.title.slice(0, 18)}
                          </text>
                        ) : null}
                      </g>
                    )
                  })}
                </svg>
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-lg border border-sidebar-border bg-sidebar-accent p-4">
              <div className="flex items-center gap-2">
                <GitBranch className="size-4 text-emerald-400" />
                <h2 className="text-sm font-semibold">Selected Note</h2>
              </div>
              {selectedNode ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">#{selectedNode.id}</p>
                    <h3 className="mt-1 text-base font-semibold leading-snug">{selectedNode.title}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <Metric label="Degree" value={selectedNode.degree} />
                    <Metric label="In" value={selectedNode.incoming} />
                    <Metric label="Out" value={selectedNode.outgoing} />
                  </div>
                  <p className="line-clamp-5 text-sm leading-6 text-muted-foreground">{selectedNode.summary || '요약 없음'}</p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Links</p>
                    {selectedEdges.slice(0, 8).map((edge) => {
                      const otherId = edge.source === selectedNode.id ? edge.target : edge.source
                      const other = graph?.nodes.find((node) => node.id === otherId)
                      return (
                        <button
                          type="button"
                          key={edge.id}
                          onClick={() => setSelectedId(otherId)}
                          className="block w-full rounded-md border border-sidebar-border bg-sidebar p-3 text-left text-xs hover:border-emerald-500/60"
                        >
                          <span className="font-semibold text-sidebar-foreground">{edge.relation_type}</span>
                          <span className="ml-2 text-muted-foreground">{edge.weight}</span>
                          <p className="mt-1 truncate text-muted-foreground">{other?.title ?? `Note #${otherId}`}</p>
                        </button>
                      )
                    })}
                    {selectedEdges.length === 0 ? <p className="text-sm text-muted-foreground">연결 없음</p> : null}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">선택된 노트가 없습니다.</p>
              )}
            </div>

            <div className="rounded-lg border border-sidebar-border bg-sidebar-accent p-4">
              <h2 className="text-sm font-semibold">Lint Findings</h2>
              <div className="mt-3 space-y-2">
                {graph?.findings.slice(0, 8).map((finding) => (
                  <div key={finding.id} className="rounded-md border border-sidebar-border bg-sidebar p-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-sidebar-foreground">{finding.finding_type}</span>
                      <span className="text-muted-foreground">{finding.severity}</span>
                    </div>
                    <p className="mt-1 leading-5 text-muted-foreground">{finding.summary}</p>
                  </div>
                ))}
                {graph && graph.findings.length === 0 ? <p className="text-sm text-muted-foreground">열린 finding 없음</p> : null}
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent p-4">
            <h2 className="text-sm font-semibold">Clusters</h2>
            <div className="mt-3 grid gap-2">
              {graph?.clusters.slice(0, 10).map((cluster) => (
                <div key={cluster.id} className="flex items-center justify-between rounded-md border border-sidebar-border bg-sidebar px-3 py-2 text-sm">
                  <span className="truncate">{cluster.label}</span>
                  <span className="text-xs text-muted-foreground">{cluster.size} notes</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent p-4">
            <h2 className="text-sm font-semibold">Recent Events</h2>
            <div className="mt-3 grid gap-2">
              {graph?.recent_events.slice(0, 10).map((event) => (
                <div key={event.id} className="rounded-md border border-sidebar-border bg-sidebar px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{event.event_type}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(event.created_at)}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{event.summary || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-sidebar-border bg-sidebar px-2 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}
