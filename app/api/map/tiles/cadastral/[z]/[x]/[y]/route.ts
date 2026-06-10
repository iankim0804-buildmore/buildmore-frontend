import { NextRequest, NextResponse } from "next/server"

const TILES_BASE_URL = "https://tiles.buildmore.co.kr"
const TILE_REVALIDATE_SECONDS = 60 * 60 * 24 * 30
const TILE_BROWSER_CACHE_SECONDS = 60 * 60 * 24
const TILE_STALE_SECONDS = 60 * 60 * 24 * 7
const TILE_CACHE_CONTROL = [
  "public",
  `max-age=${TILE_BROWSER_CACHE_SECONDS}`,
  `s-maxage=${TILE_REVALIDATE_SECONDS}`,
  `stale-while-revalidate=${TILE_STALE_SECONDS}`,
  "immutable",
].join(", ")

function parseTile(value: string, max: number) {
  const normalized = value.replace(/\.pbf$/i, "")
  const tile = Number(normalized)
  if (!Number.isInteger(tile) || tile < 0 || tile > max) return null
  return tile
}

function tileResponse(body: BodyInit | null, status: number, contentType = "application/x-protobuf") {
  const cacheable = status === 200 || status === 204
  return new NextResponse(body, {
    status,
    headers: {
      "content-type": contentType,
      "cache-control": cacheable ? TILE_CACHE_CONTROL : "no-store",
      "cdn-cache-control": cacheable ? TILE_CACHE_CONTROL : "no-store",
      "vercel-cdn-cache-control": cacheable ? TILE_CACHE_CONTROL : "no-store",
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
      next: { revalidate: TILE_REVALIDATE_SECONDS },
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
