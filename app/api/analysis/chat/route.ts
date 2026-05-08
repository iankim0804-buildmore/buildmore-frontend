import { NextRequest, NextResponse } from 'next/server'
import type { AnalysisResult } from '@/lib/analysis/dealAnalysisEngine'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// LLM 없이 로컬에서 응답 생성 (폴백)
function generateLocalResponse(
  question: string, 
  analysisResult: AnalysisResult
): string {
  const { input, kpi, bankability, dealSignal } = analysisResult
  const q = question.toLowerCase()
  
  // 적정 매수가 질문
  if (q.includes('적정') && (q.includes('매수가') || q.includes('가격'))) {
    const targetDscr = 1.2
    const annualDebt = kpi.noi / targetDscr
    const targetPrice = input.loan + (annualDebt / (input.rate / 100) / 10000)
    return `**적정 매수가 분석**

현재 입력하신 조건을 기준으로, DSCR 1.2x를 확보하려면 매입가를 약 **${targetPrice.toFixed(1)}억**으로 조정하는 것이 적절합니다.

**산출 근거:**
- 목표 DSCR: 1.2x
- 현재 NOI: ${kpi.noi.toLocaleString()}만원/년
- 대출 조건: ${input.loan}억 / ${input.rate}%

현재 매입가 ${input.price}억 대비 약 ${((1 - targetPrice / input.price) * 100).toFixed(1)}% 협상이 필요합니다.`
  }
  
  // 가격협상 근거 질문
  if (q.includes('협상') && (q.includes('근거') || q.includes('어떤') || q.includes('논리'))) {
    return `**가격협상 근거 정리**

이 매물에 대해 다음 근거로 가격협상을 진행할 수 있습니다:

1. **DSCR 기준 미달** (현재 ${kpi.dscr.toFixed(2)}x)
   - 금융기관 기준 DSCR 1.2x 이상 필요
   - 현재 조건으로는 대출 승인이 어려울 수 있음

2. **LTV 부담** (현재 ${kpi.ltv.toFixed(1)}%)
   - 자기자본 대비 대출 비중이 높아 리스크 증가
   
3. **공실률 리스크** (현재 ${input.vacancyRate}%)
   - 공실 발생 시 현금흐름 급격히 악화
   - 공실률 ${input.vacancyRate + 5}% 시나리오에서 NOI ${Math.round(input.rent * 12 * 0.05)}만원 감소

**협상 제안 범위**: ${(input.price * 0.9).toFixed(1)}억 ~ ${(input.price * 0.95).toFixed(1)}억`
  }
  
  // DSCR 개선 질문
  if (q.includes('dscr') && (q.includes('개선') || q.includes('높') || q.includes('올'))) {
    const targetRent = Math.ceil((input.loan * 10000 * (input.rate / 100) * 1.2 + 82) / (12 * (1 - input.vacancyRate / 100)))
    return `**DSCR 개선 방안**

현재 DSCR ${kpi.dscr.toFixed(2)}x를 1.2x 이상으로 개선하는 방법:

**옵션 1: 월세 인상**
- 목표 월세: ${targetRent}만원 (현재 ${input.rent}만원)
- 필요 인상률: ${((targetRent / input.rent - 1) * 100).toFixed(1)}%

**옵션 2: 대출금액 축소**
- 목표 대출: ${(kpi.noi / 1.2 / (input.rate / 100) / 10000).toFixed(1)}억
- 추가 자기자본 필요: ${(input.loan - kpi.noi / 1.2 / (input.rate / 100) / 10000).toFixed(1)}억

**옵션 3: 매입가 협상**
- 매입가를 낮추면 자기자본 비중 증가
- 동일 대출금액으로 LTV 개선 가능`
  }
  
  // 현금흐름 시나리오 질문
  if (q.includes('현금흐름') || q.includes('시나리오')) {
    const baseNoi = kpi.noi
    const annualDebt = input.loan * 10000 * (input.rate / 100)
    return `**현금흐름 시나리오 분석**

| 시나리오 | 공실률 | NOI | 순현금흐름 | DSCR |
|---------|--------|-----|-----------|------|
| 낙관 | ${Math.max(0, input.vacancyRate - 5)}% | ${Math.round(input.rent * 12 * (1 - (input.vacancyRate - 5) / 100) - 82)}만 | ${Math.round(input.rent * 12 * (1 - (input.vacancyRate - 5) / 100) - 82 - annualDebt)}만 | ${((input.rent * 12 * (1 - (input.vacancyRate - 5) / 100) - 82) / annualDebt).toFixed(2)}x |
| 기본 | ${input.vacancyRate}% | ${baseNoi}만 | ${Math.round(baseNoi - annualDebt)}만 | ${kpi.dscr.toFixed(2)}x |
| 보수 | ${input.vacancyRate + 5}% | ${Math.round(input.rent * 12 * (1 - (input.vacancyRate + 5) / 100) - 82)}만 | ${Math.round(input.rent * 12 * (1 - (input.vacancyRate + 5) / 100) - 82 - annualDebt)}만 | ${((input.rent * 12 * (1 - (input.vacancyRate + 5) / 100) - 82) / annualDebt).toFixed(2)}x |
| 위기 | ${input.vacancyRate + 10}% | ${Math.round(input.rent * 12 * (1 - (input.vacancyRate + 10) / 100) - 82)}만 | ${Math.round(input.rent * 12 * (1 - (input.vacancyRate + 10) / 100) - 82 - annualDebt)}만 | ${((input.rent * 12 * (1 - (input.vacancyRate + 10) / 100) - 82) / annualDebt).toFixed(2)}x |

**결론**: ${kpi.dscr >= 1.2 ? '보수 시나리오에서도 현금흐름이 유지됩니다.' : '보수 시나리오에서 현금흐름 위험이 있습니다.'}`
  }
  
  // 매수 조건 질문
  if (q.includes('매수') && (q.includes('조건') || q.includes('필요') || q.includes('하려면'))) {
    return `**매수 가능 조건 분석**

현재 딜 시그널: **${dealSignal}**

매수를 진행하려면 다음 조건 중 하나 이상을 충족해야 합니다:

1. **매입가 조정**: ${(input.price * 0.85).toFixed(1)}억 이하
2. **월세 확보**: ${Math.ceil((input.loan * 10000 * (input.rate / 100) * 1.2 + 82) / (12 * (1 - input.vacancyRate / 100)))}만원 이상
3. **대출 조건 개선**: 금리 ${Math.max(1, input.rate - 1).toFixed(1)}% 이하 또는 대출금액 ${(input.loan * 0.8).toFixed(1)}억 이하
4. **공실률 보장**: 임대차 계약으로 공실률 ${Math.max(0, input.vacancyRate - 5)}% 이하 확정

**권장 액션**: 매도자와 ${((1 - 0.9) * 100).toFixed(0)}% 가격협상 후 재검토`
  }
  
  // 기본 응답
  return `**${input.address} 분석 기반 답변**

질문하신 내용에 대해 분석 결과를 기반으로 답변드립니다.

현재 매물의 주요 지표:
- 매입가: ${input.price}억 / 대출: ${input.loan}억
- NOI: ${kpi.noi.toLocaleString()}만원/년
- DSCR: ${kpi.dscr.toFixed(2)}x
- Bankability: ${bankability.score}점

**딜 시그널: ${dealSignal}**

${bankability.description}

더 구체적인 분석이 필요하시면:
- "적정 매수가는 얼마인가요?"
- "가격협상 근거를 알려주세요"
- "현금흐름 시나리오를 보여주세요"

와 같이 질문해 주세요.`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, analysisResult, history = [] } = body as {
      message: string
      analysisResult: AnalysisResult
      history?: ChatMessage[]
    }
    
    if (!message || !analysisResult) {
      return NextResponse.json(
        { error: '메시지와 분석 결과가 필요합니다.' },
        { status: 400 }
      )
    }
    
    // LLM API 키 확인 (향후 확장용)
    const hasLLM = false // process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY
    
    let response: string
    
    if (hasLLM) {
      // TODO: LLM 연동 시 구현
      // const completion = await openai.chat.completions.create(...)
      response = generateLocalResponse(message, analysisResult)
    } else {
      // 로컬 응답 생성
      response = generateLocalResponse(message, analysisResult)
    }
    
    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: '응답 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
