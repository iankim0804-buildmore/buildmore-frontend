import { NextResponse } from 'next/server'

const _rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || ''
const BACKEND_URL = (_rawUrl && !_rawUrl.includes('ssmrdesign'))
  ? _rawUrl
  : 'https://buildmore-backend.replit.app'

const INTERNAL_KEY = process.env.ADMIN_INTERNAL_KEY || process.env.INTERNAL_API_KEY || ''

export async function POST() {
  if (!INTERNAL_KEY) {
    return NextResponse.json({ error: 'Server misconfigured: Internal key not set' }, { status: 500 })
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/roadmap/audit/run`, {
      method: 'POST',
      headers: { 'X-Internal-API-Key': INTERNAL_KEY },
      cache: 'no-store',
    })
    const data = await res.json().catch(async () => ({ details: await res.text().catch(() => '') }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json({ error: 'Backend unreachable', details: String(err) }, { status: 503 })
  }
}
