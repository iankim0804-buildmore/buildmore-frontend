'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TickerItem {
  id: number
  headline: string
  signal: 'favorable' | 'unfavorable' | string
  district_name: string
  report_date: string
}

interface RelatedProperty {
  id: string | number
  address: string
  deal_type: string
  deal_date: string
  area_m2: number
  deal_amount: number
}

interface RelatedNews {
  id: number
  headline: string
  signal: string
  district_name: string
  report_date: string
}

interface TickerDetail {
  id: number
  headline: string
  district_name: string
  report_date: string
  signal: string
  summary: string
  related_properties: RelatedProperty[]
  related_news?: RelatedNews[]
}

interface NewsTickerProps {
  onAddressSelect: (address: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrCreateSessionId(): string {
  const key = 'buildmore_session_id'
  const existing = sessionStorage.getItem(key)
  if (existing) return existing
  const id = crypto.randomUUID()
  sessionStorage.setItem(key, id)
  return id
}

function signalColor(signal: string) {
  return signal === 'favorable' ? 'text-blue-600' : 'text-orange-500'
}


function translateTransactionType(type: string): string {
  const map: Record<string, string> = {
    commercial_sale: '상업용매매',
    commercial_lease: '상업용임대',
    office_sale: '업무용매매',
    office_lease: '업무용임대',
    retail_sale: '리테일매매',
    retail_lease: '리테일임대',
  }
  return map[type] ?? type
}

function formatAmount(manwon: number): string {
  if (!manwon) return '-'
  if (manwon >= 10000) return `${(manwon / 10000).toFixed(1)}억`
  return `${manwon.toLocaleString()}만`
}

// ─── Popup ────────────────────────────────────────────────────────────────────

function TickerPopup({
  detail,
  onClose,
  onAddressSelect,
  onNewsSelect,
}: {
  detail: TickerDetail
  onClose: () => void
  onAddressSelect: (address: string) => void
  onNewsSelect: (id: number) => void
}) {
  const handlePropertyClick = (prop: RelatedProperty) => {
    onClose()
    onAddressSelect(prop.address)
  }

  const handleDistrictClick = () => {
    onClose()
    onAddressSelect(detail.district_name)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-[640px] max-h-[88vh] bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="text-[17px] font-bold leading-snug text-gray-950 break-keep flex-1">
              {detail.headline}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-muted text-muted-foreground shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{detail.district_name}</span>
            {detail.report_date && (
              <>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-xs text-muted-foreground">{detail.report_date}</span>
              </>
            )}
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                detail.signal === 'favorable'
                  ? 'text-blue-600 border-blue-200 bg-blue-50'
                  : 'text-orange-500 border-orange-200 bg-orange-50'
              }`}
            >
              {detail.signal === 'favorable' ? '매수 우호' : '역발상 주목'}
            </span>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Summary */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[13px] leading-relaxed text-gray-700 break-keep whitespace-pre-line">
              {detail.summary || '본문을 불러오는 중입니다...'}
            </p>
          </div>

          {/* Related Properties */}
          <div className="px-5 pt-4 pb-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              이 상권 매물
            </p>
            {detail.related_properties && detail.related_properties.length > 0 ? (
              <div className="space-y-2">
                {detail.related_properties.slice(0, 5).map((prop) => (
                  <button
                    key={prop.id}
                    type="button"
                    onClick={() => handlePropertyClick(prop)}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-gray-950 truncate">{prop.address}</span>
                      <span className="text-[13px] font-semibold text-gray-950 shrink-0">{formatAmount(prop.deal_amount)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      <span>{translateTransactionType(prop.deal_type)}</span>
                      {prop.deal_date && (
                        <>
                          <span>·</span>
                          <span>{prop.deal_date}</span>
                        </>
                      )}
                      {prop.area_m2 > 0 && (
                        <>
                          <span>·</span>
                          <span>{prop.area_m2}㎡</span>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={handleDistrictClick}>
                이 상권 직접 분석하기
              </Button>
            )}
          </div>

          {/* Related News */}
          {detail.related_news && detail.related_news.length > 0 && (
            <div className="px-5 pt-3 pb-5 border-t border-border mt-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                관련 뉴스
              </p>
              <div className="space-y-1">
                {detail.related_news.slice(0, 3).map((news) => (
                  <button
                    key={news.id}
                    type="button"
                    onClick={() => onNewsSelect(news.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-muted-foreground mt-0.5">•</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-gray-800 leading-snug break-keep group-hover:text-gray-950 transition-colors">
                          {news.headline}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">{news.district_name}</span>
                          {news.report_date && (
                            <>
                              <span className="text-muted-foreground text-[11px]">·</span>
                              <span className="text-[11px] text-muted-foreground">{news.report_date}</span>
                            </>
                          )}
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ml-1 ${
                              news.signal === 'favorable'
                                ? 'text-blue-600 border-blue-200 bg-blue-50'
                                : 'text-orange-500 border-orange-200 bg-orange-50'
                            }`}
                          >
                            {news.signal === 'favorable' ? '매수 우호' : '역발상'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 30 * 60 * 1000 // 30분

export function NewsTicker({ onAddressSelect }: NewsTickerProps) {
  const [items, setItems] = useState<TickerItem[]>([])
  const [openDetail, setOpenDetail] = useState<TickerDetail | null>(null)
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── 뉴스 목록 조회 ────────────────────────────────────────���─────
  const fetchTicker = useCallback(async () => {
    try {
      const res = await fetch('/api/news/ticker')
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json()
      if (Array.isArray(data.items) && data.items.length > 0) {
        setItems(data.items)
      }
    } catch (err) {
      console.warn('[NewsTicker] fetch failed:', err)
    }
  }, [])

  useEffect(() => {
    fetchTicker()
    refreshTimer.current = setInterval(fetchTicker, REFRESH_INTERVAL_MS)
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current)
    }
  }, [fetchTicker])

  // ── detail 조회 공통 함수 ────────────────────────────────────────
  const fetchDetail = useCallback(async (id: number, fallback?: Partial<TickerDetail>) => {
    try {
      const res = await fetch(`/api/news/ticker/${id}/detail`)
      if (!res.ok) throw new Error(`status ${res.status}`)
      const detail: TickerDetail = await res.json()
      setOpenDetail(detail)
    } catch (err) {
      console.warn('[NewsTicker] detail fetch failed:', err)
      setOpenDetail({
        id,
        headline: fallback?.headline ?? '',
        district_name: fallback?.district_name ?? '',
        report_date: fallback?.report_date ?? '',
        signal: fallback?.signal ?? '',
        summary: '',
        related_properties: [],
      })
    }
  }, [])

  // ── 마퀴 클릭 → click 이벤트 + detail 조회 ──────────────────────
  const handleItemClick = useCallback(async (item: TickerItem) => {
    const sessionId = getOrCreateSessionId()
    fetch(`/api/news/ticker/${item.id}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    }).catch(() => {})
    await fetchDetail(item.id, item)
  }, [fetchDetail])

  // ── rAF 기반 seamless 스크롤 ────────────────────────────────────
  const trackRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const SPEED = 0.6 // px/frame

  useEffect(() => {
    if (items.length === 0) return

    const step = () => {
      const el = trackRef.current
      if (!el) { rafRef.current = requestAnimationFrame(step); return }

      // 트랙 전체 너비의 절반 = 한 세트 너비 (아이템을 2벌 복사했으므로)
      const half = el.scrollWidth / 2
      offsetRef.current += SPEED
      if (offsetRef.current >= half) offsetRef.current -= half

      el.style.transform = `translateX(${-offsetRef.current}px)`
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [items])

  if (items.length === 0) return null

  // 아이템을 3벌 복사 → 짧은 화면에서도 항상 넘치도록
  const repeated = [...items, ...items, ...items]

  return (
    <>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div
          ref={trackRef}
          className="flex gap-16 whitespace-nowrap will-change-transform"
        >
          {repeated.map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              type="button"
              onClick={() => handleItemClick(item)}
              className="shrink-0 text-[13px] font-medium text-gray-900 hover:opacity-70 transition-opacity flex items-center gap-2 cursor-pointer hover:underline underline-offset-2"
            >
              <span className="shrink-0">•</span>
              {item.headline}
            </button>
          ))}
        </div>
      </div>

      {openDetail && (
        <TickerPopup
          detail={openDetail}
          onClose={() => setOpenDetail(null)}
          onAddressSelect={onAddressSelect}
          onNewsSelect={(id) => fetchDetail(id)}
        />
      )}
    </>
  )
}
