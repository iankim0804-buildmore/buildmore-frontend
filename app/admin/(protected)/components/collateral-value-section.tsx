'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Database, Loader2, Search } from 'lucide-react'

type CollateralFact = {
  key: string
  label: string
  unit?: string | null
  refresh_cycle: string
  source_name: string
  status: 'active' | 'warning' | 'todo' | 'skipped'
  value?: number | string | boolean | null
  reason?: string | null
}

type CollectResponse = {
  normalized_address: {
    road_address?: string | null
    jibun_address?: string | null
    pnu: string
  }
  facts: CollateralFact[]
  blocked_or_skipped: string[]
  [key: string]: unknown
}

type SourceIndicator = {
  metric_key: string
  metric_name_ko: string
  unit?: string | null
  collection_frequency: string
  data_source: string
  is_available: boolean
  stored_count?: number
  reason?: string | null
}

type SourceCategoryStatus = {
  total: number
  available: number
  rate: number
  snapshot_count: number
  indicators: SourceIndicator[]
  manual_connection_required: SourceIndicator[]
}

type StatusResponse = {
  configured_required_keys: Record<string, boolean>
  stored_pnu_count: number
  stored_fact_count: number
  active_item_count: number
  warning_item_count: number
  todo_item_count: number
  latest_fetched_at?: string | null
  next_actions: string[]
  commercial_vitality?: SourceCategoryStatus
  finance_rates?: SourceCategoryStatus
}

const badgeClass: Record<string, string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  todo: 'border-blue-200 bg-blue-50 text-blue-700',
  skipped: 'border-zinc-200 bg-zinc-50 text-zinc-500',
}

export function CollateralValueSection() {
  const [address, setAddress] = useState('')
  const [persist, setPersist] = useState(true)
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [result, setResult] = useState<CollectResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadStatus() {
    const response = await fetch('/api/collateral-value/status', { cache: 'no-store' })
    if (response.ok) setStatus(await response.json())
  }

  useEffect(() => {
    loadStatus().catch(() => undefined)
  }, [])

  const configured = useMemo(() => {
    if (!status) return 0
    return Object.values(status.configured_required_keys).filter(Boolean).length
  }, [status])

  const collateralPending = (status?.todo_item_count ?? 0) + (status?.warning_item_count ?? 0)

  async function runCollect() {
    if (!address.trim()) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/collateral-value/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, persist }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || body.error || '담보가치 수집 실패')
      setResult(body)
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : '담보가치 수집 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Collateral Value
          </p>
          <h2 className="mt-1 text-lg font-semibold text-sidebar-foreground">
            담보가치 원천데이터 검증
          </h2>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-md border border-sidebar-border px-2 py-1 text-muted-foreground">
            <Database className="h-3.5 w-3.5" /> PNU {status?.stored_pnu_count ?? 0}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-sidebar-border px-2 py-1 text-muted-foreground">
            <Activity className="h-3.5 w-3.5" /> facts {status?.stored_fact_count ?? 0}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-sidebar-foreground">담보가치 API 검증 상태</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            건축물대장, 공시지가, 토지이용계획처럼 담보가치 산정에 직접 쓰는 원천데이터입니다.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Metric label="필수 API 키" value={`${configured}/2`} tone={configured === 2 ? 'active' : 'warning'} />
          <Metric label="검증 완료" value={`${status?.active_item_count ?? 0}/19`} tone="active" />
          <Metric label="대기/주의" value={`${collateralPending}`} tone={collateralPending ? 'warning' : 'active'} />
        </div>
      </div>

      {status?.commercial_vitality && (
        <SourceStatusPanel
          eyebrow="Commercial Vitality"
          title="상권활력 원천데이터 연결 상태"
          description="주소 입력 후 상권 월매출, 유동인구, 개폐업률 등을 빠르게 불러오기 위한 하위 지표입니다."
          status={status.commercial_vitality}
          completeLabel="상권활력 연결 완료"
        />
      )}

      {status?.finance_rates && (
        <SourceStatusPanel
          eyebrow="Finance Rates"
          title="금융/금리 원천데이터 연결 상태"
          description="주소 분석에서 DSCR, 추정 대출금리, 환율과 금리 민감도를 계산하기 위한 금융 하위 지표입니다."
          status={status.finance_rates}
          completeLabel="금융/금리 연결 완료"
        />
      )}

      <div className="flex flex-col gap-2 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-md border border-sidebar-border bg-sidebar pl-9 pr-3 text-sm text-sidebar-foreground outline-none focus:border-[#C9A24B]"
            placeholder="검증할 주소 입력"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') runCollect()
            }}
          />
        </div>
        <label className="flex h-10 items-center gap-2 rounded-md border border-sidebar-border px-3 text-sm text-muted-foreground">
          <input type="checkbox" checked={persist} onChange={(event) => setPersist(event.target.checked)} />
          DB 저장
        </label>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#C9A24B] px-4 text-sm font-medium text-sidebar disabled:opacity-50"
          onClick={runCollect}
          disabled={loading || !address.trim()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          검증 실행
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          {error}
        </div>
      )}

      {status?.next_actions?.length ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <p className="font-medium">담보가치 API 다음 작업</p>
          {status.next_actions.map((action) => (
            <p key={action} className="mt-1">{action}</p>
          ))}
        </div>
      ) : null}

      {result && (
        <div className="space-y-3">
          <div className="rounded-md border border-sidebar-border bg-sidebar-accent p-3 text-sm text-muted-foreground">
            <p className="font-medium text-sidebar-foreground">
              {result.normalized_address.road_address || result.normalized_address.jibun_address}
            </p>
            <p className="mt-1">PNU {result.normalized_address.pnu}</p>
          </div>

          <div className="overflow-hidden rounded-md border border-sidebar-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-sidebar-accent text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">항목</th>
                  <th className="px-3 py-2">값</th>
                  <th className="px-3 py-2">출처</th>
                </tr>
              </thead>
              <tbody>
                {result.facts.map((fact) => (
                  <tr key={fact.key} className="border-t border-sidebar-border">
                    <td className="px-3 py-2">
                      <span className={`rounded-md border px-2 py-0.5 text-xs ${badgeClass[fact.status] ?? badgeClass.skipped}`}>
                        {fact.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sidebar-foreground">{fact.label}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {fact.value == null ? '-' : String(fact.value)}
                      {fact.value != null && fact.unit ? ` ${fact.unit}` : ''}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{fact.source_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

function SourceStatusPanel({
  eyebrow,
  title,
  description,
  status,
  completeLabel,
}: {
  eyebrow: string
  title: string
  description: string
  status: SourceCategoryStatus
  completeLabel: string
}) {
  const manualCount = status.manual_connection_required?.length ?? 0
  return (
    <div className="rounded-md border border-sidebar-border bg-sidebar p-3">
      <div className="mb-3 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </p>
        <h3 className="text-sm font-semibold text-sidebar-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="mb-3 grid gap-3 md:grid-cols-3">
        <Metric label={completeLabel} value={`${status.available}/${status.total}`} tone={status.available ? 'active' : 'warning'} />
        <Metric label="수동 연결 필요" value={`${manualCount}`} tone={manualCount ? 'warning' : 'active'} />
        <Metric label="캐시 스냅샷" value={`${status.snapshot_count}`} tone={status.snapshot_count ? 'active' : 'warning'} />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {status.indicators.map((indicator) => (
          <div
            key={indicator.metric_key}
            className="flex min-h-12 items-start gap-2 rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-2 text-sm"
          >
            {indicator.is_available ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-sidebar-foreground">{indicator.metric_name_ko}</span>
                <span className="text-xs text-muted-foreground">{indicator.unit || '-'}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {indicator.data_source} · {indicator.collection_frequency}
                {indicator.stored_count ? ` · ${indicator.stored_count.toLocaleString()} rows` : ''}
              </p>
              {!indicator.is_available && indicator.reason && (
                <p className="mt-1 text-xs text-amber-700">{indicator.reason}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'active' | 'warning' }) {
  return (
    <div className={`rounded-md border px-3 py-2 ${tone === 'active' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-900">{value}</p>
    </div>
  )
}
