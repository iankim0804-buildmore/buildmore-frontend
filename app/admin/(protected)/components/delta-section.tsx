'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TrendingUp, TrendingDown, Minus, RefreshCw, Calculator, Zap, Clock } from 'lucide-react'

// === Delta Types ===
export interface DeltaSummary {
  delta_count: number
  signal_count: number
  last_calculated_at: string | null
}

export interface DeltaRecent {
  metric_key: string
  dimension_key: string
  current_value: number
  previous_period_delta_pct: number
  direction: 'up' | 'down' | 'flat'
  strength: 'strong' | 'moderate' | 'weak'
  current_period_start: string
}

export interface SignalRecent {
  signal_message: string
  metric_key: string
  created_at: string
}

// === Mock Data ===
const MOCK_DELTA_SUMMARY: DeltaSummary = {
  delta_count: 24,
  signal_count: 7,
  last_calculated_at: '2026-05-05T11:00:00'
}

const MOCK_DELTA_RECENT: DeltaRecent[] = [
  {
    metric_key: 'area_sales',
    dimension_key: 'commercial_area_id:1225',
    current_value: 1850000,
    previous_period_delta_pct: 12.4,
    direction: 'up',
    strength: 'moderate',
    current_period_start: '2026-04-01'
  },
  {
    metric_key: 'store_count',
    dimension_key: 'commercial_area_id:1225',
    current_value: 342,
    previous_period_delta_pct: -5.2,
    direction: 'down',
    strength: 'weak',
    current_period_start: '2026-04-01'
  },
  {
    metric_key: 'foot_traffic',
    dimension_key: 'region_code:11680',
    current_value: 28500,
    previous_period_delta_pct: 0.3,
    direction: 'flat',
    strength: 'weak',
    current_period_start: '2026-04-01'
  },
  {
    metric_key: 'avg_rent',
    dimension_key: 'commercial_area_id:3042',
    current_value: 45000,
    previous_period_delta_pct: 8.7,
    direction: 'up',
    strength: 'strong',
    current_period_start: '2026-04-01'
  },
  {
    metric_key: 'vacancy_rate',
    dimension_key: 'region_code:11650',
    current_value: 12.5,
    previous_period_delta_pct: -15.3,
    direction: 'down',
    strength: 'strong',
    current_period_start: '2026-04-01'
  },
]

const MOCK_SIGNALS_RECENT: SignalRecent[] = [
  {
    signal_message: '상권 매출이 직전 기간 대비 12.4% 증가했습니다.',
    metric_key: 'area_sales',
    created_at: '2026-05-05T11:00:00'
  },
  {
    signal_message: '평균 임대료가 8.7% 상승하여 주의가 필요합니다.',
    metric_key: 'avg_rent',
    created_at: '2026-05-05T10:45:00'
  },
  {
    signal_message: '공실률이 15.3% 감소하여 시장 활성화 신호입니다.',
    metric_key: 'vacancy_rate',
    created_at: '2026-05-05T10:30:00'
  },
  {
    signal_message: '점포 수가 5.2% 감소했습니다.',
    metric_key: 'store_count',
    created_at: '2026-05-05T10:15:00'
  },
  {
    signal_message: '유동인구 변화가 미미합니다 (0.3%).',
    metric_key: 'foot_traffic',
    created_at: '2026-05-05T10:00:00'
  },
]

// === Helper Functions ===
function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return '-'
  
  try {
    const now = new Date()
    const date = new Date(timestamp)
    
    if (isNaN(date.getTime())) return '-'
    
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${diffDays}일 전`
  } catch {
    return '-'
  }
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

function getDirectionBadge(direction: 'up' | 'down' | 'flat') {
  switch (direction) {
    case 'up':
      return (
        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          <TrendingUp className="mr-1 h-3 w-3" />
          상승
        </Badge>
      )
    case 'down':
      return (
        <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
          <TrendingDown className="mr-1 h-3 w-3" />
          하락
        </Badge>
      )
    case 'flat':
      return (
        <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
          <Minus className="mr-1 h-3 w-3" />
          유지
        </Badge>
      )
  }
}

function getStrengthText(strength: 'strong' | 'moderate' | 'weak') {
  switch (strength) {
    case 'strong':
      return <span className="text-orange-400">강함</span>
    case 'moderate':
      return <span className="text-yellow-400">보통</span>
    case 'weak':
      return <span className="text-gray-400">약함</span>
  }
}

// === Component ===
interface DeltaSectionProps {
  onRefresh?: () => void
}

export function DeltaSection({ onRefresh }: DeltaSectionProps) {
  const [summary] = useState<DeltaSummary>(MOCK_DELTA_SUMMARY)
  const [recentDeltas] = useState<DeltaRecent[]>(MOCK_DELTA_RECENT)
  const [recentSignals] = useState<SignalRecent[]>(MOCK_SIGNALS_RECENT)
  const [isRunning, setIsRunning] = useState(false)

  const handleRunDelta = useCallback(async () => {
    setIsRunning(true)
    
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/admin/run-delta?mode=apply', { method: 'POST' })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Refresh data after completion
      onRefresh?.()
    } catch (error) {
      console.error('[v0] Delta run error:', error)
    } finally {
      setIsRunning(false)
    }
  }, [onRefresh])

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          Delta 현황
        </h2>
        <Button
          onClick={handleRunDelta}
          disabled={isRunning}
          size="sm"
          className="bg-primary hover:bg-primary/90"
        >
          {isRunning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              실행 중...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Delta 재계산 실행
            </>
          )}
        </Button>
      </div>

      {/* Delta Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Calculator className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delta 계산 완료</p>
                <p className="text-2xl font-bold text-sidebar-foreground">
                  {summary.delta_count}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <Zap className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">신호 생성</p>
                <p className="text-2xl font-bold text-sidebar-foreground">
                  {summary.signal_count}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">최근 계산</p>
                <p className="text-lg font-bold text-sidebar-foreground">
                  {formatRelativeTime(summary.last_calculated_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Delta Results Table */}
      <Card className="mt-4 border-sidebar-border bg-sidebar-accent py-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-sidebar-foreground">
            최근 Delta 결과 (최대 10건)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-sidebar-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">metric_key</TableHead>
                <TableHead className="text-muted-foreground">기준</TableHead>
                <TableHead className="text-right text-muted-foreground">현재값</TableHead>
                <TableHead className="text-right text-muted-foreground">변화율</TableHead>
                <TableHead className="text-center text-muted-foreground">방향</TableHead>
                <TableHead className="text-center text-muted-foreground">강도</TableHead>
                <TableHead className="text-muted-foreground">period_start</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDeltas.map((delta, index) => (
                <TableRow
                  key={`${delta.metric_key}-${delta.dimension_key}-${index}`}
                  className="border-sidebar-border hover:bg-sidebar/50"
                >
                  <TableCell className="font-mono text-sm text-sidebar-foreground">
                    {delta.metric_key}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {delta.dimension_key}
                  </TableCell>
                  <TableCell className="text-right text-sidebar-foreground">
                    {formatNumber(delta.current_value)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={delta.previous_period_delta_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {delta.previous_period_delta_pct >= 0 ? '+' : ''}{delta.previous_period_delta_pct.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {getDirectionBadge(delta.direction)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStrengthText(delta.strength)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {delta.current_period_start}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Signals List */}
      <Card className="mt-4 border-sidebar-border bg-sidebar-accent py-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-sidebar-foreground">
            최근 Signal 목록 (최대 5개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSignals.map((signal, index) => (
              <div
                key={`${signal.metric_key}-${index}`}
                className="flex items-start gap-3 rounded-lg border border-sidebar-border bg-sidebar/30 p-3"
              >
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-sidebar-foreground">
                    {signal.signal_message}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                      {signal.metric_key}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(signal.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
