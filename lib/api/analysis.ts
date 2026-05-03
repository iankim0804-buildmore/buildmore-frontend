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
