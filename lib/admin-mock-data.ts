// Mock data for admin dashboard
// TODO: Replace with actual API calls from lib/api/admin.ts

export interface SchedulerJob {
  id: string
  name: string
  trigger: string // "cron" | "interval 30분" | "interval 1시간"
  lastRun: string | null
  nextRun: string
  lastStatus: 'success' | 'failed' | 'pending'
  successCount: number // out of 30 days
  lastResult: string
}

export interface DataSource {
  id: string
  name: string
  isActive: boolean
  error?: string
}

export interface ProcessingQueue {
  total: number
  done: number
  queued: number
  breakdown: {
    embed: number
    summarize: number
    tag: number
  }
}

export interface WikiStats {
  metricSnapshots: number
  facts: number
  signals: number
  rules: number
}

export interface WikiUpdate {
  id: string
  time: string
  jobName: string
  result: string
}

export interface UsageStats {
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

export interface RecentAnalysis {
  id: string
  time: string
  inputType: string
  grade: 'A' | 'B+' | 'B' | 'C' | 'D'
  score: number
  responseTime: number // ms
}

export interface SystemStatus {
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

export interface PlannedSource {
  id: string
  name: string
  version: string
}

export interface SystemInfo {
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
  systemStatus: SystemStatus
  schedulerJobs: SchedulerJob[]
  dataSources: DataSource[]
  processingQueue: ProcessingQueue
  wikiStats: WikiStats
  wikiUpdates: WikiUpdate[]
  usageStats: UsageStats
  recentAnalyses: RecentAnalysis[]
  plannedSources: PlannedSource[]
  systemInfo: SystemInfo
  lastUpdated: string
}

// Mock data generator
export function getMockAdminData(): AdminDashboardData {
  const now = new Date()
  const formatKST = (date: Date) => {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul',
    })
  }

  return {
    systemStatus: {
      server: {
        status: 'ok',
        message: 'API 응답 정상',
      },
      scheduler: {
        active: 10,
        total: 10,
      },
      pipeline: {
        status: 'warning',
        queued: 916,
      },
    },
    schedulerJobs: [
      {
        id: '1',
        name: 'collect_seoul_opendata',
        trigger: 'cron 매일 06:00',
        lastRun: formatKST(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
        nextRun: formatKST(new Date(now.getTime() + 22 * 60 * 60 * 1000)),
        lastStatus: 'success',
        successCount: 28,
        lastResult: 'processed=142 succeeded=142',
      },
      {
        id: '2',
        name: 'collect_sbiz_data',
        trigger: 'cron 매일 07:00',
        lastRun: formatKST(new Date(now.getTime() - 3 * 60 * 60 * 1000)),
        nextRun: formatKST(new Date(now.getTime() + 21 * 60 * 60 * 1000)),
        lastStatus: 'success',
        successCount: 30,
        lastResult: 'processed=89 succeeded=89',
      },
      {
        id: '3',
        name: 'collect_youtube_channel',
        trigger: 'interval 1시간',
        lastRun: formatKST(new Date(now.getTime() - 45 * 60 * 1000)),
        nextRun: formatKST(new Date(now.getTime() + 15 * 60 * 1000)),
        lastStatus: 'success',
        successCount: 29,
        lastResult: 'processed=5 succeeded=5',
      },
      {
        id: '4',
        name: 'collect_blog_sigongzoa',
        trigger: 'interval 30분',
        lastRun: formatKST(new Date(now.getTime() - 20 * 60 * 1000)),
        nextRun: formatKST(new Date(now.getTime() + 10 * 60 * 1000)),
        lastStatus: 'success',
        successCount: 27,
        lastResult: 'processed=3 succeeded=3',
      },
      {
        id: '5',
        name: 'wiki_metric_snapshot',
        trigger: 'cron 매일 00:00',
        lastRun: formatKST(new Date(now.getTime() - 8 * 60 * 60 * 1000)),
        nextRun: formatKST(new Date(now.getTime() + 16 * 60 * 60 * 1000)),
        lastStatus: 'success',
        successCount: 30,
        lastResult: 'snapshots=1220 created=15',
      },
      {
        id: '6',
        name: 'wiki_fact_extract',
        trigger: 'interval 1시간',
        lastRun: formatKST(new Date(now.getTime() - 50 * 60 * 1000)),
        nextRun: formatKST(new Date(now.getTime() + 10 * 60 * 1000)),
        lastStatus: 'success',
        successCount: 25,
        lastResult: 'extracted_facts=12',
      },
      {
        id: '7',
        name: 'wiki_signal_detect',
        trigger: 'cron 매일 01:00',
        lastRun: formatKST(new Date(now.getTime() - 9 * 60 * 60 * 1000)),
        nextRun: formatKST(new Date(now.getTime() + 15 * 60 * 60 * 1000)),
        lastStatus: 'success',
        successCount: 28,
        lastResult: 'signals_detected=2',
      },
      {
        id: '8',
        name: 'wiki_rule_update',
        trigger: 'cron 매주 월 02:00',
        lastRun: formatKST(new Date(now.getTime() - 48 * 60 * 60 * 1000)),
        nextRun: formatKST(new Date(now.getTime() + 120 * 60 * 60 * 1000)),
        lastStatus: 'success',
        successCount: 4,
        lastResult: 'rules_updated=3',
      },
      {
        id: '9',
        name: 'process_embed_queue',
        trigger: 'interval 30분',
        lastRun: formatKST(new Date(now.getTime() - 15 * 60 * 1000)),
        nextRun: formatKST(new Date(now.getTime() + 15 * 60 * 1000)),
        lastStatus: 'success',
        successCount: 30,
        lastResult: 'embedded=45 remaining=819',
      },
      {
        id: '10',
        name: 'cleanup_old_data',
        trigger: 'cron 매일 03:00',
        lastRun: formatKST(new Date(now.getTime() - 7 * 60 * 60 * 1000)),
        nextRun: formatKST(new Date(now.getTime() + 17 * 60 * 60 * 1000)),
        lastStatus: 'success',
        successCount: 30,
        lastResult: 'deleted=0 archived=12',
      },
    ],
    dataSources: [
      { id: '1', name: '서울시 열린데이터광장', isActive: true },
      { id: '2', name: '소상공인시장진흥공단', isActive: true },
      { id: '3', name: '유튜브 채널 (구해줘빌딩)', isActive: true },
      { id: '4', name: '시공조아 블로그', isActive: true },
      { id: '5', name: 'sg365.go.kr', isActive: false, error: 'DNS 해석 불가, 비활성화됨' },
      { id: '6', name: 'data.go.kr', isActive: false, error: '연결 리셋 반복, 비활성화됨' },
    ],
    processingQueue: {
      total: 1440,
      done: 524,
      queued: 916,
      breakdown: {
        embed: 819,
        summarize: 58,
        tag: 39,
      },
    },
    wikiStats: {
      metricSnapshots: 1220,
      facts: 10,
      signals: 7,
      rules: 15,
    },
    wikiUpdates: [
      {
        id: '1',
        time: '2시간 전',
        jobName: 'wiki_fact_extract',
        result: 'extracted_facts=12',
      },
      {
        id: '2',
        time: '3시간 전',
        jobName: 'wiki_metric_snapshot',
        result: 'snapshots=15 created=15',
      },
      {
        id: '3',
        time: '5시간 전',
        jobName: 'wiki_signal_detect',
        result: 'signals_detected=2',
      },
      {
        id: '4',
        time: '8시간 전',
        jobName: 'wiki_fact_extract',
        result: 'extracted_facts=8',
      },
      {
        id: '5',
        time: '12시간 전',
        jobName: 'wiki_rule_update',
        result: 'rules_updated=1',
      },
    ],
    usageStats: {
      analysisRequests: {
        today: 3,
        thisWeek: 24,
        thisMonth: 156,
      },
      chatSessions: {
        today: 2,
        thisWeek: 18,
        thisMonth: 89,
      },
      uniqueIps: {
        today: 2,
        thisWeek: 12,
        thisMonth: 45,
      },
    },
    recentAnalyses: [
      {
        id: '1',
        time: '10분 전',
        inputType: '주소+금액 직접입력',
        grade: 'B+',
        score: 78,
        responseTime: 2340,
      },
      {
        id: '2',
        time: '25분 전',
        inputType: '자연어 대화',
        grade: 'B',
        score: 65,
        responseTime: 3120,
      },
      {
        id: '3',
        time: '1시간 전',
        inputType: '주소+금액 직접입력',
        grade: 'A',
        score: 92,
        responseTime: 1890,
      },
      {
        id: '4',
        time: '2시간 전',
        inputType: '기본값 테스트',
        grade: 'C',
        score: 45,
        responseTime: 1560,
      },
      {
        id: '5',
        time: '3시간 전',
        inputType: '자연어 대화',
        grade: 'B+',
        score: 82,
        responseTime: 2780,
      },
      {
        id: '6',
        time: '4시간 전',
        inputType: '시스템 호출',
        grade: 'A',
        score: 95,
        responseTime: 1230,
      },
      {
        id: '7',
        time: '5시간 전',
        inputType: '주소+금액 직접입력',
        grade: 'B',
        score: 68,
        responseTime: 2450,
      },
      {
        id: '8',
        time: '6시간 전',
        inputType: '자연어 대화',
        grade: 'D',
        score: 32,
        responseTime: 4520,
      },
      {
        id: '9',
        time: '7시간 전',
        inputType: '주소+금액 직접입력',
        grade: 'B+',
        score: 75,
        responseTime: 2100,
      },
      {
        id: '10',
        time: '8시간 전',
        inputType: '기본값 테스트',
        grade: 'B',
        score: 62,
        responseTime: 1980,
      },
    ],
    plannedSources: [
      { id: '1', name: '국토부 실거래가 직연동', version: 'V1.2' },
      { id: '2', name: '한국은행 ECOS 금리', version: 'V1.2' },
      { id: '3', name: 'KOSIS 통계청', version: 'V1.3' },
    ],
    systemInfo: {
      backend: {
        url: 'ai-mvp-ssmrdesign0804.replit.app',
        spec: 'Reserved VM · 0.5 vCPU / 2 GiB · Asia 리전',
        region: 'Asia',
        status: 'ok',
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
    },
    lastUpdated: formatKST(now),
  }
}

// Helper function to format relative time
export function getRelativeTime(lastUpdated: string): string {
  // For mock data, just return "방금 전"
  return '방금 전'
}
