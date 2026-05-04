'use client'

import type { FrontendSchedulerJob, FrontendDataSource } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  AlertTriangle,
  Calendar,
} from 'lucide-react'

interface SchedulerSectionProps {
  jobs: FrontendSchedulerJob[]
  dataSources: FrontendDataSource[]
}

function getStatusIcon(status: FrontendSchedulerJob['lastStatus']) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-400" />
    case 'pending':
      return <Clock className="h-4 w-4 text-[#C9A24B]" />
  }
}

function getSuccessRateColor(rate: number) {
  if (rate >= 90) return 'bg-emerald-500'
  if (rate >= 70) return 'bg-[#C9A24B]'
  return 'bg-red-500'
}

export function SchedulerSection({ jobs, dataSources }: SchedulerSectionProps) {
  const inactiveSources = dataSources.filter((s) => !s.isActive)

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          자동수집 현황
        </h2>
        <Badge variant="outline" className="border-sidebar-border text-muted-foreground">
          최근 30일 기준
        </Badge>
      </div>

      {/* Jobs Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {jobs.map((job) => {
          const successRate = (job.successCount / 30) * 100

          return (
            <Card
              key={job.id}
              className="border-sidebar-border bg-sidebar-accent py-4"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.lastStatus)}
                    <CardTitle className="text-sm font-medium text-sidebar-foreground">
                      {job.name}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-sidebar-border text-xs text-muted-foreground"
                  >
                    {job.trigger}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    <span>최근 실행: {job.lastRun || '없음'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>다음 실행: {job.nextRun}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>30일 성공률</span>
                    <span className="text-sidebar-foreground">
                      {job.successCount}/30
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-sidebar">
                    <div
                      className={`h-full transition-all ${getSuccessRateColor(successRate)}`}
                      style={{ width: `${successRate}%` }}
                    />
                  </div>
                </div>

                <div className="rounded bg-sidebar px-2 py-1.5 font-mono text-xs text-muted-foreground">
                  마지막 결과: {job.lastResult}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Inactive Sources Warning */}
      {inactiveSources.length > 0 && (
        <Card className="mt-4 border-[#C9A24B]/30 bg-[#C9A24B]/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-[#C9A24B]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">반복 실패 소스</span>
            </div>
            <div className="mt-2 space-y-1">
              {inactiveSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Pause className="h-3 w-3 text-[#C9A24B]" />
                  <span>{source.name}</span>
                  <span className="text-xs">— {source.error}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
