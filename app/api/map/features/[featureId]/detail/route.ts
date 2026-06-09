import { NextRequest, NextResponse } from "next/server"

const rawBackendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || ""
const BACKEND_URL = rawBackendUrl && !rawBackendUrl.includes("ssmrdesign")
  ? rawBackendUrl.replace(/\/+$/, "")
  : "https://api.buildmore.co.kr"

function mockDetail(featureId: string) {
  return {
    feature_id: featureId,
    status: "partial",
    evidence: [],
    location_read: {
      commercial_axis: "unavailable",
      residential_backing: "unavailable",
      anchor_pois: [],
    },
    next_actions: [
      "FastAPI feature detail endpoint 연결",
      "PostGIS map_* cache table 생성",
      "PNU/building_id 기준 기존 deal-panel 분석 입력 변환",
    ],
    unavailable: ["Feature detail backend endpoint pending"],
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ featureId: string }> },
) {
  const { featureId } = await params

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/map/features/${encodeURIComponent(featureId)}/detail`,
      { cache: "no-store" },
    )

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    }
  } catch {
    // Keep /map usable while the backend map API is being built.
  }

  return NextResponse.json(mockDetail(featureId), { status: 200 })
}
