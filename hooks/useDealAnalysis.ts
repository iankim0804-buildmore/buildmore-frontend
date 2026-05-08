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
      
      setState({
        isLoading: false,
        result: data.result,
        summary: data.summary,
        suggestedQuestions: data.suggestedQuestions,
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
