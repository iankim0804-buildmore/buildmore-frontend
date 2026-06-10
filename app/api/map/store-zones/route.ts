const mockStoreZones = [
  {
    type: "Feature",
    id: "store-zone-hapjeong-sample",
    properties: {
      id: "store-zone-hapjeong-sample",
      zone_no: "local-hapjeong",
      zone_name: "합정역 생활상권 샘플",
      sigungu_name: "마포구",
      area_m2: 162000,
      coord_count: 5,
      source: "local-zone-fallback",
      source_label: "SBIZ storeZoneInRectangle sample",
      updated_at: "2024-01-01",
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [126.9088, 37.5467],
        [126.9197, 37.5467],
        [126.9204, 37.5538],
        [126.9081, 37.5541],
        [126.9088, 37.5467],
      ]],
    },
  },
  {
    type: "Feature",
    id: "store-zone-hongdae-sample",
    properties: {
      id: "store-zone-hongdae-sample",
      zone_no: "local-hongdae",
      zone_name: "홍대입구 배후상권 샘플",
      sigungu_name: "마포구",
      area_m2: 245000,
      coord_count: 5,
      source: "local-zone-fallback",
      source_label: "SBIZ storeZoneInRectangle sample",
      updated_at: "2024-01-01",
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [126.9178, 37.5522],
        [126.9274, 37.5521],
        [126.9282, 37.5592],
        [126.9182, 37.5595],
        [126.9178, 37.5522],
      ]],
    },
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

function zoneInBbox(feature: (typeof mockStoreZones)[number], bbox: NonNullable<ReturnType<typeof parseBbox>>) {
  return feature.geometry.coordinates[0].some(([lng, lat]) =>
    lng >= bbox.minLng && lng <= bbox.maxLng && lat >= bbox.minLat && lat <= bbox.maxLat
  )
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const bbox = parseBbox(url.searchParams.get("bbox"))
  const limit = Number(url.searchParams.get("limit") ?? "50")

  if (!bbox) {
    return Response.json({ error: "bbox must be minLng,minLat,maxLng,maxLat" }, { status: 400 })
  }

  const params = new URLSearchParams({
    bbox: [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat].join(","),
    limit: String(Number.isFinite(limit) ? limit : 50),
  })

  try {
    const response = await fetch(`${BACKEND_URL}/api/map/store-zones?${params.toString()}`, {
      cache: "no-store",
    })

    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data.features) && data.features.length > 0) {
        return Response.json(data, {
          headers: { "Cache-Control": "no-store" },
        })
      }
    }
  } catch {
    // Keep /map usable while backend store-zone APIs are unavailable.
  }

  const features = mockStoreZones.filter((feature) => zoneInBbox(feature, bbox))
  return Response.json(
    {
      type: "FeatureCollection",
      bbox: [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat],
      count: features.length,
      source: "local-zone-fallback",
      features,
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  )
}
