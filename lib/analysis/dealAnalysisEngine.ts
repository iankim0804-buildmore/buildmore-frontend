/**
 * Deal Analysis Engine
 * 입력값을 기반으로 KPI, Bankability, Deal Signal, Insight를 계산한다.
 */

export interface DealInput {
  address: string
  price: number        // 매입가 (억)
  loan: number         // 대출금액 (억)
  rate: number         // 금리 (%)
  rent: number         // 월세 (만원)
  deposit: number      // 보증금 (만원)
  vacancyRate: number  // 공실률 (%)
}

export interface KPIResult {
  noi: number
  dscr: number
  ltv: number
  cap: number
  monthlyPayment: number
  cocReturn: number
  equity: number
}

export interface BankabilityResult {
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  description: string
}

export type DealSignal = '매수' | '가격협상' | '매수보류'

export interface InsightResult {
  buyDecision: DealInsightData
  negotiation: DealInsightData
  cashflow: DealInsightData
  upside: DealInsightData
  riskAction: DealInsightData
}

export interface DealInsightData {
  id: string
  title: string
  verdict: string
  summary: string
  reasons: string[]
  actions: string[]
  evidenceLabel: string
  ctaText: string
  severity: 'success' | 'warning' | 'danger' | 'neutral'
}

export interface AnalysisResult {
  input: DealInput
  kpi: KPIResult
  bankability: BankabilityResult
  dealSignal: DealSignal
  insights: InsightResult
  timestamp: string
  analysisId: string
}

const DEFAULT_OPEX = 82
const DEFAULT_LOAN_TERM_YEARS = 20

function calcMonthlyAmortizingPayment(loanEok: number, annualRatePct: number, loanTermYears = DEFAULT_LOAN_TERM_YEARS): number {
  const loanManwon = loanEok * 10000
  if (loanManwon <= 0 || loanTermYears <= 0) return 0

  const months = loanTermYears * 12
  const monthlyRate = annualRatePct / 100 / 12

  if (monthlyRate <= 0) return loanManwon / months
  return loanManwon * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months))
}

/** KPI 계산 */
export function calculateKPI(input: DealInput): KPIResult {
  const { price, loan, rate, rent, vacancyRate } = input

  const pgi = rent * 12
  const vacancyLoss = pgi * (vacancyRate / 100)
  const egi = pgi - vacancyLoss
  const noi = egi - DEFAULT_OPEX

  const monthlyPaymentRaw = calcMonthlyAmortizingPayment(loan, rate)
  const annualDebtService = monthlyPaymentRaw * 12
  const monthlyPayment = Math.round(monthlyPaymentRaw)
  const dscr = annualDebtService > 0 ? noi / annualDebtService : 999

  const ltv = price > 0 ? (loan / price) * 100 : 0
  const cap = price > 0 ? (noi / (price * 10000)) * 100 : 0
  const equity = price - loan
  const cashFlow = noi - annualDebtService
  const cocReturn = equity > 0 ? (cashFlow / (equity * 10000)) * 100 : 0

  return {
    noi: Math.round(noi),
    dscr: Math.round(dscr * 100) / 100,
    ltv: Math.round(ltv * 10) / 10,
    cap: Math.round(cap * 100) / 100,
    monthlyPayment,
    cocReturn: Math.round(cocReturn * 10) / 10,
    equity: Math.round(equity * 10) / 10,
  }
}

/** Bankability 점수 계산 */
export function calculateBankability(kpi: KPIResult, input: DealInput): BankabilityResult {
  let score = 50

  if (kpi.dscr >= 1.5) score += 25
  else if (kpi.dscr >= 1.2) score += 20
  else if (kpi.dscr >= 1.0) score += 10
  else if (kpi.dscr < 0.8) score -= 10

  if (kpi.ltv <= 50) score += 15
  else if (kpi.ltv <= 60) score += 10
  else if (kpi.ltv <= 70) score += 5
  else if (kpi.ltv > 80) score -= 10

  if (kpi.cap >= 5) score += 10
  else if (kpi.cap >= 4) score += 7
  else if (kpi.cap >= 3) score += 3
  else score -= 5

  if (input.vacancyRate <= 5) score += 10
  else if (input.vacancyRate <= 10) score += 5
  else if (input.vacancyRate > 15) score -= 10

  score = Math.max(0, Math.min(100, score))

  let grade: 'A' | 'B' | 'C' | 'D'
  if (score >= 80) grade = 'A'
  else if (score >= 65) grade = 'B'
  else if (score >= 50) grade = 'C'
  else grade = 'D'

  let description: string
  if (kpi.dscr >= 1.2 && score >= 68) {
    description = `은행식 DSCR ${kpi.dscr.toFixed(2)}x로 원리금 상환 여력이 양호합니다.`
  } else if (kpi.dscr >= 1.0) {
    description = `은행식 DSCR ${kpi.dscr.toFixed(2)}x로 원리금은 커버되지만 보강 자료가 필요합니다.`
  } else {
    const targetAnnualDebtService = kpi.noi / 1.2
    const currentAnnualDebtService = kpi.monthlyPayment * 12
    const annualGap = Math.max(0, currentAnnualDebtService - targetAnnualDebtService)
    const requiredRent = Math.ceil(input.rent + annualGap / (12 * (1 - input.vacancyRate / 100)))
    description = `은행식 DSCR ${kpi.dscr.toFixed(2)}x — 원리금 기준 미달. 매입가 협상 또는 월세 ${requiredRent}만 이상 확보를 권장합니다.`
  }

  return { score, grade, description }
}

/** Deal Signal 결정 */
export function determineDealSignal(kpi: KPIResult, bankability: BankabilityResult): DealSignal {
  if (kpi.dscr >= 1.2 && bankability.score >= 70) return '매수'
  if (kpi.dscr >= 0.9 && bankability.score >= 50) return '가격협상'
  return '매수보류'
}

function makeInsight(
  id: string,
  title: string,
  verdict: string,
  summary: string,
  reasons: string[],
  actions: string[],
  severity: DealInsightData['severity'],
): DealInsightData {
  return {
    id,
    title,
    verdict,
    summary,
    reasons,
    actions,
    evidenceLabel: '근거 지표: 은행식 DSCR · LTV · NOI · 월 원리금 · 공실률 · Cap Rate',
    ctaText: '실제 투자 결정 전 감정가, 선순위 보증금, 차주 상환능력, 법규 리스크를 함께 확인해야 합니다.',
    severity,
  }
}

/** Insight 생성 */
export function generateInsights(
  input: DealInput,
  kpi: KPIResult,
  bankability: BankabilityResult,
  dealSignal: DealSignal,
): InsightResult {
  const dscrText = `은행식 DSCR ${kpi.dscr.toFixed(2)}x`
  const ltvText = `LTV ${kpi.ltv.toFixed(1)}%`
  const paymentText = `월 원리금 ${kpi.monthlyPayment.toLocaleString('ko-KR')}만원`

  const isHealthy = kpi.dscr >= 1.2
  const isMarginal = kpi.dscr >= 1.0 && kpi.dscr < 1.2

  const buyDecision = makeInsight(
    'buyDecision',
    '매수 판단',
    dealSignal === '매수' ? '매수 검토 가능' : dealSignal === '가격협상' ? '가격협상 후 재검토' : '매수 보류 권장',
    isHealthy
      ? `${dscrText}, ${ltvText}로 원리금 상환 여력이 확인됩니다.`
      : `${dscrText}로 은행식 원리금 상환 기준에서 부담이 큽니다.`,
    [
      `${paymentText} 기준으로 현금흐름을 검토했습니다.`,
      `${ltvText}이며 자기자본은 ${kpi.equity.toFixed(1)}억입니다.`,
      `공실률 ${input.vacancyRate}% 반영 후 NOI는 ${kpi.noi.toLocaleString('ko-KR')}만원/년입니다.`,
    ],
    isHealthy
      ? ['임대차계약서와 임차인 신용도를 확인하세요.', '감정가 기준 LTV를 다시 점검하세요.', '법규/위반건축물 여부를 확인하세요.']
      : ['매입가 조정을 우선 협상하세요.', '대출금액을 낮춘 시나리오를 검토하세요.', '확정 임대 근거를 확보한 뒤 재분석하세요.'],
    isHealthy ? 'success' : isMarginal ? 'warning' : 'danger',
  )

  const negotiation = makeInsight(
    'negotiation',
    '가격협상 포인트',
    kpi.dscr < 1.2 ? '협상 근거 있음' : '협상 근거 제한적',
    kpi.dscr < 1.2
      ? `${dscrText}로 1.2x 기준에 미달하므로 매입가 조정 논리가 있습니다.`
      : `${dscrText}로 금융 조건은 비교적 안정적입니다.`,
    [
      `${paymentText}이 임대수익 대비 핵심 부담입니다.`,
      `금리 1%p 상승 시 현금흐름 민감도가 커질 수 있습니다.`,
      `공실률 ${input.vacancyRate}% 가정의 타당성을 실사해야 합니다.`,
    ],
    ['DSCR 1.2x가 되는 매입가를 역산하세요.', '공실/수선비 리스크를 가격 조정 근거로 쓰세요.', '유사 실거래 비교 자료를 확보하세요.'],
    kpi.dscr < 1.2 ? 'warning' : 'neutral',
  )

  const cashflow = makeInsight(
    'cashflow',
    '현금흐름 안정성',
    isHealthy ? '안정적' : isMarginal ? '보수적 관리 필요' : '위험',
    `${dscrText}, ${paymentText} 기준으로 현금흐름을 판단했습니다.`,
    [
      `연 NOI는 ${kpi.noi.toLocaleString('ko-KR')}만원입니다.`,
      `CoC 수익률은 ${kpi.cocReturn.toFixed(1)}%입니다.`,
      `Cap Rate는 ${kpi.cap.toFixed(1)}%입니다.`,
    ],
    ['공실률 보수 시나리오를 적용하세요.', '금리 상승 스트레스를 확인하세요.', '3~6개월 운영비 예비비를 확보하세요.'],
    isHealthy ? 'success' : isMarginal ? 'warning' : 'danger',
  )

  const upside = makeInsight(
    'upside',
    '업사이드 가능성',
    '추가 검토 필요',
    '업사이드는 현재 임대료, 리모델링, 상권 데이터가 보강되어야 정교하게 판단할 수 있습니다.',
    ['현재 계산은 금융 안정성 중심입니다.', '상권/실거래 데이터 반영 전에는 시장점수 해석에 주의가 필요합니다.', '리모델링 후 임대료 상승 근거가 핵심입니다.'],
    ['유사 임대 사례를 확보하세요.', '리모델링 비용 견적을 보수적으로 잡으세요.', '실거래 기반 시장점수를 연결하세요.'],
    'neutral',
  )

  const riskAction = makeInsight(
    'riskAction',
    '리스크와 다음 액션',
    kpi.dscr < 1.0 ? '높은 리스크' : '실사 확인 필요',
    `${dscrText}와 ${ltvText}가 핵심 리스크 판단 기준입니다.`,
    ['감정가가 매입가보다 낮으면 실제 LTV가 상승합니다.', '선순위 보증금은 실효 담보여력을 낮출 수 있습니다.', '차주 소득/기존부채가 반영되지 않았습니다.'],
    ['감정가 보수 추정치를 입력하세요.', '선순위 임차보증금을 확인하세요.', '차주 DSR/소득 정보를 다음 버전에 반영하세요.'],
    kpi.dscr < 1.0 ? 'danger' : 'warning',
  )

  return { buyDecision, negotiation, cashflow, upside, riskAction }
}

/** 전체 분석 실행 */
export function runDealAnalysis(input: DealInput): AnalysisResult {
  const kpi = calculateKPI(input)
  const bankability = calculateBankability(kpi, input)
  const dealSignal = determineDealSignal(kpi, bankability)
  const insights = generateInsights(input, kpi, bankability, dealSignal)

  return {
    input,
    kpi,
    bankability,
    dealSignal,
    insights,
    timestamp: new Date().toISOString(),
    analysisId: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  }
}

/** 분석 결과 요약 텍스트 생성 */
export function generateAnalysisSummary(result: AnalysisResult): string {
  const { input, kpi, bankability, dealSignal } = result

  return `## ${input.address} 분석 완료\n\n**종합 판단: ${dealSignal}**\n\n| 지표 | 값 |\n|------|-----|\n| NOI | ${kpi.noi.toLocaleString()}만원/년 |\n| 은행식 DSCR | ${kpi.dscr.toFixed(2)}x |\n| LTV | ${kpi.ltv.toFixed(1)}% |\n| 월 원리금 | ${kpi.monthlyPayment.toLocaleString()}만원 |\n| Cap Rate | ${kpi.cap.toFixed(1)}% |\n| Bankability | ${bankability.score}점 (${bankability.grade}등급) |\n\n**요약**: ${bankability.description}`
}

/** 추천 질문 생성 */
export function generateSuggestedQuestions(result: AnalysisResult): string[] {
  const { kpi, dealSignal } = result

  const baseQuestions = [
    '이 매물의 적정 매수가를 얼마로 봐야 하나요?',
    '가격협상에서 어떤 근거를 제시해야 하나요?',
    '현금흐름 시나리오를 더 자세히 알고 싶어요',
  ]

  if (dealSignal === '매수보류') {
    return [
      '이 매물을 매수하려면 어떤 조건이 필요하나요?',
      '매입가를 얼마로 낮춰야 은행식 DSCR 1.2 이상이 되나요?',
      ...baseQuestions.slice(2),
    ]
  }

  if (kpi.dscr < 1.2) {
    return ['DSCR을 개선하려면 어떻게 해야 하나요?', ...baseQuestions]
  }

  return baseQuestions
}
