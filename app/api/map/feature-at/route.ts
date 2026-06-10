import { NextRequest, NextResponse } from "next/server"

const rawBackendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || ""
const BACKEND_URL = rawBackendUrl && !rawBackendUrl.includes("ssmrdesign")
  ? rawBackendUrl.replace(/\/+$/, "")
  : "https://api.buildmore.co.kr"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const lat = url.searchParams.get("lat")
  const lng = url.searchParams.get("lng")

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 })
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/map/feature-at?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`, {
      cache: "no-store",
    })

    if (response.ok) {
      return NextResponse.json(await response.json(), {
        headers: { "Cache-Control": "no-store" },
      })
    }

    return NextResponse.json({ error: "map feature not found at coordinate" }, { status: response.status })
  } catch {
    return NextResponse.json({ error: "backend feature-at unavailable" }, { status: 502 })
  }
}
