import { NextRequest, NextResponse } from "next/server"

const rawBackendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || ""
const BACKEND_URL = rawBackendUrl && !rawBackendUrl.includes("ssmrdesign")
  ? rawBackendUrl.replace(/\/+$/, "")
  : "https://api.buildmore.co.kr"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const params = new URLSearchParams()

  for (const key of ["bbox", "pnu", "limit", "date_from", "date_to"]) {
    const value = url.searchParams.get(key)
    if (value) params.set(key, value)
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/map/transactions?${params.toString()}`, {
      next: { revalidate: 300 },
    })

    if (response.ok) {
      return NextResponse.json(await response.json(), {
        headers: { "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=600" },
      })
    }

    return NextResponse.json({ error: "map transactions unavailable" }, { status: response.status })
  } catch {
    return NextResponse.json({ error: "backend transactions unavailable" }, { status: 502 })
  }
}
