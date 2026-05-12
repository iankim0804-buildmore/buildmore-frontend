import { NextRequest, NextResponse } from 'next/server'

const BACKEND = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_ADMIN_API_URL ||
  'https://ai-mvp.replit.app'
).replace(/\/$/, '')

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  try {
    const res = await fetch(`${BACKEND}/api/news/ticker/${id}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ status: 'ok' })
  }
}
