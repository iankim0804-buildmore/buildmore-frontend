/**
 * BuildMore API Layer
 * 
 * Centralized exports for API client, endpoints, and adapters.
 */

// Client utilities
export { apiClient, apiGet, apiPost, getApiBaseUrl, isApiConfigured } from './client'
export type { ApiResponse } from './client'

// Analysis endpoints
export {
  getHealth,
  getSampleAnalysis,
  createAnalysisRequest,
  runAnalysis,
} from './analysis'
export type {
  HealthResponse,
  SampleAnalysisResponse,
  AnalysisRequestPayload,
  AnalysisRequestResponse,
  AnalysisRunPayload,
  AnalysisRunResponse,
} from './analysis'

// Response adapters
export {
  adaptApiResponse,
  adaptBackendResponse,
  adaptDirectResponse,
} from './adapters'
export type {
  DisplayAnalysis,
  BackendAnalysisResponse,
} from './adapters'
