'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  FileSearch,
  Layers3,
  Loader2,
  RefreshCw,
  Route,
  ServerCog,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MetricCatalogResponse {
  overall?: {
    total: number
    available: number
    rate: number
  }
}

interface SourceFieldDiscovery {
  id: number
  source_key: string
  source_name?: string | null
  provider?: string | null
  field_name: string
  field_path: string
  suggested_metric_key?: string | null
  suggested_metric_name_ko?: string | null
  suggested_category_name?: string | null
  confidence?: number | null
  status: string
}

interface SourceFieldDiscoveryResponse {
  table_ready: boolean
  summary: {
    total: number
    discovered: number
    reviewing: number
    promoted: number
    ignored: number
  }
  items: SourceFieldDiscovery[]
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
    delta_rows_created?: number | null
    signal_events_created?: number | null
    message?: string | null
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
      job_name?: string | null
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
  }
  categories: SourceCollectorCategory[]
}

interface CoveragePayload {
  catalog: MetricCatalogResponse | null
  discoveries: SourceFieldDiscoveryResponse | null
  collectors: SourceCollectorStatusResponse
}

const CATEGORY_LABELS: Record<string, string> = {
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

const SOURCE_STEPS = [
  {
    label: 'Metric Catalog',
    detail: 'wiki_metric_catalog',
    description: '관리 대상 지표와 API 바인딩을 읽습니다.',
    icon: FileSearch,
  },
  {
    label: '12 Category Collectors',
    detail: 'category runner',
    description: '카테고리별 due 지표만 골라 API를 순회합니다.',
    icon: Route,
  },
  {
    label: 'Raw Observations',
    detail: 'source_metric_observations',
    description: '수집한 원천 관측값을 중복 없이 저장합니다.',
    icon: Database,
  },
  {
    label: 'Snapshot Queue',
    detail: 'snapshot_processing_queue',
    description: '원천값을 기간별 스냅샷 작업으로 넘깁니다.',
    icon: Layers3,
  },
  {
    label: 'Delta Queue',
    detail: 'delta_processing_queue',
    description: '스냅샷 비교와 변화율 계산 작업을 예약합니다.',
    icon: ServerCog,
  },
  {
    label: 'Signal Candidates',
    detail: 'wiki_insight_events',
    description: '투자 시그널 후보와 Wiki 업데이트 흐름으로 연결합니다.',
    icon: Sparkles,
  },
] as const

function formatCount(value: number | null | undefined): string {
  return Number(value || 0).toLocaleString('ko-KR')
}

function formatDateTimeKst(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return `${date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  })} KST`
}

function frequencyLabel(frequency: string): string {
  if (frequency === 'hourly') return '매시간'
  if (frequency === 'daily') return '매일'
  if (frequency === 'weekly') return '매주'
  if (frequency === 'monthly') return '매월'
  if (frequency === 'quarterly') return '분기'
  if (frequency === 'annual' || frequency === 'yearly') return '매년'
  if (frequency === 'static' || frequency === 'event/static') return '고정값'
  return frequency || '-'
}

function categoryName(category: SourceCollectorCategory): string {
  return CATEGORY_LABELS[category.category_key] || category.category_name
}

function statusLabel(status: string): string {
  if (status === 'active') return '실행 중'
  if (status === 'partially_active') return '일부 실행'
  if (status === 'catalog_only') return '카탈로그 대기'
  if (status === 'not_configured') return '미구현'
  if (status === 'failed') return '실패'
  return status
}

function statusClass(status: string): string {
  if (status === 'active') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  if (status === 'partially_active') return 'border-sky-500/30 bg-sky-500/10 text-sky-300'
  if (status === 'failed') return 'border-red-500/30 bg-red-500/10 text-red-300'
  if (status === 'catalog_only') return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
  return 'border-muted-foreground/30 bg-sidebar text-muted-foreground'
}

function runStatusLabel(status?: string | null): string {
  if (!status) return '-'
  if (status === 'success' || status === 'ok') return '성공'
  if (status === 'partial') return '일부 성공'
  if (status === 'not_due') return '대상 없음'
  if (status === 'failed' || status === 'error') return '실패'
  if (status === 'running') return '실행 중'
  return status
}

function latestActivity(category: SourceCollectorCategory): string {
  const candidates = [
    category.latest_run?.finished_at,
    category.latest_run?.started_at,
    ...category.recipes.flatMap((recipe) => [
      recipe.latest_observed_at,
      recipe.latest_snapshot_at,
      recipe.latest_delta_at,
    ]),
  ].filter((value): value is string => Boolean(value))

  if (candidates.length === 0) return '-'

  const latest = candidates.reduce((current, next) => {
    const currentTime = new Date(current).getTime()
    const nextTime = new Date(next).getTime()
    if (Number.isNaN(nextTime)) return current
    if (Number.isNaN(currentTime)) return next
    return nextTime > currentTime ? next : current
  })

  return formatDateTimeKst(latest)
}

function queueText(queue?: Record<string, number>): string {
  const queued = queue?.queued || 0
  const processing = queue?.processing || 0
  const processed = queue?.processed || queue?.done || 0
  const failed = queue?.failed || 0
  return `대기 ${formatCount(queued)} / 처리중 ${formatCount(processing)} / 완료 ${formatCount(processed)} / 실패 ${formatCount(failed)}`
}

function countObservations(category: SourceCollectorCategory): number {
  return category.recipes.reduce((sum, recipe) => sum + (recipe.observation_count || 0), 0)
}

function representativeMetrics(category: SourceCollectorCategory): string {
  return category.recipes
    .filter((recipe) => (recipe.observation_count || recipe.snapshot_count || recipe.delta_count || 0) > 0)
    .slice(0, 3)
    .map((recipe) => recipe.metric_key || recipe.source_key)
    .filter(Boolean)
    .join(', ') || '-'
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
  const [catalogResult, discoveriesResult, collectors] = await Promise.allSettled([
    fetchJson<MetricCatalogResponse>('/api/admin/metric-catalog'),
    fetchJson<SourceFieldDiscoveryResponse>('/api/admin/source-field-discoveries?limit=12'),
    fetchJson<SourceCollectorStatusResponse>('/api/admin/source-collector-status'),
  ])

  if (collectors.status === 'rejected') throw collectors.reason

  return {
    catalog: catalogResult.status === 'fulfilled' ? catalogResult.value : null,
    discoveries: discoveriesResult.status === 'fulfilled' ? discoveriesResult.value : null,
    collectors: collectors.value,
  }
}

function CategoryGrid({ categories }: { categories: SourceCollectorCategory[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => {
        const observations = countObservations(category)
        const latestRunStatus = category.latest_run?.status || category.status

        return (
          <div key={category.category_key} className="rounded-md border border-sidebar-border bg-background/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-sidebar-foreground">{categoryName(category)}</div>
                <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{category.category_key}</div>
              </div>
              <Badge variant="outline" className={statusClass(category.status)}>
                {statusLabel(category.status)}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">지표</div>
                <div className="mt-1 font-semibold text-sidebar-foreground">{formatCount(category.configured_recipe_count)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">관측값</div>
                <div className="mt-1 font-semibold text-sidebar-foreground">{formatCount(observations)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">스냅샷</div>
                <div className="mt-1 font-semibold text-sidebar-foreground">{formatCount(category.snapshot_count)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">변화량</div>
                <div className="mt-1 font-semibold text-sidebar-foreground">{formatCount(category.delta_count)}</div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5" />
                <span>최근 동작 {latestActivity(category)}</span>
              </div>
              <div>주기 {category.frequencies.map(frequencyLabel).join(', ') || '-'}</div>
              <div>마지막 결과 {runStatusLabel(latestRunStatus)}</div>
              <div className="truncate">대표 지표 {representativeMetrics(category)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DiscoveryPanel({ discoveries }: { discoveries: SourceFieldDiscoveryResponse | null }) {
  const items = discoveries?.items || []

  return (
    <Card className="border-sidebar-border bg-sidebar-accent">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-sidebar-foreground">신규 필드 승격 후보</CardTitle>
      </CardHeader>
      <CardContent>
        {!discoveries ? (
          <div className="rounded-md border border-sidebar-border p-4 text-xs text-muted-foreground">
            필드 발견 테이블 상태를 불러오지 못했습니다.
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-md border border-sidebar-border p-4 text-xs text-muted-foreground">
            현재 검토할 신규 필드 후보가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-md border border-sidebar-border bg-background/20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sidebar-foreground">{item.suggested_metric_name_ko || item.field_name}</div>
                    <div className="mt-1 font-mono text-[11px] text-muted-foreground">{item.suggested_metric_key || item.field_path}</div>
                  </div>
                  <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-300">
                    {item.status}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span>{item.source_key}</span>
                  <span>{item.suggested_category_name || '-'}</span>
                  <span>{typeof item.confidence === 'number' ? `${Math.round(item.confidence * 100)}%` : '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DataCoverageSection() {
  const [payload, setPayload] = useState<CoveragePayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setError(null)
    try {
      const nextPayload = await fetchCoveragePayload()
      setPayload(nextPayload)
    } catch (err) {
      setError(err instanceof Error ? err.message : '원천 데이터 현황을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchCoveragePayload()
      .then((nextPayload) => {
        if (!cancelled) setPayload(nextPayload)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '원천 데이터 현황을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleRunCollectors = useCallback(async () => {
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

      const categories = typeof data === 'object' && data !== null && 'categories' in data
        ? Object.values((data as { categories?: Record<string, { status?: string }> }).categories || {})
        : []
      const failed = categories.filter((category) => category.status === 'failed').length
      setMessage(`12개 카테고리 순회 요청 완료${failed ? `, 실패 ${failed}개 확인 필요` : ''}.`)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '컬렉터 순회 실행에 실패했습니다.')
    } finally {
      setIsRunning(false)
    }
  }, [loadData])

  const collectors = payload?.collectors
  const snapshotQueue = collectors?.queues?.snapshot_processing_queue
  const deltaQueue = collectors?.queues?.delta_processing_queue
  const activeRate = collectors
    ? Math.round((collectors.summary.categories_with_active_collectors / Math.max(collectors.summary.category_total, 1)) * 100)
    : 0

  const sortedCategories = useMemo(() => {
    return [...(collectors?.categories || [])].sort((a, b) => a.category_code.localeCompare(b.category_code))
  }, [collectors])

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-sidebar-foreground">원천데이터 수집과 가공 현황</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            12개 카테고리 컬렉터가 metric catalog를 읽고, 원천 관측값을 스냅샷과 변화율 계산 대기열로 넘기는 현재 흐름입니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="h-8 gap-1.5 border-sidebar-border"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button
            size="sm"
            onClick={handleRunCollectors}
            disabled={isRunning}
            className="h-8 gap-1.5"
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Route className="h-3.5 w-3.5" />}
            12개 컬렉터 1회 순회
          </Button>
        </div>
      </div>

      {message && (
        <div className="mb-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          {error}
        </div>
      )}

      <Card className="border-sidebar-border bg-sidebar-accent">
        <CardContent className="p-4">
          {isLoading && !payload ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              원천데이터 상태를 불러오는 중
            </div>
          ) : collectors ? (
            <div className="space-y-4">
              <div className="grid gap-2 md:grid-cols-4">
                <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                  <div className="text-xs text-muted-foreground">관리 카테고리</div>
                  <div className="mt-1 text-2xl font-bold text-sidebar-foreground">
                    {formatCount(collectors.summary.category_total)}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">활성 {formatCount(collectors.summary.categories_with_active_collectors)}개 · {activeRate}%</div>
                </div>
                <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                  <div className="text-xs text-muted-foreground">수집 대상 지표</div>
                  <div className="mt-1 text-2xl font-bold text-sidebar-foreground">
                    {formatCount(collectors.summary.recipe_total)}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">catalog 전체 {formatCount(payload?.catalog?.overall?.total)}</div>
                </div>
                <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                  <div className="text-xs text-muted-foreground">스냅샷 저장</div>
                  <div className="mt-1 text-2xl font-bold text-sidebar-foreground">
                    {formatCount(collectors.summary.snapshot_total)}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{queueText(snapshotQueue)}</div>
                </div>
                <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                  <div className="text-xs text-muted-foreground">변화율 계산</div>
                  <div className="mt-1 text-2xl font-bold text-sidebar-foreground">
                    {formatCount(collectors.summary.delta_total)}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{queueText(deltaQueue)}</div>
                </div>
              </div>

              <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sidebar-foreground">처리 흐름</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      due 지표만 수집하고, 같은 기간 관측값은 중복 없이 저장한 뒤 SKIP LOCKED 워커가 가공 대기열을 나눠 처리합니다.
                    </div>
                  </div>
                  <div className="rounded-full border border-sidebar-border px-2 py-1 text-[11px] text-muted-foreground">
                    최근 실행 {formatDateTimeKst(collectors.runner.latest_run?.ran_at)} · {runStatusLabel(collectors.runner.latest_run?.status)}
                  </div>
                </div>

                <div className="grid gap-2 lg:grid-cols-6">
                  {SOURCE_STEPS.map((step, index) => {
                    const Icon = step.icon
                    return (
                      <div key={step.detail} className="relative">
                        <div className="h-full rounded-md border border-sidebar-border/70 bg-sidebar/30 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-500/10 text-sky-300">
                              <Icon className="h-4 w-4" />
                            </div>
                            {index < 3 ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                            ) : (
                              <Clock3 className="h-4 w-4 text-amber-300" />
                            )}
                          </div>
                          <div className="mt-3 text-[11px] text-muted-foreground">STEP {index + 1}</div>
                          <div className="mt-1 font-semibold text-sidebar-foreground">{step.label}</div>
                          <div className="mt-1 font-mono text-[10px] text-muted-foreground">{step.detail}</div>
                          <p className="mt-3 text-[11px] leading-4 text-muted-foreground">{step.description}</p>
                        </div>
                        {index < SOURCE_STEPS.length - 1 && (
                          <ArrowRight className="absolute -right-4 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground lg:block" />
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-3 rounded-md border border-sidebar-border bg-background/20 p-3 text-[11px] text-muted-foreground">
                  <div className="mb-1 font-semibold text-sidebar-foreground">중복 처리 정책</div>
                  {collectors.runner.batch_policy}
                </div>
              </div>

              <CategoryGrid categories={sortedCategories} />
            </div>
          ) : (
            <div className="rounded-md border border-sidebar-border p-4 text-sm text-muted-foreground">
              원천데이터 상태가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.7fr]">
        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-sidebar-foreground">카테고리별 세부 적재표</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead className="border-b border-sidebar-border text-sidebar-foreground">
                  <tr>
                    <th className="py-2 pr-3 font-semibold">카테고리</th>
                    <th className="py-2 pr-3 font-semibold">상태</th>
                    <th className="py-2 pr-3 font-semibold">수집 주기</th>
                    <th className="py-2 pr-3 text-right font-semibold">지표</th>
                    <th className="py-2 pr-3 text-right font-semibold">관측값</th>
                    <th className="py-2 pr-3 text-right font-semibold">스냅샷</th>
                    <th className="py-2 pr-3 text-right font-semibold">변화량</th>
                    <th className="py-2 pr-3 font-semibold">최근 동작</th>
                    <th className="py-2 pr-3 font-semibold">대표 지표</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sidebar-border">
                  {sortedCategories.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-muted-foreground">카테고리 상태가 없습니다.</td>
                    </tr>
                  ) : sortedCategories.map((category) => (
                    <tr key={category.category_key}>
                      <td className="py-3 pr-3">
                        <div className="font-medium text-sidebar-foreground">{categoryName(category)}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{category.category_key}</div>
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant="outline" className={statusClass(category.status)}>
                          {statusLabel(category.status)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">{category.frequencies.map(frequencyLabel).join(', ') || '-'}</td>
                      <td className="py-3 pr-3 text-right text-sidebar-foreground">{formatCount(category.configured_recipe_count)}</td>
                      <td className="py-3 pr-3 text-right text-sidebar-foreground">{formatCount(countObservations(category))}</td>
                      <td className="py-3 pr-3 text-right text-sidebar-foreground">{formatCount(category.snapshot_count)}</td>
                      <td className="py-3 pr-3 text-right text-sidebar-foreground">{formatCount(category.delta_count)}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{latestActivity(category)}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{representativeMetrics(category)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <DiscoveryPanel discoveries={payload?.discoveries || null} />
      </div>

      {payload?.collectors?.summary.categories_with_active_collectors === 0 ? (
        <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>활성 컬렉터가 아직 감지되지 않았습니다. API 키, metric catalog의 auto_collect 설정, 최근 source_collector_runs 로그를 확인하세요.</span>
          </div>
        </div>
      ) : null}
    </section>
  )
}
