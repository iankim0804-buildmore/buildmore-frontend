export async function GET() {
  const fallbackTilesBaseUrl = "https://pub-637cdf3d7c8b4f34a9fa470b10a9c34c.r2.dev"
  const tilesBaseUrl =
    process.env.NEXT_PUBLIC_MAP_TILES_BASE_URL?.replace(/\/+$/, "") || fallbackTilesBaseUrl
  const styleUrl =
    process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
    (tilesBaseUrl ? `${tilesBaseUrl}/styles/buildmore-map-v1.json` : "")

  return Response.json({
    engine: process.env.NEXT_PUBLIC_MAP_ENGINE || "maplibre",
    tilesBaseUrl,
    styleUrl,
    tilesetVersion: process.env.NEXT_PUBLIC_MAP_TILESET_VERSION || "r2-dev",
    defaultCenter: [126.978, 37.5665],
    defaultZoom: 12,
    minZoom: 9,
    maxZoom: 19,
    status: tilesBaseUrl ? "configured" : "missing_tiles_base_url",
  })
}
