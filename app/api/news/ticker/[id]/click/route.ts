import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? ''

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id
  const body = await request.json().catch(() => ({}))

  if (!BACKEND) {
    return NextResponse.json({ status: 'ok' })
  }
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
