// Admin API Types - matching current backend responses.

export interface AdminOverview {
  server_status: 'ok' | 'error'
  scheduler_status: 'ok' | 'error'
  pipeline_status: 'ok' | 'warning' | 'error'
  pipeline_queued_count: number
  last_updated_at: string
}

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

export interface AdminScheduler {
  jobs: SchedulerJob[]
}

export interface WikiData {
  metric_snapshots: number
  metric_observations?: number
  growth_scores?: number
  rank_snapshots?: number
  extracted_facts: number
  signals: number
  signal_cards?: number
  signal_card_wiki_documents?: number
  rules: number
  cases: number
  last_fact_extracted_at: string | null
  processing_queue: {
    total: number
    done: number
    queued: number
    failed: number
    by_task_type: Record<string, Record<string, number>>
  }
}

export interface WikiUpdate {
  id?: string
  type?: string
  title?: string
  created_at?: string
  job_id?: string
  job_name?: string
  status?: string
  ran_at?: string | null
  items_upserted?: number | null
  message?: string | null
}

export interface AdminWiki {
  wiki: WikiData
  recent_updates: WikiUpdate[]
}

export interface AdminWikiNoteVersion {
  version_no: number
  change_summary: string | null
  created_at: string
}

export interface AdminWikiNoteSummary {
  id: number
  title: string
  status: string
  freshness_status: string | null
  review_status: 'pending' | 'keep' | 'delete' | 'hold'
  review_note: string | null
  reviewed_at: string | null
  source_count: number
  version_count: number
  latest_change_summary: string | null
  latest_version_at: string | null
  last_compiled_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminWikiNoteDetail extends AdminWikiNoteSummary {
  content: string
  versions: AdminWikiNoteVersion[]
}

export interface AdminWikiGraphNode {
  id: number
  title: string
  status: string
  freshness_status: string | null
  review_status: string
  source_count: number
  degree: number
  incoming: number
  outgoing: number
  updated_at: string | null
  last_compiled_at: string | null
  summary: string
}

export interface AdminWikiGraphEdge {
  id: number
  source: number
  target: number
  relation_type: string
  weight: number
  confidence: number | null
  reason: string | null
  classifier_model: string | null
  created_at: string | null
}

export interface AdminWikiGraphCluster {
  id: string
  label: string
  note_ids: number[]
  size: number
}

export interface AdminWikiGraphFinding {
  id: number
  finding_type: string
  severity: string
  target_id: number | null
  summary: string
  suggested_fix: string | null
  created_at: string | null
}

export interface AdminWikiGraphEvent {
  id: number
  event_type: string
  note_id: number | null
  edge_id: number | null
  summary: string | null
  created_at: string | null
}

export interface AdminWikiGraph {
  stats: {
    nodes: number
    edges: number
    orphan_notes: number
    stale_notes: number
    open_findings: number
    relation_counts: Record<string, number>
    clusters: number
  }
  nodes: AdminWikiGraphNode[]
  edges: AdminWikiGraphEdge[]
  clusters: AdminWikiGraphCluster[]
  findings: AdminWikiGraphFinding[]
  recent_events: AdminWikiGraphEvent[]
}

export interface AdminSignalTickerItem {
  id: number
  headline: string
  summary: string | null
  district_name: string
  signal: string | null
  signal_strength: string | null
  frame: string
  report_date: string
  rank_score: number
  wiki_note_id: number | null
  source_metric_keys: string[]
  source_delta_ids: number[]
  click_count: number
  exposed_count: number
  created_at: string
  updated_at: string
}

export interface AdminCardNewsCandidateSummary {
  id: number
  headline: string
  subtitle: string | null
  region: string | null
  review_status: string
  trend_score: number
  visual_score: number
  confidence: number | null
  investment_takeaway: string | null
  why_promoted: string | null
  source_metric_keys: string[]
  created_at: string
  updated_at: string
}

export interface AdminCardNewsCandidateDetail extends AdminCardNewsCandidateSummary {
  key_numbers: Array<Record<string, unknown>>
  source_snapshot_ids: number[]
  source_delta_ids: number[]
  draft_payload: Record<string, unknown>
}

export interface UsageStats {
  analysis_requests_today: number
  analysis_requests_week: number
  analysis_requests_month: number
  chat_sessions_today?: number
  chat_sessions_week?: number
  chat_sessions_month?: number
  conversation_sessions_today?: number
  conversation_sessions_week?: number
  conversation_sessions_month?: number
  unique_ips_today: number
  unique_ips_week: number
  unique_ips_month?: number
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

async function fetchAdmin<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T | null; error: string | null }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(`/api/admin${path}`, {
      ...init,
      signal: controller.signal,
      credentials: 'include',
      headers: init?.headers,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      console.error(`[admin] API ${path} failed: ${res.status} ${res.statusText}`, errorText)
      return { data: null, error: `${res.status}: ${res.statusText}` }
    }

    return { data: await res.json() as T, error: null }
  } catch (error) {
    clearTimeout(timeoutId)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[admin] API ${path} error:`, errorMsg)
    return { data: null, error: errorMsg }
  }
}

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

export async function fetchWikiNotes(limit = 100): Promise<AdminWikiNoteSummary[]> {
  const result = await fetchAdmin<AdminWikiNoteSummary[]>(`/wiki/notes?limit=${limit}&status=`)
  return result.data ?? []
}

export async function fetchWikiNoteDetail(noteId: number): Promise<AdminWikiNoteDetail | null> {
  const result = await fetchAdmin<AdminWikiNoteDetail>(`/wiki/notes/${noteId}`)
  return result.data
}

export async function fetchWikiGraph(): Promise<AdminWikiGraph | null> {
  const result = await fetchAdmin<AdminWikiGraph>('/wiki-graph')
  return result.data
}

export async function generateWikiGraphLinks(noteId?: number): Promise<Record<string, unknown> | null> {
  const result = await fetchAdmin<Record<string, unknown>>('/wiki-graph/generate-links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(noteId ? { note_id: noteId } : { recent_limit: 100 }),
  })
  return result.data
}

export async function runWikiGraphLint(): Promise<Record<string, unknown> | null> {
  const result = await fetchAdmin<Record<string, unknown>>('/wiki-graph/lint', { method: 'POST' })
  return result.data
}

export async function reviewWikiNote(
  noteId: number,
  reviewStatus: AdminWikiNoteSummary['review_status'],
  reviewNote?: string,
): Promise<AdminWikiNoteDetail | null> {
  const result = await fetchAdmin<AdminWikiNoteDetail>(`/wiki/notes/${noteId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_status: reviewStatus, review_note: reviewNote || null }),
  })
  return result.data
}

export async function fetchWikiTickerItems(limit = 50): Promise<AdminSignalTickerItem[]> {
  const result = await fetchAdmin<AdminSignalTickerItem[]>(`/wiki/ticker-items?limit=${limit}`)
  return result.data ?? []
}

export async function fetchCardNewsCandidates(limit = 50): Promise<AdminCardNewsCandidateSummary[]> {
  const result = await fetchAdmin<AdminCardNewsCandidateSummary[]>(`/wiki/card-news-candidates?limit=${limit}`)
  return result.data ?? []
}

export async function fetchCardNewsCandidateDetail(candidateId: number): Promise<AdminCardNewsCandidateDetail | null> {
  const result = await fetchAdmin<AdminCardNewsCandidateDetail>(`/wiki/card-news-candidates/${candidateId}`)
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

export async function fetchAllAdminData(): Promise<FetchResult> {
  const results = await Promise.all([
    fetchAdmin<AdminOverview>('/overview'),
    fetchAdmin<AdminScheduler>('/scheduler'),
    fetchAdmin<AdminWiki>('/wiki'),
    fetchAdmin<AdminUsage>('/usage'),
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
      usage: results[3].data,
    },
    errors,
  }
}

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

export interface FrontendProcessingTask {
  taskType: string
  label: string
  total: number
  done: number
  queued: number
  failed: number
  processing: number
  skipped: number
}

export interface FrontendProcessingQueue {
  total: number
  done: number
  queued: number
  failed: number
  processing: number
  skipped: number
  breakdown: {
    embed: number
    summarize: number
    tag: number
    extractFacts: number
    extractMetrics: number
    compileWiki: number
    fetchBody: number
  }
  taskBreakdown: FrontendProcessingTask[]
}

export interface FrontendWikiStats {
  metricSnapshots: number
  metricObservations: number
  growthScores: number
  rankSnapshots: number
  facts: number
  signals: number
  signalCards: number
  signalCardWikiDocuments: number
  rules: number
  cases: number
  lastFactExtractedAt: string
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

export interface AdminDashboardData {
  systemStatus: FrontendSystemStatus
  schedulerJobs: FrontendSchedulerJob[]
  processingQueue: FrontendProcessingQueue
  wikiStats: FrontendWikiStats
  wikiUpdates: FrontendWikiUpdate[]
  usageStats: FrontendUsageStats
  recentAnalyses: FrontendRecentAnalysis[]
  lastUpdated: string
}

function formatKST(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

function formatRelativeTime(timestamp: string | null | undefined): string {
  if (!timestamp) return '-'

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '-'

  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  return `${diffDays}일 전`
}

const WIKI_TASK_LABELS: Record<string, string> = {
  fetch_body: '본문 수집',
  summarize: '요약',
  tag: '태깅',
  embed: '임베딩',
  extract_facts: 'Facts 추출',
  extract_metrics: '지표 추출',
  compile_wiki: 'Wiki 문서화',
  period_delta_recompute: 'Period Delta 재계산',
}

function getQueueStatusCount(
  byTaskType: WikiData['processing_queue']['by_task_type'] | undefined,
  taskType: string,
  status: string,
): number {
  return byTaskType?.[taskType]?.[status] ?? 0
}

function buildWikiTaskBreakdown(
  byTaskType: WikiData['processing_queue']['by_task_type'] | undefined,
): FrontendProcessingTask[] {
  return Object.entries(byTaskType ?? {})
    .map(([taskType, statuses]) => {
      const done = statuses.done ?? 0
      const queued = statuses.queued ?? 0
      const failed = statuses.failed ?? 0
      const processing = statuses.processing ?? 0
      const skipped = statuses.skipped ?? 0
      const explicitTotal = statuses.total ?? 0
      const total = explicitTotal || Object.values(statuses).reduce((sum, count) => sum + (count ?? 0), 0)

      return {
        taskType,
        label: WIKI_TASK_LABELS[taskType] ?? taskType,
        total,
        done,
        queued,
        failed,
        processing,
        skipped,
      }
    })
    .filter((task) => task.total > 0)
    .sort((a, b) => {
      const aOpen = a.queued + a.failed + a.processing
      const bOpen = b.queued + b.failed + b.processing
      if (bOpen !== aOpen) return bOpen - aOpen
      return b.total - a.total
    })
}

function formatWikiUpdateResult(update: WikiUpdate): string {
  if (update.message) return update.message
  if (update.status && update.items_upserted != null) {
    return `${update.status} · ${update.items_upserted.toLocaleString()}건`
  }
  return update.status || update.title || '-'
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

  const systemStatus: FrontendSystemStatus = {
    server: {
      status: data.overview?.server_status === 'ok' ? 'ok' : 'error',
      message: data.overview?.server_status === 'ok' ? 'API 응답 정상' : 'API 응답 오류',
    },
    scheduler: {
      active: jobs.filter((job) => job.last_status === 'success' || job.last_status === 'running').length,
      total: jobs.length,
    },
    pipeline: {
      status: data.overview?.pipeline_status === 'ok' ? 'ok'
        : data.overview?.pipeline_status === 'warning' ? 'warning'
          : 'danger',
      queued: data.overview?.pipeline_queued_count ?? 0,
    },
  }

  const schedulerJobs: FrontendSchedulerJob[] = jobs
    .filter((job): job is SchedulerJob => job != null)
    .map((job, index) => ({
      id: job.job_id || String(index + 1),
      name: job.name || '이름 없음',
      trigger: job.interval_description || job.trigger_type || '-',
      lastRun: job.last_run_time ? formatKST(new Date(job.last_run_time)) : null,
      nextRun: job.next_run_time ? formatKST(new Date(job.next_run_time)) : '-',
      lastStatus: job.last_status === 'success'
        ? 'success'
        : job.last_status === 'failure' ? 'failed' : 'pending',
      successCount: job.success_count_30d ?? 0,
      lastResult: job.last_message || `성공 ${job.success_count_30d ?? 0}건 / 실패 ${job.fail_count_30d ?? 0}건`,
    }))

  const wikiData = data.wiki?.wiki
  const wikiQueueByTaskType = wikiData?.processing_queue?.by_task_type
  const wikiTaskBreakdown = buildWikiTaskBreakdown(wikiQueueByTaskType)
  const processingQueue: FrontendProcessingQueue = {
    total: wikiData?.processing_queue?.total ?? 0,
    done: wikiData?.processing_queue?.done ?? 0,
    queued: wikiData?.processing_queue?.queued ?? 0,
    failed: wikiData?.processing_queue?.failed ?? 0,
    processing: wikiTaskBreakdown.reduce((sum, task) => sum + task.processing, 0),
    skipped: wikiTaskBreakdown.reduce((sum, task) => sum + task.skipped, 0),
    breakdown: {
      embed: getQueueStatusCount(wikiQueueByTaskType, 'embed', 'queued'),
      summarize: getQueueStatusCount(wikiQueueByTaskType, 'summarize', 'queued'),
      tag: getQueueStatusCount(wikiQueueByTaskType, 'tag', 'queued'),
      extractFacts: getQueueStatusCount(wikiQueueByTaskType, 'extract_facts', 'queued'),
      extractMetrics: getQueueStatusCount(wikiQueueByTaskType, 'extract_metrics', 'queued'),
      compileWiki: getQueueStatusCount(wikiQueueByTaskType, 'compile_wiki', 'queued'),
      fetchBody: getQueueStatusCount(wikiQueueByTaskType, 'fetch_body', 'queued'),
    },
    taskBreakdown: wikiTaskBreakdown,
  }

  const wikiStats: FrontendWikiStats = {
    metricSnapshots: wikiData?.metric_snapshots ?? 0,
    metricObservations: wikiData?.metric_observations ?? 0,
    growthScores: wikiData?.growth_scores ?? 0,
    rankSnapshots: wikiData?.rank_snapshots ?? 0,
    facts: wikiData?.extracted_facts ?? 0,
    signals: wikiData?.signals ?? 0,
    signalCards: wikiData?.signal_cards ?? 0,
    signalCardWikiDocuments: wikiData?.signal_card_wiki_documents ?? 0,
    rules: wikiData?.rules ?? 0,
    cases: wikiData?.cases ?? 0,
    lastFactExtractedAt: formatKST(wikiData?.last_fact_extracted_at ? new Date(wikiData.last_fact_extracted_at) : null),
  }

  const wikiUpdates: FrontendWikiUpdate[] = (data.wiki?.recent_updates ?? [])
    .filter((update): update is WikiUpdate => update != null)
    .map((update, index) => ({
      id: update.id || update.job_id || String(index + 1),
      time: formatRelativeTime(update.created_at || update.ran_at),
      jobName: update.type || update.job_name || update.job_id || '-',
      result: formatWikiUpdateResult(update),
    }))

  const stats = data.usage?.stats
  const usageStats: FrontendUsageStats = {
    analysisRequests: {
      today: stats?.analysis_requests_today ?? 0,
      thisWeek: stats?.analysis_requests_week ?? 0,
      thisMonth: stats?.analysis_requests_month ?? 0,
    },
    chatSessions: {
      today: stats?.chat_sessions_today ?? stats?.conversation_sessions_today ?? 0,
      thisWeek: stats?.chat_sessions_week ?? stats?.conversation_sessions_week ?? 0,
      thisMonth: stats?.chat_sessions_month ?? stats?.conversation_sessions_month ?? 0,
    },
    uniqueIps: {
      today: stats?.unique_ips_today ?? 0,
      thisWeek: stats?.unique_ips_week ?? 0,
      thisMonth: stats?.unique_ips_month ?? 0,
    },
  }

  const recentAnalyses: FrontendRecentAnalysis[] = (data.usage?.recent_analyses ?? [])
    .filter((analysis): analysis is RecentAnalysis => analysis != null)
    .map((analysis, index) => ({
      id: analysis.id || String(index + 1),
      time: formatRelativeTime(analysis.requested_at),
      inputType: analysis.input_type || '직접 입력',
      grade: mapGrade(analysis.grade),
      score: analysis.bankability_score ?? 0,
      responseTime: analysis.response_time_ms,
    }))

  return {
    systemStatus,
    schedulerJobs,
    processingQueue,
    wikiStats,
    wikiUpdates,
    usageStats,
    recentAnalyses,
    lastUpdated: formatKST(now),
  }
}

export interface DashboardResult {
  data: AdminDashboardData | null
  errors: string[]
}

export async function fetchAdminDashboardData(): Promise<DashboardResult> {
  const { data: rawData, errors } = await fetchAllAdminData()
  return { data: transformToFrontendData(rawData), errors }
}
