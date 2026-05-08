import { NextRequest, NextResponse } from 'next/server'
import { 
  runDealAnalysis, 
  generateAnalysisSummary, 
  generateSuggestedQuestions,
  type DealInput 
} from '@/lib/analysis/dealAnalysisEngine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 입력값 검증
    const input: DealInput = {
      address: body.address || '주소 미입력',
      price: Number(body.price) || 0,
      loan: Number(body.loan) || 0,
      rate: Number(body.rate) || 0,
      rent: Number(body.rent) || 0,
      deposit: Number(body.deposit) || 0,
      vacancyRate: Number(body.vacancyRate) || 5
    }
    
    // 필수 입력값 검증
    if (input.price <= 0) {
      return NextResponse.json(
        { error: '매입가를 입력해주세요.' },
        { status: 400 }
      )
    }
    
    // 분석 실행
    const result = runDealAnalysis(input)
    
    // 요약 및 추천 질문 생성
    const summary = generateAnalysisSummary(result)
    const suggestedQuestions = generateSuggestedQuestions(result)
    
    return NextResponse.json({
      success: true,
      result,
      summary,
      suggestedQuestions
    })
    
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
