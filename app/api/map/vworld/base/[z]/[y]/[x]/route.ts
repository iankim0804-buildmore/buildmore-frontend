import { NextRequest, NextResponse } from "next/server"

const VWORLD_WMTS_BASE = "http://api.vworld.kr/req/wmts/1.0.0"
const OSM_TILE_BASE = "https://tile.openstreetmap.org"
const BACKEND_WMTS_PROXY_BASE = "https://api.buildmore.co.kr/api/vworld/wmts/base"
const DEFAULT_REFERER = "https://buildmore.co.kr"
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ax2n1sAAAAASUVORK5CYII=",
  "base64"
)

function parseTile(value: string, max: number) {
  const normalized = value.replace(/\.png$/i, "")
  const tile = Number(normalized)
  if (!Number.isInteger(tile) || tile < 0 || tile > max) return null
  return tile
}

function tileResponse(body: BodyInit, status: number, contentType = "image/png") {
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

async function fetchTile(upstreamUrl: string, referer: string) {
  const response = await fetch(upstreamUrl, {
    headers: {
      Accept: "image/png,image/*,*/*",
      Origin: referer,
      Referer: referer,
      "User-Agent": "BuildMore/1.0",
    },
    next: { revalidate: 86400 },
  })

  if (!response.ok) return null

  const body = await response.arrayBuffer()
  if (!body.byteLength) return null

  return {
    body,
    contentType: response.headers.get("content-type") || "image/png",
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ z: string; y: string; x: string }> }
) {
  const { z, y, x } = await params
  const zoom = parseTile(z, 22)
  if (zoom === null) return tileResponse(TRANSPARENT_PNG, 400)

  const maxTile = 2 ** zoom - 1
  const tileY = parseTile(y, maxTile)
  const tileX = parseTile(x, maxTile)
  if (tileY === null || tileX === null) return tileResponse(TRANSPARENT_PNG, 400)

  const apiKey = process.env.VWORLD_API_KEY?.trim()
  const domain = process.env.VWORLD_DOMAIN?.trim() || DEFAULT_REFERER
  const referer = domain.startsWith("http") ? domain : `https://${domain}`
  const upstreamUrl = apiKey
    ? `${VWORLD_WMTS_BASE}/${encodeURIComponent(apiKey)}/Base/${zoom}/${tileY}/${tileX}.png`
    : `${OSM_TILE_BASE}/${zoom}/${tileX}/${tileY}.png`
  const backendProxyUrl = `${BACKEND_WMTS_PROXY_BASE}/${zoom}/${tileY}/${tileX}.png`

  try {
    const directTile = await fetchTile(upstreamUrl, referer)
    if (directTile) return tileResponse(directTile.body, 200, directTile.contentType)
  } catch (error) {
    console.error("[api/map/vworld/base] WMTS proxy error:", error)
  }

  try {
    const backendTile = await fetchTile(backendProxyUrl, referer)
    if (backendTile) return tileResponse(backendTile.body, 200, backendTile.contentType)
  } catch (error) {
    console.error("[api/map/vworld/base] backend WMTS fallback error:", error)
  }

  return tileResponse(TRANSPARENT_PNG, 502)
}
