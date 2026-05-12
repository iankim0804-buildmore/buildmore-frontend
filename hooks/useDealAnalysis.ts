'use client'

import { useState, useCallback } from 'react'
import type { AnalysisResult, DealInput } from '@/lib/analysis/dealAnalysisEngine'

interface AnalysisState {
  isLoading: boolean
  result: AnalysisResult | null
  summary: string | null
  suggestedQuestions: string[]
  error: string | null
}

interface UseDealAnalysisReturn extends AnalysisState {
  runAnalysis: (input: DealInput) => Promise<void>
  clearAnalysis: () => void
}

export function useDealAnalysis(): UseDealAnalysisReturn {
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    result: null,
    summary: null,
    suggestedQuestions: [],
    error: null
  })
  
  const runAnalysis = useCallback(async (input: DealInput) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const response = await fetch('/api/analysis/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '분석 중 오류가 발생했습니다.')
      }
      
      // API 응답 형태: { input, summary, bankabilityScore, dealSignal, kpis, insights }
      // AnalysisResult 형태:  { input, kpi, bankability, dealSignal, summary, insights }
      // 두 형태 모두 호환되도록 매핑
      const result = (data.result ?? (data.input ? {
        input: data.input,
        kpi: data.kpis ?? data.kpi ?? {},
        bankability: { score: data.bankabilityScore ?? 0, description: '' },
        dealSignal: data.dealSignal ?? '',
        summary: data.summary ?? '',
        insights: data.insights ?? {},
        // raw fields (chat context 빌드용)
        bankabilityScore: data.bankabilityScore,
        kpis: data.kpis,
      } : null)) as AnalysisResult | null
      
      setState({
        isLoading: false,
        result,
        summary: data.summary ?? null,
        suggestedQuestions: data.suggestedQuestions ?? [],
        error: null
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.'
      }))
    }
  }, [])
  
  const clearAnalysis = useCallback(() => {
    setState({
      isLoading: false,
      result: null,
      summary: null,
      suggestedQuestions: [],
      error: null
    })
  }, [])
  
  return {
    ...state,
    runAnalysis,
    clearAnalysis
  }
}
