import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://buildmore-backend.fly.dev'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  try {
    const res = await fetch(`${BACKEND_URL}/api/news/ticker/${id}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      console.warn('[news/ticker/click] Backend error:', res.status)
      return NextResponse.json({ ok: false })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.warn('[news/ticker/click] Network error:', err)
    return NextResponse.json({ ok: false })
  }
}
