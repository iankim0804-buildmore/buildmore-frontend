import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('buildmore_admin_token')?.value
  
  const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://ai-mvp.replit.app'
  const internalKey = process.env.ADMIN_INTERNAL_KEY
  const adminToken = process.env.ADMIN_TOKEN
  
  if (!adminToken) {
    return NextResponse.json({ error: 'Server misconfigured: ADMIN_TOKEN not set' }, { status: 500 })
  }
  
  if (token !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!adminApiUrl) {
    return NextResponse.json({ error: 'Server misconfigured: API URL not set' }, { status: 500 })
  }
  
  if (!internalKey) {
    return NextResponse.json({ error: 'Server misconfigured: Internal key not set' }, { status: 500 })
  }

  try {
    const res = await fetch(`${adminApiUrl}/api/admin/usage`, {
      headers: { 'X-Internal-API-Key': internalKey },
      cache: 'no-store'
    })
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      return NextResponse.json({ error: `Backend error: ${res.status}`, details: errorText }, { status: res.status })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[admin/api/usage] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch from backend', details: String(error) }, { status: 500 })
  }
}
