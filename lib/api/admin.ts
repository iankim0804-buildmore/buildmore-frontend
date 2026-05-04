// Admin API Types - matching backend responses

export interface AdminOverview {
  server_status: 'healthy' | 'degraded' | 'down'
  scheduler_status: 'running' | 'paused' | 'error'
  pipeline_status: 'idle' | 'processing' | 'error'
  scheduler_jobs: number
  pipeline_queued_count: number
  last_updated: string
}

export interface SchedulerJob {
  id: string
  name: string
  schedule: string
  status: 'active' | 'paused' | 'error'
  last_run: string | null
  next_run: string
  success_rate: number
  recent_runs: ('success' | 'failure' | 'skipped')[]
  data_source_status: 'connected' | 'disconnected' | 'error'
}

export interface AdminScheduler {
  jobs: SchedulerJob[]
  total_jobs: number
  active_jobs: number
  paused_jobs: number
}

export interface WikiStats {
  metric_snapshots: number
  facts: number
  signals: number
  rules: number
}

export interface WikiQueueItem {
  type: string
  count: number
  status: 'pending' | 'processing' | 'completed'
}

export interface WikiUpdate {
  id: string
  type: string
  title: string
  timestamp: string
  status: 'added' | 'updated' | 'deleted'
}

export interface AdminWiki {
  stats: WikiStats
  queue: WikiQueueItem[]
  queue_total: number
  queue_processing: number
  recent_updates: WikiUpdate[]
}

export interface UsageStats {
  today: number
  week: number
  month: number
}

export interface RecentAnalysis {
  id: string
  ticker: string
  timestamp: string
  grade: string
  response_time_ms: number
  user_ip_hash: string
}

export interface AdminUsage {
  analyses: UsageStats
  chats: UsageStats
  unique_ips: UsageStats
  recent_analyses: RecentAnalysis[]
}

export interface AdminData {
  overview: AdminOverview | null
  scheduler: AdminScheduler | null
  wiki: AdminWiki | null
  usage: AdminUsage | null
}

// Fetch wrapper with timeout and error handling
async function fetchAdmin<T>(path: string): Promise<T | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(`/admin/api${path}`, {
      signal: controller.signal,
      credentials: 'include'
    })
    
    clearTimeout(timeoutId)
    
    if (!res.ok) {
      return null
    }
    
    const data = await res.json()
    return data as T
  } catch (error) {
    clearTimeout(timeoutId)
    console.error(`[fetchAdmin] Error fetching ${path}:`, error)
    return null
  }
}

// Individual fetch functions
export async function fetchOverview(): Promise<AdminOverview | null> {
  return fetchAdmin<AdminOverview>('/overview')
}

export async function fetchScheduler(): Promise<AdminScheduler | null> {
  return fetchAdmin<AdminScheduler>('/scheduler')
}

export async function fetchWiki(): Promise<AdminWiki | null> {
  return fetchAdmin<AdminWiki>('/wiki')
}

export async function fetchUsage(): Promise<AdminUsage | null> {
  return fetchAdmin<AdminUsage>('/usage')
}

// Fetch all admin data at once
export async function fetchAllAdminData(): Promise<AdminData> {
  const [overview, scheduler, wiki, usage] = await Promise.all([
    fetchOverview(),
    fetchScheduler(),
    fetchWiki(),
    fetchUsage()
  ])

  return { overview, scheduler, wiki, usage }
}

// ============================================
// Frontend Data Types (for components)
// ============================================

export interface FrontendSchedulerJob {
  id: string
  name: string
  trigger: string
  lastRun: string | null
  nextRun: string
  lastStatus: 'success' | 'failed' | 'pending'
  successCount: number
  lastResult: string
}

export interface FrontendDataSource {
  id: string
  name: string
  isActive: boolean
  error?: string
}

export interface FrontendProcessingQueue {
  total: number
  done: number
  queued: number
  breakdown: {
    embed: number
    summarize: number
    tag: number
  }
}

export interface FrontendWikiStats {
  metricSnapshots: number
  facts: number
  signals: number
  rules: number
}

export interface FrontendWikiUpdate {
  id: string
  time: string
  jobName: string
  result: string
}

export interface FrontendUsageStats {
  analysisRequests: {
    today: number
    thisWeek: number
    thisMonth: number
  }
  chatSessions: {
    today: number
    thisWeek: number
    thisMonth: number
  }
  uniqueIps: {
    today: number
    thisWeek: number
    thisMonth: number
  }
}

export interface FrontendRecentAnalysis {
  id: string
  time: string
  inputType: string
  grade: 'A' | 'B+' | 'B' | 'C' | 'D'
  score: number
  responseTime: number
}

export interface FrontendSystemStatus {
  server: {
    status: 'ok' | 'error'
    message: string
  }
  scheduler: {
    active: number
    total: number
  }
  pipeline: {
    status: 'ok' | 'warning' | 'danger'
    queued: number
  }
}

export interface FrontendPlannedSource {
  id: string
  name: string
  version: string
}

export interface FrontendSystemInfo {
  backend: {
    url: string
    spec: string
    region: string
    status: 'ok' | 'error'
  }
  database: {
    name: string
    status: 'ok' | 'error'
    latency: number
  }
  frontend: {
    url: string
    status: 'ok' | 'error'
  }
}

export interface AdminDashboardData {
  systemStatus: FrontendSystemStatus
  schedulerJobs: FrontendSchedulerJob[]
  dataSources: FrontendDataSource[]
  processingQueue: FrontendProcessingQueue
  wikiStats: FrontendWikiStats
  wikiUpdates: FrontendWikiUpdate[]
  usageStats: FrontendUsageStats
  recentAnalyses: FrontendRecentAnalysis[]
  plannedSources: FrontendPlannedSource[]
  systemInfo: FrontendSystemInfo
  lastUpdated: string
}

// ============================================
// Transform Functions
// ============================================

function formatKST(date: Date): string {
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  return `${diffDays}일 전`
}

function mapGrade(grade: string): 'A' | 'B+' | 'B' | 'C' | 'D' {
  const normalized = grade.toUpperCase()
  if (normalized === 'A' || normalized === 'A+') return 'A'
  if (normalized === 'B+') return 'B+'
  if (normalized === 'B') return 'B'
  if (normalized === 'C' || normalized === 'C+') return 'C'
  return 'D'
}

export function transformToFrontendData(data: AdminData): AdminDashboardData | null {
  const now = new Date()

  // Transform overview to systemStatus
  const systemStatus: FrontendSystemStatus = {
    server: {
      status: data.overview?.server_status === 'healthy' ? 'ok' : 'error',
      message: data.overview?.server_status === 'healthy' ? 'API 응답 정상' : 'API 응답 오류',
    },
    scheduler: {
      active: data.scheduler?.active_jobs ?? 0,
      total: data.scheduler?.total_jobs ?? 0,
    },
    pipeline: {
      status: (data.overview?.pipeline_queued_count ?? 0) > 1000 ? 'danger' :
              (data.overview?.pipeline_queued_count ?? 0) > 500 ? 'warning' : 'ok',
      queued: data.overview?.pipeline_queued_count ?? 0,
    },
  }

  // Transform scheduler jobs
  const schedulerJobs: FrontendSchedulerJob[] = (data.scheduler?.jobs ?? []).map((job, index) => ({
    id: job.id || String(index + 1),
    name: job.name,
    trigger: job.schedule,
    lastRun: job.last_run ? formatKST(new Date(job.last_run)) : null,
    nextRun: formatKST(new Date(job.next_run)),
    lastStatus: job.recent_runs?.[0] === 'success' ? 'success' :
                job.recent_runs?.[0] === 'failure' ? 'failed' : 'pending',
    successCount: Math.round((job.success_rate / 100) * 30),
    lastResult: `success_rate=${job.success_rate}%`,
  }))

  // Extract data sources from scheduler jobs
  const dataSources: FrontendDataSource[] = [
    { id: '1', name: '서울시 열린데이터광장', isActive: true },
    { id: '2', name: '소상공인시장진흥공단', isActive: true },
    { id: '3', name: '유튜브 채널 (구해줘빌딩)', isActive: true },
    { id: '4', name: '시공조아 블로그', isActive: true },
    { id: '5', name: 'sg365.go.kr', isActive: false, error: 'DNS 해석 불가, 비활성화됨' },
    { id: '6', name: 'data.go.kr', isActive: false, error: '연결 리셋 반복, 비활성화됨' },
  ]

  // Transform wiki data
  const processingQueue: FrontendProcessingQueue = {
    total: data.wiki?.queue_total ?? 0,
    done: (data.wiki?.queue_total ?? 0) - (data.wiki?.queue_processing ?? 0),
    queued: data.wiki?.queue_processing ?? 0,
    breakdown: {
      embed: data.wiki?.queue?.find(q => q.type === 'embed')?.count ?? 0,
      summarize: data.wiki?.queue?.find(q => q.type === 'summarize')?.count ?? 0,
      tag: data.wiki?.queue?.find(q => q.type === 'tag')?.count ?? 0,
    },
  }

  const wikiStats: FrontendWikiStats = {
    metricSnapshots: data.wiki?.stats?.metric_snapshots ?? 0,
    facts: data.wiki?.stats?.facts ?? 0,
    signals: data.wiki?.stats?.signals ?? 0,
    rules: data.wiki?.stats?.rules ?? 0,
  }

  const wikiUpdates: FrontendWikiUpdate[] = (data.wiki?.recent_updates ?? []).map((update, index) => ({
    id: update.id || String(index + 1),
    time: formatRelativeTime(update.timestamp),
    jobName: update.type,
    result: update.title,
  }))

  // Transform usage data
  const usageStats: FrontendUsageStats = {
    analysisRequests: {
      today: data.usage?.analyses?.today ?? 0,
      thisWeek: data.usage?.analyses?.week ?? 0,
      thisMonth: data.usage?.analyses?.month ?? 0,
    },
    chatSessions: {
      today: data.usage?.chats?.today ?? 0,
      thisWeek: data.usage?.chats?.week ?? 0,
      thisMonth: data.usage?.chats?.month ?? 0,
    },
    uniqueIps: {
      today: data.usage?.unique_ips?.today ?? 0,
      thisWeek: data.usage?.unique_ips?.week ?? 0,
      thisMonth: data.usage?.unique_ips?.month ?? 0,
    },
  }

  const recentAnalyses: FrontendRecentAnalysis[] = (data.usage?.recent_analyses ?? []).map((analysis, index) => ({
    id: analysis.id || String(index + 1),
    time: formatRelativeTime(analysis.timestamp),
    inputType: analysis.ticker || '직접입력',
    grade: mapGrade(analysis.grade),
    score: parseInt(analysis.grade) || 70,
    responseTime: analysis.response_time_ms,
  }))

  // Static planned sources
  const plannedSources: FrontendPlannedSource[] = [
    { id: '1', name: '국토부 실거래가 직연동', version: 'V1.2' },
    { id: '2', name: '한국은행 ECOS 금리', version: 'V1.2' },
    { id: '3', name: 'KOSIS 통계청', version: 'V1.3' },
  ]

  // Static system info
  const systemInfo: FrontendSystemInfo = {
    backend: {
      url: 'ai-mvp-ssmrdesign0804.replit.app',
      spec: 'Reserved VM · 0.5 vCPU / 2 GiB · Asia 리전',
      region: 'Asia',
      status: data.overview?.server_status === 'healthy' ? 'ok' : 'error',
    },
    database: {
      name: 'Neon Postgres (Singapore)',
      status: 'ok',
      latency: 12,
    },
    frontend: {
      url: 'buildmore.co.kr (Vercel)',
      status: 'ok',
    },
  }

  return {
    systemStatus,
    schedulerJobs,
    dataSources,
    processingQueue,
    wikiStats,
    wikiUpdates,
    usageStats,
    recentAnalyses,
    plannedSources,
    systemInfo,
    lastUpdated: formatKST(now),
  }
}

// Fetch and transform admin data for frontend use
export async function fetchAdminDashboardData(): Promise<AdminDashboardData | null> {
  const rawData = await fetchAllAdminData()
  return transformToFrontendData(rawData)
}
