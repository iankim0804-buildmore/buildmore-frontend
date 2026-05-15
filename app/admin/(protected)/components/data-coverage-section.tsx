'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Metric {
  metric_key: string
  metric_name_ko: string
  unit: string
  collection_frequency: string
  data_source: string
  is_available: boolean
  priority: number
  status?: string
  reason?: string | null
  stored_count?: number
}

interface Category {
  category_code: string
  category_name: string
  total: number
  available: number
  rate: number
  metrics: Metric[]
}

interface MetricCatalogResponse {
  overall: {
    total: number
    available: number
    rate: number
  }
  categories: Category[]
}

interface ApiGuide {
  provider: string
  secretName: string
  keyLocation: string
  replitLocation: string
  note: string
}

const REPLIT_SECRET_LOCATION = 'Replit > Tools > Secrets'

const SOURCE_GUIDES: Record<string, ApiGuide> = {
  ecos: {
    provider: '한국은행 ECOS',
    secretName: 'ECOS_API_KEY',
    keyLocation: '한국은행 경제통계시스템 ECOS Open API',
    replitLocation: REPLIT_SECRET_LOCATION,
    note: '키를 새로 발급받아 ECOS_API_KEY로 저장한 뒤 수집을 다시 실행하세요.',
  },
  seoul: {
    provider: '서울 열린데이터광장',
    secretName: 'SEOUL_OPENAPI_KEY',
    keyLocation: '서울 열린데이터광장 인증키 신청',
    replitLocation: REPLIT_SECRET_LOCATION,
    note: '상권분석서비스 API 키가 만료되면 SEOUL_OPENAPI_KEY를 교체하세요.',
  },
  dataGoKr: {
    provider: '공공데이터포털',
    secretName: 'DATA_GO_KR_SERVICE_KEY',
    keyLocation: '공공데이터포털 활용신청/마이페이지 인증키',
    replitLocation: REPLIT_SECRET_LOCATION,
    note: '국토부, 건축물대장, 공시가격 계열 API는 이 키를 우선 확인하세요.',
  },
  juso: {
    provider: '도로명주소 개발자센터',
    secretName: 'JUSO_API_KEY',
    keyLocation: '도로명주소 개발자센터 API 승인키',
    replitLocation: REPLIT_SECRET_LOCATION,
    note: '주소 정규화가 실패하면 JUSO_API_KEY 상태를 먼저 확인하세요.',
  },
  kosis: {
    provider: '통계청 KOSIS',
    secretName: 'KOSIS_API_KEY',
    keyLocation: 'KOSIS 공유서비스 Open API',
    replitLocation: REPLIT_SECRET_LOCATION,
    note: '인구, 세대, 물가 통계 API 연결 시 KOSIS_API_KEY를 사용하세요.',
  },
  rOne: {
    provider: '한국부동산원 R-ONE',
    secretName: 'RONE_API_KEY 또는 DATA_GO_KR_SERVICE_KEY',
    keyLocation: '한국부동산원/공공데이터포털 제공 API',
    replitLocation: REPLIT_SECRET_LOCATION,
    note: '임대료, 공실률 등 R-ONE 계열 지표의 인증키와 통계코드를 확인하세요.',
  },
  fss: {
    provider: '금융감독원/금융위원회',
    secretName: 'FSS_API_KEY 또는 수동 업로드',
    keyLocation: '금융감독원 Open API 또는 금융위원회 고시/보고서',
    replitLocation: REPLIT_SECRET_LOCATION,
    note: 'API가 없거나 고시 PDF 기반이면 수동 매핑 테이블로 관리하세요.',
  },
  manual: {
    provider: '수동 연결 또는 내부 산식',
    secretName: '별도 키 없음',
    keyLocation: '계약서, 현장조사, 보고서, 내부 계산식',
    replitLocation: 'Replit Secrets가 아니라 DB/관리 테이블에서 관리',
    note: 'API 제공처가 없으면 수동 입력 또는 파생 계산 로직을 연결하세요.',
  },
}

function getBarColor(rate: number): string {
  if (rate === 0) return 'bg-muted-foreground/30'
  if (rate <= 30) return 'bg-red-500'
  if (rate <= 60) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function getCardBorderColor(rate: number): string {
  if (rate === 0) return 'border-t-muted-foreground/30'
  if (rate <= 30) return 'border-t-red-500'
  if (rate <= 60) return 'border-t-amber-500'
  return 'border-t-emerald-500'
}

function guideForMetric(metric: Metric): ApiGuide {
  const haystack = `${metric.metric_key} ${metric.data_source}`.toLowerCase()

  if (haystack.includes('ecos') || haystack.includes('한국은행') || haystack.includes('bok')) return SOURCE_GUIDES.ecos
  if (haystack.includes('서울') || haystack.includes('상권분석')) return SOURCE_GUIDES.seoul
  if (haystack.includes('kosis') || haystack.includes('통계청')) return SOURCE_GUIDES.kosis
  if (haystack.includes('r-one') || haystack.includes('rone') || haystack.includes('한국부동산원')) return SOURCE_GUIDES.rOne
  if (haystack.includes('금융감독') || haystack.includes('금융위원') || haystack.includes('fss')) return SOURCE_GUIDES.fss
  if (
    haystack.includes('국토') ||
    haystack.includes('건축물') ||
    haystack.includes('공시') ||
    haystack.includes('토지') ||
    haystack.includes('data.go') ||
    haystack.includes('nsdi')
  ) {
    return SOURCE_GUIDES.dataGoKr
  }
  if (haystack.includes('juso') || haystack.includes('주소')) return SOURCE_GUIDES.juso
  return SOURCE_GUIDES.manual
}

function statusLabel(metric: Metric): string {
  if (metric.is_available) return 'API 살아있음'
  const guide = guideForMetric(metric)
  if (guide.secretName === '별도 키 없음') return '수동 연결 필요'
  return 'API 죽음/키 확인 필요'
}

function statusClass(metric: Metric): string {
  if (metric.is_available) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
}

function CategoryCard({ category }: { category: Category }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const metrics = useMemo(
    () => [...category.metrics].sort((a, b) => a.priority - b.priority || a.metric_key.localeCompare(b.metric_key)),
    [category.metrics],
  )

  return (
    <Card className={`overflow-hidden border-sidebar-border bg-sidebar-accent border-t-4 ${getCardBorderColor(category.rate)}`}>
      <button
        onClick={() => setIsExpanded((value) => !value)}
        className="w-full p-4 text-left transition-colors hover:bg-sidebar/50"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-sidebar-foreground">{category.category_name}</span>
          <span className="text-xs text-muted-foreground">
            {category.available}/{category.total} <span className="font-medium">{category.rate}%</span>
          </span>
        </div>

        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-sidebar">
          <div
            className={`h-full transition-all duration-300 ${getBarColor(category.rate)}`}
            style={{ width: `${Math.min(category.rate, 100)}%` }}
          />
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <span>지표 보기</span>
        </div>
      </button>

      {isExpanded && (
        <CardContent className="border-t border-sidebar-border px-4 pb-4 pt-0">
          <div className="mt-3 space-y-2">
            {metrics.map((metric) => {
              const guide = guideForMetric(metric)
              return (
                <div key={metric.metric_key} className="rounded-md border border-sidebar-border bg-sidebar/40 p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {metric.is_available ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    )}
                    <span className="font-medium text-sidebar-foreground">{metric.metric_name_ko}</span>
                    <span className="text-xs text-muted-foreground">{metric.unit || '-'}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusClass(metric)}`}>
                      {statusLabel(metric)}
                    </span>
                  </div>

                  <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <div>제공처: <span className="text-sidebar-foreground">{guide.provider}</span></div>
                    <div>원천: <span className="text-sidebar-foreground">{metric.data_source || '-'}</span></div>
                    <div>주기: <span className="text-sidebar-foreground">{metric.collection_frequency || '-'}</span></div>
                    <div>Replit 키: <span className="text-sidebar-foreground">{guide.secretName}</span></div>
                    <div>입력 위치: <span className="text-sidebar-foreground">{guide.replitLocation}</span></div>
                    <div>키 발급처: <span className="text-sidebar-foreground">{guide.keyLocation}</span></div>
                  </div>

                  <p className="mt-2 text-xs text-amber-200/80">{metric.reason || guide.note}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export function DataCoverageSection() {
  const [data, setData] = useState<MetricCatalogResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/metric-catalog', {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }

      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오지 못했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (error && !data) {
    return (
      <section>
        <h1 className="mb-4 text-xl font-semibold text-sidebar-foreground">원천 데이터 적재 현황</h1>
        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button onClick={fetchData} className="mt-2 text-sm text-primary hover:underline">
              다시 시도
            </button>
          </CardContent>
        </Card>
      </section>
    )
  }

  if (isLoading && !data) {
    return (
      <section>
        <h1 className="mb-4 text-xl font-semibold text-sidebar-foreground">원천 데이터 적재 현황</h1>
        <Card className="border-sidebar-border bg-sidebar-accent">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </section>
    )
  }

  if (!data) return null

  const { overall, categories } = data

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-sidebar-foreground">원천 데이터 적재 현황</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="h-8 gap-1.5 text-muted-foreground hover:text-sidebar-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      <Card className="mb-4 border-sidebar-border bg-sidebar-accent">
        <CardContent className="py-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-sidebar-foreground">전체 적재율</span>
            <span className="text-sm text-sidebar-foreground">
              <span className="text-xl font-bold">{overall.rate}%</span>
              <span className="ml-2 text-muted-foreground">({overall.available}/{overall.total})</span>
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-sidebar">
            <div
              className={`h-full transition-all duration-300 ${getBarColor(overall.rate)}`}
              style={{ width: `${Math.min(overall.rate, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.category_code} category={category} />
        ))}
      </div>
    </section>
  )
}
