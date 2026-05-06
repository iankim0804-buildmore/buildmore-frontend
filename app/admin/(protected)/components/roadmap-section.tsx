'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, ChevronDown, ChevronRight, CheckCircle2, Square, Info } from 'lucide-react'

// Types
interface RoadmapSubItem {
  text: string
}

interface RoadmapItem {
  text: string
  completed: boolean
  completed_date: string | null
  added_date: string | null
  done_date: string | null
  sub_items: RoadmapSubItem[]
}

interface RoadmapSection {
  title: string
  items: RoadmapItem[]
}

interface RoadmapResponse {
  last_updated: string
  next_action: string
  sections: RoadmapSection[]
}

// Helper functions
function getCompletionBadge(completed: number, total: number) {
  if (completed === 0) {
    return <Badge variant="outline" className="border-muted text-muted-foreground text-xs">완료 {completed} / {total}</Badge>
  }
  if (completed === total) {
    return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">완료 {completed} / {total}</Badge>
  }
  return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">완료 {completed} / {total}</Badge>
}

// Collapsible Item Component
function RoadmapItemRow({ item }: { item: RoadmapItem }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const hasDetails = item.completed && (item.completed_date || item.done_date || item.sub_items.length > 0)
  
  // Get the effective done date (prefer done_date, fallback to completed_date)
  const effectiveDoneDate = item.done_date || item.completed_date
  
  return (
    <div className="space-y-0">
      <div 
        className={`flex items-start gap-2 py-1.5 ${hasDetails ? 'cursor-pointer hover:bg-sidebar/50 -mx-2 px-2 rounded' : ''}`}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        {/* Checkbox */}
        <div className="mt-0.5 shrink-0">
          {item.completed ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Square className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        
        {/* Text */}
        <span className={`flex-1 text-sm ${item.completed ? 'text-muted-foreground line-through' : 'text-sidebar-foreground'}`}>
          {item.text}
        </span>
        
        {/* Date display */}
        <div className="flex items-center gap-3 shrink-0">
          {item.completed ? (
            // Completed items: show "추가 YYYY-MM-DD  완료 YYYY-MM-DD"
            <>
              {item.added_date && (
                <span className="text-xs text-muted-foreground">
                  추가 {item.added_date}
                </span>
              )}
              {effectiveDoneDate && (
                <span className="text-xs text-muted-foreground">
                  완료 {effectiveDoneDate}
                </span>
              )}
            </>
          ) : (
            // Incomplete items: show "추가 YYYY-MM-DD" on the right
            item.added_date && (
              <span className="text-xs text-muted-foreground">
                추가 {item.added_date}
              </span>
            )
          )}
        </div>
        
        {hasDetails && (
          <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        )}
      </div>
      
      {/* Expanded details */}
      {isExpanded && hasDetails && (
        <div className="ml-6 pb-2 space-y-1 animate-in slide-in-from-top-1 duration-200">
          {effectiveDoneDate && (
            <div className="text-xs text-muted-foreground">
              완료일: {effectiveDoneDate}
            </div>
          )}
          {item.sub_items.length > 0 && (
            <div className="space-y-0.5">
              {item.sub_items.map((subItem, idx) => (
                <div key={idx} className="text-xs text-muted-foreground pl-2 border-l border-sidebar-border">
                  {subItem.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Section Card Component
function RoadmapSectionCard({ section, isDataCoverageSection }: { section: RoadmapSection; isDataCoverageSection: boolean }) {
  const [isExpanded, setIsExpanded] = useState(!isDataCoverageSection && !section.title.includes('완료'))
  
  const completedCount = section.items.filter(item => item.completed).length
  const totalCount = section.items.length
  
  // Special handling for data coverage section
  if (isDataCoverageSection) {
    return (
      <Card className="border-sidebar-border bg-sidebar-accent py-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {section.title}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            <span>위 &quot;원천 데이터 적재 현황&quot; 섹션에서 확인하세요</span>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="border-sidebar-border bg-sidebar-accent py-4">
      <CardHeader className="pb-2">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-sm font-medium text-sidebar-foreground">
              {section.title}
            </CardTitle>
          </div>
          {getCompletionBadge(completedCount, totalCount)}
        </button>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-2">
          <div className="space-y-1">
            {section.items.map((item, idx) => (
              <RoadmapItemRow key={idx} item={item} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export function RoadmapSection() {
  const [data, setData] = useState<RoadmapResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)
    
    try {
      const res = await fetch('/api/admin/roadmap', {
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
      setIsRefreshing(false)
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
          개발 로드맵
        </h2>
        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => fetchData()}
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
          개발 로드맵
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

  return (
    <section>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          개발 로드맵
        </h2>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            다음 작업: {data.next_action}
          </span>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              업데이트: {data.last_updated}
            </span>
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="p-1.5 rounded hover:bg-sidebar transition-colors disabled:opacity-50"
              title="새로고침"
            >
              <RefreshCw className={`h-4 w-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Section Cards */}
      <div className="space-y-4">
        {data.sections.map((section, idx) => {
          const isDataCoverageSection = section.title.includes('원천 데이터 적재') || section.title.includes('자동 업데이트')
          return (
            <RoadmapSectionCard 
              key={idx} 
              section={section} 
              isDataCoverageSection={isDataCoverageSection}
            />
          )
        })}
      </div>
    </section>
  )
}
