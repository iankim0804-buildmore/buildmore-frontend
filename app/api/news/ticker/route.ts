import { NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? ''

export async function GET() {
  if (!BACKEND) {
    return NextResponse.json({ items: [], total: 0, generated_at: new Date().toISOString() })
  }
  try {
    const res = await fetch(`${BACKEND}/api/news/ticker`, { next: { revalidate: 60 } })
    if (!res.ok) {
      return NextResponse.json(
        { items: [], total: 0, generated_at: new Date().toISOString() },
        { status: res.status }
      )
    }
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json(
      { items: [], total: 0, generated_at: new Date().toISOString() },
      { status: 502 }
    )
  }
}
