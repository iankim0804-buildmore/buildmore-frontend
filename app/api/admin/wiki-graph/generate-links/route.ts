import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function adminApiUrl() {
  const raw = process.env.NEXT_PUBLIC_ADMIN_API_URL || ''
  return raw && !raw.includes('ssmrdesign') ? raw : 'https://api.buildmore.co.kr'
}

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('buildmore_admin_token')?.value
  const adminToken = process.env.ADMIN_TOKEN
  const internalKey = process.env.ADMIN_INTERNAL_KEY

  if (!adminToken) return { error: NextResponse.json({ error: 'Server misconfigured: ADMIN_TOKEN not set' }, { status: 500 }) }
  if (token !== adminToken) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!internalKey) return { error: NextResponse.json({ error: 'Server misconfigured: Internal key not set' }, { status: 500 }) }
  return { internalKey }
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const res = await fetch(`${adminApiUrl()}/api/admin/wiki-graph/generate-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API-Key': auth.internalKey,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    if (!res.ok) {
      const details = await res.text().catch(() => '')
      return NextResponse.json({ error: `Backend error: ${res.status}`, details }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch (error) {
    console.error('[admin/api/wiki-graph/generate-links] Error:', error)
    return NextResponse.json({ error: 'Failed to post to backend', details: String(error) }, { status: 500 })
  }
}
