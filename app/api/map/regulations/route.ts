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
      cache: "no-store",
    })

    if (response.ok) {
      return NextResponse.json(await response.json(), {
        headers: { "Cache-Control": "no-store" },
      })
    }

    return NextResponse.json({ error: "map regulations unavailable" }, { status: response.status })
  } catch {
    return NextResponse.json({ error: "backend regulations unavailable" }, { status: 502 })
  }
}
