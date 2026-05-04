'use client'

import type {
  FrontendWikiStats,
  FrontendProcessingQueue,
  FrontendWikiUpdate,
} from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Database, FileText, Lightbulb, Scale, Clock } from 'lucide-react'

interface WikiSectionProps {
  wikiStats: FrontendWikiStats
  processingQueue: FrontendProcessingQueue
  wikiUpdates: FrontendWikiUpdate[]
}

export function WikiSection({
  wikiStats,
  processingQueue,
  wikiUpdates,
}: WikiSectionProps) {
  const progressPercent = processingQueue.total > 0 
    ? Math.round((processingQueue.done / processingQueue.total) * 100) 
    : 0

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-sidebar-foreground">
        LLM Wiki 학습 현황
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col items-center text-center">
            <Database className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold text-sidebar-foreground">
              {wikiStats.metricSnapshots.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Metric Snapshots</div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col items-center text-center">
            <FileText className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold text-sidebar-foreground">
                {wikiStats.facts}
              </span>
              {wikiStats.facts < 100 && (
                <AlertTriangle className="h-4 w-4 text-[#C9A24B]" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Facts{' '}
              {wikiStats.facts < 100 && (
                <span className="text-[#C9A24B]">부족</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col items-center text-center">
            <Lightbulb className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold text-sidebar-foreground">
              {wikiStats.signals}
            </div>
            <div className="text-xs text-muted-foreground">Signals</div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col items-center text-center">
            <Scale className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold text-sidebar-foreground">
              {wikiStats.rules}
            </div>
            <div className="text-xs text-muted-foreground">Rules</div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Queue */}
      <Card className="mt-4 border-sidebar-border bg-sidebar-accent py-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-sidebar-foreground">
            Processing Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                전체: {processingQueue.total.toLocaleString()}건
              </span>
              <span className="text-sidebar-foreground">
                {progressPercent}% 처리됨
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-sidebar">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>완료: {processingQueue.done.toLocaleString()}건</span>
              <span>대기: {processingQueue.queued.toLocaleString()}건</span>
            </div>
          </div>

          <div className="rounded bg-sidebar px-3 py-2">
            <div className="text-xs text-muted-foreground">task_type별 대기</div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>
                <span className="text-sidebar-foreground">embed</span>{' '}
                <span className="text-muted-foreground">
                  {processingQueue.breakdown.embed.toLocaleString()}건
                </span>
              </span>
              <span>
                <span className="text-sidebar-foreground">summarize</span>{' '}
                <span className="text-muted-foreground">
                  {processingQueue.breakdown.summarize.toLocaleString()}건
                </span>
              </span>
              <span>
                <span className="text-sidebar-foreground">tag</span>{' '}
                <span className="text-muted-foreground">
                  {processingQueue.breakdown.tag.toLocaleString()}건
                </span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Wiki Updates */}
      <Card className="mt-4 border-sidebar-border bg-sidebar-accent py-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-sidebar-foreground">
            최근 Wiki 업데이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {wikiUpdates.map((update) => (
              <div
                key={update.id}
                className="flex items-center gap-3 rounded bg-sidebar px-3 py-2 text-sm"
              >
                <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="w-16 shrink-0 text-xs text-muted-foreground">
                  {update.time}
                </span>
                <span className="font-mono text-xs text-sidebar-foreground">
                  {update.jobName}
                </span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {update.result}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
