import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('buildmore_admin_token')?.value
  
  // Debug: Check environment variables
  const _rawAdminUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || ''
  const adminApiUrl = (_rawAdminUrl && !_rawAdminUrl.includes('ssmrdesign'))
    ? _rawAdminUrl
    : 'https://buildmore-backend.replit.app'
  const internalKey = process.env.ADMIN_INTERNAL_KEY
  const adminToken = process.env.ADMIN_TOKEN
  
  if (!adminToken) {
    console.error('[admin/api/overview] ADMIN_TOKEN not set')
    return NextResponse.json({ error: 'Server misconfigured: ADMIN_TOKEN not set' }, { status: 500 })
  }
  
  if (token !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!adminApiUrl) {
    console.error('[admin/api/overview] NEXT_PUBLIC_ADMIN_API_URL not set')
    return NextResponse.json({ error: 'Server misconfigured: API URL not set' }, { status: 500 })
  }
  
  if (!internalKey) {
    console.error('[admin/api/overview] ADMIN_INTERNAL_KEY not set')
    return NextResponse.json({ error: 'Server misconfigured: Internal key not set' }, { status: 500 })
  }

  try {
    const url = `${adminApiUrl}/api/admin/overview`
    console.log('[admin/api/overview] Fetching:', url)
    
    const res = await fetch(url, {
      headers: { 'X-Internal-API-Key': internalKey },
      cache: 'no-store'
    })
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      console.error('[admin/api/overview] Backend error:', res.status, errorText)
      return NextResponse.json({ error: `Backend error: ${res.status}`, details: errorText }, { status: res.status })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[admin/api/overview] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch from backend', details: String(error) }, { status: 500 })
  }
}
