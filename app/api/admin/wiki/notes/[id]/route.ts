import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('buildmore_admin_token')?.value
  const { id } = await params

  const rawAdminUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || ''
  const adminApiUrl = rawAdminUrl && !rawAdminUrl.includes('ssmrdesign')
    ? rawAdminUrl
    : 'https://api.buildmore.co.kr'
  const internalKey = process.env.ADMIN_INTERNAL_KEY
  const adminToken = process.env.ADMIN_TOKEN

  if (!adminToken) {
    return NextResponse.json({ error: 'Server misconfigured: ADMIN_TOKEN not set' }, { status: 500 })
  }

  if (token !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!internalKey) {
    return NextResponse.json({ error: 'Server misconfigured: Internal key not set' }, { status: 500 })
  }

  try {
    const res = await fetch(`${adminApiUrl}/api/admin/wiki/notes/${encodeURIComponent(id)}`, {
      headers: { 'X-Internal-API-Key': internalKey },
      cache: 'no-store',
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      return NextResponse.json({ error: `Backend error: ${res.status}`, details: errorText }, { status: res.status })
    }

    return NextResponse.json(await res.json())
  } catch (error) {
    console.error('[admin/api/wiki/notes/:id] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch from backend', details: String(error) }, { status: 500 })
  }
}
