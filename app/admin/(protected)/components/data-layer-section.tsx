'use client'

import type {
  DataSource,
  PlannedSource,
  SystemInfo,
} from '@/lib/admin-mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Server,
  Database,
  Globe,
} from 'lucide-react'

interface DataLayerSectionProps {
  dataSources: DataSource[]
  plannedSources: PlannedSource[]
  systemInfo: SystemInfo
}

export function DataLayerSection({
  dataSources,
  plannedSources,
  systemInfo,
}: DataLayerSectionProps) {
  const activeSources = dataSources.filter((s) => s.isActive)
  const inactiveSources = dataSources.filter((s) => !s.isActive)

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-sidebar-foreground">
        데이터 레이어
      </h2>

      {/* Data Sources */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Connected Sources */}
        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-sidebar-foreground">
              연결된 소스
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-sidebar-foreground">{source.name}</span>
                </div>
              ))}
              {inactiveSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span className="text-muted-foreground">
                    {source.name}{' '}
                    <span className="text-xs">(비활성화)</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Planned Sources */}
        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-sidebar-foreground">
              연결 예정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {plannedSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Clock className="h-4 w-4 shrink-0 text-[#C9A24B]" />
                  <span className="text-muted-foreground">
                    {source.name}{' '}
                    <span className="text-xs text-[#C9A24B]">
                      ({source.version})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {/* Backend */}
        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-sidebar-foreground">
                백엔드
              </span>
              {systemInfo.backend.status === 'ok' ? (
                <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="ml-auto h-4 w-4 text-red-400" />
              )}
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-mono text-muted-foreground">
                {systemInfo.backend.url}
              </div>
              <div className="text-muted-foreground">
                {systemInfo.backend.spec}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database */}
        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-sidebar-foreground">
                DB
              </span>
              {systemInfo.database.status === 'ok' ? (
                <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="ml-auto h-4 w-4 text-red-400" />
              )}
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-mono text-muted-foreground">
                {systemInfo.database.name}
              </div>
              <div className="text-muted-foreground">
                응답 {systemInfo.database.latency}ms
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Frontend */}
        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-sidebar-foreground">
                프론트
              </span>
              {systemInfo.frontend.status === 'ok' ? (
                <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="ml-auto h-4 w-4 text-red-400" />
              )}
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-mono text-muted-foreground">
                {systemInfo.frontend.url}
              </div>
              <div className="text-muted-foreground">Vercel Edge</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
