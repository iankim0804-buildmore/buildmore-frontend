/**
 * API Response Adapters for BuildMore
 * 
 * Transforms backend API responses to frontend display structures.
 * Provides null-safe fallbacks for missing fields.
 */

// Frontend display structure (used by demo page)
export interface DisplayAnalysis {
  address: string
  assetType: string
  dealAmount: string
  score: number
  grade: string
  verdict: string
  financial: {
    ltv: string
    loanAmount: string
    rate: string
    monthlyInterest: string
    equity: string
    equityRatio: string
  }
  noi: {
    deposit: string
    monthlyRent: string
    annualRent: string
    noi: string
    dscr: string
    capRate: string
  }
  risks: {
    legal: Array<{ text: string; level: string }>
    financial: Array<{ text: string; level: string }>
  }
  comparables: Array<{
    address: string
    type: string
    price: string
    ltv: string
    date: string
  }>
  dataSources: string[]
}

/**
 * Expected backend response structure (card-based)
 * Based on FastAPI backend schema
 */
export interface BackendAnalysisResponse {
  // Conclusion/Summary card
  conclusion_card?: {
    title?: string
    verdict?: string
    summary?: string
    recommendation?: string
  }
  
  // Score cards
  score_cards?: {
    bankability_score?: number
    grade?: string
    verdict?: string
    components?: Array<{
      name?: string
      score?: number
      weight?: number
    }>
  }
  
  // Financing card
  financing_card?: {
    ltv?: string | number
    loan_amount?: string
    interest_rate?: string
    monthly_interest?: string
    equity_required?: string
    equity_ratio?: string
  }
  
  // Feasibility / NOI card
  feasibility_card?: {
    deposit?: string
    monthly_rent?: string
    annual_rent?: string
    noi?: string
    dscr?: string | number
    cap_rate?: string
  }
  
  // Market analysis card
  market_card?: {
    comparables?: Array<{
      address?: string
      property_type?: string
      price?: string
      ltv?: string
      date?: string
    }>
    market_summary?: string
  }
  
  // Development/Legal risks card
  development_legal_card?: {
    legal_risks?: Array<{
      description?: string
      severity?: 'high' | 'medium' | 'low' | 'error' | 'warning' | 'info'
    }>
    development_risks?: Array<{
      description?: string
      severity?: 'high' | 'medium' | 'low' | 'error' | 'warning' | 'info'
    }>
  }
  
  // Insight sections
  insight_sections?: Array<{
    title?: string
    content?: string
    type?: string
  }>
  
  // Action card
  action_card?: {
    recommended_actions?: string[]
    next_steps?: string[]
  }
  
  // Direct fields (for simpler responses)
  address?: string
  asset_type?: string
  deal_amount?: string
  
  // Data sources
  data_sources?: string[]
  
  // Allow additional fields
  [key: string]: unknown
}

/**
 * Default/fallback values for display
 */
const DEFAULT_DISPLAY: DisplayAnalysis = {
  address: '-',
  assetType: '-',
  dealAmount: '-',
  score: 0,
  grade: '-',
  verdict: '분석 대기 중',
  financial: {
    ltv: '-',
    loanAmount: '-',
    rate: '-',
    monthlyInterest: '-',
    equity: '-',
    equityRatio: '-',
  },
  noi: {
    deposit: '-',
    monthlyRent: '-',
    annualRent: '-',
    noi: '-',
    dscr: '-',
    capRate: '-',
  },
  risks: {
    legal: [],
    financial: [],
  },
  comparables: [],
  dataSources: [],
}

/**
 * Convert severity level to frontend risk level
 */
function mapSeverityToLevel(severity?: string): string {
  switch (severity) {
    case 'high':
    case 'error':
      return 'error'
    case 'medium':
    case 'warning':
      return 'warning'
    case 'low':
    case 'info':
    default:
      return 'info'
  }
}

/**
 * Safely convert value to string
 */
function safeString(value: unknown, fallback: string = '-'): string {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value || fallback
  if (typeof value === 'number') return String(value)
  return fallback
}

/**
 * Safely convert value to number
 */
function safeNumber(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''))
    return isNaN(parsed) ? fallback : parsed
  }
  return fallback
}

/**
 * Adapt backend response to frontend display structure
 * Handles both card-based responses and direct field responses
 */
export function adaptBackendResponse(
  response: BackendAnalysisResponse | null | undefined,
  fallback: DisplayAnalysis = DEFAULT_DISPLAY
): DisplayAnalysis {
  if (!response) {
    return fallback
  }

  // Extract score info
  const scoreCards = response.score_cards
  const score = safeNumber(scoreCards?.bankability_score, fallback.score)
  const grade = safeString(scoreCards?.grade, fallback.grade)
  const verdict = safeString(
    scoreCards?.verdict || response.conclusion_card?.verdict,
    fallback.verdict
  )

  // Extract financing info
  const financing = response.financing_card
  const financial: DisplayAnalysis['financial'] = {
    ltv: safeString(financing?.ltv, fallback.financial.ltv),
    loanAmount: safeString(financing?.loan_amount, fallback.financial.loanAmount),
    rate: safeString(financing?.interest_rate, fallback.financial.rate),
    monthlyInterest: safeString(financing?.monthly_interest, fallback.financial.monthlyInterest),
    equity: safeString(financing?.equity_required, fallback.financial.equity),
    equityRatio: safeString(financing?.equity_ratio, fallback.financial.equityRatio),
  }

  // Extract NOI/feasibility info
  const feasibility = response.feasibility_card
  const noi: DisplayAnalysis['noi'] = {
    deposit: safeString(feasibility?.deposit, fallback.noi.deposit),
    monthlyRent: safeString(feasibility?.monthly_rent, fallback.noi.monthlyRent),
    annualRent: safeString(feasibility?.annual_rent, fallback.noi.annualRent),
    noi: safeString(feasibility?.noi, fallback.noi.noi),
    dscr: safeString(feasibility?.dscr, fallback.noi.dscr),
    capRate: safeString(feasibility?.cap_rate, fallback.noi.capRate),
  }

  // Extract risks
  const devLegal = response.development_legal_card
  const legalRisks: DisplayAnalysis['risks']['legal'] = (devLegal?.legal_risks || [])
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map(risk => ({
      text: safeString(risk.description, ''),
      level: mapSeverityToLevel(risk.severity),
    }))
    .filter(r => r.text)

  const financialRisks: DisplayAnalysis['risks']['financial'] = (devLegal?.development_risks || [])
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map(risk => ({
      text: safeString(risk.description, ''),
      level: mapSeverityToLevel(risk.severity),
    }))
    .filter(r => r.text)

  // Extract comparables
  const marketComparables = response.market_card?.comparables || []
  const comparables: DisplayAnalysis['comparables'] = marketComparables
    .filter((c): c is NonNullable<typeof c> => !!c)
    .map(comp => ({
      address: safeString(comp.address, '-'),
      type: safeString(comp.property_type, '-'),
      price: safeString(comp.price, '-'),
      ltv: safeString(comp.ltv, '-'),
      date: safeString(comp.date, '-'),
    }))

  // Extract data sources
  const dataSources = Array.isArray(response.data_sources)
    ? response.data_sources.filter((s): s is string => typeof s === 'string')
    : fallback.dataSources

  return {
    address: safeString(response.address, fallback.address),
    assetType: safeString(response.asset_type, fallback.assetType),
    dealAmount: safeString(response.deal_amount, fallback.dealAmount),
    score,
    grade,
    verdict,
    financial,
    noi,
    risks: {
      legal: legalRisks.length > 0 ? legalRisks : fallback.risks.legal,
      financial: financialRisks.length > 0 ? financialRisks : fallback.risks.financial,
    },
    comparables: comparables.length > 0 ? comparables : fallback.comparables,
    dataSources: dataSources.length > 0 ? dataSources : fallback.dataSources,
  }
}

/**
 * Adapt a simpler/direct API response (when backend returns flat structure)
 * This handles responses that already match the frontend structure
 */
export function adaptDirectResponse(
  response: Record<string, unknown> | null | undefined,
  fallback: DisplayAnalysis = DEFAULT_DISPLAY
): DisplayAnalysis {
  if (!response) {
    return fallback
  }

  // If response already has expected structure, use it with fallbacks
  const financial = response.financial as Record<string, unknown> | undefined
  const noiData = response.noi as Record<string, unknown> | undefined
  const risksData = response.risks as Record<string, unknown> | undefined

  return {
    address: safeString(response.address, fallback.address),
    assetType: safeString(response.assetType, fallback.assetType),
    dealAmount: safeString(response.dealAmount, fallback.dealAmount),
    score: safeNumber(response.score, fallback.score),
    grade: safeString(response.grade, fallback.grade),
    verdict: safeString(response.verdict, fallback.verdict),
    financial: {
      ltv: safeString(financial?.ltv, fallback.financial.ltv),
      loanAmount: safeString(financial?.loanAmount, fallback.financial.loanAmount),
      rate: safeString(financial?.rate, fallback.financial.rate),
      monthlyInterest: safeString(financial?.monthlyInterest, fallback.financial.monthlyInterest),
      equity: safeString(financial?.equity, fallback.financial.equity),
      equityRatio: safeString(financial?.equityRatio, fallback.financial.equityRatio),
    },
    noi: {
      deposit: safeString(noiData?.deposit, fallback.noi.deposit),
      monthlyRent: safeString(noiData?.monthlyRent, fallback.noi.monthlyRent),
      annualRent: safeString(noiData?.annualRent, fallback.noi.annualRent),
      noi: safeString(noiData?.noi, fallback.noi.noi),
      dscr: safeString(noiData?.dscr, fallback.noi.dscr),
      capRate: safeString(noiData?.capRate, fallback.noi.capRate),
    },
    risks: {
      legal: Array.isArray(risksData?.legal) ? risksData.legal : fallback.risks.legal,
      financial: Array.isArray(risksData?.financial) ? risksData.financial : fallback.risks.financial,
    },
    comparables: Array.isArray(response.comparables) ? response.comparables : fallback.comparables,
    dataSources: Array.isArray(response.dataSources) ? response.dataSources : fallback.dataSources,
  }
}

/**
 * Smart adapter that detects response format and applies appropriate transformation
 */
export function adaptApiResponse(
  response: unknown,
  fallback: DisplayAnalysis = DEFAULT_DISPLAY
): DisplayAnalysis {
  if (!response || typeof response !== 'object') {
    return fallback
  }

  const resp = response as Record<string, unknown>

  // Detect card-based response (has *_card fields)
  const hasCardFields = [
    'conclusion_card',
    'score_cards',
    'financing_card',
    'feasibility_card',
    'market_card',
    'development_legal_card',
  ].some(key => key in resp)

  if (hasCardFields) {
    return adaptBackendResponse(resp as BackendAnalysisResponse, fallback)
  }

  // Otherwise, treat as direct response
  return adaptDirectResponse(resp, fallback)
}
