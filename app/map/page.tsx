"use client"

import "maplibre-gl/dist/maplibre-gl.css"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent } from "react"
import Link from "next/link"
import maplibregl from "maplibre-gl"
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl"
import { Protocol } from "pmtiles"
import {
  Activity,
  BarChart3,
  Building2,
  ChevronRight,
  CircleDollarSign,
  Database,
  FileText,
  Layers,
  MessageSquareText,
  Save,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type DataStatus = "ready" | "partial" | "queued"

type MapGeometry = {
  type: string
  coordinates: unknown
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
  approvalYear: number
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
  risks: string[]
  nextActions: string[]
  scenarios: string[]
}

type LayerKey = "parcels" | "transactions" | "regulations"
type PromptKey = "bankability" | "price" | "location" | "risk"

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
  tilesBaseUrl: string
  styleUrl: string
  tilesetVersion: string
  defaultCenter: [number, number]
  defaultZoom: number
  minZoom: number
  maxZoom: number
  status: string
}

type NaverMapConfig = {
  naverMapClientId: string
  customStyleId: string | null
}

type NaverLatLng = {
  lat: () => number
  lng: () => number
}

type NaverMapInstance = {
  setCenter: (center: NaverLatLng) => void
  setZoom: (zoom: number) => void
  getZoom: () => number
  relayout?: () => void
  destroy?: () => void
}

type NaverMapsNamespace = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => NaverMapInstance
  LatLng: new (lat: number, lng: number) => NaverLatLng
}

declare global {
  interface Window {
    naver?: {
      maps: NaverMapsNamespace
    }
  }
}

type BboxApiState = {
  status: "idle" | "loading" | "ready" | "error"
  count: number
  bboxLabel: string
  source: string
}

const mapCenter = { lat: 37.5523, lng: 126.9139 }
const selectedSourceId = "bm-selected-feature"

let pmtilesProtocolRegistered = false
let naverMapsLoadPromise: Promise<NaverMapsNamespace> | null = null

const vworldTileProxyBaseUrl = (
  process.env.NEXT_PUBLIC_MAP_VWORLD_TILE_PROXY_BASE_URL || "/api/map/vworld/base"
).replace(/\/+$/, "")
const vworldBaseTiles = [`${vworldTileProxyBaseUrl}/{z}/{y}/{x}.png`]

const layerLabels: Record<LayerKey, string> = {
  parcels: "필지 경계",
  transactions: "실거래",
  regulations: "규제/정비",
}

const promptLabels: Record<PromptKey, string> = {
  bankability: "은행 대출 가능성",
  price: "매입가 협상 여지",
  location: "상업축/배후세대",
  risk: "먼저 봐야 할 리스크",
}

const layerColors: Record<LayerKey, string> = {
  parcels: "bg-zinc-700",
  transactions: "bg-sky-500",
  regulations: "bg-amber-500",
}

const mockFeatures: MapFeature[] = [
  {
    id: "bm-map-001",
    featureId: "parcel-mapo-001",
    pnu: "1144012400104140016",
    address: "서울 마포구 합정동 414-16",
    district: "합정역 6번 출구권",
    use: "근린생활시설",
    coordinates: { lat: 37.5496, lng: 126.9142 },
    price: "52.8억",
    area: "대지 142㎡",
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
    locationSignal: "가로주택정비 180m",
    signalStrength: "strong",
    hiddenYield: "검토 가능",
    confidence: "중상",
    sourceUpdatedAt: "2026.06.09",
    status: "ready",
    risks: ["임대료 표본 6건", "인허가 보수 반영 필요"],
    nextActions: ["임대차 명세 확인", "최근 거래 12개월 비교", "은행 제출 메모 초안"],
    scenarios: ["리모델링", "증축"],
  },
  {
    id: "bm-map-002",
    featureId: "parcel-mapo-002",
    pnu: "1144012000103570001",
    address: "서울 마포구 서교동 357-1",
    district: "홍대입구 배후상권",
    use: "상업/업무",
    coordinates: { lat: 37.5562, lng: 126.9235 },
    price: "64.5억",
    area: "대지 171㎡",
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
    locationSignal: "역세권 통합기획 520m",
    signalStrength: "medium",
    hiddenYield: "검증 필요",
    confidence: "중간",
    sourceUpdatedAt: "2026.06.09",
    status: "partial",
    risks: ["공실률 보정 필요", "최근 고가 거래 영향"],
    nextActions: ["공실 임대료 재산정", "대출한도 보수 시나리오", "매입가 하향 기준 산출"],
    scenarios: ["유지보수", "리모델링"],
  },
  {
    id: "bm-map-003",
    featureId: "parcel-mapo-003",
    pnu: "1144012300103990004",
    address: "서울 마포구 망원동 399-4",
    district: "망리단길 생활상권",
    use: "제2종근린생활시설",
    coordinates: { lat: 37.5551, lng: 126.9064 },
    price: "41.8억",
    area: "대지 132㎡",
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
    locationSignal: "모아타운 후보지 310m",
    signalStrength: "watch",
    hiddenYield: "근거 부족",
    confidence: "보강 필요",
    sourceUpdatedAt: "분석 대기",
    status: "queued",
    risks: ["좌표 보강 대기", "상권 매출 최신성 낮음"],
    nextActions: ["PNU 보강", "상권 반경 재조회", "현장 확인 후보 등록"],
    scenarios: ["리모델링", "신축"],
  },
]

const transactions = [
  { label: "2026.06", value: "58.2억", coordinates: [126.9168, 37.552] },
  { label: "2026.05", value: "50.1억", coordinates: [126.9108, 37.5486] },
  { label: "2026.04", value: "62.0억", coordinates: [126.9216, 37.5576] },
  { label: "2026.03", value: "45.6억", coordinates: [126.9068, 37.5535] },
]

function registerPmtilesProtocol() {
  if (pmtilesProtocolRegistered || typeof window === "undefined") return
  const protocol = new Protocol()
  maplibregl.addProtocol("pmtiles", protocol.tile)
  pmtilesProtocolRegistered = true
}

function loadNaverMaps(clientId: string) {
  if (typeof window === "undefined") return Promise.reject(new Error("Naver Maps requires a browser"))
  if (window.naver?.maps) return Promise.resolve(window.naver.maps)
  if (naverMapsLoadPromise) return naverMapsLoadPromise

  naverMapsLoadPromise = new Promise<NaverMapsNamespace>((resolve, reject) => {
    const existingScript = document.getElementById("naver-maps-sdk") as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.naver?.maps) resolve(window.naver.maps)
        else reject(new Error("Naver Maps SDK loaded without maps namespace"))
      })
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Naver Maps SDK")))
      return
    }

    const script = document.createElement("script")
    script.id = "naver-maps-sdk"
    script.async = true
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}&submodules=gl`
    script.onload = () => {
      if (window.naver?.maps) resolve(window.naver.maps)
      else reject(new Error("Naver Maps SDK loaded without maps namespace"))
    }
    script.onerror = () => reject(new Error("Failed to load Naver Maps SDK"))
    document.head.appendChild(script)
  })

  return naverMapsLoadPromise
}

function fallbackStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      "buildmore-parcels": {
        type: "vector",
        tiles: ["/api/map/tiles/cadastral/{z}/{x}/{y}.pbf"],
        minzoom: 13,
        maxzoom: 17,
        attribution: "BuildMore PostGIS",
      },
    },
    layers: [
      {
        id: "buildmore-parcels-line",
        type: "line",
        source: "buildmore-parcels",
        "source-layer": "parcels",
        minzoom: 13,
        paint: {
          "line-color": "#334155",
          "line-width": ["interpolate", ["linear"], ["zoom"], 13, 0.25, 16, 0.45, 17, 0.7],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0.22, 16, 0.34, 17, 0.46],
        },
      },
    ],
  }
}

function normalizeOverlayStyle(style: StyleSpecification): StyleSpecification {
  const sources = { ...(style.sources ?? {}) } as NonNullable<StyleSpecification["sources"]>
  Object.entries(sources).forEach(([sourceId, source]) => {
    if (source && source.type === "raster") {
      delete sources[sourceId]
    }
  })

  return {
    ...style,
    sources,
    layers: style.layers
      .filter((layer) => layer.type !== "background" && layer.type !== "raster") as StyleSpecification["layers"],
  }
}

function ensureFallbackRasterBase(map: MapLibreMap | null) {
  if (!map?.isStyleLoaded()) return
  if (!map.getSource("vworld-fallback-base")) {
    map.addSource("vworld-fallback-base", {
      type: "raster",
      tiles: vworldBaseTiles,
      tileSize: 256,
      maxzoom: 19,
      attribution: "VWorld",
    })
  }
  if (!map.getLayer("vworld-fallback-base")) {
    map.addLayer(
      {
        id: "vworld-fallback-base",
        type: "raster",
        source: "vworld-fallback-base",
        paint: {
          "raster-saturation": -0.18,
          "raster-contrast": -0.05,
          "raster-opacity": 0.92,
          "raster-resampling": "linear",
        },
      },
      map.getStyle().layers[0]?.id
    )
  }
}

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

function mockParcelsGeojson(features: MapFeature[] = mockFeatures) {
  return {
    type: "FeatureCollection",
    features: features.map((feature) => ({
      type: "Feature",
      properties: {
        buildingId: feature.id,
        feature_id: feature.featureId,
        pnu: feature.pnu,
        address: feature.address,
        buildmore_class: feature.use,
        confidence: feature.confidence,
      },
      geometry: feature.geometry ?? {
        type: "Polygon",
        coordinates: createParcelCoordinates(feature),
      },
    })),
  }
}

function mockTransactionsGeojson() {
  return {
    type: "FeatureCollection",
    features: transactions.map((item) => ({
      type: "Feature",
      properties: {
        label: item.label,
        value: item.value,
      },
      geometry: {
        type: "Point",
        coordinates: item.coordinates,
      },
    })),
  }
}

function selectedFeatureGeojson(selected: MapFeature) {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          feature_id: selected.featureId,
          pnu: selected.pnu,
        },
        geometry: selected.geometry ?? {
          type: "Polygon",
          coordinates: createParcelCoordinates(selected),
        },
      },
    ],
  }
}

function statusBadge(status: DataStatus) {
  if (status === "ready") {
    return { label: "ready", className: "border-emerald-200 bg-emerald-50 text-emerald-700" }
  }
  if (status === "partial") {
    return { label: "partial", className: "border-amber-200 bg-amber-50 text-amber-700" }
  }
  return { label: "queued", className: "border-violet-200 bg-violet-50 text-violet-700" }
}

function signalTone(signal: MapFeature["signalStrength"]) {
  if (signal === "strong") return "border-amber-300 bg-amber-50 text-amber-800"
  if (signal === "medium") return "border-sky-300 bg-sky-50 text-sky-800"
  return "border-violet-300 bg-violet-50 text-violet-800"
}

function mockLlmAnswer(selected: MapFeature, prompt: PromptKey) {
  if (prompt === "price") {
    return `희망가 ${selected.price}는 보수 산정가 ${selected.maxPurchasePrice} 대비 높게 보입니다. DSCR ${selected.dscr}, 월 이자 ${selected.interest}를 맞추려면 매입가 조정 또는 자기자본 확대가 먼저 필요합니다.`
  }
  if (prompt === "location") {
    return `${selected.district}은 ${selected.locationSignal} 신호가 있고, ${selected.hiddenYield} 단계입니다. 현재 지도에서는 상호명보다 필지, 상업축, 배후 주거, 최근 거래 밀도를 우선 읽는 구조로 전환했습니다.`
  }
  if (prompt === "risk") {
    return `우선 리스크는 ${selected.risks.join(", ")}입니다. 은행 제출 전에는 임대차 명세, 최근 실거래 비교, 좌표/PNU confidence를 보강해야 합니다.`
  }
  return `${selected.address}의 Bankability는 ${selected.bankability}점입니다. 핵심 근거는 DSCR ${selected.dscr}, LTV ${selected.ltv}, NOI ${selected.noi}, cap rate ${selected.capRate}이며 추천 시나리오는 ${selected.scenarios.join(" / ")}입니다.`
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

function featureFromSummary(id: string, payload: Record<string, unknown>): MapFeature {
  const fallback = mockFeatures.find((feature) => feature.featureId === id || feature.id === id) ?? mockFeatures[0]
  const coordinates = payload.coordinates as { lat?: number; lng?: number } | undefined
  const geometry = payload.geometry as MapGeometry | undefined

  return {
    ...fallback,
    id: String(payload.id ?? payload.building_id ?? id),
    featureId: String(payload.feature_id ?? id),
    pnu: String(payload.pnu ?? fallback.pnu),
    address: String(payload.address ?? fallback.address),
    district: String(payload.district ?? payload.location_label ?? fallback.district),
    use: String(payload.use ?? payload.main_use ?? payload.land_category ?? payload.jimok ?? fallback.use),
    coordinates: {
      lat: Number(coordinates?.lat ?? payload.lat ?? fallback.coordinates.lat),
      lng: Number(coordinates?.lng ?? payload.lng ?? fallback.coordinates.lng),
    },
    price: String(payload.price ?? fallback.price),
    area: String(payload.area ?? fallback.area),
    areaM2: Number(payload.area_m2 ?? payload.areaM2 ?? fallback.areaM2 ?? 0) || undefined,
    approvalYear: Number(payload.approval_year ?? payload.approvalYear ?? fallback.approvalYear),
    bankability: Number(payload.bankability ?? payload.bankability_score ?? fallback.bankability),
    readiness: Number(payload.readiness ?? payload.deal_readiness_score ?? fallback.readiness),
    capRate: String(payload.cap_rate ?? fallback.capRate),
    dscr: String(payload.dscr ?? fallback.dscr),
    ltv: String(payload.ltv ?? fallback.ltv),
    noi: String(payload.noi ?? fallback.noi),
    equity: String(payload.equity ?? fallback.equity),
    interest: String(payload.interest ?? fallback.interest),
    maxPurchasePrice: String(payload.max_purchase_price ?? payload.maxPurchasePrice ?? fallback.maxPurchasePrice),
    locationSignal: String(payload.location_signal ?? payload.locationSignal ?? fallback.locationSignal),
    signalStrength: signalStrength(payload.signal_strength ?? payload.signalStrength, fallback.signalStrength),
    hiddenYield: String(payload.hidden_yield ?? payload.hiddenYield ?? fallback.hiddenYield),
    confidence: String(payload.confidence ?? payload.source_confidence ?? fallback.confidence),
    sourceUpdatedAt: String(payload.source_updated_at ?? fallback.sourceUpdatedAt),
    status: dataStatus(payload.status, "partial"),
    geometry: geometry?.type && geometry.coordinates ? geometry : fallback.geometry,
    risks: stringList(payload.risks, fallback.risks),
    nextActions: stringList(payload.next_actions ?? payload.nextActions, fallback.nextActions),
    scenarios: stringList(payload.scenarios, fallback.scenarios),
  }
}

export default function MapPage() {
  const [selected, setSelected] = useState<MapFeature>(mockFeatures[0])
  const [statusOpen, setStatusOpen] = useState(false)
  const [capsuleOpen, setCapsuleOpen] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const [activePrompt, setActivePrompt] = useState<PromptKey>("bankability")
  const [selectedScenario, setSelectedScenario] = useState(mockFeatures[0].scenarios[0])
  const [savedIds, setSavedIds] = useState<string[]>([mockFeatures[0].id])
  const [viewedFeatureIds, setViewedFeatureIds] = useState<string[]>(mockFeatures.map((feature) => feature.id))
  const [mapFeatures, setMapFeatures] = useState<MapFeature[]>(mockFeatures)
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null)
  const [bboxApi, setBboxApi] = useState<BboxApiState>({
    status: "idle",
    count: mockFeatures.length,
    bboxLabel: "bbox 대기",
    source: "maplibre-local",
  })
  const [activeLayers, setActiveLayers] = useState<Record<LayerKey, boolean>>({
    parcels: true,
    transactions: true,
    regulations: true,
  })

  const selectedStatus = statusBadge(selected.status)
  const isSaved = savedIds.includes(selected.id)
  const viewedFeatures = useMemo(
    () =>
      viewedFeatureIds
        .map((id) => (id === selected.id ? selected : mapFeatures.find((feature) => feature.id === id) ?? mockFeatures.find((feature) => feature.id === id)))
        .filter((feature): feature is MapFeature => Boolean(feature)),
    [mapFeatures, selected, viewedFeatureIds]
  )

  const toggleLayer = (key: LayerKey) => {
    setActiveLayers((current) => ({ ...current, [key]: !current[key] }))
  }

  const applySelected = useCallback((feature: MapFeature) => {
    setSelected(feature)
    setViewedFeatureIds((current) => [feature.id, ...current.filter((currentId) => currentId !== feature.id)].slice(0, 3))
    setSelectedScenario(feature.scenarios[0] ?? "")
    setActivePrompt("bankability")
    setStatusOpen(true)
    setCapsuleOpen(true)
  }, [])

  const selectFeatureById = useCallback((id: string) => {
    const next =
      mapFeatures.find((feature) => feature.id === id || feature.featureId === id) ??
      mockFeatures.find((feature) => feature.id === id || feature.featureId === id)
    if (next) applySelected(next)
  }, [applySelected, mapFeatures])

  const loadFeatureSummary = useCallback(async (featureId: string, properties?: Record<string, unknown>) => {
    const fallback = featureFromSummary(featureId, properties ?? {})
    applySelected(fallback)

    try {
      const response = await fetch(`/api/map/features/${encodeURIComponent(featureId)}/summary`, { cache: "no-store" })
      if (!response.ok) return
      const payload = await response.json()
      const enriched = featureFromSummary(featureId, payload)
      setMapFeatures((current) =>
        current.map((feature) => (feature.id === enriched.id || feature.featureId === enriched.featureId ? enriched : feature))
      )
      applySelected(enriched)
    } catch {
      applySelected({
        ...fallback,
        status: "partial",
        risks: ["Feature summary API 연결 대기", ...fallback.risks.slice(0, 1)],
      })
    }
  }, [applySelected])

  const toggleSaved = () => {
    setSavedIds((current) =>
      current.includes(selected.id)
        ? current.filter((id) => id !== selected.id)
        : [...current, selected.id]
    )
  }

  const closeBuildingPanels = useCallback(() => {
    setCapsuleOpen(false)
    setStatusOpen(false)
  }, [])

  const handleViewportChange = useCallback((viewport: MapViewport) => {
    setMapViewport(viewport)
  }, [])

  useEffect(() => {
    if (!mapViewport) return

    const controller = new AbortController()

    const loadBboxSignals = async () => {
      try {
        setBboxApi((current) => ({ ...current, status: "loading", bboxLabel: mapViewport.bboxParam }))

        const params = new URLSearchParams({
          bbox: mapViewport.bboxParam,
          level: String(Math.round(mapViewport.zoom)),
        })
        const response = await fetch(`/api/map/building-signals?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error("bbox API failed")
        const data = (await response.json()) as {
          count?: number
          bbox?: string
          source?: string
          buildings?: Array<Record<string, unknown>>
          features?: Array<Record<string, unknown>>
        }
        const livePayloads = data.buildings ?? data.features ?? []
        const liveFeatures = livePayloads.map((item, index) =>
          featureFromSummary(String(item.feature_id ?? item.pnu ?? item.id ?? `bbox-${index}`), item)
        )

        if (liveFeatures.length) {
          setMapFeatures(liveFeatures)
          if (selected.featureId.startsWith("parcel-mapo-")) {
            const defaultFeatureIndex = Math.max(0, liveFeatures.findIndex((feature) => !shouldExcludeScoreShade(feature)))
            void loadFeatureSummary(liveFeatures[defaultFeatureIndex].featureId, livePayloads[defaultFeatureIndex])
          }
        }

        setBboxApi({
          status: "ready",
          count: data.count ?? (liveFeatures.length || mockFeatures.length),
          bboxLabel: data.bbox ?? mapViewport.bboxParam,
          source: data.source ?? "maplibre-local",
        })
      } catch {
        if (controller.signal.aborted) return
        setBboxApi((current) => ({ ...current, status: "error", source: "maplibre-local" }))
      }
    }

    loadBboxSignals()
    return () => controller.abort()
  }, [loadFeatureSummary, mapViewport, selected.featureId])

  return (
    <main className="min-h-screen bg-[#e7ece4] text-zinc-950">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/96 backdrop-blur">
        <div className="flex min-h-16 flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:px-5">
          <div className="flex items-center gap-3">
            <Link
              href="/analysis"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-800 transition hover:bg-zinc-100"
              aria-label="Analysis로 이동"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Link>
            <div>
              <p className="text-xs font-medium text-zinc-500">BuildMore Map</p>
              <h1 className="text-lg font-semibold leading-tight text-zinc-950">필지 기반 금융 실행 지도</h1>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value="서울 마포구 합정동"
                readOnly
                className="h-10 rounded-lg border-zinc-200 bg-white pl-9 text-sm"
                aria-label="주소 검색"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className={cn("h-10 rounded-lg border-zinc-200 bg-white", filterOpen && "border-zinc-900 bg-zinc-100")}
                onClick={() => setFilterOpen((open) => !open)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                레이어
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "h-10 rounded-lg border-zinc-200 bg-white",
                  isSaved && "border-emerald-300 bg-emerald-50 text-emerald-800"
                )}
                onClick={toggleSaved}
              >
                <Save className="h-4 w-4" />
                {isSaved ? "저장됨" : "후보 저장"}
              </Button>
              <Button asChild className="h-10 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800">
                <Link href="/analysis">
                  <Activity className="h-4 w-4" />
                  분석 실행
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative h-[calc(100vh-65px)] min-h-[720px] overflow-hidden bg-[#dfe7dc]">
        <MapSurface
          activeLayers={activeLayers}
          selected={selected}
          features={mapFeatures}
          selectedScenario={selectedScenario}
          capsuleOpen={capsuleOpen && !statusOpen}
          savedIds={savedIds}
          onScenarioChange={setSelectedScenario}
          onSelect={selectFeatureById}
          onExternalFeature={loadFeatureSummary}
          onCloseCapsule={closeBuildingPanels}
          onCloseBuildingPanels={closeBuildingPanels}
          onViewportChange={handleViewportChange}
        />

        <div className="absolute bottom-5 left-4 top-4 z-30 flex w-[calc(100%-2rem)] max-w-[400px] flex-col rounded-lg border border-white/80 bg-white/78 shadow-2xl backdrop-blur-md md:left-5 md:top-5">
          <div className="flex items-center justify-between border-b border-white/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-zinc-700" />
              <div>
                <p className="text-sm font-semibold">BuildMore LLM</p>
                <p className="text-[11px] text-zinc-500">선택 필지의 대출 가능성과 실행 근거</p>
              </div>
            </div>
            <Badge className={cn("rounded-md border px-2 py-1 text-xs", selectedStatus.className)}>
              {selectedStatus.label}
            </Badge>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-zinc-500">최근 클릭 필지</p>
              <div className="grid gap-2">
                {viewedFeatures.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => applySelected(feature)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition",
                      selected.id === feature.id
                        ? "border-zinc-900 bg-zinc-950 text-white"
                        : "border-zinc-200 bg-white/90 text-zinc-800 hover:bg-zinc-50"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold">{feature.district}</span>
                      <span className={cn("block truncate text-[11px]", selected.id === feature.id ? "text-zinc-300" : "text-zinc-500")}>
                        {feature.price} · {feature.use}
                      </span>
                    </span>
                    <span className={cn("rounded-md px-2 py-1 text-[10px]", selected.id === feature.id ? "bg-white/12 text-white" : "bg-zinc-100 text-zinc-600")}>
                      {feature.bankability}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(promptLabels) as PromptKey[]).map((key) => (
                <PromptChip
                  key={key}
                  label={promptLabels[key]}
                  active={activePrompt === key}
                  onClick={() => setActivePrompt(key)}
                />
              ))}
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-normal text-zinc-500">Answer</p>
              <p className="mt-2 text-sm leading-6 text-zinc-800">{mockLlmAnswer(selected, activePrompt)}</p>
            </div>

            <div className="flex items-center gap-2">
              <Input value={`${selected.address} 기준으로 은행 제출 메모 초안`} readOnly className="h-10 rounded-lg bg-white text-xs" />
              <Button size="icon" className="h-10 w-10 rounded-lg bg-zinc-950">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {filterOpen && (
          <div
            className={cn(
              "absolute right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-lg border border-white/80 bg-white/88 p-4 shadow-2xl backdrop-blur-md md:top-5",
              statusOpen ? "md:right-[460px]" : "md:right-5"
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">MapLibre layers</p>
                <p className="text-[11px] text-zinc-500">R2 PMTiles 우선, fallback layer 보조</p>
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

        <div className="absolute bottom-3 left-3 z-20 rounded-lg border border-white/70 bg-white/82 px-3 py-2 text-[11px] font-medium text-zinc-600 shadow-sm backdrop-blur">
          bbox API: {bboxApi.status} · 줌 {mapViewport?.zoom.toFixed(1) ?? "-"} · 후보 {bboxApi.count}건 · {bboxApi.source}
        </div>

        {!statusOpen && (
          <button
            type="button"
            onClick={() => setStatusOpen(true)}
            className="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 items-center gap-2 rounded-lg border border-white/80 bg-white/86 px-3 py-2 text-xs font-semibold text-zinc-700 shadow-xl backdrop-blur transition hover:bg-white"
          >
            <Building2 className="h-3.5 w-3.5" />
            상태창
          </button>
        )}

        <div
          className={cn(
            "absolute bottom-4 right-4 top-4 z-40 flex w-[calc(100%-2rem)] max-w-[430px] translate-x-[calc(100%+1.5rem)] flex-col rounded-xl border border-white/80 bg-white/90 shadow-2xl backdrop-blur-md transition-transform duration-300 md:bottom-5 md:right-5 md:top-5",
            statusOpen ? "translate-x-0" : "pointer-events-none"
          )}
        >
          <StatusDrawer
            selected={selected}
            selectedScenario={selectedScenario}
            isSaved={isSaved}
            onScenarioChange={setSelectedScenario}
            onClose={() => setStatusOpen(false)}
          />
        </div>
      </section>
    </main>
  )
}

function MapSurface({
  activeLayers,
  selected,
  features,
  selectedScenario,
  capsuleOpen,
  savedIds,
  onScenarioChange,
  onSelect,
  onExternalFeature,
  onCloseCapsule,
  onCloseBuildingPanels,
  onViewportChange,
}: {
  activeLayers: Record<LayerKey, boolean>
  selected: MapFeature
  features: MapFeature[]
  selectedScenario: string
  capsuleOpen: boolean
  savedIds: string[]
  onScenarioChange: (scenario: string) => void
  onSelect: (id: string) => void
  onExternalFeature: (featureId: string, properties?: Record<string, unknown>) => void
  onCloseCapsule: () => void
  onCloseBuildingPanels: () => void
  onViewportChange: (viewport: MapViewport) => void
}) {
  const naverMapRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<MapLibreMap | null>(null)
  const naverMapInstanceRef = useRef<NaverMapInstance | null>(null)
  const [message, setMessage] = useState("네이버 지도 준비 중")
  const [config, setConfig] = useState<MapConfig | null>(null)
  const [naverConfig, setNaverConfig] = useState<NaverMapConfig | null>(null)
  const [selectedScreen, setSelectedScreen] = useState<{ left: number; top: number } | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const draggedRef = useRef(false)
  const selectedRef = useRef(selected)
  const featuresRef = useRef(features)
  const onSelectRef = useRef(onSelect)
  const onExternalFeatureRef = useRef(onExternalFeature)
  const onCloseBuildingPanelsRef = useRef(onCloseBuildingPanels)
  const onViewportChangeRef = useRef(onViewportChange)

  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  useEffect(() => {
    featuresRef.current = features
  }, [features])

  useEffect(() => {
    onSelectRef.current = onSelect
    onExternalFeatureRef.current = onExternalFeature
    onCloseBuildingPanelsRef.current = onCloseBuildingPanels
    onViewportChangeRef.current = onViewportChange
  }, [onCloseBuildingPanels, onExternalFeature, onSelect, onViewportChange])

  const publishViewport = useCallback((map: MapLibreMap) => {
    const bounds = map.getBounds()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    const bboxParam = [sw.lng, sw.lat, ne.lng, ne.lat].map((value) => value.toFixed(6)).join(",")
    onViewportChangeRef.current({
      swLat: sw.lat,
      swLng: sw.lng,
      neLat: ne.lat,
      neLng: ne.lng,
      zoom: map.getZoom(),
      bboxParam,
    })
  }, [])

  const syncNaverBaseMap = useCallback((map: MapLibreMap) => {
    const naverMap = naverMapInstanceRef.current
    const maps = window.naver?.maps
    if (!naverMap || !maps) return

    const center = map.getCenter()
    naverMap.setCenter(new maps.LatLng(center.lat, center.lng))
    naverMap.setZoom(Math.round(map.getZoom()))
  }, [])

  const updateSelectedPosition = useCallback((map: MapLibreMap, feature: MapFeature) => {
    const point = map.project([feature.coordinates.lng, feature.coordinates.lat])
    const width = map.getCanvas().clientWidth || 0
    const height = map.getCanvas().clientHeight || 0
    setSelectedScreen({
      left: width ? Math.min(Math.max(point.x, 180), width - 180) : point.x,
      top: height ? Math.min(Math.max(point.y, 300), height - 80) : point.y,
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadConfig = async () => {
      try {
        const [mapResponse, naverResponse] = await Promise.all([
          fetch("/api/config/map-tiles", { cache: "no-store" }),
          fetch("/api/config/naver-map-key", { cache: "no-store" }),
        ])

        const payload = (await mapResponse.json()) as MapConfig
        if (!cancelled) setConfig(payload)

        if (naverResponse.ok) {
          const naverPayload = (await naverResponse.json()) as NaverMapConfig
          if (!cancelled) setNaverConfig(naverPayload)
        } else if (!cancelled) {
          setNaverConfig({ naverMapClientId: "", customStyleId: null })
        }
      } catch {
        if (!cancelled) {
          setConfig({
            engine: "maplibre",
            tilesBaseUrl: "",
            styleUrl: "",
            tilesetVersion: "fallback",
            defaultCenter: [mapCenter.lng, mapCenter.lat],
            defaultZoom: 14,
            minZoom: 9,
            maxZoom: 19,
            status: "fallback",
          })
          setNaverConfig({ naverMapClientId: "", customStyleId: null })
        }
      }
    }

    loadConfig()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!config || !naverConfig || !mapRef.current || mapInstanceRef.current) return

    let cancelled = false
    let handleWindowResize: (() => void) | null = null
    const naverContainer = naverMapRef.current

    const createMap = async () => {
      registerPmtilesProtocol()

      let naverReady = false
      let showFallbackBase = false
      if (naverConfig.naverMapClientId && naverMapRef.current) {
        try {
          const maps = await loadNaverMaps(naverConfig.naverMapClientId)
          if (cancelled || !naverMapRef.current) return

          const options: Record<string, unknown> = {
            center: new maps.LatLng(selectedRef.current.coordinates.lat, selectedRef.current.coordinates.lng),
            zoom: Math.max(config.defaultZoom || 14, 14),
            minZoom: config.minZoom || 9,
            maxZoom: config.maxZoom || 19,
            gl: true,
            logoControl: true,
            mapDataControl: false,
            scaleControl: false,
            zoomControl: false,
          }
          if (naverConfig.customStyleId) {
            options.customStyleId = naverConfig.customStyleId
          }

          naverMapInstanceRef.current = new maps.Map(naverMapRef.current, options)
          naverMapInstanceRef.current.relayout?.()
          naverReady = true
          setMessage(naverConfig.customStyleId ? "네이버 커스텀 베이스맵 · BuildMore 레이어" : "네이버 GL 베이스맵 · BuildMore 레이어")
          window.setTimeout(() => {
            const hasNaverSurface = Boolean(naverContainer?.querySelector("canvas, img"))
            if (!hasNaverSurface) {
              showFallbackBase = true
              ensureFallbackRasterBase(mapInstanceRef.current)
              setMessage("네이버 인증 확인 필요 · VWorld fallback")
            }
          }, 1800)
        } catch {
          showFallbackBase = true
          setMessage("네이버 지도 로드 실패 · VWorld fallback")
        }
      } else {
        showFallbackBase = true
        setMessage("네이버 지도 키 없음 · VWorld fallback")
      }

      let style: string | StyleSpecification = normalizeOverlayStyle(fallbackStyle())
      if (config.styleUrl) {
        try {
          const response = await fetch(config.styleUrl, { cache: "no-store" })
          if (response.ok) {
            style = normalizeOverlayStyle((await response.json()) as StyleSpecification)
            if (!naverReady) setMessage(`R2 overlay 로드 · ${config.tilesetVersion}`)
          } else {
            if (!naverReady) setMessage(`R2 overlay ${response.status} · fallback style`)
          }
        } catch {
          if (!naverReady) setMessage("R2 overlay CORS/연결 대기 · fallback style")
        }
      } else {
        if (!naverReady) setMessage("R2 overlay URL 없음 · fallback style")
      }

      if (cancelled || !mapRef.current) return

      const map = new maplibregl.Map({
        container: mapRef.current,
        style,
        center: [selectedRef.current.coordinates.lng, selectedRef.current.coordinates.lat],
        zoom: Math.max(config.defaultZoom || 14, 14),
        minZoom: config.minZoom || 9,
        maxZoom: config.maxZoom || 19,
        attributionControl: false,
      })

      mapInstanceRef.current = map
      map.getContainer().style.background = "transparent"
      requestAnimationFrame(() => map.resize())
      window.setTimeout(() => map.resize(), 250)
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right")
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left")

      map.on("load", () => {
        if (showFallbackBase) ensureFallbackRasterBase(map)

        if (!map.getSource("bm-mock-parcels")) {
          map.addSource("bm-mock-parcels", { type: "geojson", data: mockParcelsGeojson(featuresRef.current) })
        }
        if (!map.getSource("bm-mock-transactions")) {
          map.addSource("bm-mock-transactions", { type: "geojson", data: mockTransactionsGeojson() })
        }
        if (!map.getSource(selectedSourceId)) {
          map.addSource(selectedSourceId, { type: "geojson", data: selectedFeatureGeojson(selectedRef.current) })
        }

        map.addLayer({
          id: "bm-parcels-hit",
          type: "fill",
          source: "bm-mock-parcels",
          paint: {
            "fill-color": "#ffffff",
            "fill-opacity": 0.001,
          },
        })
        map.addLayer({
          id: "bm-parcels-outline",
          type: "line",
          source: "bm-mock-parcels",
          paint: {
            "line-color": "#334155",
            "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.45, 17, 0.9, 19, 1.1],
            "line-opacity": 0.5,
          },
        })
        map.addLayer({
          id: "bm-transaction-circle",
          type: "circle",
          source: "bm-mock-transactions",
          paint: {
            "circle-color": "#0ea5e9",
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3.5, 16, 6, 19, 6.5],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.4,
            "circle-opacity": 0.72,
          },
        })
        map.addLayer({
          id: "bm-selected-feature-fill",
          type: "fill",
          source: selectedSourceId,
          paint: {
            "fill-color": "#ef4444",
            "fill-opacity": 0.34,
          },
        })
        map.addLayer({
          id: "bm-selected-feature-line",
          type: "line",
          source: selectedSourceId,
          paint: {
            "line-color": "#dc2626",
            "line-width": 3,
            "line-opacity": 0.95,
          },
        })

        publishViewport(map)
        syncNaverBaseMap(map)
        map.resize()
        updateSelectedPosition(map, selectedRef.current)
        if (!naverReady) {
          setMessage((current) => current.includes("fallback") ? current : `MapLibre overlay · PMTiles · ${config.tilesetVersion}`)
        }
      })

      map.on("moveend", () => publishViewport(map))
      map.on("move", () => {
        syncNaverBaseMap(map)
        updateSelectedPosition(map, selectedRef.current)
      })
      map.on("zoom", () => {
        syncNaverBaseMap(map)
        updateSelectedPosition(map, selectedRef.current)
      })

      handleWindowResize = () => {
        naverMapInstanceRef.current?.relayout?.()
        map.resize()
        syncNaverBaseMap(map)
        updateSelectedPosition(map, selectedRef.current)
      }
      window.addEventListener("resize", handleWindowResize)

      map.on("click", (event) => {
        const layers = ["bm-parcels-hit"].filter((layerId) => map.getLayer(layerId))
        const features = map.queryRenderedFeatures(event.point, { layers })
        const feature = features[0]

        if (!feature) {
          onCloseBuildingPanelsRef.current()
          return
        }

        const props = feature.properties as Record<string, unknown>
        const buildingId = String(props.buildingId ?? "")
        const featureId = String(props.feature_id ?? props.pnu ?? buildingId)

        if (buildingId) {
          onSelectRef.current(buildingId)
          return
        }
        if (featureId) {
          onExternalFeatureRef.current(featureId, props)
        }
      })
    }

    createMap()

    return () => {
      cancelled = true
      if (handleWindowResize) window.removeEventListener("resize", handleWindowResize)
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      naverMapInstanceRef.current?.destroy?.()
      naverMapInstanceRef.current = null
      if (naverContainer) naverContainer.innerHTML = ""
    }
  }, [config, naverConfig, publishViewport, syncNaverBaseMap, updateSelectedPosition])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map?.isStyleLoaded()) return
    const source = map.getSource(selectedSourceId) as maplibregl.GeoJSONSource | undefined
    source?.setData(selectedFeatureGeojson(selected) as never)
    updateSelectedPosition(map, selected)
  }, [selected, updateSelectedPosition])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map?.isStyleLoaded()) return
    const parcelsSource = map.getSource("bm-mock-parcels") as maplibregl.GeoJSONSource | undefined
    parcelsSource?.setData(mockParcelsGeojson(features) as never)
  }, [features])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map?.isStyleLoaded()) return

    const visibilityByLayer: Array<[string, boolean]> = [
      ["bm-parcels-hit", activeLayers.parcels],
      ["bm-parcels-outline", activeLayers.parcels],
      ["bm-transaction-circle", activeLayers.transactions],
    ]

    visibilityByLayer.forEach(([layerId, visible]) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none")
      }
    })
  }, [activeLayers])

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = { x: event.clientX, y: event.clientY }
    draggedRef.current = false
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current
    if (!start) return
    if (Math.abs(event.clientX - start.x) > 8 || Math.abs(event.clientY - start.y) > 8) {
      draggedRef.current = true
    }
  }

  const handleSurfaceClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (draggedRef.current) {
      draggedRef.current = false
      return
    }
    if ((event.target as HTMLElement).closest("[data-map-overlay]")) return
  }

  return (
    <div
      className="absolute inset-0 bg-[#dfe7dc]"
      onClick={handleSurfaceClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <div
        ref={naverMapRef}
        className="absolute inset-0"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />

      <div
        ref={mapRef}
        className="absolute inset-0 z-[1]"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent" }}
      />

      <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-lg border border-white/70 bg-white/82 px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur">
        <span className="inline-flex items-center gap-2">
          <Layers className="h-3.5 w-3.5" />
          {message}
        </span>
      </div>

      {capsuleOpen && selectedScreen && (
        <div
          data-map-overlay
          className="absolute z-20 w-[320px] -translate-x-1/2 -translate-y-[calc(100%+20px)] rounded-lg border border-white/80 bg-white/76 p-3 shadow-2xl backdrop-blur-md"
          style={{ left: selectedScreen.left, top: selectedScreen.top }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="rounded-lg border border-zinc-200 bg-white/92 p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-500">{selected.district}</p>
                <h3 className="mt-1 truncate text-sm font-semibold text-zinc-950">{selected.address}</h3>
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white" onClick={onCloseCapsule}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <MiniMetric label="Bank" value={`${selected.bankability}`} />
            <MiniMetric label="DSCR" value={selected.dscr} />
            <MiniMetric label="Cap" value={selected.capRate} />
          </div>

          <div className="mt-2 rounded-lg bg-zinc-950 px-3 py-2 text-xs text-white">
            {selected.locationSignal} · 신뢰도 {selected.confidence}
          </div>

          <div className="mt-2 rounded-lg border border-zinc-200 bg-white/92 p-2 shadow-sm">
            <p className="mb-2 text-[11px] font-semibold text-zinc-500">추천 실행 시나리오</p>
            <div className="flex flex-wrap gap-1.5">
              {selected.scenarios.map((scenario) => (
                <button
                  key={scenario}
                  type="button"
                  onClick={() => onScenarioChange(scenario)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[11px] font-semibold",
                    selectedScenario === scenario
                      ? "border-zinc-900 bg-zinc-950 text-white"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  )}
                >
                  {scenario}
                </button>
              ))}
            </div>
            <Button asChild className="mt-2 h-8 w-full rounded-md bg-zinc-950 text-xs text-white">
              <Link href="/analysis">정밀 분석 실행</Link>
            </Button>
          </div>
        </div>
      )}

      {mockFeatures.map((feature) => {
        if (!savedIds.includes(feature.id)) return null
        return (
          <div
            key={feature.id}
            data-map-overlay
            className="pointer-events-none absolute right-5 top-[calc(76px+var(--offset))] z-10 rounded-lg border border-emerald-200 bg-white/82 px-3 py-2 text-[11px] font-semibold text-emerald-800 shadow-sm backdrop-blur"
            style={{ "--offset": `${mockFeatures.findIndex((item) => item.id === feature.id) * 40}px` } as CSSProperties}
          >
            저장 후보 · {feature.district}
          </div>
        )
      })}
    </div>
  )
}

function StatusDrawer({
  selected,
  selectedScenario,
  isSaved,
  onScenarioChange,
  onClose,
}: {
  selected: MapFeature
  selectedScenario: string
  isSaved: boolean
  onScenarioChange: (scenario: string) => void
  onClose: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-zinc-200/80 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-zinc-500" />
            <p className="truncate text-xs font-medium text-zinc-500">{selected.district}</p>
          </div>
          <h2 className="mt-0.5 text-base font-semibold leading-tight">{selected.address}</h2>
        </div>
        <div className="flex shrink-0 items-start gap-2">
        <Badge className={cn("rounded-md border px-2 py-1 text-xs", statusBadge(selected.status).className)}>
          {statusBadge(selected.status).label} · {selected.sourceUpdatedAt} · {isSaved ? "저장됨" : "미저장"}
        </Badge>
        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 rounded-lg bg-white" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
        </div>
      </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          <CoreMetric icon={ShieldCheck} label="Bank" value={`${selected.bankability}`} />
          <CoreMetric icon={Activity} label="Ready" value={`${selected.readiness}`} />
          <CoreMetric icon={BarChart3} label="NOI" value={selected.noi} />
          <CoreMetric icon={CircleDollarSign} label="Equity" value={selected.equity} />
          <CoreMetric icon={TrendingUp} label="Cap" value={selected.capRate} />
          <CoreMetric icon={Database} label="DSCR/LTV" value={`${selected.dscr}/${selected.ltv}`} />
        </div>

        <div className="grid gap-3">
          <div className="rounded-lg border border-zinc-200 bg-white/92 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold">딜 스냅샷</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <CompactFact label="희망가" value={selected.price} />
              <CompactFact label="적정가" value={selected.maxPurchasePrice} />
              <CompactFact label="월 이자" value={selected.interest} />
            </div>
            <div className={cn("mt-2 rounded-lg border px-2.5 py-2", signalTone(selected.signalStrength))}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold">{selected.locationSignal}</span>
                <span>신뢰도 {selected.confidence}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200 bg-white/90 px-2.5 py-2 text-xs">
              <span className="mr-1 text-zinc-500">추천 진행</span>
              {selected.scenarios.map((scenario) => (
                <button
                  key={scenario}
                  type="button"
                  onClick={() => onScenarioChange(scenario)}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[11px] font-semibold transition",
                    selectedScenario === scenario
                      ? "border-zinc-900 bg-zinc-950 text-white"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  )}
                >
                  {scenario}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white/92 p-3">
            <div className="mb-2 flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-rose-600" />
              <h3 className="text-sm font-semibold">리스크</h3>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-700">
              {selected.risks.map((risk) => (
                <div key={risk} className="rounded-md bg-zinc-50/90 px-2.5 py-1.5">
                  {risk}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white/92 p-3">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-600" />
              <h3 className="text-sm font-semibold">다음 액션</h3>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-700">
              {selected.nextActions.slice(0, 3).map((action, index) => (
                <div key={action} className="flex items-center gap-2 rounded-md bg-zinc-50/90 px-2.5 py-1.5">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
                    {index + 1}
                  </span>
                  {action}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PromptChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-left text-xs font-medium transition",
        active
          ? "border-zinc-900 bg-zinc-950 text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
      )}
    >
      {label}
    </button>
  )
}

function CoreMetric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white/90 px-2.5 py-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-0.5 text-sm font-semibold text-zinc-950">{value}</p>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">
      <p className="text-[10px] font-medium text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-zinc-950">{value}</p>
    </div>
  )
}

function CompactFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white/90 px-2 py-1.5">
      <p className="text-[10px] font-medium text-zinc-500">{label}</p>
      <p className="mt-0.5 truncate text-xs font-semibold text-zinc-950">{value}</p>
    </div>
  )
}
