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
  injectResult: (analysisData: any) => void
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
  
  /**
   * bootstrap 엔드포인트에서 받은 MobileCardAnalysisResponse를
   * AnalysisResult 형식으로 변환해 직접 주입한다.
   * /api/analysis/run을 추가 호출하지 않고 즉시 결과를 표시한다.
   */
  const injectResult = useCallback((analysisData: any) => {
    const result = {
      input: {},
      kpi: {
        noi: analysisData?.feasibility_card?.vacancy_adjusted_noi ?? null,
        dscr: analysisData?.feasibility_card?.dscr ?? null,
        ltv: null,
        capRate: null,
      },
      bankability: {
        score: analysisData?.score_cards?.bankability_score ?? 0,
        description: analysisData?.financing_card?.bankability_comment ?? '',
      },
      dealSignal: analysisData?.conclusion_card?.overall_grade ?? '',
      summary: analysisData?.conclusion_card?.one_line_judgement ?? '',
      insights: {
        positive: analysisData?.insight_sections?.positive_points ?? [],
        caution: analysisData?.insight_sections?.caution_points ?? [],
        conditions: analysisData?.insight_sections?.conditions_for_success ?? [],
        items: analysisData?.insight_sections?.items_to_verify ?? [],
      },
      // raw fields for chat context
      bankabilityScore: analysisData?.score_cards?.bankability_score ?? 0,
      kpis: {
        noi: analysisData?.feasibility_card?.vacancy_adjusted_noi ?? null,
        dscr: analysisData?.feasibility_card?.dscr ?? null,
      },
      // full bootstrap analysis payload for advanced UI
      _bootstrap: analysisData,
    } as unknown as AnalysisResult

    setState({
      isLoading: false,
      result,
      summary: analysisData?.conclusion_card?.one_line_judgement ?? null,
      suggestedQuestions: [],
      error: null,
    })
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
    clearAnalysis,
    injectResult,
  }
}
