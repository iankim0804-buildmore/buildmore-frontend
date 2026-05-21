'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Database,
  KeyRound,
  Loader2,
  PlugZap,
  RefreshCw,
  Route,
  Search,
  ServerCog,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface MetricCatalogMetric {
  metric_key: string
  metric_name_ko?: string | null
  unit?: string | null
  collection_frequency?: string | null
  data_source?: string | null
  is_available?: boolean
  priority?: number | null
  status?: string | null
  reason?: string | null
  stored_count?: number | null
  source_status?: string | null
  availability_basis?: string | null
}

interface MetricCatalogCategory {
  category_code: string
  category_name: string
  total: number
  available: number
  rate: number
  metrics: MetricCatalogMetric[]
}

interface MetricCatalogResponse {
  overall?: {
    total: number
    available: number
    rate: number
  }
  categories?: MetricCatalogCategory[]
}

interface SourceCollectorRecipe {
  source_key: string
  source_name?: string | null
  provider?: string | null
  endpoint?: string | null
  metric_key?: string | null
  metric_category?: string | null
  refresh_frequency?: string | null
  collector_state: string
  batch_limit?: string | null
  snapshot_count?: number | null
  delta_count?: number | null
  observation_count?: number | null
  observation_status_counts?: Record<string, number> | null
  latest_observed_at?: string | null
  latest_snapshot_at?: string | null
  latest_delta_at?: string | null
}

interface SourceCollectorCategory {
  category_code: string
  category_key: string
  category_name: string
  status: string
  configured_recipe_count: number
  active_collector_count: number
  snapshot_count: number
  delta_count: number
  frequencies: string[]
  collector_runner: string
  latest_run?: {
    status?: string | null
    started_at?: string | null
    finished_at?: string | null
    raw_rows_upserted?: number | null
    snapshot_jobs_enqueued?: number | null
    snapshot_rows_upserted?: number | null
    delta_jobs_enqueued?: number | null
    error_message?: string | null
  } | null
  recipes: SourceCollectorRecipe[]
}

interface SourceCollectorStatusResponse {
  runner: {
    job_id: string
    schedule: string
    current_behavior: string
    batch_policy: string
    latest_run?: {
      job_id?: string | null
      status?: string | null
      ran_at?: string | null
      items_upserted?: number | null
      message?: string | null
    } | null
  }
  queues?: {
    snapshot_processing_queue?: Record<string, number>
    delta_processing_queue?: Record<string, number>
  }
  summary: {
    category_total: number
    categories_with_recipes: number
    categories_with_active_collectors: number
    recipe_total: number
    snapshot_total: number
    delta_total: number
    bridged_observations?: {
      total: number
      metric_count: number
      latest_bridge_at?: string | null
    }
    signal_cards?: number
    signal_card_wiki_documents?: number
    wiki_notes?: number
  }
  categories: SourceCollectorCategory[]
}

interface CoveragePayload {
  catalog: MetricCatalogResponse | null
  collectors: SourceCollectorStatusResponse
}

interface MetricRow {
  metricKey: string
  metricName: string
  categoryCode: string
  categoryKey: string
  categoryName: string
  unit?: string | null
  frequency?: string | null
  provider?: string | null
  endpoint?: string | null
  dataSource?: string | null
  status: string
  sourceStatus?: string | null
  reason?: string | null
  requiredKeys: string[]
  storedCount: number
  observationCount: number
  snapshotCount: number
  deltaCount: number
  latestObservedAt?: string | null
  latestSnapshotAt?: string | null
  latestDeltaAt?: string | null
  batchLimit?: string | null
}

const CATEGORY_NAMES: Record<string, string> = {
  collateral_value: '담보가치',
  rental_profitability: '임대수익성',
  commercial_vitality: '상권활력',
  finance_rate: '금융/금리',
  demographics: '인구/수요',
  development_legal: '개발/법규',
  market_price: '시세/가격',
  transport_access: '교통접근성',
  cost_construction: '공사비/원가',
  business_feasibility: '사업성',
  macro_market: '거시시장',
  environment_esg: '환경/ESG',
}

const REQUIRED_KEY_RULES: Array<{ key: string; tests: string[] }> = [
  { key: 'DATA_GO_KR_API_KEY', tests: ['국토부', '공공데이터', '건축hub', '건축물대장', '공시지가', 'data.go', 'apis.data.go.kr', '소상공인시장진흥공단'] },
  { key: 'SEOUL_OPENAPI_KEY', tests: ['서울', 'seoul', 'openapi.seoul.go.kr'] },
  { key: 'VWORLD_API_KEY', tests: ['vworld', '브이월드', '도시계획', '토지이용', '연속지적도'] },
  { key: 'KOSIS_API_KEY', tests: ['kosis', '통계청'] },
  { key: 'ECOS_API_KEY', tests: ['ecos', '한국은행'] },
  { key: 'KAKAO_REST_API_KEY', tests: ['kakao', '카카오', 'dapi.kakao.com', '교통', '주소'] },
  { key: 'OPENAI_API_KEY', tests: ['llm', 'wiki', '요약', 'embedding'] },
]

function formatCount(value: number | null | undefined): string {
  return Number(value || 0).toLocaleString('ko-KR')
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

function frequencyLabel(value?: string | null): string {
  const frequency = (value || '').toLowerCase()
  if (frequency === 'hourly') return '매시간'
  if (frequency === 'daily') return '매일'
  if (frequency === 'weekly') return '매주'
  if (frequency === 'monthly') return '매월'
  if (frequency === 'quarterly') return '분기'
  if (frequency === 'annual' || frequency === 'yearly') return '매년'
  if (frequency === 'static' || frequency === 'event/static') return '고정/이벤트'
  return value || '-'
}

function statusMeta(status: string, isAvailable?: boolean) {
  if (status === 'active' || status === 'observed' || isAvailable) {
    return { label: '연결됨', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', icon: CheckCircle2 }
  }
  if (status === 'api_key_required') {
    return { label: 'KEY 필요', className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300', icon: KeyRound }
  }
  if (status === 'api_dead' || status === 'failed') {
    return { label: '오류', className: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300', icon: AlertCircle }
  }
  if (status === 'manual_required') {
    return { label: '수동 매핑', className: 'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300', icon: PlugZap }
  }
  return { label: '대기', className: 'border-muted-foreground/30 bg-muted text-muted-foreground', icon: Clock3 }
}

function categoryLabel(category: SourceCollectorCategory | MetricCatalogCategory): string {
  if ('category_key' in category) return CATEGORY_NAMES[category.category_key] || category.category_name
  return category.category_name
}

function inferRequiredKeys(metric: Partial<MetricRow> | MetricCatalogMetric | SourceCollectorRecipe): string[] {
  const text = [
    'dataSource' in metric ? metric.dataSource : undefined,
    'data_source' in metric ? metric.data_source : undefined,
    'provider' in metric ? metric.provider : undefined,
    'endpoint' in metric ? metric.endpoint : undefined,
    'reason' in metric ? metric.reason : undefined,
    'metric_key' in metric ? metric.metric_key : undefined,
    'metricKey' in metric ? metric.metricKey : undefined,
  ].filter(Boolean).join(' ').toLowerCase()

  const keys = REQUIRED_KEY_RULES
    .filter((rule) => rule.tests.some((test) => text.includes(test.toLowerCase())))
    .map((rule) => rule.key)

  if ('reason' in metric && typeof metric.reason === 'string') {
    const explicit = metric.reason.match(/[A-Z0-9_]+_API_KEY|[A-Z0-9_]+_SERVICE_KEY/g) || []
    keys.push(...explicit)
  }

  return Array.from(new Set(keys))
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${url} HTTP ${res.status}${body ? `: ${body.slice(0, 160)}` : ''}`)
  }
  return await res.json() as T
}

async function fetchCoveragePayload(): Promise<CoveragePayload> {
  const [catalogResult, collectors] = await Promise.allSettled([
    fetchJson<MetricCatalogResponse>('/api/admin/metric-catalog'),
    fetchJson<SourceCollectorStatusResponse>('/api/admin/source-collector-status'),
  ])

  if (collectors.status === 'rejected') throw collectors.reason

  return {
    catalog: catalogResult.status === 'fulfilled' ? catalogResult.value : null,
    collectors: collectors.value,
  }
}

function buildMetricRows(payload: CoveragePayload | null): MetricRow[] {
  if (!payload) return []

  const collectorByCode = new Map(payload.collectors.categories.map((category) => [category.category_code, category]))
  const recipeByMetric = new Map<string, SourceCollectorRecipe>()
  for (const category of payload.collectors.categories) {
    for (const recipe of category.recipes || []) {
      if (recipe.metric_key) recipeByMetric.set(recipe.metric_key, recipe)
    }
  }

  const rows: MetricRow[] = []

  for (const catalogCategory of payload.catalog?.categories || []) {
    const collectorCategory = collectorByCode.get(catalogCategory.category_code)
    for (const metric of catalogCategory.metrics || []) {
      const recipe = recipeByMetric.get(metric.metric_key)
      const status = metric.status || recipe?.collector_state || (metric.is_available ? 'active' : 'catalog_registered')
      const row: MetricRow = {
        metricKey: metric.metric_key,
        metricName: metric.metric_name_ko || recipe?.source_name || metric.metric_key,
        categoryCode: catalogCategory.category_code,
        categoryKey: collectorCategory?.category_key || catalogCategory.category_code,
        categoryName: collectorCategory ? categoryLabel(collectorCategory) : catalogCategory.category_name,
        unit: metric.unit,
        frequency: metric.collection_frequency || recipe?.refresh_frequency,
        provider: recipe?.provider || metric.data_source,
        endpoint: recipe?.endpoint,
        dataSource: metric.data_source,
        status,
        sourceStatus: metric.source_status,
        reason: metric.reason,
        requiredKeys: inferRequiredKeys(metric),
        storedCount: metric.stored_count || 0,
        observationCount: recipe?.observation_count || 0,
        snapshotCount: recipe?.snapshot_count || metric.stored_count || 0,
        deltaCount: recipe?.delta_count || 0,
        latestObservedAt: recipe?.latest_observed_at,
        latestSnapshotAt: recipe?.latest_snapshot_at,
        latestDeltaAt: recipe?.latest_delta_at,
        batchLimit: recipe?.batch_limit,
      }
      if (row.requiredKeys.length === 0) row.requiredKeys = inferRequiredKeys(row)
      rows.push(row)
    }
  }

  for (const collectorCategory of payload.collectors.categories) {
    for (const recipe of collectorCategory.recipes || []) {
      if (!recipe.metric_key || rows.some((row) => row.metricKey === recipe.metric_key)) continue
      rows.push({
        metricKey: recipe.metric_key,
        metricName: recipe.source_name || recipe.metric_key,
        categoryCode: collectorCategory.category_code,
        categoryKey: collectorCategory.category_key,
        categoryName: categoryLabel(collectorCategory),
        frequency: recipe.refresh_frequency,
        provider: recipe.provider,
        endpoint: recipe.endpoint,
        dataSource: recipe.provider,
        status: recipe.collector_state || 'catalog_registered',
        requiredKeys: inferRequiredKeys(recipe),
        storedCount: recipe.snapshot_count || 0,
        observationCount: recipe.observation_count || 0,
        snapshotCount: recipe.snapshot_count || 0,
        deltaCount: recipe.delta_count || 0,
        latestObservedAt: recipe.latest_observed_at,
        latestSnapshotAt: recipe.latest_snapshot_at,
        latestDeltaAt: recipe.latest_delta_at,
        batchLimit: recipe.batch_limit,
      })
    }
  }

  return rows.sort((a, b) => a.categoryCode.localeCompare(b.categoryCode) || a.metricKey.localeCompare(b.metricKey))
}

function queueLine(queue?: Record<string, number>): string {
  return `대기 ${formatCount(queue?.queued)} / 처리중 ${formatCount(queue?.processing)} / 완료 ${formatCount(queue?.processed || queue?.done)} / 실패 ${formatCount(queue?.failed)}`
}

export function DataCoverageSection() {
  const [payload, setPayload] = useState<CoveragePayload | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMetric, setSelectedMetric] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setError(null)
    try {
      const nextPayload = await fetchCoveragePayload()
      setPayload(nextPayload)
    } catch (err) {
      setError(err instanceof Error ? err.message : '원천데이터 연결 현황을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(loadData, 0)
    return () => clearTimeout(timer)
  }, [loadData])

  const categories = useMemo(() => payload?.collectors.categories || [], [payload])
  const metricRows = useMemo(() => buildMetricRows(payload), [payload])

  const visibleMetrics = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return metricRows.filter((metric) => {
      const categoryMatched = selectedCategory === 'all' || metric.categoryCode === selectedCategory
      const metricMatched = selectedMetric === 'all' || metric.metricKey === selectedMetric
      const queryMatched = !keyword || [
        metric.metricKey,
        metric.metricName,
        metric.provider,
        metric.dataSource,
        metric.reason,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
      return categoryMatched && metricMatched && queryMatched
    })
  }, [metricRows, query, selectedCategory, selectedMetric])

  const selectedCategoryObject = categories.find((category) => category.category_code === selectedCategory)
  const selectedMetricsForDropdown = metricRows.filter((metric) => selectedCategory === 'all' || metric.categoryCode === selectedCategory)
  const activeCount = metricRows.filter((metric) => metric.status === 'active' || metric.status === 'observed' || metric.snapshotCount > 0).length
  const keyRequiredCount = metricRows.filter((metric) => metric.status === 'api_key_required' || metric.requiredKeys.length > 0 && metric.snapshotCount === 0).length

  const runCollectors = useCallback(async () => {
    setIsRunning(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/source-collectors/run?mode=daily', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : `HTTP ${res.status}`)
      setMessage('12개 카테고리 수집 작업을 요청했습니다. 잠시 후 상태를 새로고침하세요.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '수집 작업 실행에 실패했습니다.')
    } finally {
      setIsRunning(false)
    }
  }, [loadData])

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">원천데이터 세부지표</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            12개 카테고리별 지표 연결상태, 필요 API KEY, 제공처, 스냅샷/델타 적재 현황을 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
            새로고침
          </Button>
          <Button size="sm" onClick={runCollectors} disabled={isRunning}>
            {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Route className="mr-2 h-4 w-4" />}
            수집 실행
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">카테고리</div>
            <div className="mt-2 text-2xl font-semibold">{formatCount(payload?.collectors.summary.category_total || 12)}</div>
            <div className="mt-1 text-xs text-muted-foreground">활성 {formatCount(payload?.collectors.summary.categories_with_active_collectors)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">세부지표</div>
            <div className="mt-2 text-2xl font-semibold">{formatCount(metricRows.length)}</div>
            <div className="mt-1 text-xs text-muted-foreground">연결 {formatCount(activeCount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">스냅샷</div>
            <div className="mt-2 text-2xl font-semibold">{formatCount(payload?.collectors.summary.snapshot_total)}</div>
            <div className="mt-1 text-xs text-muted-foreground">{queueLine(payload?.collectors.queues?.snapshot_processing_queue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">KEY 확인 필요</div>
            <div className="mt-2 text-2xl font-semibold">{formatCount(keyRequiredCount)}</div>
            <div className="mt-1 text-xs text-muted-foreground">API/소스 매핑 대기</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>카테고리별 연결 현황</CardTitle>
              <CardDescription>드롭다운으로 카테고리와 세부지표를 선택하면 연결 정보가 아래 표에 반영됩니다.</CardDescription>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[680px]">
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value)
                  setSelectedMetric('all')
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 카테고리</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.category_code} value={category.category_code}>
                      {category.category_code}. {categoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="세부지표 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 세부지표</SelectItem>
                  {selectedMetricsForDropdown.map((metric) => (
                    <SelectItem key={metric.metricKey} value={metric.metricKey}>
                      {metric.metricName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="지표/제공처 검색"
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="metrics" className="w-full">
            <TabsList>
              <TabsTrigger value="metrics">세부지표</TabsTrigger>
              <TabsTrigger value="flow">처리 흐름</TabsTrigger>
              <TabsTrigger value="categories">12개 카테고리</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="mt-4">
              {selectedCategoryObject && (
                <div className="mb-3 rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{selectedCategoryObject.category_code}</Badge>
                    <span className="font-medium">{categoryLabel(selectedCategoryObject)}</span>
                    <span className="text-muted-foreground">지표 {formatCount(selectedCategoryObject.configured_recipe_count)}개</span>
                    <span className="text-muted-foreground">스냅샷 {formatCount(selectedCategoryObject.snapshot_count)}</span>
                    <span className="text-muted-foreground">델타 {formatCount(selectedCategoryObject.delta_count)}</span>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[1120px] text-left text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">세부지표</th>
                      <th className="px-3 py-2 font-medium">상태</th>
                      <th className="px-3 py-2 font-medium">필요 KEY</th>
                      <th className="px-3 py-2 font-medium">데이터 제공처</th>
                      <th className="px-3 py-2 font-medium">주기</th>
                      <th className="px-3 py-2 text-right font-medium">관측</th>
                      <th className="px-3 py-2 text-right font-medium">스냅샷</th>
                      <th className="px-3 py-2 text-right font-medium">델타</th>
                      <th className="px-3 py-2 font-medium">최근 적재</th>
                      <th className="px-3 py-2 font-medium">메모</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading && !payload ? (
                      <tr>
                        <td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">
                          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                          연결 현황을 불러오는 중입니다.
                        </td>
                      </tr>
                    ) : visibleMetrics.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">
                          조건에 맞는 세부지표가 없습니다.
                        </td>
                      </tr>
                    ) : visibleMetrics.map((metric) => {
                      const meta = statusMeta(metric.status, metric.snapshotCount > 0)
                      const Icon = meta.icon
                      return (
                        <tr key={`${metric.categoryCode}:${metric.metricKey}`} className="align-top">
                          <td className="px-3 py-3">
                            <div className="font-medium">{metric.metricName}</div>
                            <div className="mt-1 font-mono text-xs text-muted-foreground">{metric.metricKey}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{metric.categoryName}</div>
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant="outline" className={meta.className}>
                              <Icon className="h-3 w-3" />
                              {meta.label}
                            </Badge>
                            {metric.sourceStatus && <div className="mt-1 text-xs text-muted-foreground">{metric.sourceStatus}</div>}
                          </td>
                          <td className="px-3 py-3">
                            {metric.requiredKeys.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {metric.requiredKeys.map((key) => (
                                  <Badge key={key} variant="secondary" className="font-mono">
                                    {key}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div>{metric.provider || metric.dataSource || '-'}</div>
                            {metric.endpoint && <div className="mt-1 max-w-[260px] truncate font-mono text-xs text-muted-foreground">{metric.endpoint}</div>}
                          </td>
                          <td className="px-3 py-3">{frequencyLabel(metric.frequency)}</td>
                          <td className="px-3 py-3 text-right">{formatCount(metric.observationCount)}</td>
                          <td className="px-3 py-3 text-right">{formatCount(metric.snapshotCount)}</td>
                          <td className="px-3 py-3 text-right">{formatCount(metric.deltaCount)}</td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">
                            <div>관측 {formatDateTime(metric.latestObservedAt)}</div>
                            <div>스냅샷 {formatDateTime(metric.latestSnapshotAt)}</div>
                            <div>델타 {formatDateTime(metric.latestDeltaAt)}</div>
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">
                            <div className="max-w-[280px]">{metric.reason || metric.batchLimit || '-'}</div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="flow" className="mt-4">
              <div className="grid gap-3 lg:grid-cols-4">
                {[
                  { icon: ServerCog, title: 'Metric Catalog', body: 'wiki_metric_catalog에서 12개 카테고리와 세부지표 정의를 읽습니다.' },
                  { icon: Route, title: 'Collectors', body: '카테고리별 수집기가 API/테이블에서 원천 관측값을 수집합니다.' },
                  { icon: Database, title: 'Snapshots', body: 'source_metric_observations를 metric_snapshots로 정규화합니다.' },
                  { icon: PlugZap, title: 'Delta/Wiki', body: 'metric_observations, rank, signal_cards, Wiki 문서로 연결합니다.' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="rounded-md border bg-muted/20 p-4">
                      <Icon className="h-5 w-5 text-primary" />
                      <div className="mt-3 font-medium">{item.title}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">현재 큐</div>
                <div className="mt-1">Snapshot: {queueLine(payload?.collectors.queues?.snapshot_processing_queue)}</div>
                <div>Delta: {queueLine(payload?.collectors.queues?.delta_processing_queue)}</div>
                <div className="mt-2">Batch policy: {payload?.collectors.runner.batch_policy || '-'}</div>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="mt-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => {
                  const meta = statusMeta(category.status)
                  return (
                    <div key={category.category_code} className="rounded-md border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium">{category.category_code}. {categoryLabel(category)}</div>
                          <div className="mt-1 font-mono text-xs text-muted-foreground">{category.category_key}</div>
                        </div>
                        <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
                        <div><div className="text-muted-foreground">지표</div><div className="font-semibold">{formatCount(category.configured_recipe_count)}</div></div>
                        <div><div className="text-muted-foreground">활성</div><div className="font-semibold">{formatCount(category.active_collector_count)}</div></div>
                        <div><div className="text-muted-foreground">스냅샷</div><div className="font-semibold">{formatCount(category.snapshot_count)}</div></div>
                        <div><div className="text-muted-foreground">델타</div><div className="font-semibold">{formatCount(category.delta_count)}</div></div>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        최근 실행 {formatDateTime(category.latest_run?.finished_at || category.latest_run?.started_at)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  )
}
