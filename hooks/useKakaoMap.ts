import { useEffect, useRef, useState } from 'react'

interface MapInitOptions {
  latitude?: number
  longitude?: number
  address?: string
  zoom?: number
}

export const useKakaoMap = (options: MapInitOptions) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kakaoMapKey, setKakaoMapKey] = useState<string | null>(null)

  // 카카오 맵 API 키 가져오기
  useEffect(() => {
    const fetchKakaoMapKey = async () => {
      try {
        const response = await fetch('/api/config/kakao-map-key')
        if (!response.ok) throw new Error('Failed to fetch Kakao Map key')
        const data = await response.json()
        setKakaoMapKey(data.kakaoMapKey)
      } catch (err) {
        console.warn('[kakao-map] Failed to fetch API key:', err)
        setError('Kakao Map API key를 불러올 수 없습니다.')
      }
    }

    fetchKakaoMapKey()
  }, [])

  // 지도 초기화
  useEffect(() => {
    if (typeof window === 'undefined' || !kakaoMapKey || !mapRef.current) return

    const initializeMap = async () => {
      try {
        const existingScript = document.getElementById('kakao-map-script')

        const loadMap = () => {
          if (!window.kakao?.maps) {
            setError('Kakao Maps API를 불러올 수 없습니다.')
            return
          }

          const { latitude = 37.547, longitude = 126.921, zoom = 3 } = options

          const mapOption = {
            center: new window.kakao.maps.LatLng(latitude, longitude),
            level: zoom,
          }

          mapInstance.current = new window.kakao.maps.Map(mapRef.current, mapOption)

          // 마커 표시
          const markerPosition = new window.kakao.maps.LatLng(latitude, longitude)
          const marker = new window.kakao.maps.Marker({
            position: markerPosition,
          })
          marker.setMap(mapInstance.current)

          setIsLoading(false)
        }

        if (!existingScript) {
          const script = document.createElement('script')
          script.id = 'kakao-map-script'
          script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey}&autoload=false&libraries=services`
          script.async = true

          script.onload = () => {
            if (window.kakao?.maps) {
              window.kakao.maps.load(() => {
                loadMap()
              })
            }
          }

          script.onerror = () => {
            setError('Kakao Map API를 로드할 수 없습니다.')
            setIsLoading(false)
          }

          document.head.appendChild(script)
        } else if (window.kakao?.maps) {
          window.kakao.maps.load(() => {
            loadMap()
          })
        }
      } catch (err) {
        console.warn('[kakao-map] Map initialization error:', err)
        setError('지도를 초기화할 수 없습니다.')
        setIsLoading(false)
      }
    }

    initializeMap()
  }, [kakaoMapKey, options])

  return { mapRef, isLoading, error, mapInstance }
}
