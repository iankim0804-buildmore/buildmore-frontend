export async function GET() {
  const kakaoMapKey = process.env.KAKAO_MAP_API_KEY || process.env.NEXT_PUBLIC_KAKAO_MAP_KEY

  if (!kakaoMapKey) {
    return Response.json(
      { error: 'Kakao Map API key is not configured' },
      { status: 500 }
    )
  }

  // 클라이언트에 노출 가능한 JavaScript key인지 확인
  // KAKAO_MAP_API_KEY 또는 NEXT_PUBLIC_KAKAO_MAP_KEY는 JavaScript key여야 함
  return Response.json({ kakaoMapKey })
}
