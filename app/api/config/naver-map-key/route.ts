export async function GET() {
  const naverMapClientId = process.env.NAVER_MAP_CLIENT_ID || process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
  const customStyleId = process.env.NAVER_MAP_STYLE_ID || process.env.NEXT_PUBLIC_NAVER_MAP_STYLE_ID || null

  if (!naverMapClientId) {
    return Response.json(
      { error: "Naver Map client id is not configured" },
      { status: 500 }
    )
  }

  return Response.json({ naverMapClientId, customStyleId })
}
