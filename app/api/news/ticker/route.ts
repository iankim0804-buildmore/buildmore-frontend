import { NextResponse } from 'next/server'

const BACKEND = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_ADMIN_API_URL ||
  'https://ai-mvp.replit.app'
).replace(/\/$/, '')

const FALLBACK_ITEMS = [
  { id: 1, headline: '성수동 개업률 급등 — F&B 임차수요 최고조', signal: 'favorable', district_name: '성수동', bjd_code: '1120068000', region_2depth: '성동구', region_3depth: '성수동', signal_strength: 'high', frame: 'favorable', report_date: '2026-05-12', summary: null, wiki_note_id: null },
  { id: 2, headline: '홍대입구 추정매출 강세 — 서교동 공실 소진 가속', signal: 'favorable', district_name: '서교동', bjd_code: '1141010800', region_2depth: '마포구', region_3depth: '서교동', signal_strength: 'high', frame: 'favorable', report_date: '2026-05-12', summary: null, wiki_note_id: null },
  { id: 3, headline: '한남동 점포수 증가 — 고급 임차수요 흡수 중', signal: 'favorable', district_name: '한남동', bjd_code: '1159010500', region_2depth: '용산구', region_3depth: '한남동', signal_strength: 'high', frame: 'favorable', report_date: '2026-05-12', summary: null, wiki_note_id: null },
  { id: 4, headline: '합정동 유동인구 상위 — 홍대 팽창 수혜 신호', signal: 'favorable', district_name: '합정동', bjd_code: '1141010700', region_2depth: '마포구', region_3depth: '합정동', signal_strength: 'high', frame: 'favorable', report_date: '2026-05-12', summary: null, wiki_note_id: null },
  { id: 5, headline: '강남역 공실률 상승 — 유흥업종 이탈 주목', signal: 'unfavorable', district_name: '역삼동', bjd_code: '1168010100', region_2depth: '강남구', region_3depth: '역삼동', signal_strength: 'medium', frame: 'unfavorable', report_date: '2026-05-12', summary: null, wiki_note_id: null },
  { id: 6, headline: '이태원 외국인 방문객 감소 — 단기 임차 리스크', signal: 'unfavorable', district_name: '이태원동', bjd_code: '1159010400', region_2depth: '용산구', region_3depth: '이태원동', signal_strength: 'medium', frame: 'unfavorable', report_date: '2026-05-12', summary: null, wiki_note_id: null },
]

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/news/ticker`, { next: { revalidate: 60 } })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.items) && data.items.length > 0) {
        return NextResponse.json(data)
      }
    }
  } catch {
    // fall through to fallback
  }
  return NextResponse.json({
    items: FALLBACK_ITEMS,
    total: FALLBACK_ITEMS.length,
    generated_at: new Date().toISOString(),
  })
}
