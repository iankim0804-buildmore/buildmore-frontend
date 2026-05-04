import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const expectedToken = process.env.ADMIN_TOKEN

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'ADMIN_TOKEN not configured' },
        { status: 500 }
      )
    }

    if (password === expectedToken) {
      const response = NextResponse.json({ success: true })
      response.cookies.set('buildmore_admin_token', password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
      return response
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
