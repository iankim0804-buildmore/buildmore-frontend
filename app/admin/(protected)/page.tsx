'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAdminDashboardData, type AdminDashboardData } from '@/lib/api/admin'
import { StatusBar } from './components/status-bar'
import { SchedulerSection } from './components/scheduler-section'
import { WikiSection } from './components/wiki-section'
import { UsageSection } from './components/usage-section'
import { DataLayerSection } from './components/data-layer-section'

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const newData = await fetchAdminDashboardData()
      if (newData) {
        setData(newData)
        setLastRefresh(new Date())
        setError(null)
      } else {
        // If no data and no existing data, show error
        if (!data) {
          setError('데이터를 불러올 수 없습니다. 백엔드 API 연결을 확인해주세요.')
        }
      }
    } catch (err) {
      console.error('[v0] Admin fetch error:', err)
      if (!data) {
        setError('데이터 로딩 중 오류가 발생했습니다.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [data])

  useEffect(() => {
    // Initial fetch
    fetchData()

    // Set up 30-second polling
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [fetchData])

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <div className="text-muted-foreground">데이터 로딩 중...</div>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-destructive text-lg font-medium mb-2">오류 발생</div>
          <div className="text-muted-foreground mb-4">{error}</div>
          <button
            onClick={() => {
              setIsLoading(true)
              setError(null)
              fetchData()
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">데이터가 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Status Bar - Fixed at top */}
      <StatusBar
        systemStatus={data.systemStatus}
        lastRefresh={lastRefresh}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl space-y-8 px-4 pt-6 sm:px-6 lg:px-8">
        {/* Section 1: Scheduler Jobs */}
        <SchedulerSection
          jobs={data.schedulerJobs}
          dataSources={data.dataSources}
        />

        {/* Section 2: Wiki Stats */}
        <WikiSection
          wikiStats={data.wikiStats}
          processingQueue={data.processingQueue}
          wikiUpdates={data.wikiUpdates}
        />

        {/* Section 3: Usage Stats */}
        <UsageSection
          usageStats={data.usageStats}
          recentAnalyses={data.recentAnalyses}
        />

        {/* Section 4: Data Layer & System Info */}
        <DataLayerSection
          dataSources={data.dataSources}
          plannedSources={data.plannedSources}
          systemInfo={data.systemInfo}
        />
      </main>
    </div>
  )
}
