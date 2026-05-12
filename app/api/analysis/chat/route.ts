import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://ai-mvp.replit.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, analysisResult, analysisContext, history = [] } = body

    if (!message) {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      )
    }

    // analysisResult (프론트엔드 모델) → analysisContext (백엔드 형식) 변환
    const context = analysisContext || buildBackendContext(analysisResult)

    const response = await fetch(`${BACKEND_URL}/api/analysis/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API-Key': process.env.INTERNAL_API_KEY || '',
      },
      body: JSON.stringify({
        message,
        analysis_context: context,
        history: history.map((h: { role: string; content: string }) => ({
          role: h.role,
          content: h.content,
        })),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[chat] backend error:', response.status, errorText)
      // 백엔드 실패 시 로컬 폴백
      return NextResponse.json({
        success: true,
        response: generateLocalFallback(message, analysisResult),
        timestamp: new Date().toISOString(),
        source: 'local_fallback',
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      response: data.response || '',
      sources_used: data.sources_used || [],
      model: data.model || '',
      timestamp: new Date().toISOString(),
      source: 'backend',
    })
  } catch (error) {
    console.error('[chat] error:', error)
    return NextResponse.json(
      { error: '응답 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 프론트엔드 AnalysisResult → 백엔드 analysis_context 변환
 */
function buildBackendContext(analysisResult: any): Record<string, any> | null {
  if (!analysisResult) return null

  const { input, kpi, bankability, dealSignal } = analysisResult || {}

  return {
    address: input?.address,
    asset_type: input?.assetType,
    deal_amount: input?.price ? Math.round(input.price * 100_000_000) : undefined,
    loan_amount: input?.loan ? Math.round(input.loan * 100_000_000) : undefined,
    equity: input?.price && input?.loan
      ? Math.round((input.price - input.loan) * 100_000_000)
      : undefined,
    monthly_rent: input?.rent ? Math.round(input.rent * 10_000) : undefined,
    deposit: input?.deposit,
    interest_rate: input?.rate ? input.rate / 100 : undefined,
    vacancy_rate: input?.vacancyRate ? input.vacancyRate / 100 : undefined,
    score_cards: bankability ? { bankability_score: bankability.score } : undefined,
    feasibility_card: kpi
      ? {
          annual_noi: kpi.noi ? kpi.noi * 10_000 : undefined,
          dscr: kpi.dscr,
          ltv: kpi.ltv,
          cap_rate: kpi.capRate,
        }
      : undefined,
    conclusion_card: dealSignal ? { verdict: dealSignal } : undefined,
  }
}

/**
 * 백엔드 연결 실패 시 로컬 폴백 (기존 로직 유지)
 */
function generateLocalFallback(question: string, analysisResult: any): string {
  if (!analysisResult) {
    return '분석 결과가 없습니다. 먼저 딜 조건을 입력해 분석을 실행해 주세요.'
  }

  const { input, kpi, bankability, dealSignal } = analysisResult
  const q = question.toLowerCase()

  if (q.includes('적정') && (q.includes('매수가') || q.includes('가격'))) {
    const targetDscr = 1.2
    const annualDebt = kpi.noi / targetDscr
    const targetPrice = input.loan + annualDebt / (input.rate / 100) / 10000
    return `**적정 매수가 분석**\n\nDSCR 1.2x 기준으로 매입가를 약 **${targetPrice.toFixed(1)}억**으로 조정하는 것이 적절합니다.\n\n- 현재 NOI: ${kpi.noi.toLocaleString()}만원/년\n- 현재 대출: ${input.loan}억 / ${input.rate}%`
  }

  return `**${input?.address || '입력 주소'} 분석 기반 답변**\n\n딜 시그널: **${dealSignal}** | Bankability: ${bankability?.score}점\n\nNOI: ${kpi?.noi?.toLocaleString()}만원/년 | DSCR: ${kpi?.dscr?.toFixed(2)}x | LTV: ${kpi?.ltv?.toFixed(1)}%\n\n더 구체적인 질문(예: "적정 매수가는?", "DSCR 개선 방법은?")을 입력해 주세요.`
}
