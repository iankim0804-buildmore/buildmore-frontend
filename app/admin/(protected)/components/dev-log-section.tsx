'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw } from 'lucide-react'

// Types based on new API response
interface DevLogEntry {
  date: string
  title: string
  content: string
  is_latest: boolean
  is_collapsed: boolean
}

interface RoadmapSection {
  title: string
  raw_content?: string
  items?: unknown[]
  devlog_entries?: DevLogEntry[]
}

interface RoadmapResponse {
  last_updated: string
  next_action: string
  sections: RoadmapSection[]
}

// Render markdown content with simple parsing
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n')
  
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) return null
        
        // Skip HTML tags like <details>, <summary>
        if (trimmed.startsWith('<') && trimmed.endsWith('>')) return null
        if (trimmed.startsWith('</')) return null
        
        // Check for value highlight line (→ **가치**: or → 가치:)
        if (trimmed.startsWith('→')) {
          return (
            <p key={idx} className="text-teal-600 font-medium mt-2 pl-2">
              {renderInlineMarkdown(trimmed)}
            </p>
          )
        }
        
        // Check for list items (- or ·)
        if (trimmed.startsWith('-') || trimmed.startsWith('·')) {
          const text = trimmed.slice(1).trim()
          return (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-muted-foreground">·</span>
              <span className="text-sidebar-foreground">{renderInlineMarkdown(text)}</span>
            </div>
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

// Collapsible entry for older dates with triangle toggle
function CollapsibleEntry({ entry }: { entry: DevLogEntry }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="border-t border-sidebar-border first:border-t-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full py-2.5 px-4 text-left hover:bg-sidebar/50 transition-colors cursor-pointer"
      >
        <span className="text-muted-foreground text-xs select-none">
          {isOpen ? '▼' : '▶'}
        </span>
        <span className="text-xs text-muted-foreground font-mono">{entry.date}</span>
        <span className="text-sm text-sidebar-foreground">{entry.title}</span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pl-10 animate-in slide-in-from-top-1 duration-200">
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
      
      // Use devlog_entries if available (new API format)
      if (devLogSection?.devlog_entries && devLogSection.devlog_entries.length > 0) {
        setEntries(devLogSection.devlog_entries)
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

  // Error state - only show if there was an error
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

  // No devlog_entries - hide section entirely
  if (entries.length === 0) {
    return null
  }

  // Separate latest entry from older entries
  const latestEntry = entries.find(e => e.is_latest)
  const olderEntries = entries.filter(e => !e.is_latest)

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
        {/* Latest Entry - Always expanded with date and title */}
        {latestEntry && (
          <>
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-mono">{latestEntry.date}</span>
                <span className="text-base font-semibold text-sidebar-foreground">{latestEntry.title}</span>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <MarkdownContent content={latestEntry.content} />
            </CardContent>
          </>
        )}
        
        {/* Older Entries - Collapsible toggles */}
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
