import { NextRequest, NextResponse } from 'next/server'
import { runDealAnalysis } from '@/lib/analysis/dealAnalysisEngine'

// 백엔드 API 설정
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.buildmore.co.kr'

type FrontendAnalysisInput = {
  address?: string
  price: number
  loan: number
  rate: number
  rent: number
  deposit?: number
  vacancyRate?: number
  constructionCondition?: string
  targetGfaM2?: number | null
  constructionCostPerM2Manwon?: number
  elevatorOption?: string
}

type BackendKpis = {
  noi_manwon?: number | null
  dscr?: number | null
  ltv_pct?: number | null
  cap_rate_pct?: number | null
  annual_debt_service_manwon?: number | null
  monthly_debt_service_manwon?: number | null
}

type BackendRunResponse = {
  kpis?: BackendKpis
  bankability?: {
    score?: number | null
  }
  deal_signal?: {
    label?: string | null
  }
  analysis_strategy?: AnalysisStrategyPayload | null
}

type AnalysisStrategyPayload = {
  summary?: string
  tabs?: StrategyTabPayload[]
}

type StrategyTabPayload = {
  key?: string
  headline?: string
  verdict?: string
  opportunity?: string
  downside?: string
  comparison?: string
  timing?: string
  next_actions?: StrategyActionPayload[]
  evidence?: StrategyEvidencePayload[]
}

type StrategyActionPayload = {
  label?: string
  description?: string
}

type StrategyEvidencePayload = {
  label?: string
  value?: string
}

export async function POST(request: NextRequest) {
  let body: FrontendAnalysisInput | null = null

  try {
    body = (await request.json()) as FrontendAnalysisInput

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
      purchase_price_uk: Number(body.price || 0),
      loan_amount_uk: Number(body.loan || 0),
      interest_rate_pct: Number(body.rate || 0),
      monthly_rent_manwon: Number(body.rent || 0),
      deposit_manwon: Number(body.deposit || 0),
      vacancy_rate_pct: Number(body.vacancyRate || 10),
      construction_condition: body.constructionCondition || '현황',
      target_gfa_m2: body.targetGfaM2 ?? null,
      construction_cost_per_m2_manwon: body.constructionCostPerM2Manwon || 500,
      elevator_option: body.elevatorOption || '현황',
      save_result: false,
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

    const backendData = (await response.json()) as BackendRunResponse
    console.log('[analysis/run] 백엔드 응답:', backendData)

    // 백엔드 응답 → 프론트엔드 모델로 매핑
    const mappedResponse = mapBackendResponse(backendData, body)

    return NextResponse.json(mappedResponse)
  } catch (error) {
    console.error('[analysis/run] 에러:', error)

    // 네트워크 에러 시 로컬 fallback
    if (body) {
      return handleLocalFallback(body)
    }

    return NextResponse.json(
      { error: '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * 백엔드 응답을 프론트엔드 모델로 매핑
 */
function mapBackendResponse(backendData: BackendRunResponse, frontendInput: FrontendAnalysisInput) {
  const kpis = backendData.kpis || {}
  const bankability = backendData.bankability || {}
  const dealSignal = backendData.deal_signal || {}

  return {
    input: frontendInput,
    summary: generateSummary(backendData, frontendInput),
    bankabilityScore: bankability.score || 50,
    dealSignal: mapDealSignal(dealSignal.label),
    kpis: {
      noi: kpis.noi_manwon || 0,
      dscr: kpis.dscr || 0,
      ltv: kpis.ltv_pct || 0,
      capRate: kpis.cap_rate_pct || 0,
      annualDebtService: kpis.annual_debt_service_manwon || 0,
      monthlyDebtService: kpis.monthly_debt_service_manwon || 0,
    },
    insights: mapInsightCards(backendData),
    analysisStrategy: backendData.analysis_strategy ?? null,
    rawDealPanel: backendData,
  }
}

/**
 * 백엔드 deal_signal을 프론트엔드 형식으로 변환
 */
function mapDealSignal(signal?: string | null): string {
  const signalMap: { [key: string]: string } = {
    hold: '매수보류',
    negotiate: '가격협상',
    buy: '매수',
    매수보류: '매수보류',
    가격협상: '가격협상',
    매수: '매수',
  }
  if (!signal) return '분석중'
  return signalMap[signal] || signalMap[signal.toLowerCase()] || '분석중'
}

/**
 * 백엔드 응답 기반 요약 생성
 */
function generateSummary(backendData: BackendRunResponse, input: FrontendAnalysisInput): string {
  const address = input.address || '입력 주소'
  const bankability = backendData.bankability?.score || 0
  const signal = mapDealSignal(backendData.deal_signal?.label)
  const dscr = backendData.kpis?.dscr || 0
  const strategySummary = backendData.analysis_strategy?.summary

  return `${address} 기준으로 분석을 업데이트했습니다.

현재 입력 조건은 매입가 ${input.price.toFixed(1)}억, 대출금 ${input.loan.toFixed(1)}억, 금리 ${input.rate.toFixed(1)}%, 월세 ${input.rent}만원, 보증금 ${((input.deposit || 0) / 10000).toFixed(1)}억입니다.

종합 점수는 ${bankability}점이고, 현재 판단은 "${signal}"입니다. DSCR은 ${dscr.toFixed(2)}배로 ${dscr >= 1 ? '금융비용을 충분히 커버' : '금융비용이 부족'}하고 있습니다.

${strategySummary || '주소지는 생활상권과 역세권 특성이 있어 임대수요 측면에서는 긍정적입니다.'} 자세한 분석 내용은 우측 4개 탭에서 확인해주세요.`
}

function mapInsightCards(backendData: BackendRunResponse) {
  const strategy = backendData.analysis_strategy
  if (!strategy?.tabs) return {}

  const byKey = Object.fromEntries(strategy.tabs.map((tab) => [tab.key || '', tab]))
  const toInsight = (key: string, id: string, title: string) => {
    const tab = byKey[key] || {}
    return {
      id,
      title,
      verdict: tab.headline || title,
      summary: tab.verdict || '',
      reasons: [tab.opportunity, tab.downside, tab.comparison].filter(Boolean),
      actions: (tab.next_actions || []).map((action) => action.label || action.description || '').filter(Boolean),
      evidenceLabel: (tab.evidence || []).map((item) => `${item.label || ''} ${item.value || ''}`.trim()).slice(0, 4).join(' · '),
      ctaText: tab.timing || '',
      severity: tab.key === 'price_finance' ? 'warning' : 'neutral',
    }
  }
  return {
    buyDecision: toInsight('deal_decision', 'buyDecision', '딜 결론'),
    negotiation: toInsight('price_finance', 'negotiation', '가격·금융'),
    cashflow: toInsight('price_finance', 'cashflow', '현금흐름'),
    upside: toInsight('development_operation', 'upside', '개발·운영'),
    riskAction: toInsight('location_future', 'riskAction', '입지·미래가치'),
  }
}

/**
 * 로컬 fallback 계산 (백엔드 실패 시)
 */
function handleLocalFallback(input: FrontendAnalysisInput) {
  console.log('[analysis/run] 로컬 fallback 사용 - 백엔드 실패 또는 네트워크 오류')

  // dealAnalysisEngine 사용
  const result = runDealAnalysis({
    address: input.address || '주소 미입력',
    price: Number(input.price || 0),
    loan: Number(input.loan || 0),
    rate: Number(input.rate || 0),
    rent: Number(input.rent || 0),
    deposit: Number(input.deposit || 0),
    vacancyRate: Number(input.vacancyRate || 10),
  })

  return NextResponse.json({
    input,
    summary: generateLocalSummary(result),
    bankabilityScore: result.bankability.score,
    dealSignal: result.dealSignal,
    kpis: {
      noi: result.kpi.noi,
      dscr: result.kpi.dscr,
      ltv: result.kpi.ltv,
      capRate: result.kpi.cap,
      monthlyDebtService: result.kpi.monthlyPayment,
    },
    insights: result.insights,
    analysisStrategy: null,
  })
}

function generateLocalSummary(result: ReturnType<typeof runDealAnalysis>): string {
  return `${result.input.address} 기준 로컬 계산으로 분석했습니다. Bankability ${result.bankability.score}점, 판단은 ${result.dealSignal}입니다.`
}
