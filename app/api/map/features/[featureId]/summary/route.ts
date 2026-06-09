import { NextRequest, NextResponse } from "next/server"

const rawBackendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || ""
const BACKEND_URL = rawBackendUrl && !rawBackendUrl.includes("ssmrdesign")
  ? rawBackendUrl.replace(/\/+$/, "")
  : "https://api.buildmore.co.kr"

function mockSummary(featureId: string) {
  return {
    id: featureId,
    feature_id: featureId,
    pnu: featureId.startsWith("parcel-") ? "pending" : featureId,
    address: "지도 feature summary 연결 대기",
    district: "MapLibre 선택 feature",
    use: "필지/건물",
    bankability_score: 0,
    deal_readiness_score: 0,
    status: "partial",
    confidence: "backend API 대기",
    source_updated_at: "unavailable",
    unavailable: ["FastAPI /api/map/features/{feature_id}/summary endpoint pending"],
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ featureId: string }> },
) {
  const { featureId } = await params

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/map/features/${encodeURIComponent(featureId)}/summary`,
      { cache: "no-store" },
    )

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    }
  } catch {
    // Keep /map usable while the backend map API is being built.
  }

  return NextResponse.json(mockSummary(featureId), { status: 200 })
}
