'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdminDashboardData, type AdminDashboardData } from '@/lib/api/admin'
import { StatusBar } from './components/status-bar'
import { SchedulerSection } from './components/scheduler-section'
import { WikiSection } from './components/wiki-section'
import { UsageSection } from './components/usage-section'
import { DataLayerSection } from './components/data-layer-section'
import { DeltaSection } from './components/delta-section'
import { DataCoverageSection } from './components/data-coverage-section'
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
      console.error('[v0] Admin fetch error:', err)
      setErrors([err instanceof Error ? err.message : '알 수 없는 오류'])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialFetch = setTimeout(fetchData, 0)

    const onFocus = () => {
      fetchData()
    }
    window.addEventListener('focus', onFocus)

    function msUntilNext0910KST() {
      const now = new Date()
      const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
      const target = new Date(kstNow)
      target.setHours(9, 10, 0, 0)
      if (kstNow >= target) {
        target.setDate(target.getDate() + 1)
      }
      return target.getTime() - kstNow.getTime()
    }

    let dailyInterval: ReturnType<typeof setInterval>
    const initialTimeout = setTimeout(() => {
      fetchData()
      dailyInterval = setInterval(() => {
        fetchData()
      }, 24 * 60 * 60 * 1000)
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
      <div className="admin-shadcn-surface flex min-h-screen items-center justify-center px-4">
        <div className="rounded-xl border bg-card px-8 py-7 text-center text-card-foreground shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <div className="text-sm text-muted-foreground">데이터 로딩 중...</div>
        </div>
      </div>
    )
  }

  if (errors.length > 0 && !data) {
    return (
      <div className="admin-shadcn-surface flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-xl border bg-card p-6 text-center text-card-foreground shadow-sm">
          <div className="mb-2 text-lg font-semibold text-destructive">API 연결 오류</div>
          <div className="mb-4 rounded-lg border bg-muted/40 p-4 text-left text-muted-foreground">
            <p className="mb-2 font-medium">다음 API 호출에서 오류가 발생했습니다:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs">
              • 401 오류: 로그인이 필요하거나 ADMIN_INTERNAL_KEY가 잘못되었습니다.<br />
              • 500 오류: 백엔드 서버 문제입니다.<br />
              • Timeout: 네트워크 연결을 확인하세요.
            </p>
          </div>
          <button
            onClick={() => {
              setIsLoading(true)
              setErrors([])
              fetchData()
            }}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="admin-shadcn-surface flex min-h-screen items-center justify-center px-4">
        <div className="rounded-xl border bg-card px-8 py-7 text-sm text-muted-foreground shadow-sm">
          데이터가 없습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shadcn-surface min-h-screen pb-12">
      <StatusBar
        systemStatus={data.systemStatus}
        lastRefresh={lastRefresh}
      />

      <main className="mx-auto max-w-7xl space-y-8 px-4 pt-6 sm:px-6 lg:px-8">
        <DevLogSection />

        <SchedulerSection
          jobs={data.schedulerJobs}
          dataSources={data.dataSources}
        />

        <WikiSection
          wikiStats={data.wikiStats}
          processingQueue={data.processingQueue}
          wikiUpdates={data.wikiUpdates}
        />

        <UsageSection
          usageStats={data.usageStats}
          recentAnalyses={data.recentAnalyses}
        />

        <DataLayerSection
          systemInfo={data.systemInfo}
        />

        <DeltaSection onRefresh={fetchData} />

        <DataCoverageSection />
      </main>
    </div>
  )
}
