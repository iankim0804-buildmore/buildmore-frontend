'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, Database, Gauge, RefreshCw, ServerCog, ShieldCheck } from 'lucide-react'
import { fetchAdminDashboardData, type AdminDashboardData } from '@/lib/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBar } from './components/status-bar'
import { SchedulerSection } from './components/scheduler-section'
import { WikiSection } from './components/wiki-section'
import { UsageSection } from './components/usage-section'
import { DataLayerSection } from './components/data-layer-section'
import { DeltaSection } from './components/delta-section'
import { DataCoverageSection } from './components/data-coverage-section'
import { RoadmapSection } from './components/roadmap-section'
import { DevLogSection } from './components/dev-log-section'

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchAdminDashboardData()

      if (result.data) {
        setData(result.data)
        setLastRefresh(new Date())
      }

      setErrors(result.errors)
    } catch (err) {
      console.error('[admin] fetch error:', err)
      setErrors([err instanceof Error ? err.message : '알 수 없는 오류'])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialFetch = setTimeout(fetchData, 0)

    const onFocus = () => fetchData()
    window.addEventListener('focus', onFocus)

    function msUntilNext0910KST() {
      const now = new Date()
      const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
      const target = new Date(kstNow)
      target.setHours(9, 10, 0, 0)
      if (kstNow >= target) target.setDate(target.getDate() + 1)
      return target.getTime() - kstNow.getTime()
    }

    let dailyInterval: ReturnType<typeof setInterval>
    const initialTimeout = setTimeout(() => {
      fetchData()
      dailyInterval = setInterval(fetchData, 24 * 60 * 60 * 1000)
    }, msUntilNext0910KST())

    return () => {
      window.removeEventListener('focus', onFocus)
      clearTimeout(initialFetch)
      clearTimeout(initialTimeout)
      if (dailyInterval) clearInterval(dailyInterval)
    }
  }, [fetchData])

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="text-muted-foreground">어드민 데이터를 불러오는 중입니다.</div>
        </div>
      </div>
    )
  }

  if (errors.length > 0 && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <Card className="mx-4 max-w-xl">
          <CardHeader>
            <CardTitle className="text-destructive">API 연결 오류</CardTitle>
            <CardDescription>어드민 데이터를 가져오지 못했습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
              <ul className="list-inside list-disc space-y-1">
                {errors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
              <p className="mt-4 text-xs">
                401은 로그인/ADMIN_INTERNAL_KEY, 500은 백엔드 로그, Timeout은 백엔드 응답 시간을 확인하세요.
              </p>
            </div>
            <Button
              onClick={() => {
                setIsLoading(true)
                setErrors([])
                fetchData()
              }}
            >
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <div className="text-muted-foreground">표시할 데이터가 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      <StatusBar systemStatus={data.systemStatus} lastRefresh={lastRefresh} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge variant="secondary" className="mb-3">BuildMore Admin</Badge>
                  <CardTitle className="text-2xl">데이터 코어 운영 대시보드</CardTitle>
                  <CardDescription className="mt-2 max-w-2xl">
                    원천데이터 수집, 세부지표 연결, Wiki/Delta 파이프라인, 사용량을 한 화면에서 점검합니다.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  새로고침
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-md border bg-background p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ServerCog className="h-4 w-4" />
                    서버
                  </div>
                  <div className="mt-2 font-semibold">{data.systemStatus.server.status === 'ok' ? '정상' : '오류'}</div>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    스케줄러
                  </div>
                  <div className="mt-2 font-semibold">{data.systemStatus.scheduler.active}/{data.systemStatus.scheduler.total}</div>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Database className="h-4 w-4" />
                    Wiki Queue
                  </div>
                  <div className="mt-2 font-semibold">{data.systemStatus.pipeline.queued.toLocaleString()}건</div>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Gauge className="h-4 w-4" />
                    최근 분석
                  </div>
                  <div className="mt-2 font-semibold">{data.recentAnalyses.length.toLocaleString()}건</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                운영 기준
              </CardTitle>
              <CardDescription>보호 라우트와 내부 API 키로 백엔드 운영 지표를 조회합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>마지막 갱신: {data.lastUpdated}</div>
              <div>Backend: {data.systemInfo.backend.url}</div>
              <div>DB: {data.systemInfo.database.name}</div>
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue="sources" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="sources">원천데이터</TabsTrigger>
            <TabsTrigger value="wiki">Wiki/Delta</TabsTrigger>
            <TabsTrigger value="scheduler">스케줄러</TabsTrigger>
            <TabsTrigger value="usage">사용량</TabsTrigger>
            <TabsTrigger value="infra">인프라</TabsTrigger>
            <TabsTrigger value="roadmap">로드맵</TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="space-y-6">
            <DataCoverageSection />
          </TabsContent>

          <TabsContent value="wiki" className="space-y-6">
            <WikiSection
              wikiStats={data.wikiStats}
              processingQueue={data.processingQueue}
              wikiUpdates={data.wikiUpdates}
            />
            <DeltaSection onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="scheduler" className="space-y-6">
            <SchedulerSection jobs={data.schedulerJobs} dataSources={data.dataSources} />
            <DevLogSection />
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <UsageSection usageStats={data.usageStats} recentAnalyses={data.recentAnalyses} />
          </TabsContent>

          <TabsContent value="infra" className="space-y-6">
            <DataLayerSection
              dataSources={data.dataSources}
              plannedSources={data.plannedSources}
              systemInfo={data.systemInfo}
            />
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-6">
            <RoadmapSection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
