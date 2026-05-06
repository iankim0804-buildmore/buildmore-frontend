'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, CheckSquare, Square, ChevronDown, ChevronRight } from 'lucide-react'

// Types
interface Metric {
  metric_key: string
  metric_name_ko: string
  unit: string
  collection_frequency: string
  data_source: string
  is_available: boolean
  priority: number
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

// Helper: get progress bar color based on rate
function getBarColor(rate: number): string {
  if (rate === 0) return 'bg-muted-foreground/30'
  if (rate <= 30) return 'bg-red-500'
  if (rate <= 60) return 'bg-amber-500'
  return 'bg-emerald-500'
}

// Helper: get card top border color based on rate
function getCardBorderColor(rate: number): string {
  if (rate === 0) return 'border-t-muted-foreground/30'
  if (rate <= 30) return 'border-t-red-500'
  if (rate <= 60) return 'border-t-amber-500'
  return 'border-t-emerald-500'
}

// Category Card Component
function CategoryCard({ category }: { category: Category }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <Card 
      className={`border-sidebar-border bg-sidebar-accent border-t-4 ${getCardBorderColor(category.rate)} overflow-hidden`}
    >
      {/* Card Header - Clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 hover:bg-sidebar/50 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm text-sidebar-foreground">
            {category.category_name}
          </span>
          <span className="text-xs text-muted-foreground">
            {category.available}/{category.total} <span className="font-medium">{category.rate}%</span>
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-sidebar mb-2">
          <div
            className={`h-full transition-all duration-300 ${getBarColor(category.rate)}`}
            style={{ width: `${Math.min(category.rate, 100)}%` }}
          />
        </div>
        
        {/* Toggle indicator */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          <span>지표 보기</span>
        </div>
      </button>
      
      {/* Expanded Metrics List */}
      {isExpanded && (
        <CardContent className="pt-0 pb-4 px-4 border-t border-sidebar-border">
          <div className="space-y-1.5 mt-3">
            {category.metrics
              .sort((a, b) => a.priority - b.priority)
              .map((metric) => (
                <div 
                  key={metric.metric_key}
                  className={`flex items-center gap-2 text-xs ${metric.is_available ? 'text-sidebar-foreground' : 'text-muted-foreground'}`}
                >
                  {/* Checkbox Icon */}
                  {metric.is_available ? (
                    <CheckSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Square className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  )}
                  
                  {/* Metric Info */}
                  <span className="flex-1 truncate">{metric.metric_name_ko}</span>
                  <span className="shrink-0 text-muted-foreground">{metric.unit}</span>
                  <span className="shrink-0 text-muted-foreground w-6 text-center">{metric.collection_frequency}</span>
                  <span className="shrink-0 text-muted-foreground w-12 text-right">{metric.data_source}</span>
                </div>
              ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export function DataCoverageSection() {
  const [data, setData] = useState<MetricCatalogResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/admin/metric-catalog', {
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

  const { overall, categories } = data

  return (
    <section>
      {/* Section Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          원천 데이터 적재 현황
        </h2>
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

      {/* Overall Progress Card */}
      <Card className="mb-4 border-sidebar-border bg-sidebar-accent">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-sidebar-foreground">전체 적재율</span>
            <span className="text-sm text-sidebar-foreground">
              <span className="text-xl font-bold">{overall.rate}%</span>
              <span className="text-muted-foreground ml-2">({overall.available}/{overall.total})</span>
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

      {/* Category Cards Grid - 3 columns */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.category_code} category={category} />
        ))}
      </div>
    </section>
  )
}
