'use client'

import { useState, useEffect, useCallback } from 'react'

interface TickerItem {
  id: number
  headline: string | null
  district_name: string
  bjd_code: string
  signal: string | null
  frame: string
  report_date: string
  summary: string | null
  wiki_note_id: number | null
}

interface LegacyItem {
  id: number
  title: string
  url: string
}

type NewsItem = TickerItem | LegacyItem

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

interface NewsTickerProps {
  news?: LegacyItem[]
}

export const NewsTicker = ({ news = [] }: NewsTickerProps) => {
  const [items, setItems] = useState<NewsItem[]>(news)
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)

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

  useEffect(() => {
    if (!loaded && news.length > 0) setItems(news)
  }, [news, loaded])

  useEffect(() => {
    if (items.length === 0) return
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [items.length])

  const handleClick = useCallback(async (item: NewsItem) => {
    if (!isTickerItem(item)) return
    try {
      await fetch(`/api/news/ticker/${item.id}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: null }),
      })
    } catch {
      // fire-and-forget
    }
  }, [])

  if (items.length === 0) return null

  const current = items[index]
  const frame = isTickerItem(current) ? current.frame : 'neutral'
  const dotClass = FRAME_DOT[frame] ?? FRAME_DOT.neutral
  const title = getTitle(current)
  const href = isTickerItem(current)
    ? `#district-${current.bjd_code}`
    : (current as LegacyItem).url

  return (
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <span
        className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${dotClass}`}
        title={frame}
      />
      <a
        href={href}
        onClick={() => handleClick(current)}
        className="block text-[13px] text-foreground hover:text-foreground/80 truncate whitespace-nowrap"
      >
        {title}
      </a>
    </div>
  )
}
