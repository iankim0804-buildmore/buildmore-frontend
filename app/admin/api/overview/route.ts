import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('buildmore_admin_token')?.value
  
  if (token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/admin/overview`,
      {
        headers: { 'X-Internal-API-Key': process.env.ADMIN_INTERNAL_KEY! },
        cache: 'no-store'
      }
    )
    
    if (!res.ok) {
      return NextResponse.json(null, { status: res.status })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[admin/api/overview] Error:', error)
    return NextResponse.json(null, { status: 500 })
  }
}
