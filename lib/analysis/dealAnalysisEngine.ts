/**
 * Deal Analysis Engine
 * 입력값을 기반으로 KPI, Bankability, Deal Signal, Insight를 계산
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
  noi: number          // 순영업수익 (만원)
  dscr: number         // 부채상환비율
  ltv: number          // LTV (%)
  cap: number          // Cap Rate (%)
  monthlyPayment: number  // 월 상환액 (만원)
  cocReturn: number    // CoC 수익률 (%)
  equity: number       // 자기자본 (억)
}

export interface BankabilityResult {
  score: number        // 0-100
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

// 운영비용 기본값 (연간, 만원)
const DEFAULT_OPEX = 82

/**
 * KPI 계산
 */
export function calculateKPI(input: DealInput): KPIResult {
  const { price, loan, rate, rent, deposit, vacancyRate } = input
  
  // 연간 총 임대수입 (PGI)
  const pgi = rent * 12
  
  // 공실 손실
  const vacancyLoss = pgi * (vacancyRate / 100)
  
  // 유효 총수입 (EGI)
  const egi = pgi - vacancyLoss
  
  // 순영업수익 (NOI) = EGI - OPEX
  const noi = egi - DEFAULT_OPEX
  
  // 연간 이자비용 (DS) - 대출금액 x 금리
  const annualDebtService = loan * 10000 * (rate / 100)
  
  // 월 상환액
  const monthlyPayment = Math.round(annualDebtService / 12)
  
  // DSCR = NOI / DS
  const dscr = annualDebtService > 0 ? noi / annualDebtService : 999
  
  // LTV = 대출금액 / 매입가
  const ltv = price > 0 ? (loan / price) * 100 : 0
  
  // Cap Rate = NOI / 매입가
  const cap = price > 0 ? (noi / (price * 10000)) * 100 : 0
  
  // 자기자본
  const equity = price - loan
  
  // CoC 수익률 = (NOI - DS) / 자기자본
  const cashFlow = noi - annualDebtService
  const cocReturn = equity > 0 ? (cashFlow / (equity * 10000)) * 100 : 0
  
  return {
    noi: Math.round(noi),
    dscr: Math.round(dscr * 100) / 100,
    ltv: Math.round(ltv * 10) / 10,
    cap: Math.round(cap * 100) / 100,
    monthlyPayment,
    cocReturn: Math.round(cocReturn * 10) / 10,
    equity: Math.round(equity * 10) / 10
  }
}

/**
 * Bankability 점수 계산
 */
export function calculateBankability(kpi: KPIResult, input: DealInput): BankabilityResult {
  let score = 50 // 기본 점수
  
  // DSCR 기반 점수 (최대 25점)
  if (kpi.dscr >= 1.5) score += 25
  else if (kpi.dscr >= 1.2) score += 20
  else if (kpi.dscr >= 1.0) score += 10
  else if (kpi.dscr >= 0.8) score += 0
  else score -= 10
  
  // LTV 기반 점수 (최대 15점)
  if (kpi.ltv <= 50) score += 15
  else if (kpi.ltv <= 60) score += 10
  else if (kpi.ltv <= 70) score += 5
  else if (kpi.ltv <= 80) score += 0
  else score -= 10
  
  // Cap Rate 기반 점수 (최대 10점)
  if (kpi.cap >= 5) score += 10
  else if (kpi.cap >= 4) score += 7
  else if (kpi.cap >= 3) score += 3
  else score -= 5
  
  // 공실률 기반 점수 (최대 10점)
  if (input.vacancyRate <= 5) score += 10
  else if (input.vacancyRate <= 10) score += 5
  else if (input.vacancyRate <= 15) score += 0
  else score -= 10
  
  // 점수 범위 제한
  score = Math.max(0, Math.min(100, score))
  
  // 등급 결정
  let grade: 'A' | 'B' | 'C' | 'D'
  if (score >= 80) grade = 'A'
  else if (score >= 65) grade = 'B'
  else if (score >= 50) grade = 'C'
  else grade = 'D'
  
  // 설명 생성
  let description: string
  if (kpi.dscr >= 1 && score >= 68) {
    description = 'DSCR 및 수익률이 양호합니다. 현재 조건으로 매수를 검토할 수 있습니다.'
  } else if (kpi.dscr >= 1) {
    description = `DSCR ${kpi.dscr.toFixed(2)}x로 금융비용은 커버되나, 종합 점수 개선이 필요합니다.`
  } else {
    const requiredRent = Math.ceil((input.loan * 10000 * (input.rate / 100) + DEFAULT_OPEX) / (12 * (1 - input.vacancyRate / 100)))
    description = `DSCR ${kpi.dscr.toFixed(2)}x — 금융비용 미달. 매입가 협상 또는 월세 ${requiredRent}만 이상 확보를 권장합니다.`
  }
  
  return { score, grade, description }
}

/**
 * Deal Signal 결정
 */
export function determineDealSignal(kpi: KPIResult, bankability: BankabilityResult): DealSignal {
  if (kpi.dscr >= 1.2 && bankability.score >= 70) {
    return '매수'
  } else if (kpi.dscr >= 0.9 && bankability.score >= 50) {
    return '가격협상'
  } else {
    return '매수보류'
  }
}

/**
 * Insight 생성
 */
export function generateInsights(
  input: DealInput,
  kpi: KPIResult,
  bankability: BankabilityResult,
  dealSignal: DealSignal
): InsightResult {
  const { price, loan, rate, rent, vacancyRate } = input
  
  // 매수 판단 인사이트
  const buyDecision: DealInsightData = {
    id: "buyDecision",
    title: "매수 판단",
    verdict: dealSignal === '매수' ? '매수 검토 가능' : dealSignal === '가격협상' ? '가격협상 후 재검토' : '매수 보류 권장',
    summary: dealSignal === '매수'
      ? `현재 조건에서 DSCR ${kpi.dscr.toFixed(2)}x, Cap Rate ${kpi.cap.toFixed(1)}%로 금융비용을 충분히 커버합니다. 매수를 적극 검토할 수 있는 딜입니다.`
      : dealSignal === '가격협상'
        ? `현재 이 매물은 즉시 매수보다는 가격협상 후 재검토가 적절한 딜입니다. DSCR ${kpi.dscr.toFixed(2)}x로 금융 부담이 있지만 상권 특성은 긍정적으로 해석됩니다.`
        : `현재 조건에서는 매수를 보류하는 것이 좋습니다. DSCR ${kpi.dscr.toFixed(2)}x로 금융비용을 감당하기 어렵습니다.`,
    reasons: dealSignal === '매수'
      ? [
          `DSCR ${kpi.dscr.toFixed(2)}x로 금융비용 대비 충분한 수익이 발생합니다.`,
          `LTV ${kpi.ltv.toFixed(1)}%로 자기자본 비율이 적정 수준입니다.`,
          `Cap Rate ${kpi.cap.toFixed(1)}%로 시장 평균 이상의 수익률입니다.`
        ]
      : [
          `입력된 매입가 ${price.toFixed(1)}억 대비 수익성이 보수적 기준에 미달합니다.`,
          `대출 부담(LTV ${kpi.ltv.toFixed(1)}%)이 임대수익 대비 높아 보유 안정성이 낮습니다.`,
          `공실률 ${vacancyRate}% 적용 시 현금흐름 변동성이 큽니다.`
        ],
    actions: dealSignal === '매수'
      ? [
          "임대차 계약서 원본 확인 및 임차인 신용도를 검토하세요.",
          "건물 실사를 통해 숨겨진 하자를 확인하세요.",
          "매도자의 매각 사유를 파악하세요."
        ]
      : [
          "즉시 매수보다는 가격협상 후 재검토하세요.",
          "매입가 조정 가능성을 먼저 확인하세요.",
          "대출금액과 금리 조건을 보수적으로 재검토하세요."
        ],
    evidenceLabel: "근거 지표: 매입가 · 대출금액 · 금리 · NOI · DSCR · LTV · 상권특성",
    ctaText: "정확한 매수 가능 가격과 협상 기준가는 딜 브리핑에서 확인할 수 있습니다.",
    severity: dealSignal === '매수' ? 'success' : dealSignal === '가격협상' ? 'warning' : 'danger'
  }
  
  // 가격협상 포인트
  const negotiation: DealInsightData = {
    id: "negotiation",
    title: "가격협상 포인트",
    verdict: kpi.dscr < 1.2 ? "협상 여지 있음" : "협상 근거 제한적",
    summary: kpi.dscr < 1.2
      ? `현재 조건에서는 매입가에 협상 여지가 있습니다. DSCR ${kpi.dscr.toFixed(2)}x, 공실률 ${vacancyRate}%를 근거로 가격 조정을 요청할 수 있습니다.`
      : `현재 수익 구조가 양호하여 가격협상 근거가 제한적입니다. 다만 건물 상태, 도로 조건 등 물리적 요인을 확인해보세요.`,
    reasons: [
      `대출비용 ${Math.round(loan * 10000 * (rate / 100))}만원/년을 반영하면 실질 현금흐름이 ${kpi.dscr < 1 ? '마이너스입니다' : '약해집니다'}.`,
      `공실률이 ${vacancyRate + 5}%로 상승하면 NOI가 ${Math.round(rent * 12 * 0.05)}만원 감소합니다.`,
      "도로 조건과 건축 조건은 매입가 할인 근거가 될 수 있습니다."
    ],
    actions: [
      "협상 전 기준 매수가 범위를 설정하세요.",
      "공실률과 대출 부담을 가격 조정 근거로 활용하세요.",
      "감액 요청이 아니라 수치 기반 협상 논리로 접근하세요."
    ],
    evidenceLabel: "근거 지표: 공실률 · 금융비용 · 현금흐름 · 도로조건 · 실거래 비교",
    ctaText: "딜 브리핑에서는 적정 매수가 범위와 협상 논리를 리포트 형태로 제공합니다.",
    severity: kpi.dscr < 1.2 ? 'warning' : 'neutral'
  }
  
  // 현금흐름 안정성
  const cashflow: DealInsightData = {
    id: "cashflow",
    title: "현금흐름 안정성",
    verdict: kpi.dscr >= 1.2 ? "안정적" : kpi.dscr >= 1.0 ? "보수적 관리 필요" : "위험",
    summary: kpi.dscr >= 1.2
      ? `현재 대출 조건에서 현금흐름이 안정적입니다. 월 ${Math.round(kpi.noi / 12 - kpi.monthlyPayment)}만원의 순현금흐름이 발생합니다.`
      : `현재 대출 조건에서는 현금흐름 안정성이 낮은 편입니다. 금리 상승이나 공실 발생 시 보유 부담이 커질 수 있습니다.`,
    reasons: kpi.dscr >= 1.2
      ? [
          `월 순현금흐름 ${Math.round(kpi.noi / 12 - kpi.monthlyPayment)}만원으로 여유가 있습니다.`,
          `금리 1% 상승 시에도 DSCR ${(kpi.noi / (loan * 10000 * ((rate + 1) / 100))).toFixed(2)}x 유지 가능합니다.`,
          "공실률 변동에 대한 버퍼가 있습니다."
        ]
      : [
          `대출 상환 부담(월 ${kpi.monthlyPayment}만원)이 임대수익 대비 높습니다.`,
          `공실률이 ${Math.min(vacancyRate + 10, 30)}%로 상승하면 현금흐름이 빠르게 악화됩니다.`,
          "금리 조건에 민감한 구조입니다."
        ],
    actions: kpi.dscr >= 1.2
      ? [
          "현재 임대차 계약 만료일을 확인하세요.",
          "임차인 이탈 시 재임대 기간을 예상해보세요.",
          "예비비(3-6개월 운영비)를 확보하세요."
        ]
      : [
          "대출금액을 낮춘 시나리오를 검토하세요.",
          "공실률 보수 시나리오를 적용하세요.",
          "금리 상승 시에도 버틸 수 있는지 확인하세요."
        ],
    evidenceLabel: "근거 지표: NOI · DSCR · LTV · 금리 · 공실률 · 월 상환액",
    ctaText: "금리·공실·대출비율별 현금흐름 시나리오는 유료 딜 브리핑에서 확인할 수 있습니다.",
    severity: kpi.dscr >= 1.2 ? 'success' : kpi.dscr >= 1.0 ? 'warning' : 'danger'
  }
  
  // 업사이드 가능성
  const upside: DealInsightData = {
    id: "upside",
    title: "업사이드 가능성",
    verdict: "개선 여지 있음",
    summary: rent < 300
      ? `현재 월세 ${rent}만원은 인근 시세 대비 낮을 수 있습니다. 임대료 인상 또는 리모델링을 통한 수익 개선 가능성이 있습니다.`
      : `현재 수익성만 보면 보수적 접근이 필요하지만, 상권과 임대 수요 측면에서는 개선 여지가 있습니다.`,
    reasons: [
      "주소지가 가진 상권 특성은 임대수요 측면에서 긍정적입니다.",
      "리모델링 또는 업종 재구성을 통해 임대료 개선 가능성이 있습니다.",
      "건축 조건에 따라 밸류애드 여지가 존재할 수 있습니다."
    ],
    actions: [
      "현재 임차인 구조와 임대료 수준을 확인하세요.",
      "리모델링 또는 업종 변경 가능성을 검토하세요.",
      "업사이드가 이미 매입가에 반영되어 있는지 확인하세요."
    ],
    evidenceLabel: "근거 지표: 상권특성 · 임대수요 · 건축조건 · 리모델링 가능성",
    ctaText: "딜 클로징 패키지에서는 이 매물의 밸류애드 전략과 실행 체크리스트를 제공합니다.",
    severity: 'neutral'
  }
  
  // 리스크와 다음 액션
  const riskAction: DealInsightData = {
    id: "riskAction",
    title: "리스크와 다음 액션",
    verdict: kpi.dscr < 1.0 ? "높은 리스크" : "실사 확인 필요",
    summary: kpi.dscr < 1.0
      ? `이 매물의 핵심 리스크는 금융비용 미달입니다. DSCR ${kpi.dscr.toFixed(2)}x로 현재 조건에서는 보유 부담이 큽니다.`
      : `이 매물의 핵심 리스크는 공실, 금융 부담, 도로 및 건축 조건입니다. 해당 리스크는 가격 조정과 실사 확인 항목으로 전환해야 합니다.`,
    reasons: [
      `공실률이 ${vacancyRate + 10}%로 높아지면 수익성이 크게 낮아집니다.`,
      `금융비용 부담(연 ${Math.round(loan * 10000 * (rate / 100))}만원)이 커서 보수적인 대출 구조가 필요합니다.`,
      "도로와 건축 조건은 향후 매각가와 임대수요에 영향을 줄 수 있습니다."
    ],
    actions: [
      "매입가 조정 가능성을 확인하세요.",
      "임대차 계약서와 실제 공실 가능성을 확인하세요.",
      "도로폭, 건축 가능 여부, 리모델링 제약을 확인하세요.",
      "실거래 비교를 통해 가격 상한선을 설정하세요."
    ],
    evidenceLabel: "근거 지표: 공실률 · 대출부담 · 도로조건 · 건축조건 · 실거래 비교",
    ctaText: "계약 전 확인해야 할 실사 항목과 협상 전략은 딜 클로징 패키지에서 정리됩니다.",
    severity: kpi.dscr < 1.0 ? 'danger' : 'warning'
  }
  
  return {
    buyDecision,
    negotiation,
    cashflow,
    upside,
    riskAction
  }
}

/**
 * 전체 분석 실행
 */
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
    analysisId: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 분석 결과 요약 텍스트 생성 (대화창용)
 */
export function generateAnalysisSummary(result: AnalysisResult): string {
  const { input, kpi, bankability, dealSignal } = result
  
  return `## ${input.address} 분석 완료

**종합 판단: ${dealSignal}**

| 지표 | 값 |
|------|-----|
| NOI | ${kpi.noi.toLocaleString()}만원/년 |
| DSCR | ${kpi.dscr.toFixed(2)}x |
| LTV | ${kpi.ltv.toFixed(1)}% |
| Cap Rate | ${kpi.cap.toFixed(1)}% |
| Bankability | ${bankability.score}점 (${bankability.grade}등급) |

**요약**: ${bankability.description}

${dealSignal === '매수' 
  ? '현재 조건에서 매수를 적극 검토할 수 있습니다.' 
  : dealSignal === '가격협상' 
    ? '가격협상을 통해 더 나은 조건을 확보하세요.' 
    : '현재 조건에서는 매수를 보류하는 것이 좋습니다.'}`
}

/**
 * 추천 질문 생성
 */
export function generateSuggestedQuestions(result: AnalysisResult): string[] {
  const { kpi, dealSignal } = result
  
  const baseQuestions = [
    "이 매물의 적정 매수가는 얼마인가요?",
    "가격협상에서 어떤 근거를 제시해야 하나요?",
    "현금흐름 시나리오를 더 자세히 알고 싶어요"
  ]
  
  if (dealSignal === '매수보류') {
    return [
      "이 매물을 매수하려면 어떤 조건이 필요하나요?",
      "매입가를 얼마로 낮춰야 DSCR 1.0 이상이 되나요?",
      ...baseQuestions.slice(2)
    ]
  } else if (kpi.dscr < 1.2) {
    return [
      "DSCR을 개선하려면 어떻게 해야 하나요?",
      ...baseQuestions
    ]
  }
  
  return baseQuestions
}
