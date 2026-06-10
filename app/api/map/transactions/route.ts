import { NextRequest, NextResponse } from "next/server"

const rawBackendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || ""
const BACKEND_URL = rawBackendUrl && !rawBackendUrl.includes("ssmrdesign")
  ? rawBackendUrl.replace(/\/+$/, "")
  : "https://api.buildmore.co.kr"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const params = new URLSearchParams()

  for (const key of ["bbox", "pnu", "limit"]) {
    const value = url.searchParams.get(key)
    if (value) params.set(key, value)
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/map/transactions?${params.toString()}`, {
      cache: "no-store",
    })

    if (response.ok) {
      return NextResponse.json(await response.json(), {
        headers: { "Cache-Control": "no-store" },
      })
    }

    return NextResponse.json({ error: "map transactions unavailable" }, { status: response.status })
  } catch {
    return NextResponse.json({ error: "backend transactions unavailable" }, { status: 502 })
  }
}
