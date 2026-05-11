import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://buildmore-backend.fly.dev'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/news/ticker`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      console.warn('[news/ticker] Backend error:', res.status)
      return NextResponse.json({ items: FALLBACK_ITEMS })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.warn('[news/ticker] Network error, using fallback:', err)
    return NextResponse.json({ items: FALLBACK_ITEMS })
  }
}

const FALLBACK_ITEMS = [
  { id: 1, headline: '서울 상업용 부동산 거래량 전월 대비 증가', signal: 'favorable', district_name: '서울 전역', report_date: '' },
  { id: 2, headline: '기준금리 동결 전망에 수익형 부동산 관망세 지속', signal: 'unfavorable', district_name: '서울 전역', report_date: '' },
  { id: 3, headline: '마포·성수권 중소형 빌딩 매수 문의 증가', signal: 'favorable', district_name: '마포구', report_date: '' },
  { id: 4, headline: '임대료 상승 지역과 공실률 확대 지역 양극화', signal: 'unfavorable', district_name: '서울 전역', report_date: '' },
  { id: 5, headline: '역세권 리테일 공실률 안정세', signal: 'favorable', district_name: '역세권', report_date: '' },
  { id: 6, headline: '금융권, 상업용 부동산 담보대출 심사 강화', signal: 'unfavorable', district_name: '서울 전역', report_date: '' },
]
