'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  CheckCircle2,
  XCircle,
  Server,
  Database,
  Globe,
} from 'lucide-react'

interface DataLayerSectionProps {
  backendStatus: 'ok' | 'error'
}

export function DataLayerSection({
  backendStatus,
}: DataLayerSectionProps) {
  return (
    <section>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-sidebar-foreground">
                가비아 VPS
              </span>
              {backendStatus === 'ok' ? (
                <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="ml-auto h-4 w-4 text-red-400" />
              )}
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-mono text-muted-foreground">
                api.buildmore.co.kr
              </div>
              <div className="text-muted-foreground">
                Gabia VPS · Ubuntu · buildmore-web + scheduler
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
              <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-mono text-muted-foreground">
                Neon Postgres (Singapore)
              </div>
              <div className="text-muted-foreground">
                응답 12ms
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
              <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-mono text-muted-foreground">
                buildmore.co.kr (Vercel)
              </div>
              <div className="text-muted-foreground">Vercel Edge</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
