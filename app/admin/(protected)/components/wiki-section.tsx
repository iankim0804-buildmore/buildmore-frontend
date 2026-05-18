'use client'

import type {
  FrontendWikiStats,
  FrontendProcessingQueue,
  FrontendWikiUpdate,
  FrontendProcessingTask,
} from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Layers3,
  Lightbulb,
  Loader2,
  Scale,
  XCircle,
} from 'lucide-react'

interface WikiSectionProps {
  wikiStats: FrontendWikiStats
  processingQueue: FrontendProcessingQueue
  wikiUpdates: FrontendWikiUpdate[]
}

function formatCount(value: number): string {
  return value.toLocaleString()
}

function compactCount(value: number): string {
  if (value >= 1000) return value.toLocaleString()
  return String(value)
}

function taskStatusLabel(task: FrontendProcessingTask): string {
  const parts = [
    task.queued > 0 ? `대기 ${formatCount(task.queued)}` : '',
    task.failed > 0 ? `실패 ${formatCount(task.failed)}` : '',
    task.processing > 0 ? `처리중 ${formatCount(task.processing)}` : '',
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' · ') : `완료 ${formatCount(task.done)}`
}

export function WikiSection({
  wikiStats,
  processingQueue,
  wikiUpdates,
}: WikiSectionProps) {
  const progressPercent = processingQueue.total > 0
    ? Math.round((processingQueue.done / processingQueue.total) * 100)
    : 0
  const visibleTasks = processingQueue.taskBreakdown.slice(0, 8)
  const hasQueueRisk = processingQueue.failed > 0 || processingQueue.queued > 0

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-sidebar-foreground">
            LLM Wiki 학습 현황
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            마지막 Fact 추출: {wikiStats.lastFactExtractedAt}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {hasQueueRisk ? (
            <AlertTriangle className="h-4 w-4 text-[#C9A24B]" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
          <span>
            대기 {formatCount(processingQueue.queued)}건 · 실패 {formatCount(processingQueue.failed)}건
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col items-center text-center">
            <Database className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold text-sidebar-foreground">
              {formatCount(wikiStats.metricSnapshots)}
            </div>
            <div className="text-xs text-muted-foreground">Metric Snapshots</div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col items-center text-center">
            <FileText className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold text-sidebar-foreground">
                {formatCount(wikiStats.facts)}
              </span>
              {wikiStats.facts < 100 && (
                <AlertTriangle className="h-4 w-4 text-[#C9A24B]" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Facts {wikiStats.facts < 100 && <span className="text-[#C9A24B]">부족</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col items-center text-center">
            <Lightbulb className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold text-sidebar-foreground">
              {formatCount(wikiStats.signals)}
            </div>
            <div className="text-xs text-muted-foreground">Signals</div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col items-center text-center">
            <Scale className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold text-sidebar-foreground">
              {formatCount(wikiStats.rules)}
            </div>
            <div className="text-xs text-muted-foreground">Rules</div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col items-center text-center">
            <Layers3 className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold text-sidebar-foreground">
              {formatCount(wikiStats.cases)}
            </div>
            <div className="text-xs text-muted-foreground">Cases</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 border-sidebar-border bg-sidebar-accent py-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between gap-3 text-sm font-medium text-sidebar-foreground">
            <span>Processing Queue</span>
            <span className="text-xs text-muted-foreground">{progressPercent}% 처리됨</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                전체 {formatCount(processingQueue.total)}건
              </span>
              <span className="text-sidebar-foreground">
                완료 {formatCount(processingQueue.done)}건
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-sidebar">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                대기 {formatCount(processingQueue.queued)}건
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5" />
                처리중 {formatCount(processingQueue.processing)}건
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <XCircle className="h-3.5 w-3.5" />
                실패 {formatCount(processingQueue.failed)}건
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
                스킵 {formatCount(processingQueue.skipped)}건
              </div>
            </div>
          </div>

          <div className="rounded bg-sidebar px-3 py-2">
            <div className="text-xs text-muted-foreground">주요 작업 대기</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <span className="text-sidebar-foreground">본문 {compactCount(processingQueue.breakdown.fetchBody)}</span>
              <span className="text-sidebar-foreground">요약 {compactCount(processingQueue.breakdown.summarize)}</span>
              <span className="text-sidebar-foreground">태깅 {compactCount(processingQueue.breakdown.tag)}</span>
              <span className="text-sidebar-foreground">임베딩 {compactCount(processingQueue.breakdown.embed)}</span>
              <span className="text-sidebar-foreground">Facts {compactCount(processingQueue.breakdown.extractFacts)}</span>
              <span className="text-sidebar-foreground">지표 {compactCount(processingQueue.breakdown.extractMetrics)}</span>
              <span className="text-sidebar-foreground">Wiki 문서 {compactCount(processingQueue.breakdown.compileWiki)}</span>
            </div>
          </div>

          {visibleTasks.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">task_type별 상태</div>
              <div className="grid gap-2 md:grid-cols-2">
                {visibleTasks.map((task) => (
                  <div
                    key={task.taskType}
                    className="flex min-w-0 items-center justify-between gap-3 rounded bg-sidebar px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-sidebar-foreground">{task.label}</div>
                      <div className="truncate text-muted-foreground">{task.taskType}</div>
                    </div>
                    <div className="shrink-0 text-right text-muted-foreground">
                      <div>{formatCount(task.total)}건</div>
                      <div className={task.failed > 0 ? 'text-red-400' : undefined}>
                        {taskStatusLabel(task)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4 border-sidebar-border bg-sidebar-accent py-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-sidebar-foreground">
            최근 Wiki 업데이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {wikiUpdates.length === 0 && (
              <div className="rounded bg-sidebar px-3 py-2 text-xs text-muted-foreground">
                최근 작업 기록이 없습니다.
              </div>
            )}
            {wikiUpdates.map((update) => (
              <div
                key={update.id}
                className="flex items-center gap-3 rounded bg-sidebar px-3 py-2 text-sm"
              >
                <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="w-16 shrink-0 text-xs text-muted-foreground">
                  {update.time}
                </span>
                <span className="min-w-0 truncate font-mono text-xs text-sidebar-foreground">
                  {update.jobName}
                </span>
                <span className="ml-auto max-w-[55%] truncate font-mono text-xs text-muted-foreground">
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
