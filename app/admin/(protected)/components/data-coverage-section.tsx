'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Database } from 'lucide-react'

// Types
interface DataCoverageItem {
  name: string
  metric_key: string
  source: string
  current_count: number
  target_count: number
  current_periods: number
  target_periods: number
  coverage_pct: number
  quality: string
}

interface DataCoverageResponse {
  total_coverage_pct: number
  last_updated: string
  items: DataCoverageItem[]
}

// Helper functions
function getProgressBarColor(pct: number): string {
  if (pct === 0) return 'bg-muted-foreground/30'
  if (pct <= 30) return 'bg-red-500'
  if (pct <= 60) return 'bg-amber-500'
  if (pct <= 80) return 'bg-blue-500'
  return 'bg-emerald-500'
}

function getQualityBadge(quality: string) {
  const lowerQuality = quality.toLowerCase()
  if (lowerQuality.includes('충분')) {
    return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">충분</Badge>
  }
  if (lowerQuality.includes('보통')) {
    return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">보통</Badge>
  }
  if (lowerQuality.includes('부족')) {
    return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">부족</Badge>
  }
  return <Badge className="bg-muted text-muted-foreground border-muted">미적재</Badge>
}

export function DataCoverageSection() {
  const [data, setData] = useState<DataCoverageResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/admin/data-coverage', {
        credentials: 'include'
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }
      
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러올 수 없습니다')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Error state
  if (error && !data) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold text-sidebar-foreground">
          원천 데이터 적재 현황
        </h2>
        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-sm text-primary hover:underline"
            >
              다시 시도
            </button>
          </CardContent>
        </Card>
      </section>
    )
  }

  // Loading state
  if (isLoading && !data) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold text-sidebar-foreground">
          원천 데이터 적재 현황
        </h2>
        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </section>
    )
  }

  if (!data) return null

  const totalPct = data.total_coverage_pct

  return (
    <section>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-sidebar-foreground">
            원천 데이터 적재 현황
          </h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-sidebar-foreground">
            {totalPct.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            Delta Engine 정교 작동 목표: 100%
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <Card className="mb-4 border-sidebar-border bg-sidebar-accent py-4">
        <CardContent className="pb-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">전체 적재율</span>
              <span className="font-medium text-sidebar-foreground">{totalPct.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-sidebar">
              <div
                className={`h-full transition-all duration-300 ${getProgressBarColor(totalPct)}`}
                style={{ width: `${Math.min(totalPct, 100)}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              마지막 업데이트: {data.last_updated}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Cards - 2 column grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {data.items.map((item) => (
          <Card
            key={item.metric_key}
            className="border-sidebar-border bg-sidebar-accent py-4"
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium text-sidebar-foreground">
                    {item.name}
                  </CardTitle>
                </div>
                {getQualityBadge(item.quality)}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.source}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="h-2 flex-1 mr-3 overflow-hidden rounded-full bg-sidebar">
                    <div
                      className={`h-full transition-all ${getProgressBarColor(item.coverage_pct)}`}
                      style={{ width: `${Math.min(item.coverage_pct, 100)}%` }}
                    />
                  </div>
                  <span className="shrink-0 font-medium text-sidebar-foreground">
                    {item.coverage_pct === 0 ? '미적재' : `${item.coverage_pct.toFixed(1)}%`}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{item.current_count.toLocaleString()} / {item.target_count.toLocaleString()}건</span>
                <span className="text-sidebar-border">·</span>
                <span>{item.current_periods} / {item.target_periods}개월</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
