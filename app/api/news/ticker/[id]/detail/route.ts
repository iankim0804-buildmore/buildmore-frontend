import { NextRequest, NextResponse } from 'next/server'

const BACKEND = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_ADMIN_API_URL ||
  'https://ai-mvp.replit.app'
).replace(/\/$/, '')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDetail(raw: any) {
  const props = Array.isArray(raw.related_properties) ? raw.related_properties : []
  return {
    ...raw,
    related_properties: props.map((p: any, i: number) => ({
      id: p.id ?? i,
      address: p.address ?? '',
      deal_type: p.deal_type ?? p.transaction_type ?? '',
      deal_date: p.deal_date ?? p.transaction_date ?? '',
      area_m2: typeof p.area_m2 === 'number' ? p.area_m2 : (typeof p.area_sqm === 'number' ? p.area_sqm : 0),
      deal_amount: typeof p.deal_amount === 'number' ? p.deal_amount : (typeof p.amount === 'number' ? p.amount : 0),
    })),
    related_news: Array.isArray(raw.related_news) ? raw.related_news : [],
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const res = await fetch(`${BACKEND}/api/news/ticker/${id}/detail`, { cache: 'no-store' })
    if (res.ok) {
      const raw = await res.json()
      return NextResponse.json(normalizeDetail(raw))
    }
    return NextResponse.json({ detail: `Backend error: ${res.status}` }, { status: res.status })
  } catch {
    return NextResponse.json({ detail: '백엔드 연결 실패' }, { status: 502 })
  }
}
