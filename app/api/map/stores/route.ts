const mockStores = [
  {
    type: "Feature",
    id: "store-hapjeong-cafe-001",
    properties: {
      id: "store-hapjeong-cafe-001",
      store_no: "mock-hapjeong-cafe-001",
      store_name: "합정 로스터리 샘플",
      industry_l_name: "음식",
      industry_m_name: "커피점/카페",
      industry_s_name: "카페",
      industry: "카페",
      address: "서울 마포구 합정동",
      source: "local-store-fallback",
      source_label: "SBIZ public store sample",
      updated_at: "local",
    },
    geometry: { type: "Point", coordinates: [126.9146, 37.5499] },
  },
  {
    type: "Feature",
    id: "store-hapjeong-food-002",
    properties: {
      id: "store-hapjeong-food-002",
      store_no: "mock-hapjeong-food-002",
      store_name: "합정 식음 샘플",
      industry_l_name: "음식",
      industry_m_name: "한식",
      industry_s_name: "일반음식점",
      industry: "일반음식점",
      address: "서울 마포구 합정동",
      source: "local-store-fallback",
      source_label: "SBIZ public store sample",
      updated_at: "local",
    },
    geometry: { type: "Point", coordinates: [126.9138, 37.5508] },
  },
  {
    type: "Feature",
    id: "store-hongdae-retail-003",
    properties: {
      id: "store-hongdae-retail-003",
      store_no: "mock-hongdae-retail-003",
      store_name: "서교 리테일 샘플",
      industry_l_name: "소매",
      industry_m_name: "패션/잡화",
      industry_s_name: "의류",
      industry: "의류",
      address: "서울 마포구 서교동",
      source: "local-store-fallback",
      source_label: "SBIZ public store sample",
      updated_at: "local",
    },
    geometry: { type: "Point", coordinates: [126.9217, 37.5549] },
  },
  {
    type: "Feature",
    id: "store-mangwon-service-004",
    properties: {
      id: "store-mangwon-service-004",
      store_no: "mock-mangwon-service-004",
      store_name: "망원 생활서비스 샘플",
      industry_l_name: "생활서비스",
      industry_m_name: "미용",
      industry_s_name: "미용실",
      industry: "미용실",
      address: "서울 마포구 망원동",
      source: "local-store-fallback",
      source_label: "SBIZ public store sample",
      updated_at: "local",
    },
    geometry: { type: "Point", coordinates: [126.9067, 37.5552] },
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

function inBbox(feature: (typeof mockStores)[number], bbox: NonNullable<ReturnType<typeof parseBbox>>) {
  const [lng, lat] = feature.geometry.coordinates
  return lng >= bbox.minLng && lng <= bbox.maxLng && lat >= bbox.minLat && lat <= bbox.maxLat
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const bbox = parseBbox(url.searchParams.get("bbox"))
  const limit = Number(url.searchParams.get("limit") ?? "500")
  const live = url.searchParams.get("live") ?? "auto"
  const indsLclsCd = url.searchParams.get("indsLclsCd")
  const indsMclsCd = url.searchParams.get("indsMclsCd")
  const indsSclsCd = url.searchParams.get("indsSclsCd")

  if (!bbox) {
    return Response.json({ error: "bbox must be minLng,minLat,maxLng,maxLat" }, { status: 400 })
  }

  const params = new URLSearchParams({
    bbox: [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat].join(","),
    limit: String(Number.isFinite(limit) ? limit : 500),
    live,
  })
  if (indsLclsCd) params.set("indsLclsCd", indsLclsCd)
  if (indsMclsCd) params.set("indsMclsCd", indsMclsCd)
  if (indsSclsCd) params.set("indsSclsCd", indsSclsCd)

  try {
    const response = await fetch(`${BACKEND_URL}/api/map/stores?${params.toString()}`, {
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
    // Keep /map usable while backend store APIs are unavailable.
  }

  const features = mockStores.filter((feature) => inBbox(feature, bbox))
  return Response.json(
    {
      type: "FeatureCollection",
      bbox: [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat],
      count: features.length,
      source: "local-store-fallback",
      features,
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  )
}
