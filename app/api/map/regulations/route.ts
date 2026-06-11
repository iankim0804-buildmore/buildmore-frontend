import { NextRequest, NextResponse } from "next/server"

const rawBackendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || ""
const BACKEND_URL = rawBackendUrl && !rawBackendUrl.includes("ssmrdesign")
  ? rawBackendUrl.replace(/\/+$/, "")
  : "https://api.buildmore.co.kr"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const bbox = url.searchParams.get("bbox")

  if (!bbox) {
    return NextResponse.json({ error: "bbox is required" }, { status: 400 })
  }

  const params = new URLSearchParams({ bbox })
  const limit = url.searchParams.get("limit")
  if (limit) params.set("limit", limit)

  try {
    const response = await fetch(`${BACKEND_URL}/api/map/regulations?${params.toString()}`, {
      next: { revalidate: 300 },
    })

    if (response.ok) {
      return NextResponse.json(await response.json(), {
        headers: { "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600" },
      })
    }

    return NextResponse.json({ error: "map regulations unavailable" }, { status: response.status })
  } catch {
    return NextResponse.json({ error: "backend regulations unavailable" }, { status: 502 })
  }
}
