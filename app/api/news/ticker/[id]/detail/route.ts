import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? ''

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id

  if (!BACKEND) {
    return NextResponse.json(
      { detail: 'API URL이 설정되지 않았습니다.' },
      { status: 503 }
    )
  }
  try {
    const res = await fetch(`${BACKEND}/api/news/ticker/${id}/detail`, {
      cache: 'no-store',
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ detail: '백엔드 연결 실패' }, { status: 502 })
  }
}
