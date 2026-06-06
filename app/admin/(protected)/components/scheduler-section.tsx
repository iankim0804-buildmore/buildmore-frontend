'use client'

import type { FrontendSchedulerJob } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
} from 'lucide-react'

interface SchedulerSectionProps {
  jobs: FrontendSchedulerJob[]
}

function getStatusIcon(status: FrontendSchedulerJob['lastStatus']) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-400" />
    case 'pending':
      return <Clock className="h-4 w-4 text-amber-500" />
  }
}

function getSuccessRateColor(rate: number) {
  if (rate >= 90) return 'bg-emerald-500'
  if (rate >= 70) return 'bg-amber-500'
  return 'bg-red-500'
}

function getStatusLabel(status: FrontendSchedulerJob['lastStatus']) {
  switch (status) {
    case 'success':
      return '정상'
    case 'failed':
      return '실패'
    case 'pending':
      return '대기'
  }
}

export function SchedulerSection({ jobs }: SchedulerSectionProps) {
  const scheduledJobs = [...jobs].sort((a, b) => {
    const aTime = a.nextRunAt ? new Date(a.nextRunAt).getTime() : Number.POSITIVE_INFINITY
    const bTime = b.nextRunAt ? new Date(b.nextRunAt).getTime() : Number.POSITIVE_INFINITY

    if (aTime !== bTime) return aTime - bTime
    return a.name.localeCompare(b.name, 'ko-KR')
  })

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

      {scheduledJobs.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-md border border-sidebar-border bg-sidebar-accent">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full table-fixed text-left text-sm">
              <thead className="border-b border-sidebar-border bg-sidebar">
                <tr className="text-xs font-medium text-muted-foreground">
                  <th className="w-[190px] px-4 py-3">다음 실행 시간</th>
                  <th className="w-[320px] px-4 py-3">임무</th>
                  <th className="w-[160px] px-4 py-3">반복</th>
                  <th className="w-[90px] px-4 py-3">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sidebar-border">
                {scheduledJobs.map((job) => (
                  <tr key={job.id} className="text-sidebar-foreground">
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {job.nextRun}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <div className="truncate">{job.name}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div className="truncate">{job.trigger}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        {getStatusIcon(job.lastStatus)}
                        {getStatusLabel(job.lastStatus)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Jobs Grid */}
      {scheduledJobs.length === 0 ? (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-medium">web role에서 등록된 스케줄러 잡이 없습니다.</div>
              <div className="mt-1 text-xs text-amber-100/80">
                scheduler role이 별도 프로세스에서 실행 중인 배포 구조일 수 있으니 ops 로그와 scheduler role 상태를 함께 확인하세요.
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {scheduledJobs.map((job) => {
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
      )}
    </section>
  )
}
