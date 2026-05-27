'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, GitBranch, Layers3, Network, RefreshCw, Search, Sparkles } from 'lucide-react'
import {
  fetchWikiGraph,
  generateWikiGraphLinks,
  runWikiGraphLint,
  type AdminWikiGraph,
  type AdminWikiGraphEdge,
  type AdminWikiGraphNode,
} from '@/lib/api/admin'

const VIEW_WIDTH = 1000
const VIEW_HEIGHT = 620
const VIEW_CENTER_X = VIEW_WIDTH / 2
const VIEW_CENTER_Y = VIEW_HEIGHT / 2

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

const categoryDefinitions = [
  {
    id: 'market',
    label: '상권·임대수요',
    description: '유동인구, 임대료, 공실률, 상권 변화',
    color: '#22c55e',
    keywords: ['상권', '유동', '임대', '월세', '전세', '공실', '매출', '상가', 'F&B', '근생', '수요', '폐업'],
  },
  {
    id: 'pricing',
    label: '매입가·거래비교',
    description: '실거래, 토지평단가, 호가, 가격 상승률',
    color: '#38bdf8',
    keywords: ['매입', '매매', '거래', '실거래', '호가', '평당가', '토지', '가격', '급매', '시세', '상승률'],
  },
  {
    id: 'finance',
    label: '금융·수익성',
    description: 'NOI, ROE, DSCR, LTV, 금리와 자기자본',
    color: '#f59e0b',
    keywords: ['NOI', 'ROE', 'DSCR', 'LTV', '금리', '대출', '수익률', '자기자본', '레버리지', '이자', 'cap rate', '캡레이트'],
  },
  {
    id: 'development',
    label: '개발·인허가',
    description: '리모델링, 신축, 용도지역, 공사비, 주차',
    color: '#a78bfa',
    keywords: ['개발', '인허가', '용도지역', '건폐율', '용적률', '리모델링', '증축', '신축', '공사비', '주차', '재건축'],
  },
  {
    id: 'execution',
    label: '운영·Exit/리포트',
    description: '투자자 브리핑, 비교카드, 리포트, 매각 전략',
    color: '#f472b6',
    keywords: ['리포트', '투자자', '브리핑', '비교카드', '후보', '매각', 'exit', '엑시트', '운영', '전략', '검토'],
  },
] as const

type CategoryId = (typeof categoryDefinitions)[number]['id']
type CategoryDefinition = (typeof categoryDefinitions)[number]

type CategoryLayoutNode = {
  kind: 'category'
  graphId: string
  categoryId: CategoryId
  label: string
  description: string
  color: string
  count: number
  x: number
  y: number
  vx: number
  vy: number
  r: number
  anchorX: number
  anchorY: number
}

type NoteLayoutNode = AdminWikiGraphNode & {
  kind: 'note'
  graphId: string
  noteId: number
  categoryId: CategoryId
  color: string
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

type LayoutNode = CategoryLayoutNode | NoteLayoutNode

type LayoutLink = {
  id: string
  source: string
  target: string
  kind: 'category' | 'note'
  relation_type: string
  weight: number
  confidence?: number | null
}

type GraphLayout = {
  nodes: LayoutNode[]
  links: LayoutLink[]
  categoryCounts: Map<CategoryId, number>
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function hashString(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function categoryAnchor(index: number, total: number) {
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2
  return {
    x: VIEW_CENTER_X + Math.cos(angle) * 280,
    y: VIEW_CENTER_Y + Math.sin(angle) * 205,
  }
}

function categoryById(id: CategoryId): CategoryDefinition {
  return categoryDefinitions.find((category) => category.id === id) ?? categoryDefinitions[0]
}

function noteText(node: AdminWikiGraphNode) {
  return `${node.title} ${node.summary}`.toLowerCase()
}

function classifyNote(node: AdminWikiGraphNode): CategoryId {
  const text = noteText(node)
  let bestCategory: CategoryDefinition = categoryDefinitions[0]
  let bestScore = 0

  categoryDefinitions.forEach((category) => {
    const score = category.keywords.reduce((sum, keyword) => {
      return text.includes(keyword.toLowerCase()) ? sum + 1 : sum
    }, 0)
    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  })

  if (bestScore > 0) return bestCategory.id
  return categoryDefinitions[hashString(`${node.id}:${node.title}`) % categoryDefinitions.length].id
}

function noteRadius(node: AdminWikiGraphNode) {
  return Math.max(5, Math.min(14, 5 + Math.sqrt(Math.max(node.degree, 1)) * 2))
}

function noteTone(node: NoteLayoutNode) {
  if (node.freshness_status === 'stale') return '#f59e0b'
  if (node.review_status === 'hold') return '#c084fc'
  return node.color
}

function createInitialLayout(notes: AdminWikiGraphNode[], noteEdges: AdminWikiGraphEdge[]): GraphLayout {
  const counts = new Map<CategoryId, number>(categoryDefinitions.map((category) => [category.id, 0]))
  const noteCategory = new Map<number, CategoryId>()

  notes.forEach((note) => {
    const categoryId = classifyNote(note)
    noteCategory.set(note.id, categoryId)
    counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1)
  })

  const categoryNodes: CategoryLayoutNode[] = categoryDefinitions.map((category, index) => {
    const anchor = categoryAnchor(index, categoryDefinitions.length)
    const count = counts.get(category.id) ?? 0
    return {
      kind: 'category',
      graphId: `category-${category.id}`,
      categoryId: category.id,
      label: category.label,
      description: category.description,
      color: category.color,
      count,
      x: anchor.x,
      y: anchor.y,
      vx: 0,
      vy: 0,
      r: 24 + Math.min(14, Math.sqrt(count) * 2.2),
      anchorX: anchor.x,
      anchorY: anchor.y,
    }
  })

  const categoryNodeById = new Map(categoryNodes.map((node) => [node.categoryId, node]))
  const categoryOffsets = new Map<CategoryId, number>(categoryDefinitions.map((category) => [category.id, 0]))

  const noteNodes: NoteLayoutNode[] = notes.map((note) => {
    const categoryId = noteCategory.get(note.id) ?? categoryDefinitions[0].id
    const category = categoryById(categoryId)
    const categoryNode = categoryNodeById.get(categoryId) ?? categoryNodes[0]
    const localIndex = categoryOffsets.get(categoryId) ?? 0
    categoryOffsets.set(categoryId, localIndex + 1)

    const seed = hashString(`${categoryId}:${note.id}:${note.title}`)
    const angle = ((seed % 1000) / 1000) * Math.PI * 2 + localIndex * 0.37
    const radius = 62 + ((seed >>> 8) % 90)

    return {
      ...note,
      kind: 'note',
      graphId: `note-${note.id}`,
      noteId: note.id,
      categoryId,
      color: category.color,
      x: categoryNode.x + Math.cos(angle) * radius,
      y: categoryNode.y + Math.sin(angle) * radius * 0.78,
      vx: 0,
      vy: 0,
      r: noteRadius(note),
    }
  })

  const categoryLinks: LayoutLink[] = noteNodes.map((node) => ({
    id: `category-link-${node.categoryId}-${node.noteId}`,
    source: `category-${node.categoryId}`,
    target: node.graphId,
    kind: 'category',
    relation_type: 'category',
    weight: 42,
  }))

  const graphNoteIds = new Set(noteNodes.map((node) => node.id))
  const graphNoteEdges: LayoutLink[] = noteEdges
    .filter((edge) => graphNoteIds.has(edge.source) && graphNoteIds.has(edge.target))
    .map((edge) => ({
      id: `note-link-${edge.id}`,
      source: `note-${edge.source}`,
      target: `note-${edge.target}`,
      kind: 'note',
      relation_type: edge.relation_type,
      weight: edge.weight,
      confidence: edge.confidence,
    }))

  return {
    nodes: [...categoryNodes, ...noteNodes],
    links: [...categoryLinks, ...graphNoteEdges],
    categoryCounts: counts,
  }
}

function snapshot(nodes: LayoutNode[]) {
  return nodes.map((node) => ({ ...node }))
}

function bounded(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function stepSimulation(nodes: LayoutNode[], links: LayoutLink[], time: number) {
  const nodeById = new Map(nodes.map((node) => [node.graphId, node]))
  const categoryNodeById = new Map(
    nodes.filter((node): node is CategoryLayoutNode => node.kind === 'category').map((node) => [node.categoryId, node]),
  )

  nodes.forEach((node) => {
    if (node.kind === 'category') {
      node.vx += (node.anchorX - node.x) * 0.016 + Math.cos(time / 1700 + hashString(node.graphId)) * 0.012
      node.vy += (node.anchorY - node.y) * 0.016 + Math.sin(time / 1600 + hashString(node.graphId)) * 0.012
      return
    }

    const category = categoryNodeById.get(node.categoryId)
    if (category) {
      node.vx += (category.x - node.x) * 0.001
      node.vy += (category.y - node.y) * 0.001
    }
    node.vx += (VIEW_CENTER_X - node.x) * 0.00015
    node.vy += (VIEW_CENTER_Y - node.y) * 0.00015
  })

  links.forEach((link) => {
    const source = nodeById.get(link.source)
    const target = nodeById.get(link.target)
    if (!source || !target) return

    const dx = target.x - source.x
    const dy = target.y - source.y
    const distance = Math.max(1, Math.hypot(dx, dy))
    const desired = link.kind === 'category' ? 96 : Math.max(92, 150 - Math.min(45, link.weight / 2))
    const stiffness = link.kind === 'category' ? 0.01 : 0.007
    const force = (distance - desired) * stiffness
    const fx = (dx / distance) * force
    const fy = (dy / distance) * force
    const sourceMass = source.kind === 'category' ? 4.5 : 1
    const targetMass = target.kind === 'category' ? 4.5 : 1

    source.vx += fx / sourceMass
    source.vy += fy / sourceMass
    target.vx -= fx / targetMass
    target.vy -= fy / targetMass
  })

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i]
      const b = nodes[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const distanceSq = Math.max(25, dx * dx + dy * dy)
      const distance = Math.sqrt(distanceSq)
      const hasCategory = a.kind === 'category' || b.kind === 'category'
      const strength = hasCategory ? 760 : 62
      const repel = strength / distanceSq
      const ax = (dx / distance) * repel
      const ay = (dy / distance) * repel
      const aMass = a.kind === 'category' ? 4 : 1
      const bMass = b.kind === 'category' ? 4 : 1

      a.vx -= ax / aMass
      a.vy -= ay / aMass
      b.vx += ax / bMass
      b.vy += ay / bMass

      const minDistance = a.r + b.r + (hasCategory ? 26 : 8)
      if (distance < minDistance) {
        const correction = (minDistance - distance) * 0.022
        a.vx -= (dx / distance) * correction
        a.vy -= (dy / distance) * correction
        b.vx += (dx / distance) * correction
        b.vy += (dy / distance) * correction
      }
    }
  }

  nodes.forEach((node) => {
    const damping = node.kind === 'category' ? 0.76 : 0.86
    node.vx *= damping
    node.vy *= damping
    node.x = bounded(node.x + node.vx, node.r + 18, VIEW_WIDTH - node.r - 18)
    node.y = bounded(node.y + node.vy, node.r + 18, VIEW_HEIGHT - node.r - 18)
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
  const [motionNodes, setMotionNodes] = useState<LayoutNode[]>([])

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

  const visibleApiEdges = useMemo(() => {
    if (!graph) return []
    const visibleIds = new Set(visibleNodes.map((node) => node.id))
    return graph.edges.filter((edge) => {
      const matchesRelation = relationFilter === 'all' || edge.relation_type === relationFilter
      return matchesRelation && visibleIds.has(edge.source) && visibleIds.has(edge.target)
    })
  }, [graph, relationFilter, visibleNodes])

  const layout = useMemo(() => createInitialLayout(visibleNodes, visibleApiEdges), [visibleNodes, visibleApiEdges])

  useEffect(() => {
    let frameId = 0
    let cancelled = false
    const nodes = snapshot(layout.nodes)
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const tick = (time: number) => {
      if (cancelled) return
      if (!reduceMotion) stepSimulation(nodes, layout.links, time)
      setMotionNodes(snapshot(nodes))
      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)
    return () => {
      cancelled = true
      window.cancelAnimationFrame(frameId)
    }
  }, [layout])

  const motionNodeById = useMemo(() => new Map(motionNodes.map((node) => [node.graphId, node])), [motionNodes])
  const visibleCategoryLinks = useMemo(() => layout.links.filter((link) => link.kind === 'category'), [layout.links])
  const visibleNoteLinks = useMemo(() => layout.links.filter((link) => link.kind === 'note'), [layout.links])
  const activeCategoryCount = useMemo(() => {
    return categoryDefinitions.filter((category) => (layout.categoryCounts.get(category.id) ?? 0) > 0).length
  }, [layout.categoryCounts])

  const selectedNode = useMemo(() => {
    if (!graph || selectedId == null) return null
    return graph.nodes.find((node) => node.id === selectedId) ?? null
  }, [graph, selectedId])

  const selectedCategory = useMemo(() => {
    if (!selectedNode) return null
    return categoryById(classifyNote(selectedNode))
  }, [selectedNode])

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
            ['Note Links', graph?.stats.edges ?? 0],
            ['Categories', activeCategoryCount],
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
                <span className="text-xs text-muted-foreground">
                  {visibleNodes.length} notes / {visibleCategoryLinks.length} category links / {visibleNoteLinks.length} note links
                </span>
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
                <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="h-full w-full">
                  <defs>
                    <radialGradient id="nodeGlow">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                    <filter id="categoryGlow" x="-70%" y="-70%" width="240%" height="240%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {layout.links.map((link) => {
                    const source = motionNodeById.get(link.source)
                    const target = motionNodeById.get(link.target)
                    if (!source || !target) return null
                    const isCategoryLink = link.kind === 'category'
                    const color = isCategoryLink ? '#334155' : relationColor[link.relation_type] ?? relationColor.related
                    return (
                      <line
                        key={link.id}
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={color}
                        strokeDasharray={isCategoryLink ? '4 7' : undefined}
                        strokeOpacity={isCategoryLink ? 0.44 : selectedId && link.source !== `note-${selectedId}` && link.target !== `note-${selectedId}` ? 0.13 : 0.42}
                        strokeWidth={isCategoryLink ? 1 : Math.max(0.8, Math.min(3.5, (link.weight || 1) / 35))}
                      />
                    )
                  })}

                  {motionNodes.filter((node): node is CategoryLayoutNode => node.kind === 'category').map((node) => (
                    <g key={node.graphId} filter="url(#categoryGlow)">
                      <circle cx={node.x} cy={node.y} r={node.r + 10} fill={node.color} opacity="0.12" />
                      <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} opacity="0.92" stroke="#f8fafc" strokeOpacity="0.72" strokeWidth="1.4" />
                      <text x={node.x} y={node.y + 4} textAnchor="middle" fill="#020617" fontSize="12" fontWeight="700">
                        {node.count}
                      </text>
                      <text x={node.x + node.r + 9} y={node.y - 3} fill="#e2e8f0" fontSize="12" fontWeight="700">
                        {node.label}
                      </text>
                      <text x={node.x + node.r + 9} y={node.y + 14} fill="#94a3b8" fontSize="10">
                        {node.description}
                      </text>
                    </g>
                  ))}

                  {motionNodes.filter((node): node is NoteLayoutNode => node.kind === 'note').map((node) => {
                    const selected = selectedId === node.id
                    return (
                      <g key={node.graphId} onClick={() => setSelectedId(node.id)} className="cursor-pointer">
                        {selected ? <circle cx={node.x} cy={node.y} r={node.r + 12} fill="url(#nodeGlow)" opacity="0.55" /> : null}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={node.r}
                          fill={noteTone(node)}
                          stroke={selected ? '#ffffff' : node.degree === 0 ? '#ef4444' : '#0f172a'}
                          strokeWidth={selected ? 2.5 : node.degree === 0 ? 1.4 : 1}
                          opacity={selectedId && !selected ? 0.76 : 1}
                        />
                        {selected || node.degree >= 8 ? (
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
                    {selectedCategory ? (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar px-2 py-1 text-xs">
                        <span className="size-2 rounded-full" style={{ backgroundColor: selectedCategory.color }} />
                        {selectedCategory.label}
                      </div>
                    ) : null}
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
            <div className="flex items-center gap-2">
              <Layers3 className="size-4 text-emerald-400" />
              <h2 className="text-sm font-semibold">Recommended Categories</h2>
            </div>
            <div className="mt-3 grid gap-2">
              {categoryDefinitions.map((category) => (
                <div key={category.id} className="flex items-center justify-between rounded-md border border-sidebar-border bg-sidebar px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="truncate font-medium">{category.label}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{category.description}</p>
                  </div>
                  <span className="ml-3 text-xs text-muted-foreground">{layout.categoryCounts.get(category.id) ?? 0} notes</span>
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
