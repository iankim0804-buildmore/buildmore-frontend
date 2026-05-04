'use client'

import { useEffect, useState } from 'react'
import type { SystemStatus } from '@/lib/admin-mock-data'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Clock,
  Activity,
} from 'lucide-react'

interface StatusBarProps {
  systemStatus: SystemStatus
  lastRefresh: Date
}

export function StatusBar({ systemStatus, lastRefresh }: StatusBarProps) {
  const [relativeTime, setRelativeTime] = useState('방금 전')

  useEffect(() => {
    const updateRelativeTime = () => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000)

      if (diff < 10) {
        setRelativeTime('방금 전')
      } else if (diff < 60) {
        setRelativeTime(`${diff}초 전`)
      } else {
        setRelativeTime(`${Math.floor(diff / 60)}분 전`)
      }
    }

    updateRelativeTime()
    const interval = setInterval(updateRelativeTime, 1000)
    return () => clearInterval(interval)
  }, [lastRefresh])

  const getPipelineStatus = () => {
    const { queued } = systemStatus.pipeline
    if (queued > 1000) return { status: 'danger', icon: XCircle, color: 'text-red-400' }
    if (queued > 500) return { status: 'warning', icon: AlertTriangle, color: 'text-[#C9A24B]' }
    return { status: 'ok', icon: CheckCircle2, color: 'text-emerald-400' }
  }

  const pipelineInfo = getPipelineStatus()
  const PipelineIcon = pipelineInfo.icon

  return (
    <div className="sticky top-0 z-50 border-b border-sidebar-border bg-sidebar/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Server Status */}
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-4 py-2.5">
            <Server className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-1 items-center gap-2">
              {systemStatus.server.status === 'ok' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              <span className="text-sm font-medium">
                {systemStatus.server.status === 'ok' ? '서버 정상' : '서버 오류'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {systemStatus.server.message}
            </span>
          </div>

          {/* Scheduler Status */}
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-4 py-2.5">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-1 items-center gap-2">
              {systemStatus.scheduler.active === systemStatus.scheduler.total ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-[#C9A24B]" />
              )}
              <span className="text-sm font-medium">
                스케줄러 {systemStatus.scheduler.active}/{systemStatus.scheduler.total}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {systemStatus.scheduler.active === systemStatus.scheduler.total
                ? '모든 잡 가동 중'
                : `${systemStatus.scheduler.total - systemStatus.scheduler.active}개 중단`}
            </span>
          </div>

          {/* Pipeline Status */}
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-4 py-2.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-1 items-center gap-2">
              <PipelineIcon className={`h-4 w-4 ${pipelineInfo.color}`} />
              <span className="text-sm font-medium">
                {pipelineInfo.status === 'ok'
                  ? 'Wiki 파이프라인 정상'
                  : 'Wiki 파이프라인 주의'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              queued {systemStatus.pipeline.queued.toLocaleString()}건 대기
            </span>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-2 text-center text-xs text-muted-foreground">
          마지막 갱신: {relativeTime}
        </div>
      </div>
    </div>
  )
}
