import { NextRequest, NextResponse } from 'next/server'

const _rawUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || ''
const BACKEND_URL = (_rawUrl && !_rawUrl.includes('ssmrdesign'))
  ? _rawUrl
  : 'https://buildmore-backend.replit.app'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> },
) {
  const { nodeId } = await params

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/roadmap/audit/node/${encodeURIComponent(nodeId)}`,
      { cache: 'no-store' },
    )
    const data = await res.json().catch(async () => ({ details: await res.text().catch(() => '') }))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json({ error: 'Backend unreachable', details: String(err) }, { status: 503 })
  }
}
