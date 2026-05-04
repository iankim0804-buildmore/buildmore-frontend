'use client'

import { useEffect, useState, useCallback } from 'react'
import { getMockAdminData, type AdminDashboardData } from '@/lib/admin-mock-data'
import { StatusBar } from './components/status-bar'
import { SchedulerSection } from './components/scheduler-section'
import { WikiSection } from './components/wiki-section'
import { UsageSection } from './components/usage-section'
import { DataLayerSection } from './components/data-layer-section'

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = useCallback(() => {
    // TODO: Replace with actual API call
    const mockData = getMockAdminData()
    setData(mockData)
    setLastRefresh(new Date())
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchData()

    // Set up 30-second polling
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [fetchData])

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
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
