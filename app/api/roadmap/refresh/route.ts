import { NextResponse } from 'next/server'

const _rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || ''
const BACKEND_URL = (_rawUrl && !_rawUrl.includes('ssmrdesign'))
  ? _rawUrl
  : 'https://ai-mvp.replit.app'

const INTERNAL_KEY = process.env.ADMIN_INTERNAL_KEY || ''

export async function POST() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/roadmap/refresh`, {
      method: 'POST',
      headers: INTERNAL_KEY ? { 'X-Internal-API-Key': INTERNAL_KEY } : {},
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json({ error: `Refresh failed: ${res.status}`, details: text }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Backend unreachable', details: String(err) }, { status: 503 })
  }
}
