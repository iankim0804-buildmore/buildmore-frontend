import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://buildmore-backend.fly.dev'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const res = await fetch(`${BACKEND_URL}/api/news/ticker/${id}/detail`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      console.warn('[news/ticker/detail] Backend error:', res.status)
      return NextResponse.json({ error: 'Detail not available' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.warn('[news/ticker/detail] Network error:', err)
    return NextResponse.json({ error: 'Failed to fetch detail' }, { status: 500 })
  }
}
