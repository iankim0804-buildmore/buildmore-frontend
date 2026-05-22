import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function adminApiUrl() {
  const rawAdminUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || ''
  return rawAdminUrl && !rawAdminUrl.includes('ssmrdesign')
    ? rawAdminUrl
    : 'https://api.buildmore.co.kr'
}

async function requireAdminProxyConfig() {
  const cookieStore = await cookies()
  const token = cookieStore.get('buildmore_admin_token')?.value
  const internalKey = process.env.ADMIN_INTERNAL_KEY
  const adminToken = process.env.ADMIN_TOKEN

  if (!adminToken) return { error: NextResponse.json({ error: 'Server misconfigured: ADMIN_TOKEN not set' }, { status: 500 }) }
  if (token !== adminToken) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!internalKey) return { error: NextResponse.json({ error: 'Server misconfigured: Internal key not set' }, { status: 500 }) }

  return { internalKey }
}

export async function POST(request: NextRequest) {
  const config = await requireAdminProxyConfig()
  if ('error' in config) return config.error

  const search = request.nextUrl.searchParams
  const mode = search.get('mode') || 'queue'
  const months = search.get('months') || '12'
  const metricKey = search.get('metric_key')
  const backendSearch = new URLSearchParams({ mode, months })
  if (metricKey) backendSearch.set('metric_key', metricKey)

  try {
    const res = await fetch(`${adminApiUrl()}/api/admin/period-delta/recompute?${backendSearch.toString()}`, {
      method: 'POST',
      headers: { 'X-Internal-API-Key': config.internalKey },
      cache: 'no-store',
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      return NextResponse.json({ error: `Backend error: ${res.status}`, details: errorText }, { status: res.status })
    }

    return NextResponse.json(await res.json())
  } catch (error) {
    return NextResponse.json({ error: 'Failed to recompute period delta engine', details: String(error) }, { status: 500 })
  }
}
