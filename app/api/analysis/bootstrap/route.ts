import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://buildmore-backend.replit.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.full_address) {
      return NextResponse.json({ error: '주소를 입력해주세요.' }, { status: 400 })
    }

    const response = await fetch(`${BACKEND_URL}/api/analysis/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn('[analysis/bootstrap] 백엔드 오류:', response.status, errorText)
      return NextResponse.json(
        { error: '주소 정보 조회에 실패했습니다.' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[analysis/bootstrap] 에러:', error)
    return NextResponse.json(
      { error: '주소 분석 초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
