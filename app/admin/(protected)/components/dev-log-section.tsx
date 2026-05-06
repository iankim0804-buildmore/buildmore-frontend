'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, ChevronRight } from 'lucide-react'

// Types
interface DevLogEntry {
  date: string
  content: string
}

interface RoadmapSection {
  title: string
  raw_content?: string
  items?: unknown[]
}

interface RoadmapResponse {
  last_updated: string
  next_action: string
  sections: RoadmapSection[]
}

// Parse raw_content into date entries
function parseDevLogContent(rawContent: string): DevLogEntry[] {
  const entries: DevLogEntry[] = []
  
  // Split by date headers (### YYYY-MM-DD)
  const dateRegex = /^###\s*(\d{4}-\d{2}-\d{2})/gm
  const parts = rawContent.split(dateRegex)
  
  // parts[0] is content before first date (usually empty)
  // parts[1] is first date, parts[2] is first content
  // parts[3] is second date, parts[4] is second content, etc.
  for (let i = 1; i < parts.length; i += 2) {
    const date = parts[i]?.trim()
    const content = parts[i + 1]?.trim()
    
    if (date && content) {
      entries.push({ date, content })
    }
  }
  
  // Sort by date descending (most recent first)
  entries.sort((a, b) => b.date.localeCompare(a.date))
  
  return entries
}

// Render markdown content with simple parsing
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n')
  
  return (
    <div className="space-y-2 text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) return null
        
        // Check for value highlight line (→ 서비스 가치: or → **가치**:)
        if (trimmed.startsWith('→')) {
          return (
            <p key={idx} className="text-teal-600 font-medium mt-3">
              {renderInlineMarkdown(trimmed)}
            </p>
          )
        }
        
        // Check for list items (- or ·)
        if (trimmed.startsWith('-') || trimmed.startsWith('·')) {
          const text = trimmed.slice(1).trim()
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-muted-foreground mt-1.5">·</span>
              <span className="text-sidebar-foreground">{renderInlineMarkdown(text)}</span>
            </div>
          )
        }
        
        // Check for bold headers (**text:**)
        if (trimmed.match(/^\*\*[^*]+\*\*:?$/)) {
          return (
            <p key={idx} className="font-semibold text-sidebar-foreground mt-3 first:mt-0">
              {renderInlineMarkdown(trimmed)}
            </p>
          )
        }
        
        // Regular text
        return (
          <p key={idx} className="text-sidebar-foreground">
            {renderInlineMarkdown(trimmed)}
          </p>
        )
      })}
    </div>
  )
}

// Render inline markdown (bold text)
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2)
      return <strong key={idx}>{boldText}</strong>
    }
    return part
  })
}

// Collapsible entry for older dates
function CollapsibleEntry({ entry }: { entry: DevLogEntry }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="border-t border-sidebar-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full py-3 px-4 text-left hover:bg-sidebar/50 transition-colors"
      >
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
        <span className="text-sm font-medium text-sidebar-foreground">{entry.date}</span>
        <span className="text-xs text-muted-foreground">보기</span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200">
          <MarkdownContent content={entry.content} />
        </div>
      )}
    </div>
  )
}

export function DevLogSection() {
  const [entries, setEntries] = useState<DevLogEntry[]>([])
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
      
      const result: RoadmapResponse = await res.json()
      
      // Find the "개발 일지" section
      const devLogSection = result.sections.find(s => s.title === '개발 일지')
      
      if (devLogSection?.raw_content) {
        const parsed = parseDevLogContent(devLogSection.raw_content)
        setEntries(parsed)
      } else {
        setEntries([])
      }
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
  if (error && entries.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold text-sidebar-foreground flex items-center gap-2">
          <span>📔</span> 개발 일지
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
  if (isLoading && entries.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold text-sidebar-foreground flex items-center gap-2">
          <span>📔</span> 개발 일지
        </h2>
        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </section>
    )
  }

  // No data
  if (entries.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold text-sidebar-foreground flex items-center gap-2">
          <span>📔</span> 개발 일지
        </h2>
        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">개발 일지 데이터가 없습니다.</p>
          </CardContent>
        </Card>
      </section>
    )
  }

  const [latestEntry, ...olderEntries] = entries

  return (
    <section>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-sidebar-foreground flex items-center gap-2">
          <span>📔</span> 개발 일지
        </h2>
        
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            BuildMore V1.2 개발 중
          </Badge>
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

      {/* Main Card */}
      <Card className="border-sidebar-border bg-sidebar-accent overflow-hidden">
        {/* Latest Entry - Always expanded */}
        <CardHeader className="pb-2 pt-4">
          <div className="text-base font-semibold text-sidebar-foreground">
            {latestEntry.date}
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <MarkdownContent content={latestEntry.content} />
        </CardContent>
        
        {/* Older Entries - Collapsible */}
        {olderEntries.length > 0 && (
          <div className="border-t border-sidebar-border bg-sidebar/30">
            {olderEntries.map((entry) => (
              <CollapsibleEntry key={entry.date} entry={entry} />
            ))}
          </div>
        )}
      </Card>
    </section>
  )
}
