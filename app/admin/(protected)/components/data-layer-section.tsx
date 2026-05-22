'use client'

import type {
  FrontendSystemInfo,
} from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle2,
  XCircle,
  Server,
  Database,
  Globe,
} from 'lucide-react'

interface DataLayerSectionProps {
  systemInfo: FrontendSystemInfo
}

export function DataLayerSection({
  systemInfo,
}: DataLayerSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-sidebar-foreground">
        데이터 레이어
      </h2>

      <div className="grid gap-4 md:grid-cols-3">
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

        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-sidebar-foreground">
                프론트엔드
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
