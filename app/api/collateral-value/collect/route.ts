import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function backendConfig() {
  const rawAdminUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || ''
  const adminApiUrl = rawAdminUrl && !rawAdminUrl.includes('ssmrdesign')
    ? rawAdminUrl
    : 'https://ai-mvp.replit.app'
  return {
    adminApiUrl,
    internalKey: process.env.ADMIN_INTERNAL_KEY,
    adminToken: process.env.ADMIN_TOKEN,
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get('buildmore_admin_token')?.value
  const { adminApiUrl, internalKey, adminToken } = backendConfig()

  if (!adminToken || token !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!internalKey) {
    return NextResponse.json({ error: 'Server misconfigured: Internal key not set' }, { status: 500 })
  }

  try {
    const res = await fetch(`${adminApiUrl}/api/collateral-value/collect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API-Key': internalKey,
      },
      body: await request.text(),
      cache: 'no-store',
    })
    const body = await res.text()
    return new NextResponse(body, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch from backend', details: String(error) }, { status: 500 })
  }
}
