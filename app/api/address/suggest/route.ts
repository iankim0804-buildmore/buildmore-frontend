import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://buildmore-backend.replit.app'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.trim() || ''
    const size = url.searchParams.get('size') || '7'

    if (q.length < 2) {
      return NextResponse.json({ suggestions: [], total: 0 })
    }

    const backendUrl = new URL('/api/address/suggest', BACKEND_URL)
    backendUrl.searchParams.set('q', q)
    backendUrl.searchParams.set('size', size)

    const response = await fetch(backendUrl.toString(), { cache: 'no-store' })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn('[address/suggest] backend error:', response.status, errorText)
      return NextResponse.json(
        { error: '주소 자동완성 조회에 실패했습니다.', suggestions: [], total: 0 },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[address/suggest] error:', error)
    return NextResponse.json(
      { error: '주소 자동완성 처리 중 오류가 발생했습니다.', suggestions: [], total: 0 },
      { status: 500 }
    )
  }
}
