'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Database, Loader2, RefreshCw, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PipelineStage {
  total: number
  recent_24h?: number
  last_created_at?: string | null
}

interface QueueStage extends PipelineStage {
  queued: number
  processing: number
  processed: number
  failed: number
  last_processed_at?: string | null
}

interface DeltaSummary {
  observations: number
  snapshots: number
  deltas: number
  events: number
  last_calculated_at: string | null
  pipeline?: {
    observations: PipelineStage
    snapshot_queue: QueueStage
    snapshots: PipelineStage
    delta_queue: QueueStage
    deltas: PipelineStage
    events: PipelineStage
  }
  health?: {
    snapshot_backlog: number
    delta_backlog: number
    snapshot_failed: number
    delta_failed: number
    status: 'healthy' | 'backlog' | 'blocked' | string
  }
}

interface DeltaRecent {
  id: number
  metric_key: string
  metric_category?: string | null
  region_code?: string | null
  pnu?: string | null
  commercial_area_id?: number | null
  source_id?: number | null
  comparison_window: string
  current_period_start?: string | null
  previous_period_start?: string | null
  current_value?: number | string | null
  previous_value?: number | string | null
  delta_value?: number | string | null
  delta_percent?: number | string | null
  direction?: 'up' | 'down' | 'flat' | 'unknown' | string | null
  significance_level?: string | null
  interpretation?: string | null
  created_at?: string | null
}

interface SignalRecent {
  id: number
  event_title?: string | null
  event_summary?: string | null
  investment_takeaway?: string | null
  metric_key?: string | null
  metric_category?: string | null
  signal_score?: number | null
  status?: string | null
  created_at?: string | null
}

interface DeltaSectionProps {
  onRefresh?: () => void
}

function formatCount(value: number | null | undefined): string {
  return Number(value || 0).toLocaleString()
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-'
  const number = Number(value)
  if (Number.isNaN(number)) return String(value)
  if (Math.abs(number) >= 1000000) return `${(number / 1000000).toFixed(1)}M`
  if (Math.abs(number) >= 1000) return `${(number / 1000).toFixed(1)}K`
  return number.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-'
  const number = Number(value)
  if (Number.isNaN(number)) return String(value)
  return `${number > 0 ? '+' : ''}${number.toFixed(1)}%`
}

function dimensionLabel(delta: DeltaRecent): string {
  if (delta.region_code) return `지역 ${delta.region_code}`
  if (delta.pnu) return `PNU ${delta.pnu}`
  if (delta.commercial_area_id) return `상권 ${delta.commercial_area_id}`
  if (delta.source_id) return `source ${delta.source_id}`
  return 'global'
}

function healthLabel(status: string | undefined): { text: string; className: string } {
  if (status === 'blocked') return { text: '실패 확인 필요', className: 'border-red-500/30 bg-red-500/10 text-red-300' }
  if (status === 'backlog') return { text: '대기열 처리 중', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' }
  return { text: '흐름 정상', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' }
}

function directionClass(direction: string | null | undefined): string {
  if (direction === 'up') return 'text-emerald-300'
  if (direction === 'down') return 'text-red-300'
  return 'text-muted-foreground'
}

async function fetchDeltaPayload(): Promise<{
  summary: DeltaSummary
  recentDeltas: DeltaRecent[]
  recentSignals: SignalRecent[]
}> {
  const [summaryRes, deltasRes, signalsRes] = await Promise.all([
    fetch('/api/admin/delta-summary', { credentials: 'include', cache: 'no-store' }),
    fetch('/api/admin/delta-recent?limit=12', { credentials: 'include', cache: 'no-store' }),
    fetch('/api/admin/signals-recent?limit=5', { credentials: 'include', cache: 'no-store' }),
  ])

  if (!summaryRes.ok) throw new Error(`delta summary HTTP ${summaryRes.status}`)
  if (!deltasRes.ok) throw new Error(`delta recent HTTP ${deltasRes.status}`)
  if (!signalsRes.ok) throw new Error(`signals recent HTTP ${signalsRes.status}`)

  return {
    summary: await summaryRes.json(),
    recentDeltas: await deltasRes.json(),
    recentSignals: await signalsRes.json(),
  }
}

export function DeltaSection({ onRefresh }: DeltaSectionProps) {
  const [summary, setSummary] = useState<DeltaSummary | null>(null)
  const [recentDeltas, setRecentDeltas] = useState<DeltaRecent[]>([])
  const [recentSignals, setRecentSignals] = useState<SignalRecent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDeltaData = useCallback(async () => {
    setError(null)
    try {
      const payload = await fetchDeltaPayload()
      setSummary(payload.summary)
      setRecentDeltas(payload.recentDeltas)
      setRecentSignals(payload.recentSignals)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delta 현황을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchDeltaPayload()
      .then((payload) => {
        if (cancelled) return
        setSummary(payload.summary)
        setRecentDeltas(payload.recentDeltas)
        setRecentSignals(payload.recentSignals)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Delta 현황을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleRunDelta = useCallback(async () => {
    setIsRunning(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/run-delta?mode=apply', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`run delta HTTP ${res.status}`)
      await loadDeltaData()
      onRefresh?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delta 재계산에 실패했습니다.')
    } finally {
      setIsRunning(false)
    }
  }, [loadDeltaData, onRefresh])

  const stages = useMemo(() => {
    const pipeline = summary?.pipeline
    return [
      {
        key: 'observations',
        title: '원천 관측값 저장',
        subtitle: 'collector가 DB에 쌓은 원천값',
        total: pipeline?.observations.total ?? summary?.observations ?? 0,
        recent: pipeline?.observations.recent_24h ?? 0,
        time: pipeline?.observations.last_created_at,
        tone: 'sky',
      },
      {
        key: 'snapshot_queue',
        title: '스냅샷 대기열',
        subtitle: '원천값을 스냅샷으로 만들 작업',
        total: pipeline?.snapshot_queue.total ?? 0,
        queued: pipeline?.snapshot_queue.queued ?? 0,
        processing: pipeline?.snapshot_queue.processing ?? 0,
        failed: pipeline?.snapshot_queue.failed ?? 0,
        time: pipeline?.snapshot_queue.last_processed_at || pipeline?.snapshot_queue.last_created_at,
        tone: 'amber',
      },
      {
        key: 'snapshots',
        title: '스냅샷 저장',
        subtitle: '기간별로 정리된 지표값',
        total: pipeline?.snapshots.total ?? summary?.snapshots ?? 0,
        recent: pipeline?.snapshots.recent_24h ?? 0,
        time: pipeline?.snapshots.last_created_at,
        tone: 'emerald',
      },
      {
        key: 'delta_queue',
        title: 'Delta 대기열',
        subtitle: '스냅샷 비교 계산 작업',
        total: pipeline?.delta_queue.total ?? 0,
        queued: pipeline?.delta_queue.queued ?? 0,
        processing: pipeline?.delta_queue.processing ?? 0,
        failed: pipeline?.delta_queue.failed ?? 0,
        time: pipeline?.delta_queue.last_processed_at || pipeline?.delta_queue.last_created_at,
        tone: 'orange',
      },
      {
        key: 'deltas',
        title: 'Delta 결과',
        subtitle: '증감률과 방향성 계산값',
        total: pipeline?.deltas.total ?? summary?.deltas ?? 0,
        recent: pipeline?.deltas.recent_24h ?? 0,
        time: pipeline?.deltas.last_created_at,
        tone: 'violet',
      },
      {
        key: 'events',
        title: '투자 시그널',
        subtitle: 'Delta에서 승격된 인사이트',
        total: pipeline?.events.total ?? summary?.events ?? 0,
        recent: pipeline?.events.recent_24h ?? 0,
        time: pipeline?.events.last_created_at,
        tone: 'teal',
      },
    ]
  }, [summary])

  const health = healthLabel(summary?.health?.status)

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-sidebar-foreground">Delta 파이프라인 현황</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            원천 관측값이 스냅샷과 변화량 계산을 거쳐 투자 시그널로 이어지는지 확인합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {summary && (
            <Badge variant="outline" className={health.className}>
              {health.text}
            </Badge>
          )}
          <Button onClick={handleRunDelta} disabled={isRunning} size="sm">
            {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Delta 재계산
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          {error}
        </div>
      )}

      <Card className="border-sidebar-border bg-sidebar-accent">
        <CardContent className="p-4">
          {isLoading && !summary ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Delta 현황을 불러오는 중
            </div>
          ) : (
            <>
              <div className="mb-4 grid gap-2 md:grid-cols-4">
                <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Database className="h-4 w-4" />
                    저장된 스냅샷
                  </div>
                  <div className="mt-1 text-2xl font-bold text-sidebar-foreground">{formatCount(summary?.snapshots)}</div>
                </div>
                <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    생성된 Delta
                  </div>
                  <div className="mt-1 text-2xl font-bold text-sidebar-foreground">{formatCount(summary?.deltas)}</div>
                </div>
                <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Delta 마지막 계산
                  </div>
                  <div className="mt-2 font-semibold text-sidebar-foreground">{formatDateTime(summary?.last_calculated_at)}</div>
                </div>
                <div className="rounded-md border border-sidebar-border bg-background/20 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    현재 병목
                  </div>
                  <div className="mt-2 text-sidebar-foreground">
                    snapshot 대기 {formatCount(summary?.health?.snapshot_backlog)} / delta 대기 {formatCount(summary?.health?.delta_backlog)}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 lg:grid-cols-6">
                {stages.map((stage, index) => (
                  <div key={stage.key} className="relative">
                    <div className="h-full rounded-md border border-sidebar-border bg-background/20 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] text-muted-foreground">STEP {index + 1}</div>
                          <div className="mt-1 font-semibold text-sidebar-foreground">{stage.title}</div>
                        </div>
                        {('failed' in stage && stage.failed > 0) ? (
                          <AlertTriangle className="h-4 w-4 text-red-300" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        )}
                      </div>
                      <div className="mt-3 text-2xl font-bold text-sidebar-foreground">{formatCount(stage.total)}</div>
                      <div className="mt-1 min-h-8 text-[11px] leading-4 text-muted-foreground">{stage.subtitle}</div>
                      {'queued' in stage ? (
                        <div className="mt-3 grid grid-cols-3 gap-1 text-[11px]">
                          <span className="rounded border border-sidebar-border px-1.5 py-1 text-amber-300">대기 {formatCount(stage.queued)}</span>
                          <span className="rounded border border-sidebar-border px-1.5 py-1 text-sky-300">처리 {formatCount(stage.processing)}</span>
                          <span className="rounded border border-sidebar-border px-1.5 py-1 text-red-300">실패 {formatCount(stage.failed)}</span>
                        </div>
                      ) : (
                        <div className="mt-3 text-[11px] text-muted-foreground">24시간 내 {formatCount(stage.recent)}건 생성</div>
                      )}
                      <div className="mt-2 text-[11px] text-muted-foreground">최근 {formatDateTime(stage.time)}</div>
                    </div>
                    {index < stages.length - 1 && (
                      <ArrowRight className="absolute -right-4 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground lg:block" />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-sidebar-foreground">최근 Delta 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-xs">
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
                  {recentDeltas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground">아직 계산된 Delta가 없습니다.</td>
                    </tr>
                  ) : recentDeltas.map((delta) => (
                    <tr key={delta.id}>
                      <td className="py-3 pr-3">
                        <div className="font-medium text-sidebar-foreground">{delta.metric_key}</div>
                        <div className="text-muted-foreground">{delta.metric_category || '-'}</div>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">{dimensionLabel(delta)}</td>
                      <td className="py-3 pr-3 text-right text-sidebar-foreground">{formatNumber(delta.current_value)}</td>
                      <td className="py-3 pr-3 text-right text-muted-foreground">{formatNumber(delta.previous_value)}</td>
                      <td className={`py-3 pr-3 text-right font-semibold ${directionClass(delta.direction)}`}>
                        {formatPercent(delta.delta_percent)}
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">{delta.comparison_window}</td>
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
              {recentSignals.length === 0 ? (
                <div className="rounded-md border border-sidebar-border p-4 text-center text-xs text-muted-foreground">
                  아직 생성된 시그널이 없습니다.
                </div>
              ) : recentSignals.map((signal) => (
                <div key={signal.id} className="rounded-md border border-sidebar-border bg-background/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sidebar-foreground">{signal.event_title || signal.metric_key || 'Delta signal'}</div>
                    {typeof signal.signal_score === 'number' && (
                      <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-300">
                        {signal.signal_score}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{signal.event_summary || signal.investment_takeaway || '-'}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span>{signal.metric_key || '-'}</span>
                    <span>{formatDateTime(signal.created_at)}</span>
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
