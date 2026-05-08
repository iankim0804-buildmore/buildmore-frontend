'use client'

import { useState, useEffect } from 'react'

interface NewsItem {
  id: number
  title: string
  url: string
}

interface NewsTickerProps {
  news: NewsItem[]
}

export const NewsTicker = ({ news }: NewsTickerProps) => {
  const [newsIndex, setNewsIndex] = useState(0)
  const currentNews = news[newsIndex]

  useEffect(() => {
    const timer = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % news.length)
    }, 3000)

    return () => clearInterval(timer)
  }, [news.length])

  return (
    <div className="flex items-center justify-center min-w-0">
      <a
        href={currentNews.url}
        target="_blank"
        rel="noreferrer"
        className="block text-sm text-gray-700 hover:text-gray-900 truncate px-3"
      >
        {currentNews.title}
      </a>
    </div>
  )
}
