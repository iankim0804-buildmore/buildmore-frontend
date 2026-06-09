import { NextRequest, NextResponse } from "next/server"

const TILES_BASE_URL = "https://tiles.buildmore.co.kr"

function parseTile(value: string, max: number) {
  const normalized = value.replace(/\.pbf$/i, "")
  const tile = Number(normalized)
  if (!Number.isInteger(tile) || tile < 0 || tile > max) return null
  return tile
}

function tileResponse(body: BodyInit | null, status: number, contentType = "application/x-protobuf") {
  return new NextResponse(body, {
    status,
    headers: {
      "content-type": contentType,
      "cache-control": status === 200
        ? "public, max-age=86400, stale-while-revalidate=604800"
        : "no-store",
    },
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params
  const zoom = parseTile(z, 22)
  if (zoom === null) return tileResponse(null, 400)

  const maxTile = 2 ** zoom - 1
  const tileX = parseTile(x, maxTile)
  const tileY = parseTile(y, maxTile)
  if (tileX === null || tileY === null) return tileResponse(null, 400)

  try {
    const upstreamUrl = `${TILES_BASE_URL}/tiles/cadastral/${zoom}/${tileX}/${tileY}.pbf`
    const response = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/x-protobuf,application/octet-stream,*/*",
        "User-Agent": "BuildMore/1.0",
      },
      next: { revalidate: 86400 },
    })

    if (!response.ok) return tileResponse(null, response.status === 404 ? 204 : response.status)

    const body = await response.arrayBuffer()
    if (!body.byteLength) return tileResponse(null, 204)

    return tileResponse(body, 200, response.headers.get("content-type") || "application/x-protobuf")
  } catch (error) {
    console.error("[api/map/tiles/cadastral] tile proxy error:", error)
    return tileResponse(null, 502)
  }
}
