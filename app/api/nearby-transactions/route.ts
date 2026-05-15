import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://buildmore-backend.replit.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pnu, radius_m = 500, limit = 20 } = body

    if (!pnu) {
      return NextResponse.json(
        { error: 'PNU is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/api/nearby-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API-Key': process.env.INTERNAL_API_KEY || '',
      },
      body: JSON.stringify({ pnu, radius_m, limit }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] nearby-transactions API error:', errorText)
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] nearby-transactions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
