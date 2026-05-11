'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ── 백엔드 타입 ──────────────────────────────────────
interface TickerItem {
  id: number
  headline: string | null
  district_name: string
  bjd_code: string
  signal: string | null
  signal_strength: string | null
  frame: string
  report_date: string
  summary: string | null
  wiki_note_id: number | null
}

interface RelatedProperty {
  address: string | null
  deal_type: string
  deal_date: string | null
  area_m2: number | null
  deal_amount: number | null
}

interface DetailData extends TickerItem {
  click_count: number
  exposed_count: number
  related_properties: RelatedProperty[]
}

interface LegacyItem {
  id: number
  title: string
  url: string
}

type NewsItem = TickerItem | LegacyItem

// ── 헬퍼 ─────────────────────────────────────────────
function isTickerItem(item: NewsItem): item is TickerItem {
  return 'headline' in item
}

function getTitle(item: NewsItem): string {
  if (isTickerItem(item)) return item.headline ?? item.district_name + ' 상권 동향'
  return item.title
}

const FRAME_DOT: Record<string, string> = {
  opportunity: 'bg-emerald-500',
  contrarian: 'bg-amber-500',
  neutral: 'bg-gray-400',
}

const SIGNAL_BADGE: Record<string, string> = {
  favorable: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  unfavorable: 'bg-red-100 text-red-700 border-red-200',
  neutral: 'bg-gray-100 text-gray-600 border-gray-200',
}

const SIGNAL_LABEL: Record<string, string> = {
  favorable: '매수 신호',
  unfavorable: '주의 신호',
  neutral: '관망',
}

const DEAL_TYPE_LABEL: Record<string, string> = {
  commercial_sale: '상업용 매매',
  commercial_rent: '상업용 임대',
  row_house_sale: '다세대 매매',
  row_house_rent: '다세대 임대',
  apartment_sale: '아파트 매매',
  apartment_rent: '아파트 임대',
  land_sale: '토지 매매',
}

function formatAmount(amount: number | null): string {
  if (amount == null) return '-'
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}억`
  return `${amount.toLocaleString()}만`
}

// ── 상세 팝업 ─────────────────────────────────────────
function DistrictDetailDialog({
  detail,
  open,
  onClose,
}: {
  detail: DetailData | null
  open: boolean
  onClose: () => void
}) {
  if (!detail) return null

  const signal = detail.signal ?? 'neutral'
  const badgeClass = SIGNAL_BADGE[signal] ?? SIGNAL_BADGE.neutral
  const signalLabel = SIGNAL_LABEL[signal] ?? '관망'

  // summary 파싱: [동향] [의미] [신호] 섹션 분리
  const summaryLines = (detail.summary ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[480px] p-0 gap-0 overflow-hidden">
        {/* 헤더 */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              {detail.region_2depth ?? ''} {detail.region_3depth ?? ''}
            </span>
            <span className="text-[11px] text-muted-foreground">·</span>
            <span className="text-[11px] text-muted-foreground">{detail.report_date}</span>
          </div>
          <DialogTitle className="text-[17px] font-bold leading-snug text-left break-keep">
            {detail.headline ?? detail.district_name + ' 상권 동향'}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}
            >
              {signalLabel}
            </span>
            {detail.signal_strength === 'high' && (
              <span className="text-[11px] text-muted-foreground">강도 높음</span>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-5 py-4 space-y-4">
            {/* 요약 */}
            {summaryLines.length > 0 && (
              <div className="space-y-2">
                {summaryLines.map((line, i) => (
                  <p
                    key={i}
                    className={`text-[13px] leading-relaxed break-keep ${
                      line.startsWith('[') ? 'font-medium text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}

            {/* 관련 매물 */}
            {detail.related_properties.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
                    인근 최근 거래
                  </p>
                  <div className="space-y-2">
                    {detail.related_properties.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-[12px] font-medium truncate text-foreground">
                            {p.address ?? '-'}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {DEAL_TYPE_LABEL[p.deal_type] ?? p.deal_type}
                            {p.area_m2 != null && ` · ${p.area_m2.toFixed(0)}㎡`}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[13px] font-semibold tabular-nums">
                            {formatAmount(p.deal_amount)}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {p.deal_date ?? '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 관련 매물 없을 때 */}
            {detail.related_properties.length === 0 && (
              <>
                <Separator />
                <p className="text-[12px] text-muted-foreground text-center py-2">
                  인근 거래 데이터가 없습니다.
                </p>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────
interface NewsTickerProps {
  news?: LegacyItem[]
}

export const NewsTicker = ({ news = [] }: NewsTickerProps) => {
  const [items, setItems] = useState<NewsItem[]>(news)
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  // 목록 fetch
  useEffect(() => {
    let cancelled = false
    async function fetchTicker() {
      try {
        const res = await fetch('/api/news/ticker', { cache: 'no-store' })
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json()
        const liveItems: TickerItem[] = data.items ?? []
        if (!cancelled && liveItems.length > 0) {
          setItems(liveItems)
          setLoaded(true)
        }
      } catch {
        // fall back to legacy news prop
      }
    }
    fetchTicker()
    return () => {
      cancelled = true
    }
  }, [])

  // 폴백
  useEffect(() => {
    if (!loaded && news.length > 0) setItems(news)
  }, [news, loaded])

  // 자동 순환
  useEffect(() => {
    if (items.length === 0) return
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [items.length])

  // 클릭 핸들러: click 추적 + detail 팝업
  const handleClick = useCallback(async (e: React.MouseEvent, item: NewsItem) => {
    if (!isTickerItem(item)) return
    e.preventDefault()

    // 클릭 추적 (fire-and-forget)
    fetch(`/api/news/ticker/${item.id}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: null }),
    }).catch(() => {})

    // 상세 팝업 열기
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const res = await fetch(`/api/news/ticker/${item.id}/detail`, { cache: 'no-store' })
      if (!res.ok) throw new Error('detail fetch failed')
      const data: DetailData = await res.json()
      setDetail(data)
    } catch {
      // 팝업은 열렸지만 데이터 로드 실패 — 기존 item으로 임시 표시
      setDetail({
        ...item,
        click_count: 0,
        exposed_count: 0,
        related_properties: [],
        region_2depth: null,
        region_3depth: null,
        signal_strength: null,
      })
    } finally {
      setDetailLoading(false)
    }
  }, [])

  if (items.length === 0) return null

  const current = items[index]
  const frame = isTickerItem(current) ? current.frame : 'neutral'
  const dotClass = FRAME_DOT[frame] ?? FRAME_DOT.neutral
  const title = getTitle(current)

  return (
    <>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Frame 색상 dot */}
        <span
          className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${dotClass}`}
          title={frame}
        />
        {/* 헤드라인 — 클릭 시 detail 팝업 */}
        <button
          type="button"
          onClick={(e) => handleClick(e, current)}
          className="block text-[13px] text-foreground hover:text-foreground/70 truncate whitespace-nowrap text-left transition-colors"
          disabled={detailLoading}
        >
          {detailLoading ? (
            <span className="opacity-60">{title}</span>
          ) : (
            title
          )}
        </button>
      </div>

      {/* 상세 팝업 */}
      <DistrictDetailDialog
        detail={detail}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setDetail(null)
        }}
      />
    </>
  )
}
