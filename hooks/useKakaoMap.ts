"use client"

import { useEffect, useRef, useState, useCallback } from 'react'

interface MapInitOptions {
  latitude?: number
  longitude?: number
  address?: string
  zoom?: number
}

interface UseKakaoMapReturn {
  mapRef: React.RefObject<HTMLDivElement | null>
  modalMapRef: React.RefObject<HTMLDivElement | null>
  isLoading: boolean
  error: string | null
  mapInstance: React.MutableRefObject<any>
  modalMapInstance: React.MutableRefObject<any>
  initModalMap: () => void
}

export const useKakaoMap = (options: MapInitOptions): UseKakaoMapReturn => {
  const mapRef = useRef<HTMLDivElement>(null)
  const modalMapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const modalMapInstance = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const modalMarkerRef = useRef<any>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kakaoMapKey, setKakaoMapKey] = useState<string | null>(null)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  // 현재 도메인 확인
  const getCurrentDomain = (): string => {
    if (typeof window === 'undefined') return ''
    return window.location.hostname
  }

  // 테스트 도메인 여부 확인
  const isTestDomain = (): boolean => {
    const domain = getCurrentDomain()
    const productionDomains = ['buildmore.co.kr', 'www.buildmore.co.kr']
    return !productionDomains.includes(domain)
  }

  // Step 1: API 키 가져오기
  useEffect(() => {
    const fetchKakaoMapKey = async () => {
      console.log('[kakao-map] Step 1: Fetching API key...')
      console.log('[kakao-map] Current domain:', getCurrentDomain())
      
      try {
        const response = await fetch('/api/config/kakao-map-key')
        console.log('[kakao-map] API response status:', response.status)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('[kakao-map] API error response:', errorData)
          throw new Error(errorData.error || 'Failed to fetch Kakao Map key')
        }
        
        const data = await response.json()
        console.log('[kakao-map] API response data:', { hasKey: !!data.kakaoMapKey, keyLength: data.kakaoMapKey?.length })
        
        if (data.kakaoMapKey) {
          setKakaoMapKey(data.kakaoMapKey)
          console.log('[kakao-map] API key fetched successfully')
        } else {
          const errorMsg = 'Kakao Map API key가 환경변수에 설정되지 않았습니다.'
          setError(errorMsg)
          console.error('[kakao-map] No API key in response')
          setIsLoading(false)
        }
      } catch (err) {
        console.error('[kakao-map] Failed to fetch API key:', err)
        setError('Kakao Map API key를 불러올 수 없습니다.')
        setIsLoading(false)
      }
    }

    fetchKakaoMapKey()
  }, [])

  // Step 2: 스크립트 로드
  useEffect(() => {
    if (!kakaoMapKey) return
    
    console.log('[kakao-map] Step 2: Loading Kakao Maps script...')
    
    const existingScript = document.getElementById('kakao-map-script')
    
    if (existingScript) {
      console.log('[kakao-map] Script already exists, checking window.kakao...')
      if (window.kakao?.maps) {
        console.log('[kakao-map] window.kakao.maps already available')
        setIsScriptLoaded(true)
      } else {
        // 스크립트는 있지만 아직 로드 안 됨
        existingScript.addEventListener('load', () => {
          console.log('[kakao-map] Existing script loaded')
          setIsScriptLoaded(true)
        })
      }
      return
    }

    const script = document.createElement('script')
    script.id = 'kakao-map-script'
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey}&autoload=false&libraries=services`
    script.async = true

    console.log('[kakao-map] Script src:', script.src.replace(kakaoMapKey, '***'))

    script.onload = () => {
      console.log('[kakao-map] Script loaded successfully')
      setIsScriptLoaded(true)
    }

    script.onerror = (e) => {
      console.error('[kakao-map] Script load error:', e)
      
      if (isTestDomain()) {
        setError(`테스트 도메인(${getCurrentDomain()})에서는 Kakao Map이 차단될 수 있습니다. buildmore.co.kr/analysis에서 확인해주세요.`)
      } else {
        setError('Kakao Map 스크립트를 로드할 수 없습니다. 네트워크 상태를 확인해주세요.')
      }
      setIsLoading(false)
    }

    document.head.appendChild(script)
  }, [kakaoMapKey])

  // Step 3: 주소를 좌표로 변환 (Geocoder)
  useEffect(() => {
    if (!isScriptLoaded || !window.kakao?.maps) return
    
    console.log('[kakao-map] Step 3: Converting address to coordinates...')
    
    window.kakao.maps.load(() => {
      console.log('[kakao-map] kakao.maps.load callback executed')
      
      const { address: inputAddress, latitude, longitude } = options
      
      // 주소가 있으면 Geocoder 사용
      if (inputAddress) {
        console.log('[kakao-map] Using Geocoder for address:', inputAddress)
        
        const geocoder = new window.kakao.maps.services.Geocoder()
        
        geocoder.addressSearch(inputAddress, (result: any[], status: string) => {
          console.log('[kakao-map] Geocoder status:', status)
          console.log('[kakao-map] Geocoder result:', result)
          
          if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
            const coords = {
              lat: parseFloat(result[0].y),
              lng: parseFloat(result[0].x)
            }
            console.log('[kakao-map] Coordinates from Geocoder:', coords)
            setCoordinates(coords)
          } else {
            console.warn('[kakao-map] Geocoder failed, using fallback coordinates')
            // 폴백: 기본 좌표 또는 전달된 좌표 사용
            setCoordinates({
              lat: latitude ?? 37.547,
              lng: longitude ?? 126.921
            })
          }
        })
      } else if (latitude && longitude) {
        // 좌표가 직접 전달된 경우
        console.log('[kakao-map] Using provided coordinates:', { latitude, longitude })
        setCoordinates({ lat: latitude, lng: longitude })
      } else {
        // 기본 좌표 (합정동)
        console.log('[kakao-map] Using default coordinates (합정동)')
        setCoordinates({ lat: 37.547, lng: 126.921 })
      }
    })
  }, [isScriptLoaded, options.address, options.latitude, options.longitude])

  // Step 4: 지도 생성
  useEffect(() => {
    if (!coordinates) {
      console.log('[kakao-map] Step 4: Waiting for coordinates...')
      return
    }
    
    if (!window.kakao?.maps) {
      console.log('[kakao-map] Step 4: Waiting for window.kakao.maps...')
      return
    }
    
    console.log('[kakao-map] Step 4: Creating map with coordinates:', coordinates)
    
    // DOM이 마운트되고 크기가 결정된 후 실행
    requestAnimationFrame(() => {
      if (!mapRef.current) {
        console.warn('[kakao-map] ⚠️ Map container is not mounted yet - will retry')
        // 아직 DOM이 준비되지 않으면 작은 지연 후 재시도
        setTimeout(() => {
          if (!mapRef.current) {
            console.error('[kakao-map] ❌ Map container still not mounted - giving up')
            setError('지도 컨테이너를 찾을 수 없습니다.')
            setIsLoading(false)
          }
        }, 100)
        return
      }

      try {
        console.log('[kakao-map] Map container verified:', { width: mapRef.current.offsetWidth, height: mapRef.current.offsetHeight })
        
        const { zoom = 3 } = options
        
        const mapOption = {
          center: new window.kakao.maps.LatLng(coordinates.lat, coordinates.lng),
          level: zoom,
        }

        mapInstance.current = new window.kakao.maps.Map(mapRef.current, mapOption)
        console.log('[kakao-map] ✅ Map instance created')

        // 마커 생성
        const markerPosition = new window.kakao.maps.LatLng(coordinates.lat, coordinates.lng)
        markerRef.current = new window.kakao.maps.Marker({
          position: markerPosition,
        })
        markerRef.current.setMap(mapInstance.current)
        console.log('[kakao-map] ✅ Marker placed at', coordinates)

        setIsLoading(false)
        setError(null)
        console.log('[kakao-map] ✅ Map initialization complete!')
      } catch (err) {
        console.error('[kakao-map] ❌ Map creation error:', err)
        
        if (isTestDomain()) {
          setError(`테스트 도메인(${getCurrentDomain()})에서는 Kakao Map이 차단될 수 있습니다. buildmore.co.kr/analysis에서 확인해주세요.`)
        } else {
          setError('지도를 생성할 수 없습니다. Kakao Developers 콘솔에서 도메인 등록 상태를 확인해주세요.')
        }
        setIsLoading(false)
      }
    })
  }, [coordinates, options.zoom])

  // 모달 지도 초기화 함수
  const initModalMap = useCallback(() => {
    console.log('[kakao-map] Modal: Initializing modal map...')
    
    if (!coordinates) {
      console.warn('[kakao-map] Modal: No coordinates available yet')
      return
    }

    if (!window.kakao?.maps) {
      console.warn('[kakao-map] Modal: window.kakao.maps not available')
      return
    }

    // DOM이 마운트되고 크기가 결정된 후 실행
    requestAnimationFrame(() => {
      if (!modalMapRef.current) {
        console.warn('[kakao-map] Modal: Container not mounted - retrying...')
        setTimeout(() => {
          if (!modalMapRef.current) {
            console.error('[kakao-map] Modal: Container still not mounted')
            return
          }
          initializeModalMapInternal()
        }, 100)
        return
      }
      
      initializeModalMapInternal()
    })

    const initializeModalMapInternal = () => {
      try {
        if (!modalMapRef.current) {
          console.error('[kakao-map] Modal: Container disappeared during init')
          return
        }

        console.log('[kakao-map] Modal: Container verified:', { width: modalMapRef.current.offsetWidth, height: modalMapRef.current.offsetHeight })

        const mapOption = {
          center: new window.kakao.maps.LatLng(coordinates.lat, coordinates.lng),
          level: 2, // 모달에서는 더 확대
        }

        modalMapInstance.current = new window.kakao.maps.Map(modalMapRef.current, mapOption)
        console.log('[kakao-map] Modal: ✅ Map instance created')

        // 마커 생성
        const markerPosition = new window.kakao.maps.LatLng(coordinates.lat, coordinates.lng)
        modalMarkerRef.current = new window.kakao.maps.Marker({
          position: markerPosition,
        })
        modalMarkerRef.current.setMap(modalMapInstance.current)
        console.log('[kakao-map] Modal: ✅ Marker placed')

        // 줌 컨트롤 추가
        const zoomControl = new window.kakao.maps.ZoomControl()
        modalMapInstance.current.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT)
        console.log('[kakao-map] Modal: ✅ Zoom control added')

        console.log('[kakao-map] Modal: ✅ Initialization complete')
      } catch (err) {
        console.error('[kakao-map] Modal: ❌ Map creation error:', err)
      }
    }
  }, [coordinates])

  return { 
    mapRef, 
    modalMapRef,
    isLoading, 
    error, 
    mapInstance,
    modalMapInstance,
    initModalMap
  }
}
