import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://buildmore-backend.replit.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, analysisResult, analysisContext, history = [], dealInputState } = body

    if (!message) {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      )
    }

    // analysisResult (프론트엔드 모델) → analysisContext (백엔드 형식) 변환
    const context = analysisContext || buildBackendContext(analysisResult)

    const dealInputResponse = buildDealInputResponse(message, dealInputState)
    if (dealInputResponse) {
      return NextResponse.json(dealInputResponse)
    }

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
      apply_to_analyzer: data.apply_to_analyzer || null,
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

type DealField = 'price' | 'loan' | 'rate' | 'rent' | 'deposit'

const REQUIRED_DEAL_FIELDS: DealField[] = ['price', 'loan', 'rate', 'rent', 'deposit']

const DEAL_FIELD_LABELS: Record<DealField, string> = {
  price: '매입가',
  loan: '대출금',
  rate: '금리',
  rent: '월세',
  deposit: '보증금',
}

const DEAL_FIELD_UNITS: Record<DealField, string> = {
  price: '억',
  loan: '억',
  rate: '%',
  rent: '만원',
  deposit: '만원',
}

function buildDealInputResponse(message: string, dealInputState: any) {
  const parsed = parseDealInputs(message)
  const parsedFields = Object.keys(parsed) as DealField[]

  if (parsedFields.length === 0) {
    return null
  }

  const previousProvided = new Set<DealField>(
    (dealInputState?.providedFields || []).filter((field: string) =>
      REQUIRED_DEAL_FIELDS.includes(field as DealField)
    )
  )
  const provided = new Set<DealField>([...previousProvided, ...parsedFields])
  const missing = REQUIRED_DEAL_FIELDS.filter((field) => !provided.has(field))

  if (missing.length > 0) {
    return {
      success: true,
      response:
        `${formatDealFields(parsed)} 확인했습니다. 입력하신 정보를 반영해 분석하려면 ` +
        `${missing.map((field) => DEAL_FIELD_LABELS[field]).join(', ')}도 필요합니다. ` +
        `예: 보증금 5000만원, 월세 320만원처럼 알려주세요.`,
      apply_to_analyzer: null,
      parsed_deal_fields: parsed,
      missing_deal_fields: missing,
      timestamp: new Date().toISOString(),
      source: 'deal_input_parser',
    }
  }

  const currentValues = dealInputState?.values || {}
  const apply: Record<DealField, number> = {
    price: Number(parsed.price ?? currentValues.price),
    loan: Number(parsed.loan ?? currentValues.loan),
    rate: Number(parsed.rate ?? currentValues.rate),
    rent: Number(parsed.rent ?? currentValues.rent),
    deposit: Number(parsed.deposit ?? currentValues.deposit),
  }

  return {
    success: true,
    response: `${formatDealFields(parsed)} 반영했습니다. 입력하신 정보를 기준으로 분석 조건을 자동 입력하고 분석을 실행하겠습니다.`,
    apply_to_analyzer: apply,
    parsed_deal_fields: parsed,
    missing_deal_fields: [],
    timestamp: new Date().toISOString(),
    source: 'deal_input_parser',
  }
}

function parseDealInputs(message: string): Partial<Record<DealField, number>> {
  const parsed: Partial<Record<DealField, number>> = {}
  const text = message.replace(/,/g, '').replace(/\s+/g, ' ').trim()

  const price = matchMoney(text, /(?:매입가|매입금액|매수가|매매가|가격|매입)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:억|억원|만|만원)?)/)
  if (price != null) parsed.price = Math.round((price / 100_000_000) * 10) / 10

  const loan = matchMoney(text, /(?:대출금|대출액|대출)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:억|억원|만|만원)?)/)
  if (loan != null) parsed.loan = Math.round((loan / 100_000_000) * 10) / 10

  const rent = matchMoney(text, /(?:월세|월임대료|임대료|월 임대료)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:억|억원|만|만원)?)/)
  if (rent != null) parsed.rent = Math.round(rent / 10_000)

  const deposit = matchMoney(text, /(?:보증금|보증|임대보증금)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:억|억원|만|만원)?)/)
  if (deposit != null) parsed.deposit = Math.round(deposit / 10_000)

  const rateMatch = text.match(/(?:금리|이자율|대출금리)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*%?/)
  if (rateMatch) parsed.rate = Number(rateMatch[1])

  return parsed
}

function matchMoney(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern)
  if (!match?.[1]) return null
  return parseKoreanMoneyToWon(match[1])
}

function parseKoreanMoneyToWon(raw: string): number {
  const cleaned = raw.replace(/\s+/g, '')
  const value = Number(cleaned.match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || 0)

  if (cleaned.includes('억')) return value * 100_000_000
  if (cleaned.includes('만')) return value * 10_000

  return value * 10_000
}

function formatDealFields(values: Partial<Record<DealField, number>>): string {
  const parts = (Object.entries(values) as [DealField, number][])
    .filter(([, value]) => Number.isFinite(value))
    .map(([field, value]) => `${DEAL_FIELD_LABELS[field]} ${value}${DEAL_FIELD_UNITS[field]}`)

  return parts.length > 0 ? parts.join(', ') : '입력값'
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
