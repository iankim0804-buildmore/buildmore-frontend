"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Database,
  MapIcon,
  Navigation,
  Ruler,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  TriangleAlert,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type DataStatus = "ready" | "partial" | "queued"
type LayerKey = "transactions" | "regulations"
type ViewMode = "map" | "roadview"
type PanelSection = "transactions" | "land" | "building" | "analysis"

type MapGeometry = {
  type: string
  coordinates: unknown
}

type BuildingRegister = {
  building_count?: number
  building_name?: string | null
  use_code?: string | null
  structure_code?: string | null
  approval_year?: number | null
  latest_use_approval_date?: string | null
  total_floor_area_m2?: number | null
  largest_total_floor_area_m2?: number | null
  ground_floors?: number | null
  underground_floors?: number | null
  height_m?: number | null
}

type MapFeature = {
  id: string
  featureId: string
  pnu: string
  address: string
  district: string
  use: string
  coordinates: { lat: number; lng: number }
  price: string
  area: string
  areaM2?: number
  approvalYear?: number
  bankability: number
  readiness: number
  capRate: string
  dscr: string
  ltv: string
  noi: string
  equity: string
  interest: string
  maxPurchasePrice: string
  locationSignal: string
  signalStrength: "strong" | "medium" | "watch"
  hiddenYield: string
  confidence: string
  sourceUpdatedAt: string
  status: DataStatus
  geometry?: MapGeometry
  buildingGeometry?: MapGeometry
  buildingName?: string | null
  buildingCount?: number
  buildingRegister?: BuildingRegister
  buildingAreaM2?: number
  totalFloorAreaM2?: number
  groundFloors?: number
  undergroundFloors?: number
  heightM?: number
  landValueLabel?: string
  officialLandPriceLabel?: string
  officialLandPricePerM2?: number
  latestDealDate?: string
  transactionContext?: Record<string, unknown>
  source?: string
  sourceBaseDate?: string | null
  risks: string[]
  nextActions: string[]
  scenarios: string[]
}

type MapViewport = {
  swLat: number
  swLng: number
  neLat: number
  neLng: number
  zoom: number
  bboxParam: string
}

type MapConfig = {
  engine: string
  defaultCenter: [number, number]
  defaultZoom: number
  minZoom: number
  maxZoom: number
  status: string
}

type ApiState = {
  status: "idle" | "loading" | "ready" | "error"
  count: number
  source: string
}

type MapLayerApiState = {
  status: "idle" | "loading" | "ready" | "error"
  count: number
  source: string
}

type TransactionItem = {
  id?: string | number | null
  transaction_id?: string | number | null
  pnu?: string | null
  address?: string | null
  building_name?: string | null
  deal_date?: string | null
  deal_date_label?: string | null
  amount_10k?: number | null
  amount_label?: string | null
  arch_area_m2?: number | null
  land_area_m2?: number | null
  floor?: number | null
  arch_year?: number | null
  building_use?: string | null
  deal_type?: string | null
}

type FeatureCollection = {
  type: "FeatureCollection"
  features: Array<Record<string, unknown>>
  [key: string]: unknown
}

type KakaoOverlay = { setMap: (map: unknown | null) => void }
type KakaoLatLngLike = {
  getLat?: () => number
  getLng?: () => number
  Ma?: number
  La?: number
}
type KakaoBoundsLike = {
  getSouthWest: () => KakaoLatLngLike
  getNorthEast: () => KakaoLatLngLike
}
type KakaoMapInstance = {
  addControl: (control: unknown, position: unknown) => void
  getBounds: () => KakaoBoundsLike
  getLevel?: () => number
}
type KakaoRoadviewInstance = {
  setPanoId: (panoId: number, position: unknown) => void
  relayout?: () => void
}
type KakaoRoadviewClient = {
  getNearestPanoId: (position: unknown, radius: number, callback: (panoId: number | null) => void) => void
}
type KakaoClickEvent = { latLng: KakaoLatLngLike }
type KakaoEventHandler = (...args: unknown[]) => void

const mapInitialLevel = 3
const emptyFeatureCollection: FeatureCollection = { type: "FeatureCollection", features: [] }

let kakaoMapsPromise: Promise<typeof window.kakao.maps> | null = null

const layerLabels: Record<LayerKey, string> = {
  transactions: "부동산 실거래",
  regulations: "규제/정비",
}

const layerColors: Record<LayerKey, string> = {
  transactions: "bg-indigo-500",
  regulations: "bg-amber-500",
}

const mockFeatures: MapFeature[] = [
  {
    id: "bm-map-001",
    featureId: "1144012400104140016",
    pnu: "1144012400104140016",
    address: "서울 마포구 합정동 414-16",
    district: "합정역 6번 출구권",
    use: "근린생활시설",
    coordinates: { lat: 37.5496, lng: 126.9142 },
    price: "52.8억",
    area: "대지 142㎡",
    areaM2: 142,
    approvalYear: 1998,
    bankability: 74,
    readiness: 68,
    capRate: "4.7%",
    dscr: "1.31",
    ltv: "58%",
    noi: "2.48억",
    equity: "22.1억",
    interest: "1,920만/월",
    maxPurchasePrice: "49.6억",
    locationSignal: "합정역 상업축 인접",
    signalStrength: "strong",
    hiddenYield: "검토 가능",
    confidence: "샘플",
    sourceUpdatedAt: "2026.06.09",
    status: "ready",
    risks: ["임대료 표본 보강 필요", "건축물대장 원장 확인 필요"],
    nextActions: ["임대차 명세 확인", "최근 거래 24개월 비교", "은행 제출 메모 초안"],
    scenarios: ["리모델링", "증축"],
  },
  {
    id: "bm-map-002",
    featureId: "1144012000103570001",
    pnu: "1144012000103570001",
    address: "서울 마포구 서교동 357-1",
    district: "홍대입구 배후상권",
    use: "상업/업무",
    coordinates: { lat: 37.5562, lng: 126.9235 },
    price: "64.5억",
    area: "대지 171㎡",
    areaM2: 171,
    approvalYear: 2004,
    bankability: 61,
    readiness: 56,
    capRate: "3.9%",
    dscr: "1.12",
    ltv: "52%",
    noi: "2.51억",
    equity: "31.0억",
    interest: "2,460만/월",
    maxPurchasePrice: "57.2억",
    locationSignal: "홍대 배후 임대수요",
    signalStrength: "medium",
    hiddenYield: "검증 필요",
    confidence: "샘플",
    sourceUpdatedAt: "2026.06.09",
    status: "partial",
    risks: ["공실률 보정 필요", "최근 고가 거래 영향"],
    nextActions: ["공실 임대료 재산정", "대출한도 보수 시나리오", "매입가 하향 기준 산출"],
    scenarios: ["유지보수", "리모델링"],
  },
  {
    id: "bm-map-003",
    featureId: "1144012300103990004",
    pnu: "1144012300103990004",
    address: "서울 마포구 망원동 399-4",
    district: "망리단길 생활상권",
    use: "제2종근린생활시설",
    coordinates: { lat: 37.5551, lng: 126.9064 },
    price: "41.8억",
    area: "대지 132㎡",
    areaM2: 132,
    approvalYear: 1992,
    bankability: 69,
    readiness: 63,
    capRate: "4.4%",
    dscr: "1.24",
    ltv: "56%",
    noi: "1.84억",
    equity: "18.5억",
    interest: "1,410만/월",
    maxPurchasePrice: "40.9억",
    locationSignal: "생활상권 유입",
    signalStrength: "watch",
    hiddenYield: "근거 부족",
    confidence: "샘플",
    sourceUpdatedAt: "분석 대기",
    status: "queued",
    risks: ["좌표 보강 대기", "상권 매출 최신성 낮음"],
    nextActions: ["PNU 보강", "상권 반경 재조회", "현장 확인 후보 등록"],
    scenarios: ["리모델링", "신축"],
  },
]

function createParcelCoordinates(feature: MapFeature): [number, number][][] {
  const { lat, lng } = feature.coordinates
  const latDelta = 0.0001
  const lngDelta = 0.00013

  return [[
    [lng - lngDelta, lat + latDelta],
    [lng + lngDelta, lat + latDelta],
    [lng + lngDelta, lat - latDelta],
    [lng - lngDelta, lat - latDelta],
    [lng - lngDelta, lat + latDelta],
  ]]
}

function loadKakaoMaps() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Kakao Maps requires browser runtime"))
  }
  if (window.kakao?.maps) {
    return new Promise<typeof window.kakao.maps>((resolve) => {
      window.kakao.maps.load(() => resolve(window.kakao.maps))
    })
  }
  if (kakaoMapsPromise) return kakaoMapsPromise

  kakaoMapsPromise = fetch("/api/config/kakao-map-key", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Kakao Map API key is not configured")
      return response.json() as Promise<{ kakaoMapKey?: string }>
    })
    .then(({ kakaoMapKey }) => {
      if (!kakaoMapKey) throw new Error("Kakao Map API key is missing")

      return new Promise<typeof window.kakao.maps>((resolve, reject) => {
        const existingScript = document.getElementById("kakao-map-script") as HTMLScriptElement | null
        const finish = () => window.kakao.maps.load(() => resolve(window.kakao.maps))

        if (existingScript) {
          if (window.kakao?.maps) finish()
          else existingScript.addEventListener("load", finish, { once: true })
          return
        }

        const script = document.createElement("script")
        script.id = "kakao-map-script"
        script.async = true
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(kakaoMapKey)}&autoload=false&libraries=services`
        script.onload = finish
        script.onerror = () => reject(new Error("Kakao Maps SDK load failed"))
        document.head.appendChild(script)
      })
    })

  return kakaoMapsPromise
}

function numberValue(value: unknown) {
  const next = Number(value)
  return Number.isFinite(next) ? next : undefined
}

function textValue(value: unknown, fallback: string) {
  if (value === null || value === undefined || value === "") return fallback
  return String(value)
}

function stringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback
  const items = value.map((item) => String(item)).filter(Boolean)
  return items.length ? items : fallback
}

function dataStatus(value: unknown, fallback: DataStatus): DataStatus {
  return value === "ready" || value === "partial" || value === "queued" ? value : fallback
}

function signalStrength(value: unknown, fallback: MapFeature["signalStrength"]): MapFeature["signalStrength"] {
  return value === "strong" || value === "medium" || value === "watch" ? value : fallback
}

function statusBadge(status: DataStatus) {
  if (status === "ready") return { label: "ready", className: "border-emerald-200 bg-emerald-50 text-emerald-700" }
  if (status === "partial") return { label: "partial", className: "border-amber-200 bg-amber-50 text-amber-700" }
  return { label: "queued", className: "border-violet-200 bg-violet-50 text-violet-700" }
}

function featureFromSummary(id: string, payload: Record<string, unknown>): MapFeature {
  const fallback = mockFeatures.find((feature) => feature.featureId === id || feature.id === id || feature.pnu === id) ?? mockFeatures[0]
  const coordinates = payload.coordinates as { lat?: number; lng?: number } | undefined
  const geometry = payload.geometry as MapGeometry | undefined
  const buildingGeometry = payload.building_geometry as MapGeometry | undefined
  const buildingRegister = payload.building_register as BuildingRegister | undefined
  const featureId = textValue(payload.feature_id ?? payload.pnu ?? id, fallback.featureId)
  const areaM2 = numberValue(payload.area_m2 ?? payload.areaM2 ?? fallback.areaM2)

  return {
    ...fallback,
    id: textValue(payload.id ?? `parcel-${featureId}`, fallback.id),
    featureId,
    pnu: textValue(payload.pnu ?? featureId, fallback.pnu),
    address: textValue(payload.address, fallback.address),
    district: textValue(payload.district ?? payload.location_label, fallback.district),
    use: textValue(payload.use ?? payload.main_use ?? payload.land_category ?? payload.jimok, fallback.use),
    coordinates: {
      lat: Number(coordinates?.lat ?? payload.lat ?? fallback.coordinates.lat),
      lng: Number(coordinates?.lng ?? payload.lng ?? fallback.coordinates.lng),
    },
    price: textValue(payload.price, fallback.price),
    area: textValue(payload.area, areaM2 ? `${areaM2.toLocaleString("ko-KR")}㎡` : fallback.area),
    areaM2,
    approvalYear: numberValue(payload.approval_year ?? payload.approvalYear ?? fallback.approvalYear),
    bankability: numberValue(payload.bankability ?? payload.bankability_score) ?? fallback.bankability,
    readiness: numberValue(payload.readiness ?? payload.deal_readiness_score) ?? fallback.readiness,
    capRate: textValue(payload.cap_rate, fallback.capRate),
    dscr: textValue(payload.dscr, fallback.dscr),
    ltv: textValue(payload.ltv, fallback.ltv),
    noi: textValue(payload.noi, fallback.noi),
    equity: textValue(payload.equity, fallback.equity),
    interest: textValue(payload.interest, fallback.interest),
    maxPurchasePrice: textValue(payload.max_purchase_price ?? payload.maxPurchasePrice, fallback.maxPurchasePrice),
    locationSignal: textValue(payload.location_signal ?? payload.locationSignal, fallback.locationSignal),
    signalStrength: signalStrength(payload.signal_strength ?? payload.signalStrength, fallback.signalStrength),
    hiddenYield: textValue(payload.hidden_yield ?? payload.hiddenYield, fallback.hiddenYield),
    confidence: textValue(payload.confidence ?? payload.source_confidence, fallback.confidence),
    sourceUpdatedAt: textValue(payload.source_updated_at, fallback.sourceUpdatedAt),
    status: dataStatus(payload.status, "partial"),
    geometry: geometry?.type && geometry.coordinates ? geometry : fallback.geometry,
    buildingGeometry: buildingGeometry?.type && buildingGeometry.coordinates ? buildingGeometry : fallback.buildingGeometry,
    buildingName: textValue(payload.building_name ?? buildingRegister?.building_name, fallback.buildingName ?? "-"),
    buildingCount: numberValue(payload.building_count ?? buildingRegister?.building_count) ?? fallback.buildingCount ?? 0,
    buildingRegister,
    buildingAreaM2: numberValue(payload.building_area_m2 ?? buildingRegister?.largest_total_floor_area_m2),
    totalFloorAreaM2: numberValue(payload.total_floor_area_m2 ?? buildingRegister?.total_floor_area_m2),
    groundFloors: numberValue(payload.ground_floors ?? buildingRegister?.ground_floors),
    undergroundFloors: numberValue(payload.underground_floors ?? buildingRegister?.underground_floors),
    heightM: numberValue(payload.height_m ?? buildingRegister?.height_m),
    landValueLabel: textValue(payload.land_value_label, fallback.landValueLabel ?? "-"),
    officialLandPriceLabel: textValue(payload.official_land_price_label, fallback.officialLandPriceLabel ?? "-"),
    officialLandPricePerM2: numberValue(payload.official_land_price_per_m2),
    latestDealDate: textValue(payload.latest_deal_date, fallback.latestDealDate ?? "-"),
    transactionContext: (payload.transaction_context as Record<string, unknown> | undefined) ?? fallback.transactionContext,
    source: textValue(payload.source, fallback.source ?? "BuildMore"),
    sourceBaseDate: textValue(payload.source_base_date, fallback.sourceBaseDate ?? "-"),
    risks: stringList(payload.risks, fallback.risks),
    nextActions: stringList(payload.next_actions ?? payload.nextActions, fallback.nextActions),
    scenarios: stringList(payload.scenarios, fallback.scenarios),
  }
}

function geometryToKakaoPaths(geometry: MapGeometry | undefined, kakaoMaps: typeof window.kakao.maps) {
  if (!geometry?.coordinates) return []
  const paths: unknown[][] = []

  const addRing = (ring: unknown) => {
    if (!Array.isArray(ring)) return
    const path = ring
      .map((point) => {
        if (!Array.isArray(point) || point.length < 2) return null
        const lng = Number(point[0])
        const lat = Number(point[1])
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
        return new kakaoMaps.LatLng(lat, lng)
      })
      .filter(Boolean) as unknown[]
    if (path.length >= 3) paths.push(path)
  }

  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates)) {
    addRing(geometry.coordinates[0])
  }
  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
    geometry.coordinates.forEach((polygon) => {
      if (Array.isArray(polygon)) addRing(polygon[0])
    })
  }
  return paths
}

function compactArea(value?: number) {
  if (!value) return "-"
  return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}㎡`
}

function kakaoLatLngToPoint(latLng: KakaoLatLngLike) {
  return {
    lat: typeof latLng.getLat === "function" ? latLng.getLat() : Number(latLng.Ma ?? latLng.La),
    lng: typeof latLng.getLng === "function" ? latLng.getLng() : Number(latLng.La ?? latLng.Ma),
  }
}

function bboxFromKakaoMap(map: KakaoMapInstance) {
  const bounds = map.getBounds()
  const sw = kakaoLatLngToPoint(bounds.getSouthWest())
  const ne = kakaoLatLngToPoint(bounds.getNorthEast())
  const level = Number(map.getLevel?.() ?? mapInitialLevel)
  const zoom = Math.max(1, 22 - level)
  const bboxParam = [sw.lng, sw.lat, ne.lng, ne.lat].map((value) => value.toFixed(6)).join(",")
  return {
    swLat: sw.lat,
    swLng: sw.lng,
    neLat: ne.lat,
    neLng: ne.lng,
    zoom,
    bboxParam,
  }
}

export default function MapPage() {
  const [selected, setSelected] = useState<MapFeature>(mockFeatures[0])
  const [activeSection, setActiveSection] = useState<PanelSection>("transactions")
  const [filterOpen, setFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("map")
  const [mapFeatures, setMapFeatures] = useState<MapFeature[]>(mockFeatures)
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null)
  const [transactionFeatures, setTransactionFeatures] = useState<FeatureCollection>(emptyFeatureCollection)
  const [selectedTransactions, setSelectedTransactions] = useState<TransactionItem[]>([])
  const [regulationFeatures, setRegulationFeatures] = useState<FeatureCollection>(emptyFeatureCollection)
  const [bboxApi, setBboxApi] = useState<ApiState>({ status: "idle", count: mockFeatures.length, source: "idle" })
  const [transactionApi, setTransactionApi] = useState<MapLayerApiState>({
    status: "idle",
    count: 0,
    source: "idle",
  })
  const [regulationApi, setRegulationApi] = useState<MapLayerApiState>({ status: "idle", count: 0, source: "idle" })
  const [activeLayers, setActiveLayers] = useState<Record<LayerKey, boolean>>({
    transactions: true,
    regulations: true,
  })

  const applySelected = useCallback((feature: MapFeature) => {
    setSelected(feature)
    setMapFeatures((current) => {
      const exists = current.some((item) => item.id === feature.id || item.featureId === feature.featureId || item.pnu === feature.pnu)
      if (exists) {
        return current.map((item) =>
          item.id === feature.id || item.featureId === feature.featureId || item.pnu === feature.pnu ? feature : item
        )
      }
      return [feature, ...current].slice(0, 240)
    })
  }, [])

  const applyFeaturePayload = useCallback((payload: Record<string, unknown>) => {
    const featureId = textValue(payload.feature_id ?? payload.pnu ?? payload.id, "clicked-feature")
    applySelected(featureFromSummary(featureId, payload))
  }, [applySelected])

  const toggleLayer = (key: LayerKey) => {
    setActiveLayers((current) => ({ ...current, [key]: !current[key] }))
  }

  useEffect(() => {
    if (!mapViewport) return
    const controller = new AbortController()

    const loadViewportSignals = async () => {
      try {
        setBboxApi((current) => ({ ...current, status: "loading" }))
        setTransactionApi((current) => ({ ...current, status: "loading" }))
        setRegulationApi((current) => ({ ...current, status: "loading" }))

        const params = new URLSearchParams({
          bbox: mapViewport.bboxParam,
          level: String(Math.round(mapViewport.zoom)),
          limit: "220",
        })
        const transactionParams = new URLSearchParams({
          bbox: mapViewport.bboxParam,
          pnu: selected.pnu,
          limit: mapViewport.zoom >= 16 ? "180" : "90",
        })
        const regulationParams = new URLSearchParams({
          bbox: mapViewport.bboxParam,
          limit: "160",
        })

        const [buildingResult, transactionResult, regulationResult] = await Promise.allSettled([
          fetch(`/api/map/building-signals?${params.toString()}`, { signal: controller.signal }),
          fetch(`/api/map/transactions?${transactionParams.toString()}`, { signal: controller.signal }),
          fetch(`/api/map/regulations?${regulationParams.toString()}`, { signal: controller.signal }),
        ])

        const buildingResponse = buildingResult.status === "fulfilled" ? buildingResult.value : null
        const transactionResponse = transactionResult.status === "fulfilled" ? transactionResult.value : null
        const regulationResponse = regulationResult.status === "fulfilled" ? regulationResult.value : null
        const buildingData = buildingResponse?.ok
          ? ((await buildingResponse.json()) as { count?: number; source?: string; buildings?: Array<Record<string, unknown>>; features?: Array<Record<string, unknown>> })
          : { count: mockFeatures.length, source: "local-map-features", buildings: [] }
        const transactionData = transactionResponse?.ok
          ? ((await transactionResponse.json()) as FeatureCollection & { count?: number; source?: string; items?: TransactionItem[] })
          : emptyFeatureCollection
        const regulationData = regulationResponse?.ok
          ? ((await regulationResponse.json()) as FeatureCollection & { count?: number; source?: string })
          : emptyFeatureCollection
        const livePayloads = buildingData.buildings ?? buildingData.features ?? []
        const liveFeatures = livePayloads.map((item, index) =>
          featureFromSummary(textValue(item.feature_id ?? item.pnu ?? item.id, `bbox-${index}`), item)
        )

        if (liveFeatures.length) {
          setMapFeatures(liveFeatures)
        }
        setBboxApi({
          status: buildingResponse?.ok ? "ready" : "error",
          count: buildingData.count ?? liveFeatures.length,
          source: buildingData.source ?? "map-building-signals",
        })
        setTransactionFeatures(transactionData.features ? transactionData : emptyFeatureCollection)
        setSelectedTransactions((transactionData.items ?? []) as TransactionItem[])
        setTransactionApi({
          status: transactionResponse?.ok ? "ready" : "error",
          count: Number(transactionData.count ?? transactionData.features?.length ?? 0),
          source: transactionData.source ?? "commerce_seoul_transactions",
        })
        setRegulationFeatures(regulationData.features ? regulationData : emptyFeatureCollection)
        setRegulationApi({
          status: regulationResponse?.ok ? "ready" : "error",
          count: Number(regulationData.count ?? regulationData.features?.length ?? 0),
          source: regulationData.source ?? "map_redevelopment_zones",
        })
      } catch {
        if (controller.signal.aborted) return
        setBboxApi((current) => ({ ...current, status: "error" }))
        setTransactionApi((current) => ({ ...current, status: "error" }))
        setRegulationApi((current) => ({ ...current, status: "error" }))
      }
    }

    loadViewportSignals()
    return () => controller.abort()
  }, [mapViewport, selected.pnu])

  return (
    <main className="h-screen overflow-hidden bg-[#eef1ea] text-zinc-950">
      <section className="relative h-full w-full overflow-hidden">
        <MapSurface
          activeLayers={activeLayers}
          features={mapFeatures}
          selected={selected}
          transactionFeatures={transactionFeatures}
          regulationFeatures={regulationFeatures}
          viewMode={viewMode}
          onFeaturePayload={applyFeaturePayload}
          onViewportChange={setMapViewport}
        />

        <LeftParcelPanel
          selected={selected}
          transactions={selectedTransactions}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <div className="absolute left-[420px] top-3 z-30 flex items-center gap-2">
          <Button
            variant="outline"
            className={cn("h-12 rounded-lg border-white/80 bg-white/92 px-4 shadow-lg", filterOpen && "border-zinc-900 bg-zinc-950 text-white")}
            onClick={() => setFilterOpen((open) => !open)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            필터
          </Button>
          <div className="rounded-lg border border-white/80 bg-white/92 p-1 shadow-lg">
            <Button
              variant="ghost"
              className={cn("h-10 rounded-md px-8 text-base font-semibold", viewMode === "map" && "bg-[#0f67e8] text-white hover:bg-[#0f67e8] hover:text-white")}
              onClick={() => setViewMode("map")}
            >
              지도
            </Button>
            <Button
              variant="ghost"
              className={cn("h-10 rounded-md px-8 text-base font-semibold", viewMode === "roadview" && "bg-[#0f67e8] text-white hover:bg-[#0f67e8] hover:text-white")}
              onClick={() => setViewMode("roadview")}
            >
              로드뷰
            </Button>
          </div>
        </div>

        {filterOpen && (
          <div className="absolute left-[420px] top-[72px] z-40 w-72 rounded-lg border border-white/80 bg-white/94 p-3 shadow-xl backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">지도 레이어</p>
                <p className="text-[11px] text-zinc-500">Kakao 단일 엔진 오버레이</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setFilterOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {(Object.keys(layerLabels) as LayerKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleLayer(key)}
                  className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", layerColors[key])} />
                    {layerLabels[key]}
                  </span>
                  <span className={cn("text-xs font-semibold", activeLayers[key] ? "text-emerald-700" : "text-zinc-400")}>
                    {activeLayers[key] ? "ON" : "OFF"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-[420px] z-20 rounded-lg border border-white/70 bg-white/86 px-3 py-2 text-[11px] font-medium text-zinc-600 shadow-sm backdrop-blur">
          필지 {bboxApi.count} · 실거래 {transactionApi.count} · 정비 {regulationApi.count} · {bboxApi.status}/{transactionApi.status}/{regulationApi.status}
        </div>
      </section>
    </main>
  )
}

function MapSurface({
  activeLayers,
  features,
  selected,
  transactionFeatures,
  regulationFeatures,
  viewMode,
  onFeaturePayload,
  onViewportChange,
}: {
  activeLayers: Record<LayerKey, boolean>
  features: MapFeature[]
  selected: MapFeature
  transactionFeatures: FeatureCollection
  regulationFeatures: FeatureCollection
  viewMode: ViewMode
  onFeaturePayload: (payload: Record<string, unknown>) => void
  onViewportChange: (viewport: MapViewport) => void
}) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const roadviewRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<KakaoMapInstance | null>(null)
  const roadviewInstanceRef = useRef<KakaoRoadviewInstance | null>(null)
  const roadviewClientRef = useRef<KakaoRoadviewClient | null>(null)
  const roadviewOverlayRef = useRef<KakaoOverlay | null>(null)
  const overlaysRef = useRef<KakaoOverlay[]>([])
  const featuresRef = useRef(features)
  const selectedRef = useRef(selected)
  const transactionFeaturesRef = useRef(transactionFeatures)
  const regulationFeaturesRef = useRef(regulationFeatures)
  const activeLayersRef = useRef(activeLayers)
  const viewModeRef = useRef(viewMode)
  const onFeaturePayloadRef = useRef(onFeaturePayload)
  const onViewportChangeRef = useRef(onViewportChange)
  const [message, setMessage] = useState("Kakao 지도 준비 중")
  const [roadviewActive, setRoadviewActive] = useState(false)

  useEffect(() => {
    featuresRef.current = features
    selectedRef.current = selected
    transactionFeaturesRef.current = transactionFeatures
    regulationFeaturesRef.current = regulationFeatures
    activeLayersRef.current = activeLayers
    viewModeRef.current = viewMode
    onFeaturePayloadRef.current = onFeaturePayload
    onViewportChangeRef.current = onViewportChange
  }, [activeLayers, features, onFeaturePayload, onViewportChange, selected, transactionFeatures, regulationFeatures, viewMode])

  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach((overlay) => overlay.setMap(null))
    overlaysRef.current = []
  }, [])

  const publishViewport = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map) return
    onViewportChangeRef.current(bboxFromKakaoMap(map))
  }, [])

  const drawOverlays = useCallback(() => {
    const kakaoMaps = window.kakao?.maps
    const map = mapInstanceRef.current
    if (!kakaoMaps || !map) return

    clearOverlays()
    const layers = activeLayersRef.current
    const selectedFeature = selectedRef.current

    if (layers.regulations) {
      regulationFeaturesRef.current.features.slice(0, 160).forEach((feature) => {
        const geometry = feature.geometry as MapGeometry | undefined
        geometryToKakaoPaths(geometry, kakaoMaps).forEach((path) => {
          const polygon = new kakaoMaps.Polygon({
            map,
            path,
            strokeWeight: 2.5,
            strokeColor: "#f59e0b",
            strokeOpacity: 0.78,
            fillColor: "#fbbf24",
            fillOpacity: 0.13,
            zIndex: 18,
          }) as KakaoOverlay
          overlaysRef.current.push(polygon)
        })
      })
    }

    const drawable = featuresRef.current.filter((feature) => feature.geometry || feature.id === selectedFeature.id)
    drawable.slice(0, 220).forEach((feature) => {
      const isSelected = feature.id === selectedFeature.id || feature.featureId === selectedFeature.featureId || feature.pnu === selectedFeature.pnu
      const geometry = feature.geometry ?? { type: "Polygon", coordinates: createParcelCoordinates(feature) }
      geometryToKakaoPaths(geometry, kakaoMaps).forEach((path) => {
        const polygon = new kakaoMaps.Polygon({
          map,
          path,
          strokeWeight: isSelected ? 3 : 1.3,
          strokeColor: isSelected ? "#0284c7" : "#38bdf8",
          strokeOpacity: isSelected ? 0.95 : 0.32,
          strokeStyle: isSelected ? "shortdash" : "solid",
          fillColor: "#38bdf8",
          fillOpacity: isSelected ? 0.24 : 0.025,
          zIndex: isSelected ? 45 : 20,
        }) as KakaoOverlay
        overlaysRef.current.push(polygon)
      })
    })

    geometryToKakaoPaths(selectedFeature.buildingGeometry, kakaoMaps).forEach((path) => {
      const polygon = new kakaoMaps.Polygon({
        map,
        path,
        strokeWeight: 3,
        strokeColor: "#2563eb",
        strokeOpacity: 0.95,
        fillColor: "#60a5fa",
        fillOpacity: 0.28,
        zIndex: 55,
      }) as KakaoOverlay
      overlaysRef.current.push(polygon)
    })

    if (layers.transactions) {
      transactionFeaturesRef.current.features.slice(0, 140).forEach((feature) => {
        const geometry = feature.geometry as { type?: string; coordinates?: unknown } | undefined
        const coords = geometry?.coordinates
        if (!Array.isArray(coords) || coords.length < 2) return
        const lng = Number(coords[0])
        const lat = Number(coords[1])
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
        const props = (feature.properties ?? {}) as Record<string, unknown>
        const content = document.createElement("div")
        content.className = "rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-center text-[11px] font-bold leading-tight text-indigo-600 shadow-md"
        content.innerHTML = `${escapeHtml(props.amount_label ?? "-")}<br><span style="font-weight:600;color:#64748b">${escapeHtml(props.deal_date_label ?? "-")}</span>`
        const overlay = new kakaoMaps.CustomOverlay({
          position: new kakaoMaps.LatLng(lat, lng),
          content,
          yAnchor: 1,
          zIndex: 35,
        }) as KakaoOverlay
        overlay.setMap(map)
        overlaysRef.current.push(overlay)
      })
    }
  }, [clearOverlays])

  const hitTestParcel = useCallback(async (lat: number, lng: number) => {
    try {
      setMessage("클릭 좌표에서 필지 조회 중")
      const response = await fetch(`/api/map/feature-at?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`, {
        cache: "no-store",
      })
      if (!response.ok) {
        setMessage("해당 좌표의 필지를 찾지 못했습니다")
        return
      }
      const payload = (await response.json()) as Record<string, unknown>
      onFeaturePayloadRef.current(payload)
      setMessage("필지/건물 경계 강조")
    } catch {
      setMessage("필지 hit-test API 연결 대기")
    }
  }, [])

  const openRoadviewAt = useCallback((position: unknown) => {
    const roadview = roadviewInstanceRef.current
    const client = roadviewClientRef.current
    if (!roadview || !client) return

    setMessage("근처 로드뷰 탐색 중")
    client.getNearestPanoId(position, 80, (panoId: number | null) => {
      if (!panoId) {
        setMessage("반경 80m 안에 로드뷰가 없습니다")
        return
      }
      roadview.setPanoId(panoId, position)
      setRoadviewActive(true)
      window.setTimeout(() => roadview.relayout?.(), 120)
      setMessage("로드뷰 표시 중")
    })
  }, [])

  useEffect(() => {
    if (!mapRef.current || !roadviewRef.current || mapInstanceRef.current) return

    let cancelled = false
    let idleHandler: KakaoEventHandler | null = null
    let clickHandler: KakaoEventHandler | null = null

    const initMap = async () => {
      try {
        const [kakaoMaps, configResponse] = await Promise.all([
          loadKakaoMaps(),
          fetch("/api/config/map-tiles", { cache: "no-store" }).catch(() => null),
        ])
        const config = configResponse?.ok ? ((await configResponse.json()) as MapConfig) : null
        if (cancelled || !mapRef.current || !roadviewRef.current) return

        const level = Math.max(1, Math.min(8, 18 - (config?.defaultZoom ?? 15))) || mapInitialLevel
        const map = new kakaoMaps.Map(mapRef.current, {
          center: new kakaoMaps.LatLng(selectedRef.current.coordinates.lat, selectedRef.current.coordinates.lng),
          level: Math.max(1, Math.min(8, level)),
        }) as KakaoMapInstance
        mapInstanceRef.current = map
        map.addControl(new kakaoMaps.ZoomControl(), kakaoMaps.ControlPosition.RIGHT)

        roadviewInstanceRef.current = new kakaoMaps.Roadview(roadviewRef.current) as KakaoRoadviewInstance
        roadviewClientRef.current = new kakaoMaps.RoadviewClient() as KakaoRoadviewClient
        roadviewOverlayRef.current = new kakaoMaps.RoadviewOverlay() as KakaoOverlay

        idleHandler = () => {
          publishViewport()
          drawOverlays()
        }
        clickHandler = (eventValue: unknown) => {
          const event = eventValue as KakaoClickEvent
          const point = kakaoLatLngToPoint(event.latLng)
          if (viewModeRef.current === "roadview") {
            openRoadviewAt(event.latLng)
            return
          }
          void hitTestParcel(point.lat, point.lng)
        }

        kakaoMaps.event.addListener(map, "idle", idleHandler)
        kakaoMaps.event.addListener(map, "click", clickHandler)
        publishViewport()
        drawOverlays()
        setMessage("Kakao 단일 지도 · 필지 클릭 준비")
      } catch {
        setMessage("Kakao 지도 로딩 실패")
      }
    }

    initMap()
    return () => {
      cancelled = true
      const kakaoMaps = window.kakao?.maps
      if (kakaoMaps && mapInstanceRef.current) {
        if (idleHandler) kakaoMaps.event.removeListener(mapInstanceRef.current, "idle", idleHandler)
        if (clickHandler) kakaoMaps.event.removeListener(mapInstanceRef.current, "click", clickHandler)
      }
      roadviewOverlayRef.current?.setMap(null)
      clearOverlays()
      mapInstanceRef.current = null
    }
  }, [clearOverlays, drawOverlays, hitTestParcel, openRoadviewAt, publishViewport])

  useEffect(() => {
    drawOverlays()
  }, [activeLayers, drawOverlays, features, selected, transactionFeatures, regulationFeatures])

  useEffect(() => {
    const map = mapInstanceRef.current
    const overlay = roadviewOverlayRef.current
    if (!map || !overlay) return

    if (viewMode === "roadview") {
      overlay.setMap(map)
      window.setTimeout(() => setMessage(roadviewActive ? "로드뷰 표시 중" : "파란 로드뷰 노선을 클릭하세요"), 0)
    } else {
      overlay.setMap(null)
      window.setTimeout(() => {
        setRoadviewActive(false)
        setMessage("Kakao 단일 지도 · 필지 클릭 준비")
      }, 0)
    }
  }, [roadviewActive, viewMode])

  useEffect(() => {
    if (!roadviewActive) return
    window.setTimeout(() => roadviewInstanceRef.current?.relayout?.(), 120)
  }, [roadviewActive])

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#eef1ea]">
      <div ref={mapRef} className="absolute inset-0" />
      <div
        ref={roadviewRef}
        className={cn(
          "absolute inset-0 z-20 bg-zinc-900 transition-opacity",
          roadviewActive && viewMode === "roadview" ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <div className="absolute left-[420px] top-[76px] z-30 rounded-lg border border-white/80 bg-white/88 px-3 py-2 text-xs font-semibold text-zinc-700 shadow-lg backdrop-blur">
        <span className="inline-flex items-center gap-2">
          {viewMode === "roadview" ? <Navigation className="h-3.5 w-3.5 text-[#0f67e8]" /> : <MapIcon className="h-3.5 w-3.5 text-[#0f67e8]" />}
          {message}
        </span>
      </div>

      {roadviewActive && viewMode === "roadview" && (
        <Button
          className="absolute right-5 top-5 z-40 h-10 rounded-lg bg-zinc-950 text-white shadow-lg hover:bg-zinc-800"
          onClick={() => {
            setRoadviewActive(false)
            setMessage("파란 로드뷰 노선을 클릭하세요")
          }}
        >
          <MapIcon className="h-4 w-4" />
          지도에서 다시 선택
        </Button>
      )}
    </div>
  )
}

function LeftParcelPanel({
  selected,
  transactions,
  activeSection,
  onSectionChange,
}: {
  selected: MapFeature
  transactions: TransactionItem[]
  activeSection: PanelSection
  onSectionChange: (section: PanelSection) => void
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [transactionMode, setTransactionMode] = useState<"sale" | "jeonse" | "rent">("sale")
  const sectionRefs = useRef<Record<PanelSection, HTMLElement | null>>({
    transactions: null,
    land: null,
    building: null,
    analysis: null,
  })
  const status = statusBadge(selected.status)
  const visibleTransactions = transactionMode === "sale" ? transactions : []
  const latestTransaction = visibleTransactions[0]

  const scrollToSection = (section: PanelSection) => {
    onSectionChange(section)
    const container = scrollRef.current
    const target = sectionRefs.current[section]
    if (!container || !target) return
    container.scrollTo({
      top: target.offsetTop - 8,
      behavior: "smooth",
    })
  }

  return (
    <aside className="absolute bottom-0 left-0 top-0 z-40 flex w-[396px] flex-col border-r border-zinc-200 bg-white shadow-2xl">
      <div className="shrink-0 border-b border-zinc-200">
        <div className="flex h-16 items-center gap-3 px-4">
          <Link href="/analysis" className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100" aria-label="분석으로 이동">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-950">{selected.address}</p>
            <p className="truncate text-xs text-zinc-500">{selected.district} · {selected.use}</p>
          </div>
          <Badge className={cn("rounded-md border px-2 py-1 text-xs", status.className)}>{status.label}</Badge>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input value={selected.pnu} readOnly className="h-10 rounded-lg border-zinc-200 bg-zinc-50 pl-9 text-xs" aria-label="선택 필지 PNU" />
          </div>
        </div>
        <div className="grid grid-cols-4 border-t border-zinc-200">
          {[
            ["transactions", "실거래가"],
            ["land", "토지"],
            ["building", "건물"],
            ["analysis", "빌드모어분석"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => scrollToSection(key as PanelSection)}
              className={cn(
                "h-11 border-r border-zinc-200 text-sm font-semibold last:border-r-0",
                activeSection === key ? "bg-[#0f67e8] text-white" : "bg-white text-zinc-700 hover:bg-zinc-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-white">
        <section
          ref={(node) => {
            sectionRefs.current.transactions = node
          }}
          className="border-b-8 border-zinc-100 px-5 py-5"
        >
          <SectionTitle icon={CircleDollarSign} title="실거래가" />
          <div className="mb-4 grid grid-cols-3 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
            {[
              ["sale", "매매"],
              ["jeonse", "전세"],
              ["rent", "월세"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTransactionMode(key as "sale" | "jeonse" | "rent")}
                className={cn(
                  "h-10 rounded-md text-sm font-semibold",
                  transactionMode === key ? "bg-[#0f67e8] text-white shadow-sm" : "text-zinc-700 hover:bg-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mb-4 grid grid-cols-[1fr_120px] gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-500">최근 실거래가</p>
              <p className="mt-1 text-2xl font-extrabold text-[#0f67e8]">{latestTransaction?.amount_label ?? "-"}</p>
              <p className="mt-1 text-sm font-medium text-zinc-500">{latestTransaction?.deal_date_label ?? "거래내역 없음"}</p>
            </div>
            <button
              type="button"
              className="h-14 self-end rounded-lg border border-zinc-200 bg-white text-sm font-bold text-zinc-500"
            >
              타입면적
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-950">거래내역 ({visibleTransactions.length}건)</h3>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700">총액</span>
          </div>
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <div className="grid grid-cols-[86px_1fr_74px_40px] bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-500">
              <span>거래일</span>
              <span>거래금액</span>
              <span>층/면적</span>
              <span />
            </div>
            {visibleTransactions.length ? (
              visibleTransactions.slice(0, 8).map((transaction) => (
                <div
                  key={`${transaction.transaction_id ?? transaction.id}-${transaction.deal_date}`}
                  className="grid grid-cols-[86px_1fr_74px_40px] items-center border-t border-zinc-100 px-3 py-3 text-sm"
                >
                  <span className="font-semibold text-zinc-700">{transaction.deal_date_label ?? "-"}</span>
                  <span className="font-bold text-zinc-950">{transaction.amount_label ?? "-"}</span>
                  <span className="text-xs font-medium text-zinc-500">
                    {transaction.floor ? `${transaction.floor}층` : "-"} · {compactArea(transaction.arch_area_m2 ?? undefined)}
                  </span>
                  <span className="rounded-md bg-zinc-200 px-1.5 py-1 text-center text-[11px] font-bold text-zinc-600">등기</span>
                </div>
              ))
            ) : (
              <div className="border-t border-zinc-100 px-3 py-10 text-center text-sm font-medium text-zinc-400">
                표시할 실거래가 없습니다.
              </div>
            )}
          </div>

          <div className="mt-5 rounded-lg bg-slate-50 px-4 py-4">
            <p className="text-sm font-bold text-zinc-950">우리동네 중개사</p>
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200 text-sm font-bold text-slate-600">BM</div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-zinc-950">BuildMore 인증 중개사</p>
                <p className="truncate text-xs text-zinc-500">실거래 및 현장 확인 연결 준비</p>
              </div>
              <button type="button" className="h-10 rounded-lg bg-[#0f67e8] px-3 text-sm font-bold text-white">
                연결
              </button>
            </div>
          </div>
        </section>

        <section
          ref={(node) => {
            sectionRefs.current.land = node
          }}
          className="border-b-8 border-zinc-100 px-5 py-5"
        >
          <SectionTitle icon={Ruler} title="토지 정보" />
          <InfoRows
            rows={[
              ["면적", selected.area],
              ["지목", selected.use],
              ["토지가액", selected.landValueLabel ?? selected.price],
              ["공시지가", selected.officialLandPriceLabel ?? "-"],
              ["PNU", selected.pnu],
              ["자료 기준", selected.sourceBaseDate ?? selected.sourceUpdatedAt],
              ["출처", selected.source ?? "BuildMore"],
            ]}
          />
        </section>

        <section
          ref={(node) => {
            sectionRefs.current.building = node
          }}
          className="border-b-8 border-zinc-100 px-5 py-5"
        >
          <SectionTitle icon={Building2} title="건물 정보" />
          <div className="mb-3 rounded-lg bg-[#0f67e8] px-4 py-3 text-white">
            <p className="text-xs font-semibold opacity-80">건축물대장 선택</p>
            <p className="mt-1 text-lg font-bold">{selected.buildingName && selected.buildingName !== "-" ? selected.buildingName : selected.address.split(" ").slice(-1)[0]}</p>
            <p className="text-xs font-medium opacity-85">{selected.buildingCount || 0}개 동 · 사용승인 {selected.approvalYear ?? "-"}</p>
          </div>
          <InfoRows
            rows={[
              ["건물명", selected.buildingName ?? "-"],
              ["주용도", selected.buildingRegister?.use_code ?? selected.use],
              ["구조", selected.buildingRegister?.structure_code ?? "-"],
              ["높이", selected.heightM ? `${selected.heightM}m` : "-"],
              ["지상/지하", `${selected.groundFloors ?? "-"} / ${selected.undergroundFloors ?? "-"}`],
              ["대지면적", compactArea(selected.areaM2)],
              ["건축면적", compactArea(selected.buildingAreaM2)],
              ["연면적", compactArea(selected.totalFloorAreaM2)],
              ["사용승인", selected.buildingRegister?.latest_use_approval_date ?? selected.approvalYear ?? "-"],
            ]}
          />
        </section>

        <section
          ref={(node) => {
            sectionRefs.current.analysis = node
          }}
          className="px-5 py-5"
        >
          <SectionTitle icon={Sparkles} title="빌드모어분석" />
          <div className="grid grid-cols-2 gap-2">
            <CoreMetric icon={ShieldCheck} label="Bankability" value={`${selected.bankability}`} />
            <CoreMetric icon={Activity} label="Readiness" value={`${selected.readiness}`} />
            <CoreMetric icon={BarChart3} label="NOI" value={selected.noi} />
            <CoreMetric icon={CircleDollarSign} label="Equity" value={selected.equity} />
            <CoreMetric icon={Database} label="DSCR/LTV" value={`${selected.dscr}/${selected.ltv}`} />
            <CoreMetric icon={Store} label="Cap" value={selected.capRate} />
          </div>

          <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-sky-900">{selected.locationSignal}</span>
              <span className="text-sky-700">신뢰도 {selected.confidence}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-sky-800">{selected.hiddenYield}</p>
          </div>

          <PanelList
            icon={TriangleAlert}
            title="리스크"
            items={selected.risks}
            className="mt-4"
          />
          <PanelList
            icon={CheckCircle2}
            title="다음 액션"
            items={selected.nextActions}
            className="mt-4"
            ordered
          />
        </section>
      </div>
    </aside>
  )
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Ruler; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-zinc-700" />
      <h2 className="text-lg font-bold text-zinc-950">{title}</h2>
    </div>
  )
}

function InfoRows({ rows }: { rows: Array<[string, string | number | null | undefined]> }) {
  return (
    <div className="divide-y divide-zinc-200 border-y border-zinc-200">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[112px_1fr] gap-3 py-3 text-sm">
          <div className="font-medium text-slate-500">{label}</div>
          <div className="min-w-0 text-right font-semibold text-zinc-950">{value ?? "-"}</div>
        </div>
      ))}
    </div>
  )
}

function CoreMetric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-bold text-zinc-950">{value}</p>
    </div>
  )
}

function PanelList({
  icon: Icon,
  title,
  items,
  className,
  ordered,
}: {
  icon: typeof TriangleAlert
  title: string
  items: string[]
  className?: string
  ordered?: boolean
}) {
  return (
    <div className={cn("rounded-lg border border-zinc-200 bg-white p-3", className)}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-zinc-700" />
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <div className="space-y-1.5 text-xs text-zinc-700">
        {items.map((item, index) => (
          <div key={item} className="flex items-center gap-2 rounded-md bg-zinc-50 px-2.5 py-2">
            {ordered && (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
                {index + 1}
              </span>
            )}
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const escaped: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return escaped[char] ?? char
  })
}
