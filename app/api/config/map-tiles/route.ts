export async function GET() {
  const tilesBaseUrl = (
    process.env.NEXT_PUBLIC_MAP_TILES_BASE_URL || "https://tiles.buildmore.co.kr"
  ).replace(/\/+$/, "")
  const styleUrl =
    process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
    (tilesBaseUrl ? `${tilesBaseUrl}/styles/buildmore-map-v1.json` : "")

  return Response.json({
    engine: process.env.NEXT_PUBLIC_MAP_ENGINE || "naver-maplibre",
    tilesBaseUrl,
    styleUrl,
    tilesetVersion: process.env.NEXT_PUBLIC_MAP_TILESET_VERSION || "r2-custom-domain",
    defaultCenter: [126.978, 37.5665],
    defaultZoom: 12,
    minZoom: 9,
    maxZoom: 22,
    status: tilesBaseUrl ? "configured" : "missing_tiles_base_url",
  })
}
