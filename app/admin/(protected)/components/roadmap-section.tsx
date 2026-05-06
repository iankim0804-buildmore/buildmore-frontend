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

// Helper to strip HTML comments and parse dates from text
function parseItemText(text: string): { cleanText: string; parsedAddedDate: string | null; parsedDoneDate: string | null } {
  let cleanText = text
  let parsedAddedDate: string | null = null
  let parsedDoneDate: string | null = null
  
  // Match HTML comments like <!-- added: 2026-05-05 --> or <!-- added: 2026-05-05, done: 2026-05-07 -->
  const commentMatch = text.match(/<!--\s*(.*?)\s*-->/)
  if (commentMatch) {
    const commentContent = commentMatch[1]
    
    // Parse added date
    const addedMatch = commentContent.match(/added:\s*(\d{4}-\d{2}-\d{2})/)
    if (addedMatch) {
      parsedAddedDate = addedMatch[1]
    }
    
    // Parse done date
    const doneMatch = commentContent.match(/done:\s*(\d{4}-\d{2}-\d{2})/)
    if (doneMatch) {
      parsedDoneDate = doneMatch[1]
    }
    
    // Remove the HTML comment from text
    cleanText = text.replace(/<!--.*?-->/g, '').trim()
  }
  
  return { cleanText, parsedAddedDate, parsedDoneDate }
}

// Item Row Component (no expandable details - dates are inline)
function RoadmapItemRow({ item }: { item: RoadmapItem }) {
  // Parse text to extract dates and clean HTML comments
  const { cleanText, parsedAddedDate, parsedDoneDate } = parseItemText(item.text)
  
  // Use parsed dates, fallback to item properties
  const addedDate = item.added_date || parsedAddedDate
  const doneDate = item.done_date || item.completed_date || parsedDoneDate
  
  return (
    <div className="flex items-center gap-2 py-1.5">
      {/* Checkbox */}
      <div className="shrink-0">
        {item.completed ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Square className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      
      {/* Text */}
      <span className={`flex-1 text-sm ${item.completed ? 'text-muted-foreground line-through' : 'text-sidebar-foreground'}`}>
        {cleanText}
      </span>
      
      {/* Date display - right aligned, nowrap */}
      <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
        {item.completed ? (
          // Completed items: "등록 YYYY-MM-DD  완료 YYYY-MM-DD"
          <>
            {addedDate && (
              <span className="text-[11px] text-muted-foreground">
                등록 {addedDate}
              </span>
            )}
            {doneDate && (
              <span className="text-[11px] text-muted-foreground">
                완료 {doneDate}
              </span>
            )}
          </>
        ) : (
          // Incomplete items: "추가 YYYY-MM-DD"
          addedDate && (
            <span className="text-[11px] text-muted-foreground">
              추가 {addedDate}
            </span>
          )
        )}
      </div>
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
