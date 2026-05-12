import { NextRequest, NextResponse } from 'next/server'
import { runDealAnalysis } from '@/lib/analysis/dealAnalysisEngine'

// 백엔드 API 설정
const BACKEND_URL = process.env.BACKEND_URL || 'https://ai-mvp.replit.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 프론트엔드 입력값 검증
    if (body.price <= 0) {
      return NextResponse.json(
        { error: '매입가를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 프론트엔드 입력값을 백엔드 형식으로 변환
    const backendPayload = {
      address: body.address || '주소 미입력',
      deal_amount: Math.round(body.price * 100000000), // 억 → 원
      loan_amount: Math.round(body.loan * 100000000), // 억 → 원
      equity: Math.round((body.price - body.loan) * 100000000), // 자기자본 (원)
      monthly_rent: Math.round(body.rent * 10000), // 만원 → 원
      monthly_deposit: Math.round(body.deposit || 0), // 이미 원 단위
      interest_rate: body.rate / 100, // % → 소수
      vacancy_rate: (body.vacancyRate || 5) / 100, // % → 소수
    }

    console.log('[analysis/run] 백엔드 요청:', backendPayload)

    // 백엔드 프록시
    const response = await fetch(`${BACKEND_URL}/api/analysis/deal-panel/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn(
        '[analysis/run] 백엔드 오류:',
        response.status,
        errorText
      )
      // 백엔드 실패 시 로컬 fallback
      return handleLocalFallback(body)
    }

    const backendData = await response.json()
    console.log('[analysis/run] 백엔드 응답:', backendData)

    // 백엔드 응답 → 프론트엔드 모델로 매핑
    const mappedResponse = mapBackendResponse(backendData, body)

    return NextResponse.json(mappedResponse)
  } catch (error) {
    console.error('[analysis/run] 에러:', error)

    // 네트워크 에러 시 로컬 fallback
    try {
      const body = await request.json()
      return handleLocalFallback(body)
    } catch {
      return NextResponse.json(
        { error: '분석 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
  }
}

/**
 * 백엔드 응답을 프론트엔드 모델로 매핑
 */
function mapBackendResponse(backendData: any, frontendInput: any) {
  const deal_panel = backendData.deal_panel || {}

  return {
    input: frontendInput,
    summary: generateSummary(deal_panel, frontendInput),
    bankabilityScore: deal_panel.bankability_score || 50,
    dealSignal: mapDealSignal(deal_panel.deal_signal),
    kpis: {
      noi: deal_panel.kpis?.noi || 0,
      dscr: deal_panel.kpis?.dscr || 0,
      ltv: deal_panel.kpis?.ltv || 0,
      capRate: deal_panel.kpis?.cap_rate || 0,
    },
    insights: deal_panel.insights || [],
  }
}

/**
 * 백엔드 deal_signal을 프론트엔드 형식으로 변환
 */
function mapDealSignal(signal: string): string {
  const signalMap: { [key: string]: string } = {
    hold: '매수보류',
    negotiate: '가격협상',
    buy: '매수',
  }
  return signalMap[signal?.toLowerCase()] || '분석중'
}

/**
 * 백엔드 응답 기반 요약 생성
 */
function generateSummary(deal_panel: any, input: any): string {
  const address = input.address || '입력 주소'
  const bankability = deal_panel.bankability_score || 0
  const signal = mapDealSignal(deal_panel.deal_signal)
  const dscr = deal_panel.kpis?.dscr || 0

  return `${address} 기준으로 분석을 업데이트했습니다.

현재 입력 조건은 매입가 ${input.price.toFixed(1)}억, 대출금 ${input.loan.toFixed(1)}억, 금리 ${input.rate.toFixed(1)}%, 월세 ${input.rent}만원, 보증금 ${(input.deposit / 10000).toFixed(1)}억입니다.

종합 점수는 ${bankability}점이고, 현재 판단은 "${signal}"입니다. DSCR은 ${dscr.toFixed(2)}배로 ${dscr >= 1 ? '금융비용을 충분히 커버' : '금융비용이 부족'}하고 있습니다.

주소지는 생활상권과 역세권 특성이 있어 임대수요 측면에서는 긍정적입니다. 자세한 분석 내용은 우측 카드들을 확인해주세요.`
}

/**
 * 로컬 fallback 계산 (백엔드 실패 시)
 */
function handleLocalFallback(input: any) {
  console.log('[analysis/run] 로컬 fallback 사용 - 백엔드 실패 또는 네트워크 오류')

  // dealAnalysisEngine 사용
  const result = runDealAnalysis(input)

  return NextResponse.json({
    input,
    summary: result.summary,
    bankabilityScore: result.bankabilityScore,
    dealSignal: result.dealSignal,
    kpis: result.kpis,
    insights: result.insights,
  })
}
