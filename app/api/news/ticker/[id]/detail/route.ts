import { NextRequest, NextResponse } from 'next/server'

const BACKEND = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_ADMIN_API_URL ||
  'https://buildmore-backend.replit.app'
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

type FallbackDetail = {
  id: number
  headline: string
  district_name: string
  bjd_code: string
  region_2depth: string
  region_3depth: string
  signal: string
  signal_strength: string
  frame: string
  report_date: string
  summary: string
  wiki_note_id: null
  click_count: number
  exposed_count: number
  related_properties: never[]
  related_news: never[]
}

const FALLBACK_DETAILS: Record<number, Partial<FallbackDetail>> = {
  1: { headline: '성수동 개업률 급등 — F&B 임차수요 최고조', district_name: '성수동', signal: 'favorable', summary: '[동향] 성수동 상권은 개업률 5.30%로 서울 최상위권이며 폐업률은 1.90%로 낮아 임대수익이 안정적입니다.\n[의미] F&B 업종 집중과 함께 팝업스토어 수요가 급증하여 단기·중기 임대 모두 수요가 강세를 보이고 있습니다.\n[신호] favorable' },
  2: { headline: '홍대입구 추정매출 강세 — 서교동 공실 소진 가속', district_name: '서교동', signal: 'favorable', summary: '[동향] 홍대입구 추정 매출이 분기 대비 8% 증가하며 서교동 일대 공실이 빠르게 소진되고 있습니다.\n[의미] 개업률이 폐업률을 초과하여 점포 수 순증이 이어지고 있어 임대 수요 유지가 기대됩니다.\n[신호] favorable' },
  3: { headline: '한남동 점포수 증가 — 고급 임차수요 흡수 중', district_name: '한남동', signal: 'favorable', summary: '[동향] 한남동 점포 수가 전분기 대비 증가세이며 고급 브랜드와 갤러리의 임차 수요가 이어지고 있습니다.\n[의미] 단위 면적당 임대료가 서울 내 최상위권으로 유지되어 자산가치 보존 측면에서 유리합니다.\n[신호] favorable' },
  4: { headline: '합정동 유동인구 상위 — 홍대 팽창 수혜 신호', district_name: '합정동', signal: 'favorable', summary: '[동향] 합정동 유동인구가 전분기 대비 안정세를 유지하며 홍대 팽창 효과로 신규 임차수요가 유입되고 있습니다.\n[의미] 주거+상업 복합 특성상 공실 위험이 낮고 임차인 교체 사이클이 안정적입니다.\n[신호] favorable' },
  5: { headline: '강남역 공실률 상승 — 유흥업종 이탈 주목', district_name: '역삼동', signal: 'unfavorable', summary: '[동향] 강남역 일대 유흥업종의 이탈로 공실률이 전분기 대비 소폭 상승했습니다.\n[의미] 단기적 임대수익 압박 요인이나 역설적으로 업종 전환 임차인의 진입 기회가 될 수 있습니다.\n[신호] unfavorable' },
  6: { headline: '이태원 외국인 방문객 감소 — 단기 임차 리스크', district_name: '이태원동', signal: 'unfavorable', summary: '[동향] 이태원 외국인 방문객 수가 전년 동기 대비 감소하며 단기 임차 수요가 약화되고 있습니다.\n[의미] 관광 의존도가 높은 업종을 중심으로 임차 계약 해지가 늘고 있어 공실 관리가 필요합니다.\n[신호] unfavorable' },
}

function buildFallback(id: number, fallback: Partial<FallbackDetail>): FallbackDetail {
  return {
    id,
    headline: fallback.headline ?? '',
    district_name: fallback.district_name ?? '',
    bjd_code: '',
    region_2depth: fallback.district_name ?? '',
    region_3depth: fallback.district_name ?? '',
    signal: fallback.signal ?? 'neutral',
    signal_strength: 'medium',
    frame: fallback.signal ?? 'neutral',
    report_date: new Date().toISOString().slice(0, 10),
    summary: fallback.summary ?? '',
    wiki_note_id: null,
    click_count: 0,
    exposed_count: 0,
    related_properties: [],
    related_news: [],
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const numId = parseInt(id, 10)

  try {
    const res = await fetch(`${BACKEND}/api/news/ticker/${id}/detail`, { cache: 'no-store' })
    if (res.ok) {
      const raw = await res.json()
      return NextResponse.json(normalizeDetail(raw))
    }
    // 404이고 fallback 데이터 있으면 사용
    if (res.status === 404 && FALLBACK_DETAILS[numId]) {
      return NextResponse.json(buildFallback(numId, FALLBACK_DETAILS[numId]))
    }
    return NextResponse.json({ detail: `Backend error: ${res.status}` }, { status: res.status })
  } catch {
    if (FALLBACK_DETAILS[numId]) {
      return NextResponse.json(buildFallback(numId, FALLBACK_DETAILS[numId]))
    }
    return NextResponse.json({ detail: '백엔드 연결 실패' }, { status: 502 })
  }
}
