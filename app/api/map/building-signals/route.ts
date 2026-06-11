const mockBuildingSignals = [
  {
    id: "bm-map-001",
    address: "서울 마포구 합정동 414-16",
    district: "합정역 6번 출구권",
    bankability: 74,
    scenarios: ["리모델링", "증축"],
    status: "ready",
    lat: 37.5496,
    lng: 126.9142,
  },
  {
    id: "bm-map-002",
    address: "서울 마포구 서교동 357-1",
    district: "홍대입구 배후상권",
    bankability: 68,
    scenarios: ["유지보수", "리모델링"],
    status: "partial",
    lat: 37.5562,
    lng: 126.9235,
  },
  {
    id: "bm-map-003",
    address: "서울 마포구 망원동 399-4",
    district: "망리단길 생활상권",
    bankability: 61,
    scenarios: ["리모델링", "신축"],
    status: "queued",
    lat: 37.5551,
    lng: 126.9064,
  },
]

const rawBackendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || ""
const BACKEND_URL = rawBackendUrl && !rawBackendUrl.includes("ssmrdesign")
  ? rawBackendUrl.replace(/\/+$/, "")
  : "https://api.buildmore.co.kr"

function parseBbox(rawBbox: string | null) {
  if (!rawBbox) return null

  const values = rawBbox.split(",").map((value) => Number(value.trim()))
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    return null
  }

  const [minLng, minLat, maxLng, maxLat] = values
  return { minLng, minLat, maxLng, maxLat }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const bbox = parseBbox(url.searchParams.get("bbox"))
  const level = Number(url.searchParams.get("level") ?? "4")

  if (!bbox) {
    return Response.json({ error: "bbox must be minLng,minLat,maxLng,maxLat" }, { status: 400 })
  }

  const params = new URLSearchParams({
    bbox: [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat].join(","),
    level: String(Number.isFinite(level) ? level : 4),
  })

  try {
    const response = await fetch(`${BACKEND_URL}/api/map/building-signals?${params.toString()}`, {
      next: { revalidate: 120 },
    })

    if (response.ok) {
      const data = await response.json()
      return Response.json(data, {
        headers: {
          "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
        },
      })
    }
  } catch {
    // Keep /map usable while backend map APIs are unavailable.
  }

  const buildings = mockBuildingSignals.filter(
    (building) =>
      building.lng >= bbox.minLng &&
      building.lng <= bbox.maxLng &&
      building.lat >= bbox.minLat &&
      building.lat <= bbox.maxLat
  )

  return Response.json(
    {
      bbox: [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat].map((value) => value.toFixed(6)).join(","),
      level: Number.isFinite(level) ? level : 4,
      count: buildings.length,
      source: "local-bbox-mock",
      buildings,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
      },
    }
  )
}
