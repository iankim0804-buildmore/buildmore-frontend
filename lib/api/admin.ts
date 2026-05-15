// Admin API Types - matching ACTUAL backend responses

// === Overview API Response ===
export interface AdminOverview {
  server_status: 'ok' | 'error'
  scheduler_status: 'ok' | 'error'
  pipeline_status: 'ok' | 'warning' | 'error'
  pipeline_queued_count: number
  last_updated_at: string
}

// === Scheduler API Response ===
export interface SchedulerJob {
  job_id: string
  name: string
  trigger_type: string
  interval_description: string
  next_run_time: string | null
  last_run_time: string | null
  last_status: 'success' | 'failure' | 'running' | null
  last_message: string | null
  success_count_30d: number
  fail_count_30d: number
  total_count_30d: number
}

export interface FailedSource {
  name: string
  error: string
}

export interface AdminScheduler {
  jobs: SchedulerJob[]
  failed_sources: FailedSource[]
}

// === Wiki API Response ===
export interface WikiData {
  metric_snapshots: number
  extracted_facts: number
  signals: number
  rules: number
  cases: number
  last_fact_extracted_at: string | null
  processing_queue: {
    total: number
    done: number
    queued: number
    failed: number
    by_task_type: Record<string, { total: number; done: number; queued: number }>
  }
}

export interface WikiUpdate {
  id: string
  type: string
  title: string
  created_at: string
}

export interface AdminWiki {
  wiki: WikiData
  recent_updates: WikiUpdate[]
}

// === Usage API Response ===
export interface UsageStats {
  analysis_requests_today: number
  analysis_requests_week: number
  analysis_requests_month: number
  chat_sessions_today: number
  chat_sessions_week: number
  chat_sessions_month: number
  unique_ips_today: number
  unique_ips_week: number
  unique_ips_month: number
}

export interface RecentAnalysis {
  id?: string
  requested_at: string
  input_type: string
  grade: string | null
  bankability_score: number | null
  response_time_ms: number | null
}

export interface AdminUsage {
  stats: UsageStats
  recent_analyses: RecentAnalysis[]
}

export interface AdminData {
  overview: AdminOverview | null
  scheduler: AdminScheduler | null
  wiki: AdminWiki | null
  usage: AdminUsage | null
}

// Fetch wrapper with timeout and error handling
async function fetchAdmin<T>(path: string): Promise<{ data: T | null; error: string | null }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(`/api/admin${path}`, {
      signal: controller.signal,
      credentials: 'include'
    })
    
    clearTimeout(timeoutId)
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      console.error(`[v0] API ${path} failed: ${res.status} ${res.statusText}`, errorText)
      return { data: null, error: `${res.status}: ${res.statusText}` }
    }
    
    const data = await res.json()
    return { data: data as T, error: null }
  } catch (error) {
    clearTimeout(timeoutId)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[v0] API ${path} error:`, errorMsg)
    return { data: null, error: errorMsg }
  }
}

// Individual fetch functions
export async function fetchOverview(): Promise<AdminOverview | null> {
  const result = await fetchAdmin<AdminOverview>('/overview')
  return result.data
}

export async function fetchScheduler(): Promise<AdminScheduler | null> {
  const result = await fetchAdmin<AdminScheduler>('/scheduler')
  return result.data
}

export async function fetchWiki(): Promise<AdminWiki | null> {
  const result = await fetchAdmin<AdminWiki>('/wiki')
  return result.data
}

export async function fetchUsage(): Promise<AdminUsage | null> {
  const result = await fetchAdmin<AdminUsage>('/usage')
  return result.data
}

export interface FetchResult {
  data: AdminData
  errors: string[]
}

// Fetch all admin data at once with error tracking
export async function fetchAllAdminData(): Promise<FetchResult> {
  const results = await Promise.all([
    fetchAdmin<AdminOverview>('/overview'),
    fetchAdmin<AdminScheduler>('/scheduler'),
    fetchAdmin<AdminWiki>('/wiki'),
    fetchAdmin<AdminUsage>('/usage')
  ])

  const errors: string[] = []
  if (results[0].error) errors.push(`Overview: ${results[0].error}`)
  if (results[1].error) errors.push(`Scheduler: ${results[1].error}`)
  if (results[2].error) errors.push(`Wiki: ${results[2].error}`)
  if (results[3].error) errors.push(`Usage: ${results[3].error}`)

  return {
    data: {
      overview: results[0].data,
      scheduler: results[1].data,
      wiki: results[2].data,
      usage: results[3].data
    },
    errors
  }
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
  responseTime: number | null
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

function formatKST(date: Date | null | undefined): string {
  if (!date || isNaN(date.getTime())) return '-'
  
  try {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul',
    })
  } catch {
    return '-'
  }
}

function formatRelativeTime(timestamp: string | null | undefined): string {
  if (!timestamp) return '-'
  
  try {
    const now = new Date()
    const date = new Date(timestamp)
    
    if (isNaN(date.getTime())) return '-'
    
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${diffDays}일 전`
  } catch {
    return '-'
  }
}

function mapGrade(grade: string | null | undefined): 'A' | 'B+' | 'B' | 'C' | 'D' {
  if (!grade) return 'D'
  const normalized = grade.toUpperCase()
  if (normalized === 'A' || normalized === 'A+') return 'A'
  if (normalized === 'B+') return 'B+'
  if (normalized === 'B') return 'B'
  if (normalized === 'C' || normalized === 'C+') return 'C'
  return 'D'
}

export function transformToFrontendData(data: AdminData): AdminDashboardData {
  const now = new Date()
  const jobs = data.scheduler?.jobs ?? []

  // Transform overview to systemStatus
  const systemStatus: FrontendSystemStatus = {
    server: {
      status: data.overview?.server_status === 'ok' ? 'ok' : 'error',
      message: data.overview?.server_status === 'ok' ? 'API 응답 정상' : 'API 응답 오류',
    },
    scheduler: {
      active: jobs.filter(j => j.last_status === 'success' || j.last_status === 'running').length,
      total: jobs.length,
    },
    pipeline: {
      status: data.overview?.pipeline_status === 'ok' ? 'ok' :
              data.overview?.pipeline_status === 'warning' ? 'warning' : 'danger',
      queued: data.overview?.pipeline_queued_count ?? 0,
    },
  }

  // Transform scheduler jobs - using ACTUAL backend field names
  const schedulerJobs: FrontendSchedulerJob[] = jobs
    .filter((job): job is SchedulerJob => job != null)
    .map((job, index) => ({
      id: job.job_id || String(index + 1),
      name: job.name || '알 수 없음',
      trigger: job.interval_description || job.trigger_type || '-',
      lastRun: job.last_run_time ? formatKST(new Date(job.last_run_time)) : null,
      nextRun: job.next_run_time ? formatKST(new Date(job.next_run_time)) : '-',
      lastStatus: job.last_status === 'success' ? 'success' :
                  job.last_status === 'failure' ? 'failed' : 'pending',
      successCount: job.success_count_30d ?? 0,
      lastResult: job.last_message || `성공 ${job.success_count_30d ?? 0}회 / 실패 ${job.fail_count_30d ?? 0}회`,
    }))

  // Data sources from failed_sources
  const failedSources = data.scheduler?.failed_sources ?? []
  const dataSources: FrontendDataSource[] = [
    { id: '1', name: '서울시 열린데이터광장', isActive: true },
    { id: '2', name: '소상공인시장진흥공단', isActive: true },
    { id: '3', name: '유튜브 채널 (구해줘빌딩)', isActive: true },
    { id: '4', name: '시공조아 블로그', isActive: true },
    ...failedSources.map((fs, i) => ({
      id: `failed-${i}`,
      name: fs.name,
      isActive: false,
      error: fs.error,
    }))
  ]

  // Transform wiki data - using ACTUAL nested structure
  const wikiData = data.wiki?.wiki
  const processingQueue: FrontendProcessingQueue = {
    total: wikiData?.processing_queue?.total ?? 0,
    done: wikiData?.processing_queue?.done ?? 0,
    queued: wikiData?.processing_queue?.queued ?? 0,
    breakdown: {
      embed: wikiData?.processing_queue?.by_task_type?.embed?.queued ?? 0,
      summarize: wikiData?.processing_queue?.by_task_type?.summarize?.queued ?? 0,
      tag: wikiData?.processing_queue?.by_task_type?.tag?.queued ?? 0,
    },
  }

  const wikiStats: FrontendWikiStats = {
    metricSnapshots: wikiData?.metric_snapshots ?? 0,
    facts: wikiData?.extracted_facts ?? 0,
    signals: wikiData?.signals ?? 0,
    rules: wikiData?.rules ?? 0,
  }

  const wikiUpdates: FrontendWikiUpdate[] = (data.wiki?.recent_updates ?? [])
    .filter((update): update is WikiUpdate => update != null)
    .map((update, index) => ({
      id: update.id || String(index + 1),
      time: formatRelativeTime(update.created_at),
      jobName: update.type || '-',
      result: update.title || '-',
    }))

  // Transform usage data - using ACTUAL field names
  const stats = data.usage?.stats
  const usageStats: FrontendUsageStats = {
    analysisRequests: {
      today: stats?.analysis_requests_today ?? 0,
      thisWeek: stats?.analysis_requests_week ?? 0,
      thisMonth: stats?.analysis_requests_month ?? 0,
    },
    chatSessions: {
      today: stats?.chat_sessions_today ?? 0,
      thisWeek: stats?.chat_sessions_week ?? 0,
      thisMonth: stats?.chat_sessions_month ?? 0,
    },
    uniqueIps: {
      today: stats?.unique_ips_today ?? 0,
      thisWeek: stats?.unique_ips_week ?? 0,
      thisMonth: stats?.unique_ips_month ?? 0,
    },
  }

  // Transform recent analyses - using ACTUAL field names
  const recentAnalyses: FrontendRecentAnalysis[] = (data.usage?.recent_analyses ?? [])
    .filter((analysis): analysis is RecentAnalysis => analysis != null)
    .map((analysis, index) => ({
      id: analysis.id || String(index + 1),
      time: formatRelativeTime(analysis.requested_at),
      inputType: analysis.input_type || '직접입력',
      grade: mapGrade(analysis.grade),
      score: analysis.bankability_score ?? 0,
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
      url: 'buildmore-backend.replit.app',
      spec: 'Reserved VM · 0.5 vCPU / 2 GiB · Asia 리전',
      region: 'Asia',
      status: data.overview?.server_status === 'ok' ? 'ok' : 'error',
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

export interface DashboardResult {
  data: AdminDashboardData | null
  errors: string[]
}

// Fetch and transform admin data for frontend use
export async function fetchAdminDashboardData(): Promise<DashboardResult> {
  const { data: rawData, errors } = await fetchAllAdminData()
  const transformed = transformToFrontendData(rawData)
  return { data: transformed, errors }
}
