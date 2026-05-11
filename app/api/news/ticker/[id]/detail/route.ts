import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://buildmore-backend.fly.dev'

// Fallback 데이터 (백엔드 연결 실패 시 사용)
const FALLBACK_DETAILS: Record<string, any> = {
  '1': {
    id: 1,
    headline: '서울 상업용 부동산 거래량 전월 대비 증가',
    district_name: '서울 전역',
    report_date: '2024-01-15',
    signal: 'favorable',
    summary: '최근 서울 상업용 부동산 시장에서 거래량이 전월 대비 약 12% 증가한 것으로 나타났습니다. 특히 강남권과 마포·성수 지역의 중소형 빌딩 거래가 활발하며, 금리 인하 기대감과 함께 투자 심리가 회복되는 모습입니다. 전문가들은 하반기에도 이러한 추세가 이어질 것으로 전망하고 있습니다.',
    related_properties: [
      { id: 'p1', address: '서울 강남구 역삼동 123-45', transaction_type: 'commercial_sale', transaction_date: '2024-01-10', area_sqm: 330, amount: 2500000000 },
      { id: 'p2', address: '서울 마포구 서교동 456-78', transaction_type: 'commercial_sale', transaction_date: '2024-01-08', area_sqm: 198, amount: 1800000000 },
    ],
    related_news: [
      { id: 3, headline: '마포·성수권 중소형 빌딩 매수 문의 증가', signal: 'favorable', district_name: '마포구', report_date: '2024-01-13' },
      { id: 5, headline: '역세권 리테일 공실률 안정세', signal: 'favorable', district_name: '역세권', report_date: '2024-01-11' },
      { id: 4, headline: '임대료 상승 지역과 공실률 확대 지역 양극화', signal: 'unfavorable', district_name: '서울 전역', report_date: '2024-01-12' },
    ],
  },
  '2': {
    id: 2,
    headline: '기준금리 동결 전망에 수익형 부동산 관망세 지속',
    district_name: '서울 전역',
    report_date: '2024-01-14',
    signal: 'unfavorable',
    summary: '한국은행의 기준금리 동결 전망이 지속되면서 수익형 부동산 시장에서는 관망세가 이어지고 있습니다. 대출 금리 부담으로 인해 투자자들이 신중한 태도를 보이고 있으며, 특히 고가 물건보다는 중소형 물건 위주로 선별적 투자가 이뤄지고 있습니다.',
    related_properties: [],
    related_news: [
      { id: 6, headline: '금융권, 상업용 부동산 담보대출 심사 강화', signal: 'unfavorable', district_name: '서울 전역', report_date: '2024-01-10' },
      { id: 4, headline: '임대료 상승 지역과 공실률 확대 지역 양극화', signal: 'unfavorable', district_name: '서울 전역', report_date: '2024-01-12' },
      { id: 1, headline: '서울 상업용 부동산 거래량 전월 대비 증가', signal: 'favorable', district_name: '서울 전역', report_date: '2024-01-15' },
    ],
  },
  '3': {
    id: 3,
    headline: '마포·성수권 중소형 빌딩 매수 문의 증가',
    district_name: '마포구',
    report_date: '2024-01-13',
    signal: 'favorable',
    summary: '마포구 합정·상수동과 성동구 성수동 일대 중소형 빌딩에 대한 매수 문의가 늘어나고 있습니다. 젊은 층의 유동인구가 많고 상권이 활성화된 지역 특성상 임대 수익 안정성이 높다는 평가입니다. 50~100억원대 물건이 인기를 끌고 있습니다.',
    related_properties: [
      { id: 'p3', address: '서울 마포구 합정동 428-5', transaction_type: 'commercial_sale', transaction_date: '2024-01-05', area_sqm: 264, amount: 4200000000 },
    ],
    related_news: [
      { id: 1, headline: '서울 상업용 부동산 거래량 전월 대비 증가', signal: 'favorable', district_name: '서울 전역', report_date: '2024-01-15' },
      { id: 5, headline: '역세권 리테일 공실률 안정세', signal: 'favorable', district_name: '역세권', report_date: '2024-01-11' },
      { id: 4, headline: '임대료 상승 지역과 공실률 확대 지역 양극화', signal: 'unfavorable', district_name: '서울 전역', report_date: '2024-01-12' },
    ],
  },
  '4': {
    id: 4,
    headline: '임대료 상승 지역과 공실률 확대 지역 양극화',
    district_name: '서울 전역',
    report_date: '2024-01-12',
    signal: 'unfavorable',
    summary: '서울 상업용 부동산 시장에서 지역별 양극화가 심화되고 있습니다. 강남·홍대·성수 등 핵심 상권은 임대료가 상승하는 반면, 외곽 지역과 오피스 밀집 지역은 공실률이 높아지는 추세입니다. 입지 선별의 중요성이 더욱 커지고 있습니다.',
    related_properties: [],
    related_news: [
      { id: 2, headline: '기준금리 동결 전망에 수익형 부동산 관망세 지속', signal: 'unfavorable', district_name: '서울 전역', report_date: '2024-01-14' },
      { id: 6, headline: '금융권, 상업용 부동산 담보대출 심사 강화', signal: 'unfavorable', district_name: '서울 전역', report_date: '2024-01-10' },
      { id: 5, headline: '역세권 리테일 공실률 안정세', signal: 'favorable', district_name: '역세권', report_date: '2024-01-11' },
    ],
  },
  '5': {
    id: 5,
    headline: '역세권 리테일 공실률 안정세',
    district_name: '역세권',
    report_date: '2024-01-11',
    signal: 'favorable',
    summary: '지하철 역세권 주변 리테일 상가의 공실률이 안정세를 보이고 있습니다. 유동인구 회복과 함께 F&B 업종의 신규 입점이 늘어나면서 역세권 1층 상가의 경쟁력이 회복되고 있습니다. 특히 2호선과 수도권 광역철도 환승역 주변이 인기입니다.',
    related_properties: [
      { id: 'p4', address: '서울 강남구 신논현역 인근', transaction_type: 'retail_lease', transaction_date: '2024-01-09', area_sqm: 66, amount: 15000000 },
    ],
    related_news: [
      { id: 1, headline: '서울 상업용 부동산 거래량 전월 대비 증가', signal: 'favorable', district_name: '서울 전역', report_date: '2024-01-15' },
      { id: 3, headline: '마포·성수권 중소형 빌딩 매수 문의 증가', signal: 'favorable', district_name: '마포구', report_date: '2024-01-13' },
      { id: 4, headline: '임대료 상승 지역과 공실률 확대 지역 양극화', signal: 'unfavorable', district_name: '서울 전역', report_date: '2024-01-12' },
    ],
  },
  '6': {
    id: 6,
    headline: '금융권, 상업용 부동산 담보대출 심사 강화',
    district_name: '서울 전역',
    report_date: '2024-01-10',
    signal: 'unfavorable',
    summary: '주요 시중은행들이 상업용 부동산 담보대출 심사 기준을 강화하고 있습니다. LTV 한도 축소와 함께 임대 수익 대비 원리금 상환 능력(DSCR) 검토가 까다로워지면서 레버리지 투자가 어려워지고 있습니다. 자기자본 비중을 높여야 하는 상황입니다.',
    related_properties: [],
    related_news: [
      { id: 2, headline: '기준금리 동결 전망에 수익형 부동산 관망세 지속', signal: 'unfavorable', district_name: '서울 전역', report_date: '2024-01-14' },
      { id: 4, headline: '임대료 상승 지역과 공실률 확대 지역 양극화', signal: 'unfavorable', district_name: '서울 전역', report_date: '2024-01-12' },
      { id: 1, headline: '서울 상업용 부동산 거래량 전월 대비 증가', signal: 'favorable', district_name: '서울 전역', report_date: '2024-01-15' },
    ],
  },
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const res = await fetch(`${BACKEND_URL}/api/news/ticker/${id}/detail`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      console.warn('[news/ticker/detail] Backend error:', res.status, '- using fallback')
      return NextResponse.json(FALLBACK_DETAILS[id] || { error: 'Detail not available' })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.warn('[news/ticker/detail] Network error, using fallback:', err)
    return NextResponse.json(FALLBACK_DETAILS[id] || { error: 'Detail not available' })
  }
}
