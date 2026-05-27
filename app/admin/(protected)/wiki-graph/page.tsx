'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { AlertTriangle, ArrowLeft, GitBranch, Layers3, Minus, Network, Plus, RefreshCw, Search, Sparkles } from 'lucide-react'
import {
  fetchWikiGraph,
  fetchWikiNoteDetail,
  generateWikiGraphLinks,
  runWikiGraphLint,
  type AdminWikiGraph,
  type AdminWikiGraphEdge,
  type AdminWikiGraphNode,
  type AdminWikiNoteDetail,
} from '@/lib/api/admin'

const VIEW_WIDTH = 1500
const VIEW_HEIGHT = 900
const VIEW_CENTER_X = VIEW_WIDTH / 2
const VIEW_CENTER_Y = VIEW_HEIGHT / 2
const MIN_ZOOM = 0.42
const MAX_ZOOM = 3.4
const CATEGORY_CHILD_DISTANCE = 270
const NOTE_MIN_GAP = 34
const CATEGORY_MIN_GAP = 68
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

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
  kind: 'category_child' | 'category_peer' | 'note'
  relation_type: string
  weight: number
  confidence?: number | null
}

type ViewportState = {
  scale: number
  x: number
  y: number
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
    x: VIEW_CENTER_X + Math.cos(angle) * 500,
    y: VIEW_CENTER_Y + Math.sin(angle) * 305,
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

function categoryLabelLines(label: string) {
  if (label.includes('·')) return label.split('·')
  if (label.includes('/')) return label.split('/')
  return [label]
}

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
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
      r: 44 + Math.min(18, Math.sqrt(count) * 2.4),
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
    const ring = Math.floor(localIndex / 14)
    const angle = (localIndex * GOLDEN_ANGLE) + ((seed % 100) / 100) * 0.32
    const radius = categoryNode.r + 105 + ring * 58 + ((seed >>> 8) % 28)

    return {
      ...note,
      kind: 'note',
      graphId: `note-${note.id}`,
      noteId: note.id,
      categoryId,
      color: category.color,
      x: categoryNode.x + Math.cos(angle) * radius,
      y: categoryNode.y + Math.sin(angle) * radius * 0.9,
      vx: 0,
      vy: 0,
      r: noteRadius(note),
    }
  })

  const categoryLinks: LayoutLink[] = noteNodes.map((node) => ({
    id: `category-link-${node.categoryId}-${node.noteId}`,
    source: `category-${node.categoryId}`,
    target: node.graphId,
    kind: 'category_child',
    relation_type: 'category',
    weight: 42,
  }))

  const categoryPeerLinks: LayoutLink[] = []
  for (let sourceIndex = 0; sourceIndex < categoryNodes.length; sourceIndex += 1) {
    for (let targetIndex = sourceIndex + 1; targetIndex < categoryNodes.length; targetIndex += 1) {
      const source = categoryNodes[sourceIndex]
      const target = categoryNodes[targetIndex]
      categoryPeerLinks.push({
        id: `category-peer-${source.categoryId}-${target.categoryId}`,
        source: source.graphId,
        target: target.graphId,
        kind: 'category_peer',
        relation_type: 'category_peer',
        weight: 24,
      })
    }
  }

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
    links: [...categoryPeerLinks, ...categoryLinks, ...graphNoteEdges],
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
      const dx = node.x - category.x
      const dy = node.y - category.y
      const distance = Math.max(1, Math.hypot(dx, dy))
      const desired = category.r + CATEGORY_CHILD_DISTANCE
      const radialForce = (distance - desired) * 0.0018
      node.vx -= (dx / distance) * radialForce
      node.vy -= (dy / distance) * radialForce
      node.vx += (category.x - node.x) * 0.00034
      node.vy += (category.y - node.y) * 0.00034
    }
    node.vx += (VIEW_CENTER_X - node.x) * 0.00004
    node.vy += (VIEW_CENTER_Y - node.y) * 0.00004
  })

  links.forEach((link) => {
    const source = nodeById.get(link.source)
    const target = nodeById.get(link.target)
    if (!source || !target) return

    const dx = target.x - source.x
    const dy = target.y - source.y
    const distance = Math.max(1, Math.hypot(dx, dy))
    const sameNoteCategory = source.kind === 'note' && target.kind === 'note' && source.categoryId === target.categoryId
    const desired = link.kind === 'category_child'
      ? (source.kind === 'category' ? source.r : target.r) + CATEGORY_CHILD_DISTANCE
      : link.kind === 'category_peer'
        ? 560
        : sameNoteCategory
          ? Math.max(215, 310 - Math.min(55, (link.weight || 1) * 0.5))
          : 430
    const stiffness = link.kind === 'category_child'
      ? 0.006
      : link.kind === 'category_peer'
        ? 0.0026
        : sameNoteCategory
          ? 0.0009
          : 0.00022
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
      const sameCategory = a.kind === 'note' && b.kind === 'note' && a.categoryId === b.categoryId
      const strength = hasCategory ? 5200 : sameCategory ? 2300 : 1700
      const repel = strength / distanceSq
      const ax = (dx / distance) * repel
      const ay = (dy / distance) * repel
      const aMass = a.kind === 'category' ? 4 : 1
      const bMass = b.kind === 'category' ? 4 : 1

      a.vx -= ax / aMass
      a.vy -= ay / aMass
      b.vx += ax / bMass
      b.vy += ay / bMass

      const minDistance = a.r + b.r + (hasCategory ? CATEGORY_MIN_GAP : NOTE_MIN_GAP)
      if (distance < minDistance) {
        const correction = (minDistance - distance) * 0.16
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
  const [viewport, setViewport] = useState<ViewportState>({ scale: 1, x: 0, y: 0 })
  const [selectedDetail, setSelectedDetail] = useState<{ noteId: number; detail: AdminWikiNoteDetail | null } | null>(null)
  const panRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const graphStageRef = useRef<HTMLDivElement | null>(null)

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
    if (!reduceMotion) {
      for (let index = 0; index < 150; index += 1) {
        stepSimulation(nodes, layout.links, index * 16)
      }
    }

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
  const visibleCategoryChildLinks = useMemo(() => layout.links.filter((link) => link.kind === 'category_child'), [layout.links])
  const visibleCategoryPeerLinks = useMemo(() => layout.links.filter((link) => link.kind === 'category_peer'), [layout.links])
  const visibleNoteLinks = useMemo(() => layout.links.filter((link) => link.kind === 'note'), [layout.links])
  const activeCategoryCount = useMemo(() => {
    return categoryDefinitions.filter((category) => (layout.categoryCounts.get(category.id) ?? 0) > 0).length
  }, [layout.categoryCounts])

  const selectedNode = useMemo(() => {
    if (!graph || selectedId == null) return null
    return graph.nodes.find((node) => node.id === selectedId) ?? null
  }, [graph, selectedId])

  useEffect(() => {
    let cancelled = false
    if (selectedId == null) return () => {
      cancelled = true
    }

    fetchWikiNoteDetail(selectedId)
      .then((detail) => {
        if (!cancelled) setSelectedDetail({ noteId: selectedId, detail })
      })
      .catch(() => {
        if (!cancelled) setSelectedDetail({ noteId: selectedId, detail: null })
      })

    return () => {
      cancelled = true
    }
  }, [selectedId])

  const selectedCategory = useMemo(() => {
    if (!selectedNode) return null
    return categoryById(classifyNote(selectedNode))
  }, [selectedNode])

  const selectedEdges = useMemo(() => {
    if (!graph || selectedId == null) return []
    return graph.edges.filter((edge) => edge.source === selectedId || edge.target === selectedId)
  }, [graph, selectedId])

  const selectedBody = selectedDetail?.noteId === selectedId
    ? selectedDetail.detail?.content || selectedNode?.summary || '요약 없음'
    : selectedNode?.summary || '요약 없음'

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

  const zoomAtFactor = useCallback((point: { x: number; y: number }, factor: number) => {
    setViewport((current) => {
      const scale = clampZoom(current.scale * factor)
      const ratio = scale / current.scale
      return {
        scale,
        x: point.x - (point.x - current.x) * ratio,
        y: point.y - (point.y - current.y) * ratio,
      }
    })
  }, [])

  const zoomFromCenter = useCallback((factor: number) => {
    zoomAtFactor({ x: VIEW_CENTER_X, y: VIEW_CENTER_Y }, factor)
  }, [zoomAtFactor])

  useEffect(() => {
    const stage = graphStageRef.current
    if (!stage) return undefined

    const handleStageWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const rect = stage.getBoundingClientRect()
      const point = {
        x: ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT,
      }
      zoomAtFactor(point, event.deltaY < 0 ? 1.12 : 0.88)
    }

    stage.addEventListener('wheel', handleStageWheel, { passive: false })
    return () => stage.removeEventListener('wheel', handleStageWheel)
  }, [zoomAtFactor])

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    const target = event.target as SVGElement
    if (target.closest('[data-graph-node="true"]')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
    }
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const pan = panRef.current
    if (!pan || pan.pointerId !== event.pointerId) return
    const rect = event.currentTarget.getBoundingClientRect()
    const dx = ((event.clientX - pan.startX) / rect.width) * VIEW_WIDTH
    const dy = ((event.clientY - pan.startY) / rect.height) * VIEW_HEIGHT
    setViewport((current) => ({ ...current, x: pan.originX + dx, y: pan.originY + dy }))
  }

  function handlePointerEnd(event: ReactPointerEvent<SVGSVGElement>) {
    if (panRef.current?.pointerId === event.pointerId) {
      panRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div className="admin-shadcn-surface min-h-screen bg-sidebar pb-10 text-sidebar-foreground">
      <header className="border-b border-sidebar-border bg-sidebar/95">
        <div className="mx-auto flex max-w-[1720px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
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

      <main className="mx-auto max-w-[1720px] space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
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

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_500px]">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent">
            <div className="flex flex-col gap-3 border-b border-sidebar-border p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Network className="size-4 text-emerald-400" />
                <span className="text-sm font-semibold">Graph View</span>
                <span className="text-xs text-muted-foreground">
                  {visibleNodes.length} notes / {visibleCategoryChildLinks.length} child links / {visibleCategoryPeerLinks.length} category links / {visibleNoteLinks.length} note links
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
            <div ref={graphStageRef} className="relative h-[700px] overflow-hidden overscroll-none bg-[#090c11]">
              {isLoading && !graph ? (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">로딩 중...</div>
              ) : (
                <svg
                  viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
                  className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                >
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

                  <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}>
                  {layout.links.map((link) => {
                    const source = motionNodeById.get(link.source)
                    const target = motionNodeById.get(link.target)
                    if (!source || !target) return null
                    const isCategoryChildLink = link.kind === 'category_child'
                    const isCategoryPeerLink = link.kind === 'category_peer'
                    const color = isCategoryChildLink || isCategoryPeerLink ? '#334155' : relationColor[link.relation_type] ?? relationColor.related
                    return (
                      <line
                        key={link.id}
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={color}
                        strokeDasharray={isCategoryChildLink ? '4 7' : undefined}
                        strokeOpacity={isCategoryPeerLink ? 0.18 : isCategoryChildLink ? 0.36 : selectedId && link.source !== `note-${selectedId}` && link.target !== `note-${selectedId}` ? 0.13 : 0.42}
                        strokeWidth={isCategoryPeerLink ? 1.2 : isCategoryChildLink ? 0.9 : Math.max(0.8, Math.min(3.5, (link.weight || 1) / 35))}
                      />
                    )
                  })}

                  {motionNodes.filter((node): node is CategoryLayoutNode => node.kind === 'category').map((node) => (
                    <g key={node.graphId} filter="url(#categoryGlow)">
                      <circle cx={node.x} cy={node.y} r={node.r + 10} fill={node.color} opacity="0.12" />
                      <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} opacity="0.92" stroke="#f8fafc" strokeOpacity="0.72" strokeWidth="1.4" />
                      <text x={node.x} y={node.y - 7} textAnchor="middle" fill="#020617" fontSize="11" fontWeight="800">
                        {categoryLabelLines(node.label).slice(0, 2).map((line, index) => (
                          <tspan key={line} x={node.x} dy={index === 0 ? 0 : 13}>{line}</tspan>
                        ))}
                      </text>
                      <text x={node.x} y={node.y + 29} textAnchor="middle" fill="#020617" fontSize="12" fontWeight="700">
                        {node.count} notes
                      </text>
                    </g>
                  ))}

                  {motionNodes.filter((node): node is NoteLayoutNode => node.kind === 'note').map((node) => {
                    const selected = selectedId === node.id
                    const showLabel = selected || (viewport.scale >= 1.22 && node.degree >= 18)
                    return (
                      <g key={node.graphId} data-graph-node="true" onClick={() => setSelectedId(node.id)} className="cursor-pointer">
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
                        {showLabel ? (
                          <text x={node.x + node.r + 6} y={node.y + 4} fill="#dbeafe" fontSize={selected ? 12 : 10} fontWeight={selected ? 700 : 500} pointerEvents="none">
                            {node.title.slice(0, 18)}
                          </text>
                        ) : null}
                      </g>
                    )
                  })}
                  </g>
                </svg>
              )}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md border border-slate-700/70 bg-slate-950/80 p-1 text-xs text-slate-100 shadow-lg backdrop-blur">
                <button
                  type="button"
                  onClick={() => zoomFromCenter(0.82)}
                  className="grid size-8 place-items-center rounded text-slate-200 hover:bg-slate-800"
                  aria-label="축소"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-12 text-center tabular-nums">{Math.round(viewport.scale * 100)}%</span>
                <button
                  type="button"
                  onClick={() => zoomFromCenter(1.18)}
                  className="grid size-8 place-items-center rounded text-slate-200 hover:bg-slate-800"
                  aria-label="확대"
                >
                  <Plus className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewport({ scale: 1, x: 0, y: 0 })}
                  className="h-8 rounded px-2 text-slate-200 hover:bg-slate-800"
                >
                  Fit
                </button>
              </div>
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
                  <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-md border border-sidebar-border bg-sidebar p-4 text-sm leading-7 text-muted-foreground">
                    {selectedBody}
                  </div>
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
