const tilesBaseUrl = (
  process.env.NEXT_PUBLIC_MAP_TILES_BASE_URL || "https://tiles.buildmore.co.kr"
).replace(/\/+$/, "")
const tilesetVersion = process.env.NEXT_PUBLIC_MAP_TILESET_VERSION || "r2-custom-domain"
const styleUrl =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
  (tilesBaseUrl ? `${tilesBaseUrl}/styles/buildmore-map-v1.json` : "")

export async function GET() {
  return Response.json({
    version: tilesetVersion,
    styleUrl,
    tilesBaseUrl,
    sources: {
      "bm-basemap": tilesBaseUrl ? `pmtiles://${tilesBaseUrl}/tiles/bm-basemap-${tilesetVersion}.pmtiles` : "",
      "bm-parcels": tilesBaseUrl ? `pmtiles://${tilesBaseUrl}/tiles/bm-parcels-${tilesetVersion}.pmtiles` : "",
      "bm-buildings": tilesBaseUrl ? `pmtiles://${tilesBaseUrl}/tiles/bm-buildings-${tilesetVersion}.pmtiles` : "",
      "bm-transactions": tilesBaseUrl ? `pmtiles://${tilesBaseUrl}/tiles/bm-transactions-${tilesetVersion}.pmtiles` : "",
      "bm-regulations": tilesBaseUrl ? `pmtiles://${tilesBaseUrl}/tiles/bm-regulations-${tilesetVersion}.pmtiles` : "",
    },
    status: tilesBaseUrl ? "configured" : "missing_tiles_base_url",
  })
}
