'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Store, Users, Lightbulb, Loader2 } from 'lucide-react'

// Delta data types
interface DeltaMetric {
  previous_period_delta_pct: number
  direction: 'up' | 'down' | 'flat'
  strength: 'strong' | 'moderate' | 'weak'
  current_period_start: string
  signal_message: string | null
}

interface MarketDeltaData {
  region_code: string
  area_sales: DeltaMetric | null
  floating_population: DeltaMetric | null
}

// Mock data for rendering before API connection
const mockDeltaData: MarketDeltaData = {
  region_code: '1144000000',
  area_sales: {
    previous_period_delta_pct: 12.4,
    direction: 'up',
    strength: 'moderate',
    current_period_start: '2026-04-01',
    signal_message: '상권 매출이 직전 기간 대비 12.4% 증가했습니다.',
  },
  floating_population: {
    previous_period_delta_pct: -10.5,
    direction: 'down',
    strength: 'moderate',
    current_period_start: '2026-04-01',
    signal_message: '유동인구가 직전 기간 대비 10.5% 감소했습니다.',
  },
}

interface MarketTrendSectionProps {
  regionCode?: string
  className?: string
}

export function MarketTrendSection({ regionCode = '1144000000', className }: MarketTrendSectionProps) {
  const [deltaData, setDeltaData] = useState<MarketDeltaData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDeltaData() {
      setIsLoading(true)
      setError(null)

      try {
        // TODO: Replace with actual API call when ready
        // const res = await fetch(`/api/analysis/${regionCode}/delta-summary`)
        // if (!res.ok) throw new Error('Failed to fetch delta data')
        // const data = await res.json()
        // setDeltaData(data)

        // For now, simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 800))
        setDeltaData(mockDeltaData)
      } catch (err) {
        console.error('[v0] Delta fetch error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeltaData()
  }, [regionCode])

  // Don't render anything if there's an error (fail silently as per requirements)
  if (error) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={`border-border bg-white ${className ?? ''}`}>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">시장 트렌드 로딩 중...</span>
        </CardContent>
      </Card>
    )
  }

  // Don't render if no data
  if (!deltaData) {
    return null
  }

  const { area_sales, floating_population } = deltaData

  // Get combined signal message (prioritize area_sales signal)
  const signalMessage = area_sales?.signal_message || floating_population?.signal_message

  // Get period start for data source attribution
  const periodStart = area_sales?.current_period_start || floating_population?.current_period_start

  return (
    <Card className={`border-border bg-white overflow-hidden ${className ?? ''}`}>
      {/* Header */}
      <CardHeader className="pb-3 border-b border-border bg-secondary/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            시장 변화 트렌드
          </CardTitle>
          <Badge variant="secondary" className="text-xs font-normal">
            LLM Wiki Delta 분석
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Two metrics side by side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Area Sales Metric */}
          {area_sales && (
            <DeltaMetricCard
              icon={<Store className="w-4 h-4" />}
              label="상권 매출"
              metric={area_sales}
            />
          )}

          {/* Floating Population Metric */}
          {floating_population && (
            <DeltaMetricCard
              icon={<Users className="w-4 h-4" />}
              label="유동인구"
              metric={floating_population}
            />
          )}
        </div>

        {/* Signal Message Box */}
        {signalMessage && (
          <div className="p-3 bg-chart-1/5 rounded-lg border border-chart-1/10">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-chart-1 mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">
                {signalMessage}
              </p>
            </div>
          </div>
        )}

        {/* Data Source Attribution */}
        {periodStart && (
          <p className="text-xs text-muted-foreground text-right">
            출처: BuildMore Wiki Delta 분석 | 기준: {periodStart}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Sub-component for individual delta metric
function DeltaMetricCard({
  icon,
  label,
  metric,
}: {
  icon: React.ReactNode
  label: string
  metric: DeltaMetric
}) {
  const { previous_period_delta_pct, direction, strength } = metric

  // Direction styling
  const directionConfig = {
    up: {
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
      text: '직전 기간 대비 상승',
    },
    down: {
      icon: <TrendingDown className="w-4 h-4" />,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      text: '직전 기간 대비 하락',
    },
    flat: {
      icon: <Minus className="w-4 h-4" />,
      color: 'text-muted-foreground',
      bgColor: 'bg-secondary',
      text: '보합',
    },
  }

  // Strength styling
  const strengthConfig = {
    strong: {
      variant: 'default' as const,
      className: 'bg-foreground text-background',
    },
    moderate: {
      variant: 'secondary' as const,
      className: 'bg-secondary text-foreground',
    },
    weak: {
      variant: 'outline' as const,
      className: 'border-border text-muted-foreground',
    },
  }

  const config = directionConfig[direction]
  const strengthStyle = strengthConfig[strength]

  // Format percentage with sign
  const formattedPct = direction === 'up' 
    ? `+${previous_period_delta_pct.toFixed(1)}%`
    : direction === 'down'
    ? `${previous_period_delta_pct.toFixed(1)}%`
    : `${previous_period_delta_pct.toFixed(1)}%`

  return (
    <div className={`p-3 rounded-lg ${config.bgColor}`}>
      {/* Label with icon */}
      <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>

      {/* Percentage value */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-xl font-bold ${config.color}`}>
          {formattedPct}
        </span>
        <span className={config.color}>{config.icon}</span>
      </div>

      {/* Direction text */}
      <p className="text-xs text-muted-foreground mb-2">{config.text}</p>

      {/* Strength badge */}
      <Badge variant={strengthStyle.variant} className={`text-xs ${strengthStyle.className}`}>
        {strength === 'strong' ? '강함' : strength === 'moderate' ? '보통' : '약함'}
      </Badge>
    </div>
  )
}
