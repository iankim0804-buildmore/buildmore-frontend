import { NextResponse } from 'next/server'

// NEXT_PUBLIC_ADMIN_API_URL 이 ssmrdesign(개발용) URL 이면 무시하고 프로덕션 URL 사용
const _rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || ''
const BACKEND_URL = (_rawUrl && !_rawUrl.includes('ssmrdesign'))
  ? _rawUrl
  : 'https://buildmore-backend.replit.app'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/roadmap/graph`, { cache: 'no-store' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json({ error: `Backend error: ${res.status}`, details: text }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Backend unreachable', details: String(err) }, { status: 503 })
  }
}
