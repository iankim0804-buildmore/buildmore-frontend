'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CalendarClock,
  CheckCircle2,
  FileText,
  Gauge,
  Layers3,
  Loader2,
  RefreshCw,
  Signal,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PeriodEngineCounts {
  metric_observations: number
  metric_growth_scores: number
  metric_rank_snapshots: number
  signal_cards: number
  signal_card_wiki_documents: number
}

interface PeriodRange {
  metric_key: string
  source_category?: string | null
  first_period?: string | null
  latest_period?: string | null
  count: number
}

interface PeriodDeltaStatus {
  architecture: string
  uses_storage_dates_as_time_axis: boolean
  counts: PeriodEngineCounts
  period_ranges: PeriodRange[]
  queue: Record<string, number>
  deprecated_inputs: string[]
}

interface LegacyDeltaSummary {
  period_engine?: {
    architecture?: string
    uses_storage_dates_as_time_axis?: boolean
    counts?: Partial<PeriodEngineCounts>
    queue?: Record<string, number>
  }
  health?: {
    status?: string
    snapshot_backlog?: number
    delta_backlog?: number
    snapshot_failed?: number
    delta_failed?: number
  }
  pipeline?: {
    observations?: { total?: number; recent_24h?: number; last_created_at?: string | null }
    snapshot_queue?: QueueSummary
    snapshots?: { total?: number; recent_24h?: number; last_created_at?: string | null }
    delta_queue?: QueueSummary
    deltas?: { total?: number; recent_24h?: number; last_created_at?: string | null }
    events?: { total?: number; recent_24h?: number; last_created_at?: string | null }
  }
}

interface QueueSummary {
  total?: number
  queued?: number
  processing?: number
  processed?: number
  failed?: number
  recent_24h?: number
  last_created_at?: string | null
  last_processed_at?: string | null
}

interface RecentDelta {
  id: number
  metric_key: string
  metric_category?: string | null
  region_code?: string | null
  pnu?: string | null
  commercial_area_id?: number | null
  comparison_window?: string | null
  current_period_start?: string | null
  previous_period_start?: string | null
  current_value?: number | string | null
  previous_value?: number | string | null
  delta_percent?: number | string | null
  direction?: string | null
  significance_level?: string | null
  interpretation?: string | null
  created_at?: string | null
}

interface RecentSignal {
  id: number
  event_title?: string | null
  event_summary?: string | null
  investment_takeaway?: string | null
  metric_key?: string | null
  metric_category?: string | null
  direction?: string | null
  signal_score?: number | null
  status?: string | null
  wiki_note_id?: number | null
  created_at?: string | null
}

interface DeltaPayload {
  periodStatus: PeriodDeltaStatus
  summary: LegacyDeltaSummary
  recentDeltas: RecentDelta[]
  recentSignals: RecentSignal[]
}

interface DeltaSectionProps {
  onRefresh?: () => void
}

const ENGINE_STEPS = [
  {
    key: 'metric_observations',
    label: '기간 관측값',
    table: 'metric_observations',
    description: '거래일, 상권 YYYY-MM 같은 원천 기간을 기준으로 정규화된 지표값입니다.',
    icon: Activity,
  },
  {
    key: 'metric_growth_scores',
    label: '상대 성장률',
    table: 'metric_growth_scores',
    description: '직전 3개월, 6개월 등 비교창으로 증감률과 벤치마크 초과분을 계산합니다.',
    icon: TrendingUp,
  },
  {
    key: 'metric_rank_snapshots',
    label: '순위 스냅샷',
    table: 'metric_rank_snapshots',
    description: '현재값, 성장률, 예측 순위를 같은 그룹 안에서 다시 줄 세웁니다.',
    icon: BarChart3,
  },
  {
    key: 'signal_cards',
    label: '델타 시그널 카드',
    table: 'signal_cards',
    description: '투자 판단에 쓸 수 있는 기회, 리스크, 관찰 카드를 생성합니다.',
    icon: Signal,
  },
  {
    key: 'signal_card_wiki_documents',
    label: 'LLM Wiki 학습 문서',
    table: 'signal_card_wiki_documents',
    description: '시그널 카드를 문서화하고 embed 큐에 넣어 Wiki가 다시 학습하게 합니다.',
    icon: Brain,
  },
] as const

function formatCount(value: number | null | undefined): string {
  return Number(value || 0).toLocaleString('ko-KR')
}

function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-'
  const number = Number(value)
  if (Number.isNaN(number)) return String(value)
  if (Math.abs(number) >= 100000000) return `${(number / 100000000).toFixed(1)}억`
  if (Math.abs(number) >= 10000) return `${(number / 10000).toFixed(1)}만`
  return number.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}

function formatPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-'
  const number = Number(value)
  if (Number.isNaN(number)) return String(value)
  return `${number > 0 ? '+' : ''}${number.toFixed(1)}%`
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

function formatPeriod(value: string | null | undefined): string {
  if (!value) return '-'
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      timeZone: 'Asia/Seoul',
    })
  }
  return String(value).slice(0, 7)
}

function directionClass(direction: string | null | undefined): string {
  if (direction === 'up') return 'text-emerald-300'
  if (direction === 'down') return 'text-red-300'
  return 'text-muted-foreground'
}

function directionIcon(direction: string | null | undefined) {
  if (direction === 'up') return <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
  if (direction === 'down') return <TrendingDown className="h-3.5 w-3.5 text-red-300" />
  return <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
}

function targetLabel(delta: RecentDelta): string {
  if (delta.commercial_area_id) return `상권 ${delta.commercial_area_id}`
  if (delta.region_code) return `지역 ${delta.region_code}`
  if (delta.pnu) return `PNU ${delta.pnu}`
  return 'global'
}

function statusBadgeClass(status: string | undefined): string {
  if (status === 'blocked') return 'border-red-500/30 bg-red-500/10 text-red-300'
  if (status === 'backlog') return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
  return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
}

function queueTotal(queue: Record<string, number> | undefined): number {
  return Object.values(queue || {}).reduce((sum, value) => sum + Number(value || 0), 0)
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${url} HTTP ${res.status}${body ? `: ${body.slice(0, 160)}` : ''}`)
  }
  return await res.json() as T
}

async function fetchDeltaPayload(): Promise<DeltaPayload> {
  const [periodStatus, summary, recentDeltas, recentSignals] = await Promise.all([
    fetchJson<PeriodDeltaStatus>('/api/admin/period-delta/status'),
    fetchJson<LegacyDeltaSummary>('/api/admin/delta-summary'),
    fetchJson<RecentDelta[]>('/api/admin/delta-recent?limit=12'),
    fetchJson<RecentSignal[]>('/api/admin/signals-recent?limit=6'),
  ])

  return { periodStatus, summary, recentDeltas, recentSignals }
}

function MetricCoverageStrip({ ranges }: { ranges: PeriodRange[] }) {
  const topRanges = ranges
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  if (topRanges.length === 0) {
    return (
      <div className="rounded-md border border-sidebar-border bg-background/20 p-4 text-sm text-muted-foreground">
        아직 기간 관측값 범위가 없습니다. 원천 수집 후 Period Delta 재계산을 큐에 넣으면 채워집니다.
      </div>
    )
  }

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      {topRanges.map((range) => (
        <div key={`${range.metric_key}-${range.source_category || 'source'}`} className="rounded-md border border-sidebar-border bg-background/20 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-medium text-sidebar-foreground">{range.metric_key}</div>
              <div className="text-[11px] text-muted-foreground">{range.source_category || 'source period'}</div>
            </div>
            <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-300">
              {formatCount(range.count)}
            </Badge>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            <span>{formatPeriod(range.first_period)} - {formatPeriod(range.latest_period)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DeltaSection({ onRefresh }: DeltaSectionProps) {
  const [payload, setPayload] = useState<DeltaPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRecomputing, setIsRecomputing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setError(null)
    try {
      const nextPayload = await fetchDeltaPayload()
      setPayload(nextPayload)
    } catch (err) {
      setError(err instanceof Error ? err.message : '델타 엔진 상태를 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchDeltaPayload()
      .then((nextPayload) => {
        if (!cancelled) setPayload(nextPayload)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '델타 엔진 상태를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleRecompute = useCallback(async () => {
    setIsRecomputing(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/period-delta/recompute?mode=queue&months=12', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : `HTTP ${res.status}`)
      const queueId = typeof data.queue_id === 'number' ? ` #${data.queue_id}` : ''
      setMessage(`Period Delta 재계산 작업을 큐에 넣었습니다${queueId}.`)
      await loadData()
      onRefresh?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Period Delta 재계산 요청에 실패했습니다.')
    } finally {
      setIsRecomputing(false)
    }
  }, [loadData, onRefresh])

  const counts = payload?.periodStatus.counts
  const healthStatus = payload?.summary.health?.status
  const periodQueueTotal = queueTotal(payload?.periodStatus.queue)
  const queueText = useMemo(() => {
    const queue = payload?.periodStatus.queue || {}
    const queued = queue.queued || 0
    const processing = queue.processing || 0
    const done = queue.done || queue.processed || 0
    const failed = queue.failed || 0
    return `대기 ${formatCount(queued)} / 처리중 ${formatCount(processing)} / 완료 ${formatCount(done)} / 실패 ${formatCount(failed)}`
  }, [payload])

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-sidebar-foreground">Period Delta Engine</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            저장 시각이 아니라 원천 기간을 기준으로 관측값, 상대 성장률, 순위, 시그널 카드, Wiki 학습 문서까지 이어지는 새 엔진입니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {payload && (
            <Badge variant="outline" className={statusBadgeClass(healthStatus)}>
              {healthStatus === 'blocked' ? '실패 확인 필요' : healthStatus === 'backlog' ? '대기열 처리 중' : '정상 흐름'}
            </Badge>
          )}
          <Button onClick={handleRecompute} disabled={isRecomputing} size="sm">
            {isRecomputing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Period Delta 재계산
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
              델타 엔진 상태를 불러오는 중
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2 md:grid-cols-4">
                <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Layers3 className="h-4 w-4" />
                    기간 관측값
                  </div>
                  <div className="mt-1 text-2xl font-bold text-sidebar-foreground">{formatCount(counts?.metric_observations)}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">source-period 기반 정규화 지표</div>
                </div>
                <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Gauge className="h-4 w-4" />
                    성장률/순위
                  </div>
                  <div className="mt-1 text-2xl font-bold text-sidebar-foreground">
                    {formatCount((counts?.metric_growth_scores || 0) + (counts?.metric_rank_snapshots || 0))}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">비교창과 벤치마크 그룹 결과</div>
                </div>
                <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Signal className="h-4 w-4" />
                    시그널 카드
                  </div>
                  <div className="mt-1 text-2xl font-bold text-sidebar-foreground">{formatCount(counts?.signal_cards)}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">투자 기회/리스크 카드</div>
                </div>
                <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Wiki 연결
                  </div>
                  <div className="mt-1 text-2xl font-bold text-sidebar-foreground">{formatCount(counts?.signal_card_wiki_documents)}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">embed 큐로 넘어가는 학습 문서</div>
                </div>
              </div>

              <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sidebar-foreground">새 계산 흐름</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      created_at 기준의 구식 전광판 대신, 원천 기간으로 쌓인 데이터가 어떻게 델타 시그널 카드와 Wiki 학습 문서가 되는지 보여줍니다.
                    </div>
                  </div>
                  <div className="rounded-full border border-sidebar-border px-2 py-1 text-[11px] text-muted-foreground">
                    큐 {formatCount(periodQueueTotal)}건 · {queueText}
                  </div>
                </div>

                <div className="grid gap-2 lg:grid-cols-5">
                  {ENGINE_STEPS.map((step, index) => {
                    const Icon = step.icon
                    const total = counts?.[step.key] || 0
                    return (
                      <div key={step.key} className="relative">
                        <div className="h-full rounded-md border border-sidebar-border/70 bg-sidebar/30 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-500/10 text-sky-300">
                              <Icon className="h-4 w-4" />
                            </div>
                            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          </div>
                          <div className="mt-3 text-[11px] text-muted-foreground">STEP {index + 1}</div>
                          <div className="mt-1 font-semibold text-sidebar-foreground">{step.label}</div>
                          <div className="mt-2 text-2xl font-bold text-sidebar-foreground">{formatCount(total)}</div>
                          <div className="mt-1 font-mono text-[10px] text-muted-foreground">{step.table}</div>
                          <p className="mt-3 text-[11px] leading-4 text-muted-foreground">{step.description}</p>
                        </div>
                        {index < ENGINE_STEPS.length - 1 && (
                          <ArrowRight className="absolute -right-4 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground lg:block" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <MetricCoverageStrip ranges={payload?.periodStatus.period_ranges || []} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.75fr]">
        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-sidebar-foreground">최근 구 editorial delta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-xs">
                <thead className="border-b border-sidebar-border text-sidebar-foreground">
                  <tr>
                    <th className="py-2 pr-3 font-semibold">지표</th>
                    <th className="py-2 pr-3 font-semibold">대상</th>
                    <th className="py-2 pr-3 text-right font-semibold">현재값</th>
                    <th className="py-2 pr-3 text-right font-semibold">이전값</th>
                    <th className="py-2 pr-3 text-right font-semibold">변화율</th>
                    <th className="py-2 pr-3 font-semibold">기간</th>
                    <th className="py-2 pr-3 font-semibold">계산 시각</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sidebar-border">
                  {(payload?.recentDeltas || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground">최근 delta 결과가 없습니다.</td>
                    </tr>
                  ) : payload?.recentDeltas.map((delta) => (
                    <tr key={delta.id}>
                      <td className="py-3 pr-3">
                        <div className="font-medium text-sidebar-foreground">{delta.metric_key}</div>
                        <div className="text-muted-foreground">{delta.metric_category || '-'}</div>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">{targetLabel(delta)}</td>
                      <td className="py-3 pr-3 text-right text-sidebar-foreground">{formatNumber(delta.current_value)}</td>
                      <td className="py-3 pr-3 text-right text-muted-foreground">{formatNumber(delta.previous_value)}</td>
                      <td className={`py-3 pr-3 text-right font-semibold ${directionClass(delta.direction)}`}>
                        <span className="inline-flex items-center justify-end gap-1">
                          {directionIcon(delta.direction)}
                          {formatPercent(delta.delta_percent)}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">{delta.comparison_window || '-'}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{formatDateTime(delta.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-sidebar-foreground">최근 투자 시그널</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(payload?.recentSignals || []).length === 0 ? (
                <div className="rounded-md border border-sidebar-border p-4 text-center text-xs text-muted-foreground">
                  생성된 투자 시그널이 없습니다.
                </div>
              ) : payload?.recentSignals.map((signal) => (
                <div key={signal.id} className="rounded-md border border-sidebar-border bg-background/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sidebar-foreground">{signal.event_title || signal.metric_key || 'Delta signal'}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{signal.event_summary || signal.investment_takeaway || '-'}</div>
                    </div>
                    {typeof signal.signal_score === 'number' && (
                      <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-300">
                        {signal.signal_score}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span>{signal.metric_key || '-'}</span>
                    <span>{signal.status || '-'}</span>
                    <span>{formatDateTime(signal.created_at)}</span>
                    {signal.wiki_note_id ? <span>Wiki #{signal.wiki_note_id}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
