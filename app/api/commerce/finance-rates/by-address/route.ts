import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://ai-mvp.replit.app'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const response = await fetch(`${BACKEND_URL}/api/commerce/finance-rates/by-address?${url.searchParams.toString()}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      )
    }

    return NextResponse.json(await response.json())
  } catch (error) {
    console.error('Finance rates API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch finance rates' },
      { status: 500 }
    )
  }
}
