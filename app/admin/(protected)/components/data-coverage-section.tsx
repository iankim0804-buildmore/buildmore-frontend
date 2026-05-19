'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Metric {
  metric_key: string
  metric_name_ko: string
  unit: string
  collection_frequency: string
  data_source: string
  is_available: boolean
  priority: number
  status?: string
  reason?: string | null
  stored_count?: number
  source_status?: string
  availability_basis?: string
}

interface Category {
  category_code: string
  category_name: string
  total: number
  available: number
  rate: number
  metrics: Metric[]
}

interface MetricCatalogResponse {
  overall: {
    total: number
    available: number
    rate: number
  }
  categories: Category[]
}

interface SourceFieldDiscovery {
  id: number
  source_key: string
  source_name?: string | null
  provider?: string | null
  category_code?: string | null
  category_name?: string | null
  field_no?: number | null
  field_path: string
  field_name: string
  field_description?: string | null
  inferred_value_type?: string | null
  suggested_metric_key?: string | null
  suggested_metric_name_ko?: string | null
  suggested_unit?: string | null
  suggested_category_code?: string | null
  suggested_category_name?: string | null
  suggested_frequency?: string | null
  suggested_direction?: string | null
  confidence?: number | null
  status: string
  review_note?: string | null
  first_seen_at?: string | null
  last_seen_at?: string | null
  promoted_metric_key?: string | null
  promoted_at?: string | null
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
  workflow: string[]
  next_actions: string[]
}

interface SourceCollectorRecipe {
  source_key: string
  source_name?: string | null
  provider?: string | null
  endpoint?: string | null
  metric_key?: string | null
  refresh_frequency?: string | null
  collector_state: string
  batch_limit?: string | null
  snapshot_count?: number | null
  delta_count?: number | null
  observation_count?: number | null
  observation_status_counts?: Record<string, number> | null
  latest_period_start?: string | null
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
  recipes: SourceCollectorRecipe[]
}

interface SourceCollectorStatusResponse {
  runner: {
    job_id: string
    schedule: string
    current_behavior: string
    batch_policy: string
    latest_run?: {
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

interface ApiGuide {
  provider: string
  secretName: string
  keyLocation: string
  replitLocation: string
  note: string
}

const REPLIT_SECRET_LOCATION = 'Replit > Tools > Secrets'

const SOURCE_GUIDES: Record<string, ApiGuide> = {
  ecos: {
    provider: '한국은행 ECOS',
    secretName: 'ECOS_API_KEY',
    keyLocation: '한국은행 ECOS Open API',
    replitLocation: REPLIT_SECRET_LOCATION,
    note: 'ECOS API 키와 백엔드 상태 점검 결과를 확인하세요.',
  },
  seoul: {
    provider: '서울 열린데이터광장',
    secretName: 'SEOUL_OPENAPI_KEY',
    keyLocation: '서울 열린데이터광장 인증키',
    replitLocation: REPLIT_SECRET_LOCATION,
    note: '서울 열린데이터 API 키와 호출 권한을 확인하세요.',
  },
  dataGoKr: {
    provider: '공공데이터포털',
    secretName: 'DATA_GO_KR_SERVICE_KEY',
    keyLocation: '공공데이터포털 활용신청/마이페이지 인증키',
    replitLocation: REPLIT_SECRET_LOCATION,
    note: '공공데이터포털 키와 백엔드 API 상태 점검 결과를 확인하세요.',
  },
  juso: {
    provider: '도로명주소 개발자센터',
    secretName: 'JUSO_API_KEY',
    keyLocation: '도로명주소 개발자센터 API 승인키',
    replitLocation: REPLIT_SECRET_LOCATION,
    note: '주소 정규화 API 키 상태를 확인하세요.',
  },
  kosis: {
    provider: '통계청 KOSIS',
    secretName: 'KOSIS_API_KEY',
    keyLocation: 'KOSIS 공유서비스 Open API',
    replitLocation: REPLIT_SECRET_LOCATION,
    note: 'KOSIS API 키와 통계 코드 매핑을 확인하세요.',
  },
  rOne: {
    provider: '한국부동산원 R-ONE',
    secretName: 'RONE_API_KEY 또는 DATA_GO_KR_SERVICE_KEY',
    keyLocation: '한국부동산원/공공데이터포털 제공 API',
    replitLocation: REPLIT_SECRET_LOCATION,
    note: 'R-ONE 계열 API 키와 통계 코드 매핑을 확인하세요.',
  },
  fss: {
    provider: '금융감독원/금융위원회',
    secretName: 'FSS_API_KEY 또는 수동 업로드',
    keyLocation: '금융감독원 Open API 또는 금융위원회 고시/보고서',
    replitLocation: REPLIT_SECRET_LOCATION,
    note: 'API가 없거나 고시 PDF 기반이면 수동 매핑 테이블로 관리하세요.',
  },
  manual: {
    provider: '수동 연결 또는 내부 데이터',
    secretName: '별도 키 없음',
    keyLocation: '계약서, 현장조사, 보고서, 내부 계산값',
    replitLocation: 'DB/관리 테이블',
    note: '백엔드가 내려준 상태와 사유를 기준으로 확인하세요.',
  },
}
function getBarColor(rate: number): string {
  if (rate === 0) return 'bg-muted-foreground/30'
  if (rate <= 30) return 'bg-red-500'
  if (rate <= 60) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function getCardBorderColor(rate: number): string {
  if (rate === 0) return 'border-t-muted-foreground/30'
  if (rate <= 30) return 'border-t-red-500'
  if (rate <= 60) return 'border-t-amber-500'
  return 'border-t-emerald-500'
}

function guideForMetric(metric: Metric): ApiGuide {
  const haystack = `${metric.metric_key} ${metric.data_source}`.toLowerCase()

  if (haystack.includes('ecos') || haystack.includes('bok') || haystack.includes('한국은행')) return SOURCE_GUIDES.ecos
  if (haystack.includes('서울') || haystack.includes('seoul')) return SOURCE_GUIDES.seoul
  if (haystack.includes('kosis') || haystack.includes('통계청')) return SOURCE_GUIDES.kosis
  if (haystack.includes('r-one') || haystack.includes('rone') || haystack.includes('부동산원')) return SOURCE_GUIDES.rOne
  if (haystack.includes('금융감독') || haystack.includes('금융위원') || haystack.includes('fss')) return SOURCE_GUIDES.fss
  if (haystack.includes('국토') || haystack.includes('건축물') || haystack.includes('공시') || haystack.includes('data.go') || haystack.includes('nsdi')) return SOURCE_GUIDES.dataGoKr
  if (haystack.includes('juso') || haystack.includes('주소')) return SOURCE_GUIDES.juso
  return SOURCE_GUIDES.manual
}

function statusLabel(metric: Metric): string {
  const sourceStatus = metric.source_status || metric.status
  if (sourceStatus === 'api_alive') return 'API 살아있음'
  if (sourceStatus === 'api_dead') return 'API 죽어있음'
  if (sourceStatus === 'api_key_required') return 'API 키 필요'
  if (sourceStatus === 'mapping_required') return '매핑 필요'
  if (sourceStatus === 'table_available') return '데이터 적재됨'
  if (sourceStatus === 'table_required') return '테이블 필요'
  if (sourceStatus === 'manual_only' || sourceStatus === 'log_only') return '수동 관리'
  if (metric.is_available) return '데이터 적재됨'
  if (metric.status === 'manual_required') return '수동 연결 필요'
  return 'API 죽어있음'
}

function statusClass(metric: Metric): string {
  const sourceStatus = metric.source_status || metric.status
  if (sourceStatus === 'api_dead') return 'border-red-500/30 bg-red-500/10 text-red-300'
  if (sourceStatus === 'api_alive' || sourceStatus === 'table_available' || metric.is_available) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
}

function discoveryStatusLabel(status: string): string {
  if (status === 'discovered') return '발견됨'
  if (status === 'reviewing') return '검토 중'
  if (status === 'promoted') return 'metric 승격'
  if (status === 'ignored') return '보류'
  return status
}

function discoveryStatusClass(status: string): string {
  if (status === 'promoted') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  if (status === 'reviewing') return 'border-sky-500/30 bg-sky-500/10 text-sky-300'
  if (status === 'ignored') return 'border-muted-foreground/30 bg-sidebar text-muted-foreground'
  return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
}

const PIPELINE_STEPS = [
  { label: '지표 목록 확인', detail: 'wiki_metric_catalog' },
  { label: '12개 카테고리 수집', detail: 'category collectors' },
  { label: '원천 관측값 저장', detail: 'source_metric_observations' },
  { label: '스냅샷 생성 대기열', detail: 'snapshot queue' },
  { label: '스냅샷 저장', detail: 'metric_snapshots' },
  { label: '변화량 계산 대기열', detail: 'delta queue' },
  { label: '투자 시그널 생성', detail: 'insight events' },
]

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

function runnerDisplayName(jobId?: string): string {
  if (!jobId) return '-'
  if (jobId === 'delta_editorial_daily' || jobId === 'metric_insight_daily') return 'Metric Insight Pipeline'
  if (jobId === 'metric_insight_hourly') return 'Metric Insight Hourly'
  return jobId
}

function scheduleLabel(schedule?: string): string {
  if (!schedule) return '-'
  if (schedule === 'hourly every hour + daily 07:00 KST') return '매시간 정각 + 매일 07:00 KST'
  if (schedule === 'daily 07:00 KST') return '매일 07:00 KST'
  return schedule
}

function runnerStatusLabel(status?: string | null): string {
  if (!status) return '-'
  if (status === 'success') return '성공'
  if (status === 'failed' || status === 'error') return '실패'
  if (status === 'running') return '실행 중'
  if (status === 'partial') return '일부 성공'
  return status
}

function formatDateTimeKst(value?: string | null): string {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return `${new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)} KST`
}

function categoryDisplayName(category: SourceCollectorCategory): string {
  return CATEGORY_LABELS[category.category_key] || CATEGORY_LABELS[category.category_code] || category.category_name
}

function frequencyLabel(frequency: string): string {
  if (frequency === 'hourly') return '매시간'
  if (frequency === 'daily') return '매일'
  if (frequency === 'monthly') return '매월'
  if (frequency === 'quarterly') return '분기'
  if (frequency === 'annual' || frequency === 'yearly') return '매년'
  if (frequency === 'static') return '고정값'
  return frequency
}

function frequencyListLabel(frequencies: string[]): string {
  if (frequencies.length === 0) return '-'
  return frequencies.map(frequencyLabel).join(', ')
}

function latestCategoryActivity(category: SourceCollectorCategory): string {
  const timestamps = category.recipes.flatMap((recipe) => [
    recipe.latest_observed_at,
    recipe.latest_snapshot_at,
    recipe.latest_delta_at,
  ]).filter((value): value is string => Boolean(value))

  if (timestamps.length === 0) return '-'

  const latest = timestamps.reduce((currentLatest, value) => {
    const currentTime = new Date(currentLatest).getTime()
    const nextTime = new Date(value).getTime()
    if (Number.isNaN(nextTime)) return currentLatest
    if (Number.isNaN(currentTime)) return value
    return nextTime > currentTime ? value : currentLatest
  })

  return formatDateTimeKst(latest)
}

function collectorStatusLabel(status: string): string {
  if (status === 'active') return '실행 중'
  if (status === 'partially_active') return '일부 실행'
  if (status === 'catalog_only') return '카탈로그만 있음'
  if (status === 'recipes_only') return '수집 설정만 있음'
  if (status === 'not_configured') return '미구현'
  return status
}

function collectorStatusClass(status: string): string {
  if (status === 'active') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  if (status === 'partially_active') return 'border-sky-500/30 bg-sky-500/10 text-sky-300'
  if (status === 'catalog_only' || status === 'recipes_only') return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
  return 'border-muted-foreground/30 bg-sidebar text-muted-foreground'
}

function CategoryCard({ category }: { category: Category }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const metrics = useMemo(
    () => [...category.metrics].sort((a, b) => a.priority - b.priority || a.metric_key.localeCompare(b.metric_key)),
    [category.metrics],
  )

  return (
    <Card className={`overflow-hidden border-sidebar-border bg-sidebar-accent border-t-4 ${getCardBorderColor(category.rate)}`}>
      <button
        onClick={() => setIsExpanded((value) => !value)}
        className="w-full p-4 text-left transition-colors hover:bg-sidebar/50"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-sidebar-foreground">{category.category_name}</span>
          <span className="text-xs text-muted-foreground">
            {category.available}/{category.total} <span className="font-medium">{category.rate}%</span>
          </span>
        </div>

        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-sidebar">
          <div
            className={`h-full transition-all duration-300 ${getBarColor(category.rate)}`}
            style={{ width: `${Math.min(category.rate, 100)}%` }}
          />
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <span>지표 보기</span>
        </div>
      </button>

      {isExpanded && (
        <CardContent className="border-t border-sidebar-border px-4 pb-4 pt-0">
          <div className="mt-3 space-y-2">
            {metrics.map((metric) => {
              const guide = guideForMetric(metric)
              return (
                <div key={metric.metric_key} className="rounded-md border border-sidebar-border bg-sidebar/40 p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {metric.is_available ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    )}
                    <span className="font-medium text-sidebar-foreground">{metric.metric_name_ko}</span>
                    <span className="text-xs text-muted-foreground">{metric.unit || '-'}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusClass(metric)}`}>
                      {statusLabel(metric)}
                    </span>
                  </div>

                  <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <div>제공처: <span className="text-sidebar-foreground">{guide.provider}</span></div>
                    <div>원천: <span className="text-sidebar-foreground">{metric.data_source || '-'}</span></div>
                    <div>주기: <span className="text-sidebar-foreground">{metric.collection_frequency || '-'}</span></div>
                    <div>Replit 키: <span className="text-sidebar-foreground">{guide.secretName}</span></div>
                    <div>입력 위치: <span className="text-sidebar-foreground">{guide.replitLocation}</span></div>
                    <div>키 발급처: <span className="text-sidebar-foreground">{guide.keyLocation}</span></div>
                    <div>백엔드 상태: <span className="text-sidebar-foreground">{metric.source_status || metric.status || '-'}</span></div>
                    <div>판정 기준: <span className="text-sidebar-foreground">{metric.availability_basis || '-'}</span></div>
                  </div>

                  <p className="mt-2 text-xs text-amber-200/80">{metric.reason || guide.note}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function FieldPromotionPanel({
  discoveries,
  error,
}: {
  discoveries: SourceFieldDiscoveryResponse | null
  error: string | null
}) {
  const items = discoveries?.items || []
  const summary = discoveries?.summary

  return (
    <Card className="mt-4 border-sidebar-border bg-sidebar-accent">
      <CardContent className="p-4">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-sidebar-foreground">신규 API 필드 발견 및 metric 승격 후보</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              새 필드를 metric으로 승격하면 해당 카테고리 collector의 자동 수집 목록에 바로 포함됩니다.
            </p>
          </div>
          {summary && (
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full border border-sidebar-border px-2 py-1 text-muted-foreground">전체 {summary.total}</span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-300">발견 {summary.discovered}</span>
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-sky-300">검토 {summary.reviewing}</span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">승격 {summary.promoted}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            {error}
          </div>
        )}

        {!discoveries?.table_ready && (
          <div className="rounded-md border border-sidebar-border bg-sidebar/40 p-3 text-xs text-muted-foreground">
            백엔드 migration 적용 전이거나 discovery 테이블이 아직 준비되지 않았습니다.
          </div>
        )}

        {discoveries?.table_ready && items.length === 0 && (
          <div className="rounded-md border border-sidebar-border bg-sidebar/40 p-3 text-xs text-muted-foreground">
            아직 발견된 신규 필드는 없습니다. collector가 새 API 응답 필드를 발견하거나 admin에서 API binding을 등록하면 이곳과 catalog에 반영됩니다.
          </div>
        )}

        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead className="border-b border-sidebar-border text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-medium">상태</th>
                  <th className="py-2 pr-3 font-medium">원천</th>
                  <th className="py-2 pr-3 font-medium">필드</th>
                  <th className="py-2 pr-3 font-medium">추천 metric</th>
                  <th className="py-2 pr-3 font-medium">카테고리</th>
                  <th className="py-2 pr-3 font-medium">신뢰도</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sidebar-border">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${discoveryStatusClass(item.status)}`}>
                        {discoveryStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      <div className="font-medium text-sidebar-foreground">{item.source_name || item.source_key}</div>
                      <div>{item.provider || '-'}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="font-medium text-sidebar-foreground">
                        {item.field_no ? `No.${item.field_no} ` : ''}{item.field_name}
                      </div>
                      <div className="text-muted-foreground">{item.field_description || item.field_path}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="font-medium text-sidebar-foreground">{item.suggested_metric_name_ko || '-'}</div>
                      <div className="text-muted-foreground">{item.suggested_metric_key || '-'}</div>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {item.suggested_category_name || item.category_name || '-'}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {typeof item.confidence === 'number' ? `${Math.round(item.confidence * 100)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CollectorRunnerPanel({
  status,
  error,
}: {
  status: SourceCollectorStatusResponse | null
  error: string | null
}) {
  const runnerJobId =
    status?.runner.job_id === 'delta_editorial_daily'
      ? 'metric_insight_daily'
      : status?.runner.job_id
  const snapshotQueue = status?.queues?.snapshot_processing_queue
  const deltaQueue = status?.queues?.delta_processing_queue

  return (
    <Card className="mt-4 border-sidebar-border bg-sidebar-accent">
      <CardContent className="p-4">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-sidebar-foreground">원천지표 인사이트 파이프라인</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              원천데이터 카탈로그의 세부지표/API가 수집, 스냅샷, 변화량, 투자 시그널까지 이어지는지 확인합니다.
            </p>
          </div>
          {status && (
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full border border-sidebar-border px-2 py-1 text-muted-foreground">관리 카테고리 {status.summary.category_total}개</span>
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-sky-300">수집 대상 지표 {status.summary.recipe_total}개</span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">스냅샷 {status.summary.snapshot_total}건</span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-300">변화량 {status.summary.delta_total}건</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            {error}
          </div>
        )}

        {status && (
          <div className="mb-4 space-y-3 text-xs">
            <div className="grid gap-2 md:grid-cols-4">
              <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                <div className="text-muted-foreground">실행 작업</div>
                <div className="mt-1 font-semibold text-sidebar-foreground">{runnerDisplayName(runnerJobId)}</div>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">{runnerJobId || '-'}</div>
              </div>
              <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                <div className="text-muted-foreground">실행 주기</div>
                <div className="mt-1 font-semibold text-sidebar-foreground">{scheduleLabel(status.runner.schedule)}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">원천지표를 자동으로 다시 수집합니다.</div>
              </div>
              <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                <div className="text-muted-foreground">최근 실행</div>
                <div className="mt-1 font-semibold text-sidebar-foreground">{formatDateTimeKst(status.runner.latest_run?.ran_at)}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">표시는 한국 시간 기준입니다.</div>
              </div>
              <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                <div className="text-muted-foreground">최근 결과</div>
                <div className="mt-1 font-semibold text-sidebar-foreground">{runnerStatusLabel(status.runner.latest_run?.status)}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">마지막 배치 실행 상태입니다.</div>
              </div>
            </div>

            <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-sidebar-foreground">처리 흐름</div>
                  <div className="mt-1 text-muted-foreground">지표 목록을 읽고, 관측값을 저장한 뒤 스냅샷과 변화량을 만들어 투자 시그널로 넘깁니다.</div>
                </div>
                <span className="max-w-full break-all rounded-full border border-sidebar-border px-2 py-1 font-mono text-[11px] text-muted-foreground">
                  {status.runner.current_behavior}
                </span>
              </div>
              <div className="grid gap-2 md:grid-cols-7">
                {PIPELINE_STEPS.map((step, index) => (
                  <div key={step.detail} className="rounded-md border border-sidebar-border/70 bg-background/20 p-2">
                    <div className="mb-2 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/15 text-[11px] font-semibold text-sky-300">
                      {index + 1}
                    </div>
                    <div className="font-medium text-sidebar-foreground">{step.label}</div>
                    <div className="mt-1 break-words font-mono text-[10px] leading-4 text-muted-foreground">{step.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                <div className="font-semibold text-sidebar-foreground">중복 처리 방지</div>
                <div className="mt-1 text-muted-foreground">
                  수집 시점이 된 하위 지표만 읽고, 여러 워커가 동시에 돌아도 같은 작업을 중복 처리하지 않도록 관리합니다.
                </div>
                <div className="mt-2 rounded border border-sidebar-border px-2 py-1 font-mono text-[10px] text-muted-foreground">
                  {status.runner.batch_policy}
                </div>
              </div>
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="font-semibold text-emerald-300">스냅샷 대기열</div>
                <div className="mt-1 text-sidebar-foreground">
                  대기 {snapshotQueue?.queued ?? 0}건 / 완료 {snapshotQueue?.processed ?? 0}건
                </div>
                <div className="mt-1 text-muted-foreground">원천 관측값을 기간별 스냅샷으로 만드는 작업입니다.</div>
              </div>
              <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="font-semibold text-amber-300">변화량 대기열</div>
                <div className="mt-1 text-sidebar-foreground">
                  대기 {deltaQueue?.queued ?? 0}건 / 완료 {deltaQueue?.processed ?? 0}건
                </div>
                <div className="mt-1 text-muted-foreground">스냅샷끼리 비교해 증감률과 투자 신호 후보를 계산합니다.</div>
              </div>
            </div>
          </div>
        )}

        {status && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-xs">
              <thead className="border-b border-sidebar-border text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-medium">카테고리</th>
                  <th className="py-2 pr-3 font-medium">동작 상태</th>
                  <th className="py-2 pr-3 font-medium">수집 주기</th>
                  <th className="py-2 pr-3 font-medium">관리 지표</th>
                  <th className="py-2 pr-3 font-medium">동작 수집기</th>
                  <th className="py-2 pr-3 font-medium">원천 관측값</th>
                  <th className="py-2 pr-3 font-medium">스냅샷 저장</th>
                  <th className="py-2 pr-3 font-medium">변화량 계산</th>
                  <th className="py-2 pr-3 font-medium">저장된 대표 지표</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sidebar-border">
                {status.categories.map((category) => {
                  const stored = category.recipes
                    .filter((recipe) => (recipe.snapshot_count || 0) > 0)
                    .slice(0, 2)
                    .map((recipe) => recipe.metric_key || recipe.source_key)
                    .join(', ')
                  const observations = category.recipes.reduce((sum, recipe) => sum + (recipe.observation_count || 0), 0)
                  const latestActivity = latestCategoryActivity(category)
                  return (
                    <tr key={category.category_code}>
                      <td className="py-3 pr-3">
                        <div className="font-medium text-sidebar-foreground">{categoryDisplayName(category)}</div>
                        <div className="text-muted-foreground">{category.category_key}</div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${collectorStatusClass(category.status)}`}>
                          {collectorStatusLabel(category.status)}
                        </span>
                        <div className="mt-1 text-[11px] text-muted-foreground">마지막 동작 {latestActivity}</div>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">{frequencyListLabel(category.frequencies)}</td>
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-sidebar-foreground">{category.configured_recipe_count}개</div>
                        <div className="text-[11px] text-muted-foreground">카탈로그에 등록된 하위 지표</div>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-sidebar-foreground">{category.active_collector_count}개</div>
                        <div className="text-[11px] text-muted-foreground">실제로 API/DB를 읽는 수집기</div>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-sidebar-foreground">{observations}건</div>
                        <div className="text-[11px] text-muted-foreground">수집 직후 저장된 원천값</div>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-sidebar-foreground">{category.snapshot_count}건</div>
                        <div className="text-[11px] text-muted-foreground">기간별로 정리된 값</div>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-sidebar-foreground">{category.delta_count}건</div>
                        <div className="text-[11px] text-muted-foreground">이전 값과 비교한 변화량</div>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">{stored || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DataCoverageSection() {
  const [data, setData] = useState<MetricCatalogResponse | null>(null)
  const [discoveries, setDiscoveries] = useState<SourceFieldDiscoveryResponse | null>(null)
  const [collectorStatus, setCollectorStatus] = useState<SourceCollectorStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [discoveryError, setDiscoveryError] = useState<string | null>(null)
  const [collectorError, setCollectorError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setDiscoveryError(null)
    setCollectorError(null)

    try {
      const res = await fetch('/api/admin/metric-catalog', {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }

      setData(await res.json())

      const discoveryRes = await fetch('/api/admin/source-field-discoveries?limit=50', {
        credentials: 'include',
        cache: 'no-store',
      })

      if (discoveryRes.ok) {
        setDiscoveries(await discoveryRes.json())
      } else {
        const errorData = await discoveryRes.json().catch(() => ({}))
        setDiscoveryError(errorData.error || `신규 필드 후보를 불러오지 못했습니다. HTTP ${discoveryRes.status}`)
      }

      const collectorRes = await fetch('/api/admin/source-collector-status', {
        credentials: 'include',
        cache: 'no-store',
      })

      if (collectorRes.ok) {
        setCollectorStatus(await collectorRes.json())
      } else {
        const errorData = await collectorRes.json().catch(() => ({}))
        setCollectorError(errorData.error || `collector 현황을 불러오지 못했습니다. HTTP ${collectorRes.status}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (error && !data) {
    return (
      <section>
        <h1 className="mb-4 text-xl font-semibold text-sidebar-foreground">원천 데이터 적재 현황</h1>
        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button onClick={fetchData} className="mt-2 text-sm text-primary hover:underline">
              다시 시도
            </button>
          </CardContent>
        </Card>
      </section>
    )
  }

  if (isLoading && !data) {
    return (
      <section>
        <h1 className="mb-4 text-xl font-semibold text-sidebar-foreground">원천 데이터 적재 현황</h1>
        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </section>
    )
  }

  if (!data) return null

  const { overall, categories } = data

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-sidebar-foreground">원천 데이터 적재 현황</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="h-8 gap-1.5 text-muted-foreground hover:text-sidebar-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      <Card className="mb-4 border-sidebar-border bg-sidebar-accent">
        <CardContent className="py-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-sidebar-foreground">전체 적재율</span>
            <span className="text-sm text-sidebar-foreground">
              <span className="text-xl font-bold">{overall.rate}%</span>
              <span className="ml-2 text-muted-foreground">({overall.available}/{overall.total})</span>
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-sidebar">
            <div
              className={`h-full transition-all duration-300 ${getBarColor(overall.rate)}`}
              style={{ width: `${Math.min(overall.rate, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.category_code} category={category} />
        ))}
      </div>

      <CollectorRunnerPanel status={collectorStatus} error={collectorError} />

      <FieldPromotionPanel discoveries={discoveries} error={discoveryError} />
    </section>
  )
}
