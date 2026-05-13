import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://ai-mvp.replit.app'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/roadmap/graph`, { cache: 'no-store' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json({ error: `Backend error: ${res.status}`, details: text }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Backend unreachable', details: String(err) }, { status: 503 })
  }
}
