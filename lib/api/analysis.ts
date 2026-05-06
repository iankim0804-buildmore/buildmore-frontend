/**
 * Analysis API functions for BuildMore
 * 
 * Provides functions to interact with the FastAPI backend analysis endpoints.
 */

import { apiGet, apiPost, ApiResponse } from './client'

// Response types - these should match the backend response structure
export interface HealthResponse {
  status: string
  message?: string
  version?: string
}

export interface AnalysisFinancial {
  ltv?: string
  loanAmount?: string
  rate?: string
  monthlyInterest?: string
  equity?: string
  equityRatio?: string
}

export interface AnalysisNOI {
  deposit?: string
  monthlyRent?: string
  annualRent?: string
  noi?: string
  dscr?: string
  capRate?: string
}

export interface RiskItem {
  text: string
  level: 'error' | 'warning' | 'info'
}

export interface Comparable {
  address: string
  type: string
  price: string
  ltv: string
  date: string
}

export interface SampleAnalysisResponse {
  address?: string
  assetType?: string
  dealAmount?: string
  score?: number
  grade?: string
  verdict?: string
  financial?: AnalysisFinancial
  noi?: AnalysisNOI
  risks?: {
    legal?: RiskItem[]
    financial?: RiskItem[]
  }
  comparables?: Comparable[]
  dataSources?: string[]
  // Allow additional properties from the backend
  [key: string]: unknown
}

export interface AnalysisRequestPayload {
  address?: string
  assetType?: string
  dealAmount?: number | string
  deposit?: number | string
  monthlyRent?: number | string
  equity?: number | string
  purpose?: string
  question?: string
}

export interface AnalysisRequestResponse {
  requestId?: string
  status?: string
  message?: string
  [key: string]: unknown
}

export interface AnalysisRunPayload {
  address?: string
  assetType?: string
  dealAmount?: number | string
  deposit?: number | string
  monthlyRent?: number | string
  equity?: number | string
  purpose?: string
  question?: string
}

export interface AnalysisRunResponse {
  analysis?: SampleAnalysisResponse
  status?: string
  message?: string
  [key: string]: unknown
}

/**
 * Check API health status
 * GET /api/health
 */
export async function getHealth(): Promise<ApiResponse<HealthResponse>> {
  return apiGet<HealthResponse>('/api/health')
}

/**
 * Get sample analysis data
 * GET /api/analysis/sample
 */
export async function getSampleAnalysis(): Promise<ApiResponse<SampleAnalysisResponse>> {
  return apiGet<SampleAnalysisResponse>('/api/analysis/sample')
}

/**
 * Create an analysis request
 * POST /api/analysis/requests
 */
export async function createAnalysisRequest(
  payload: AnalysisRequestPayload
): Promise<ApiResponse<AnalysisRequestResponse>> {
  return apiPost<AnalysisRequestResponse>('/api/analysis/requests', payload)
}

/**
 * Run analysis directly
 * POST /api/analysis/run
 */
export async function runAnalysis(
  payload: AnalysisRunPayload
): Promise<ApiResponse<AnalysisRunResponse>> {
  return apiPost<AnalysisRunResponse>('/api/analysis/run', payload)
}

// Property analyze types
export interface PropertyAnalyzeResponse {
  pnu?: string
  lat?: number
  lng?: number
  land_area_m2?: number
  building_area_m2?: number
  total_floor_area_m2?: number
  floors_above?: number
  floors_below?: number
  built_year?: number
  structure?: string
  main_use?: string
  violation?: boolean
  land_price_per_m2?: number
  zoning?: string
  bcrat?: number
  vlrat?: number
  current_base_rate?: number
  estimated_loan_rate_min?: number
  estimated_loan_rate_max?: number
  errors?: string[]
  [key: string]: unknown
}

// Nearby transactions types
export interface NearbyTransaction {
  pnu: string
  address: string
  distance_m: number
  transaction_date: string
  transaction_type: string
  price: number
  price_per_m2: number
  land_area_m2?: number
  building_area_m2?: number
  floors?: number
  built_year?: number
  main_use?: string
}

export interface NearbyTransactionsResponse {
  transactions: NearbyTransaction[]
  center_pnu: string
  radius_m: number
  total_count: number
}

/**
 * Get nearby transactions
 * POST /api/nearby-transactions
 */
export async function getNearbyTransactions(
  pnu: string,
  radiusM: number = 500,
  limit: number = 20
): Promise<ApiResponse<NearbyTransactionsResponse>> {
  try {
    const response = await fetch('/api/nearby-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pnu, radius_m: radiusM, limit }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        data: null,
        error: `인근 거래 조회 실패: ${errorText}`,
        ok: false,
      }
    }

    const data = await response.json()
    return {
      data: data as NearbyTransactionsResponse,
      error: null,
      ok: true,
    }
  } catch (error) {
    return {
      data: null,
      error: `인근 거래 조회 오류: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ok: false,
    }
  }
}

/**
 * Analyze property by address
 * POST /api/property/analyze
 * 
 * This calls the internal Next.js API route which proxies to the backend
 */
export async function analyzeProperty(
  address: string
): Promise<ApiResponse<PropertyAnalyzeResponse>> {
  try {
    const response = await fetch('/api/property/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        data: null,
        error: `물건정보 조회 실패: ${errorText}`,
        ok: false,
      }
    }

    const data = await response.json()
    return {
      data: data as PropertyAnalyzeResponse,
      error: null,
      ok: true,
    }
  } catch (error) {
    return {
      data: null,
      error: `물건정보 조회 오류: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ok: false,
    }
  }
}
