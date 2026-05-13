import { NextRequest, NextResponse } from 'next/server'

const _rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || ''
const BACKEND_URL = (_rawUrl && !_rawUrl.includes('ssmrdesign'))
  ? _rawUrl
  : 'https://ai-mvp.replit.app'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ auditRunId: string }> },
) {
  const { auditRunId } = await params

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/roadmap/audit/run/${encodeURIComponent(auditRunId)}`,
      { cache: 'no-store' },
    )
    const data = await res.json().catch(async () => ({ details: await res.text().catch(() => '') }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json({ error: 'Backend unreachable', details: String(err) }, { status: 503 })
  }
}
