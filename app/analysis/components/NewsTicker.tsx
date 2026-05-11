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
  transaction_type: string
  transaction_date: string
  area_sqm: number
  amount: number
}

interface TickerDetail {
  id: number
  headline: string
  district_name: string
  report_date: string
  signal: string
  summary: string
  related_properties: RelatedProperty[]
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

function highlightHeadline(headline: string): React.ReactNode {
  // 핵심 키워드들 - 상업용 부동산, 상권, 거래 관련
  const keywords = [
    '상업용',
    '부동산',
    '거래량',
    '상권',
    '임대료',
    '공실률',
    '매수',
    '매입',
    '리모델링',
    '대출',
    '금리',
    '수익률',
    '역세권',
    '매물',
    '투자',
    '강화',
    '증가',
    '상승',
    '감소',
    '회복',
    '안정',
  ]

  // 키워드를 기준으로 텍스트 분할
  const regex = new RegExp(`(${keywords.join('|')})`, 'g')
  const parts = headline.split(regex).filter(part => part.length > 0) // 빈 부분 제거

  // 인라인으로 이어붙여 span 사이 공백 방지
  return <>{parts.map((part) =>
    keywords.includes(part)
      ? <span key={part}>{part}</span>
      : <span key={part}>{part}</span>
  )}</>

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

function formatAmount(amount: number): string {
  const eok = amount / 100000000
  return eok >= 1 ? `${eok.toFixed(1)}억` : `${(amount / 10000).toFixed(0)}만`
}

// ─── Popup ────────────────────────────────────────────────────────────────────

function TickerPopup({
  detail,
  onClose,
  onAddressSelect,
}: {
  detail: TickerDetail
  onClose: () => void
  onAddressSelect: (address: string) => void
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
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-[600px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="text-[17px] font-bold leading-snug text-gray-950 break-keep flex-1">
              {highlightHeadline(detail.headline)}
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

        {/* Summary */}
        <div className="px-5 py-4 border-b border-border flex-shrink-0">
          <p className="text-[13px] leading-relaxed text-gray-700 break-keep whitespace-pre-line">
            {detail.summary}
          </p>
        </div>

        {/* Related Properties */}
        <div className="p-5 flex-1 overflow-y-auto">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
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
                    <span className="text-[13px] font-semibold text-gray-950 shrink-0">{formatAmount(prop.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                    <span>{translateTransactionType(prop.transaction_type)}</span>
                    {prop.transaction_date && (
                      <>
                        <span>·</span>
                        <span>{prop.transaction_date}</span>
                      </>
                    )}
                    {prop.area_sqm > 0 && (
                      <>
                        <span>·</span>
                        <span>{prop.area_sqm}㎡</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDistrictClick}
            >
              이 상권 직접 분석하기
            </Button>
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

  // ── 클릭 → click 이벤트 → detail 조회 → 팝업 ───────────────────
  const handleItemClick = useCallback(async (item: TickerItem) => {
    const sessionId = getOrCreateSessionId()

    // 1. click 이벤트 (fire-and-forget)
    fetch(`/api/news/ticker/${item.id}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    }).catch(() => {})

    // 2. detail 조회
    try {
      const res = await fetch(`/api/news/ticker/${item.id}/detail`)
      if (!res.ok) throw new Error(`status ${res.status}`)
      const detail: TickerDetail = await res.json()
      setOpenDetail(detail)
    } catch (err) {
      console.warn('[NewsTicker] detail fetch failed:', err)
      // detail 실패 시 기본 팝업 구성
      setOpenDetail({
        id: item.id,
        headline: item.headline,
        district_name: item.district_name,
        report_date: item.report_date,
        signal: item.signal,
        summary: '',
        related_properties: [],
      })
    }
  }, [])

  if (items.length === 0) return null

  // ── marquee 렌더 ────────────────────────────────────────────────
  // 아이템을 2번 반복해서 끊김 없는 루프 구현
  const repeated = [...items, ...items]
  const animDuration = `${items.length * 6}s`

  return (
    <>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div
          className="flex gap-16 whitespace-nowrap"
          style={{
            animation: `ticker-scroll ${animDuration} linear infinite`,
          }}
        >
          {repeated.map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              type="button"
              onClick={() => handleItemClick(item)}
              className="shrink-0 text-[13px] font-medium text-gray-900 hover:opacity-70 transition-opacity flex items-center gap-2 cursor-pointer hover:underline underline-offset-2"
            >
              <span className="shrink-0">•</span>
              {highlightHeadline(item.headline)}
            </button>
          ))}
        </div>
      </div>

      {openDetail && (
        <TickerPopup
          detail={openDetail}
          onClose={() => setOpenDetail(null)}
          onAddressSelect={onAddressSelect}
        />
      )}

      <style jsx global>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </>
  )
}
