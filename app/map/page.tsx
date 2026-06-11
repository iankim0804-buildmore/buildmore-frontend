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
  Ruler,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  TriangleAlert,
  X,
} from "lucide-react"

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
  use_label?: string | null
  structure_code?: string | null
  structure_label?: string | null
  approval_year?: number | null
  latest_use_approval_date?: string | null
  total_floor_area_m2?: number | null
  largest_total_floor_area_m2?: number | null
  ground_floors?: number | null
  underground_floors?: number | null
  height_m?: number | null
  building_coverage_ratio?: number | null
  legal_max_building_coverage_ratio?: number | null
  floor_area_ratio?: number | null
  legal_max_floor_area_ratio?: number | null
  temporary_floor_area_ratio?: number | null
  legal_relaxation_note?: string | null
  legal_max_source?: string | null
  violation_building_label?: string | null
  parking_count?: number | null
  parking_self_count?: number | null
  parking_mechanical_count?: number | null
  parking_indoor_self_count?: number | null
  parking_outdoor_self_count?: number | null
  parking_indoor_mechanical_count?: number | null
  parking_outdoor_mechanical_count?: number | null
  passenger_elevator_count?: number | null
  household_count?: number | null
  zoning_label?: string | null
  zoning_code?: string | null
  district_label?: string | null
  district_code?: string | null
  zone_label?: string | null
  zone_code?: string | null
  land_use_source_status?: string | null
  land_use_source_label?: string | null
  owner_count?: number | null
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
  buildingCoverageRatio?: number
  legalMaxBuildingCoverageRatio?: number
  floorAreaRatio?: number
  legalMaxFloorAreaRatio?: number
  temporaryFloorAreaRatio?: number
  legalRelaxationNote?: string
  legalMaxSource?: string
  violationBuildingLabel?: string
  parkingCount?: number
  parkingSelfCount?: number
  parkingMechanicalCount?: number
  parkingIndoorSelfCount?: number
  parkingOutdoorSelfCount?: number
  parkingIndoorMechanicalCount?: number
  parkingOutdoorMechanicalCount?: number
  passengerElevatorCount?: number
  householdCount?: number
  zoningLabel?: string
  zoningCode?: string
  districtLabel?: string
  districtCode?: string
  zoneLabel?: string
  zoneCode?: string
  ownerCount?: number
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
  transaction_category?: "apartment" | "officetel" | "retail" | "other" | string | null
  deal_type?: string | null
}

type FeatureCollection = {
  type: "FeatureCollection"
  features: Array<Record<string, unknown>>
  [key: string]: unknown
}

type KakaoOverlay = { setMap: (map: unknown | null) => void; setZIndex?: (zIndex: number) => void }
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
  setCenter?: (position: unknown) => void
  panTo?: (position: unknown) => void
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

type AddressSuggestion = {
  label: string
  address: string
  lat: number
  lng: number
}

type FocusTarget = {
  lat: number
  lng: number
  nonce: number
}

const mapInitialLevel = 3
const emptyFeatureCollection: FeatureCollection = { type: "FeatureCollection", features: [] }

let kakaoMapsPromise: Promise<typeof window.kakao.maps> | null = null

const layerLabels: Record<LayerKey, string> = {
  transactions: "부동산 실거래",
  regulations: "규제/정비",
}

const layerColors: Record<LayerKey, string> = {
  transactions: "bg-zinc-950",
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
    buildingCoverageRatio: numberValue(buildingRegister?.building_coverage_ratio),
    legalMaxBuildingCoverageRatio: numberValue(buildingRegister?.legal_max_building_coverage_ratio),
    floorAreaRatio: numberValue(buildingRegister?.floor_area_ratio),
    legalMaxFloorAreaRatio: numberValue(buildingRegister?.legal_max_floor_area_ratio),
    temporaryFloorAreaRatio: numberValue(buildingRegister?.temporary_floor_area_ratio),
    legalRelaxationNote: textValue(buildingRegister?.legal_relaxation_note, ""),
    legalMaxSource: textValue(buildingRegister?.legal_max_source, ""),
    violationBuildingLabel: textValue(buildingRegister?.violation_building_label, "확인 필요"),
    parkingCount: numberValue(buildingRegister?.parking_count),
    parkingSelfCount: numberValue(buildingRegister?.parking_self_count),
    parkingMechanicalCount: numberValue(buildingRegister?.parking_mechanical_count),
    parkingIndoorSelfCount: numberValue(buildingRegister?.parking_indoor_self_count),
    parkingOutdoorSelfCount: numberValue(buildingRegister?.parking_outdoor_self_count),
    parkingIndoorMechanicalCount: numberValue(buildingRegister?.parking_indoor_mechanical_count),
    parkingOutdoorMechanicalCount: numberValue(buildingRegister?.parking_outdoor_mechanical_count),
    passengerElevatorCount: numberValue(buildingRegister?.passenger_elevator_count),
    householdCount: numberValue(buildingRegister?.household_count),
    zoningLabel: textValue(buildingRegister?.zoning_label, "확인 필요"),
    zoningCode: textValue(buildingRegister?.zoning_code, ""),
    districtLabel: textValue(buildingRegister?.district_label, "확인 필요"),
    districtCode: textValue(buildingRegister?.district_code, ""),
    zoneLabel: textValue(buildingRegister?.zone_label, "확인 필요"),
    zoneCode: textValue(buildingRegister?.zone_code, ""),
    ownerCount: numberValue(buildingRegister?.owner_count),
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

function geometryCenter(geometry: MapGeometry | undefined) {
  if (!geometry?.coordinates) return null
  const points: Array<[number, number]> = []
  const collect = (ring: unknown) => {
    if (!Array.isArray(ring)) return
    ring.forEach((point) => {
      if (!Array.isArray(point) || point.length < 2) return
      const lng = Number(point[0])
      const lat = Number(point[1])
      if (Number.isFinite(lat) && Number.isFinite(lng)) points.push([lng, lat])
    })
  }
  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates)) {
    collect(geometry.coordinates[0])
  }
  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
    geometry.coordinates.forEach((polygon) => {
      if (Array.isArray(polygon)) collect(polygon[0])
    })
  }
  if (!points.length) return null
  const lng = points.reduce((sum, point) => sum + point[0], 0) / points.length
  const lat = points.reduce((sum, point) => sum + point[1], 0) / points.length
  return { lat, lng }
}

function compactArea(value?: number) {
  if (!value) return "-"
  return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}㎡`
}

function formatTransactionAmount(value?: { amount_10k?: unknown; amount_label?: unknown } | null) {
  const amount10k = Number(value?.amount_10k)
  if (!Number.isFinite(amount10k) || amount10k <= 0) {
    return typeof value?.amount_label === "string" ? value.amount_label : "-"
  }
  const eok = amount10k / 10000
  if (eok >= 100) return `${eok.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}억`
  if (eok >= 10) return `${eok.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억`
  if (eok >= 1) return `${eok.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}억`
  return `${amount10k.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}만`
}

function transactionAccent(category: unknown) {
  if (category === "apartment") return { color: "#2563eb", label: "아파트" }
  if (category === "officetel") return { color: "#7c3aed", label: "오피스텔" }
  if (category === "retail") return { color: "#059669", label: "상가" }
  return { color: "#f97316", label: "그외" }
}

function transactionCategoryFromProps(props: Record<string, unknown>) {
  const category = String(props.transaction_category ?? "").trim()
  const buildingUse = String(props.building_use ?? props.use_label ?? "").trim()
  if (category === "apartment" || buildingUse.includes("아파트")) return "apartment"
  if (category === "officetel" || buildingUse.includes("오피스텔")) return "officetel"
  if (
    category === "retail" ||
    ["근린생활시설", "근린", "상가", "상업", "업무", "판매", "생활시설"].some((token) => buildingUse.includes(token))
  ) {
    return "retail"
  }
  return "other"
}

const transactionLegend = [
  { key: "apartment", ...transactionAccent("apartment") },
  { key: "officetel", ...transactionAccent("officetel") },
  { key: "retail", ...transactionAccent("retail") },
  { key: "other", ...transactionAccent("other") },
]

function percentLabel(value?: number, suffix = "%") {
  if (!Number.isFinite(value) || Number(value) <= 0) return "확인 필요"
  return `${Number(value).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}${suffix}`
}

function legalPairLabel(current?: number, legalMax?: number) {
  const currentLabel = percentLabel(current)
  const maxLabel = percentLabel(legalMax)
  return `${currentLabel} (${maxLabel})`
}

function valueWithCode(label?: string, code?: string) {
  const cleanLabel = label && label !== "확인 필요" ? label : ""
  const cleanCode = code && code !== "확인 필요" ? code : ""
  if (cleanLabel && cleanCode) return `${cleanLabel} (${cleanCode})`
  return cleanLabel || cleanCode || "확인 필요"
}

function districtZoneLabel(feature: MapFeature) {
  const district = valueWithCode(feature.districtLabel, feature.districtCode)
  const zone = valueWithCode(feature.zoneLabel, feature.zoneCode)
  if (district === "확인 필요") return zone
  if (zone === "확인 필요" || zone === district) return district
  return `${district} / ${zone}`
}

function parkingSplitLabel(total?: number, indoor?: number, outdoor?: number) {
  if (typeof total !== "number") return "확인 필요"
  const parts = [
    typeof indoor === "number" ? `옥내 ${indoor.toLocaleString("ko-KR")}` : null,
    typeof outdoor === "number" ? `옥외 ${outdoor.toLocaleString("ko-KR")}` : null,
  ].filter(Boolean)
  return parts.length ? `${total.toLocaleString("ko-KR")}대 (${parts.join(" / ")})` : `${total.toLocaleString("ko-KR")}대`
}

function shouldShowHouseholdCount(feature: MapFeature) {
  const label = [feature.buildingRegister?.use_label, feature.use].filter(Boolean).join(" ")
  return ["공동주택", "단독주택", "다세대", "연립", "아파트"].some((token) => label.includes(token))
}

function groupedTransactionFeatures(collection: FeatureCollection) {
  const groups = new Map<string, { feature: Record<string, unknown>; count: number }>()
  collection.features.forEach((feature) => {
    const geometry = feature.geometry as { type?: string; coordinates?: unknown } | undefined
    const coords = geometry?.coordinates
    const props = (feature.properties ?? {}) as Record<string, unknown>
    const pnu = typeof props.pnu === "string" ? props.pnu : ""
    const key = pnu || (Array.isArray(coords) ? coords.map((coord) => Number(coord).toFixed(7)).join(",") : String(feature.id ?? ""))
    const current = groups.get(key)
    if (!current) {
      groups.set(key, { feature, count: 1 })
      return
    }
    const nextDate = String(props.deal_date ?? "")
    const currentDate = String(((current.feature.properties ?? {}) as Record<string, unknown>).deal_date ?? "")
    if (nextDate > currentDate) current.feature = feature
    current.count += 1
  })
  return Array.from(groups.values())
}

function ignoreMapMessage(value: string) {
  void value
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

// ── 실거래 타일 캐시 ──────────────────────────────────────────────────────────
// 지도를 0.01° 격자(약 1km)로 나눠 한 번 로드한 타일은 재방문 시 fetch 없이
// 메모리에서 즉시 렌더한다. bbox를 격자에 스냅해 같은 지역 = 같은 URL이
// 되도록 만들어 브라우저 HTTP 캐시와 백엔드 TTL 캐시도 적중시킨다.
const TX_TILE_DEG = 0.01

function snapBboxOutward(swLng: number, swLat: number, neLng: number, neLat: number, step = TX_TILE_DEG) {
  return [
    Math.floor(swLng / step) * step,
    Math.floor(swLat / step) * step,
    Math.ceil(neLng / step) * step,
    Math.ceil(neLat / step) * step,
  ] as const
}

function tileKeysForBbox(swLng: number, swLat: number, neLng: number, neLat: number, band: string, step = TX_TILE_DEG) {
  const keys: string[] = []
  for (let x = Math.floor(swLng / step); x <= Math.floor((neLng - 1e-9) / step); x++) {
    for (let y = Math.floor(swLat / step); y <= Math.floor((neLat - 1e-9) / step); y++) {
      keys.push(`${band}:${x}:${y}`)
    }
  }
  return keys
}

function txCollectionFromStore(
  store: Map<string, Record<string, unknown>>,
  swLng: number,
  swLat: number,
  neLng: number,
  neLat: number,
): FeatureCollection {
  const margin = 0.005
  const features: Array<Record<string, unknown>> = []
  store.forEach((feature) => {
    const coords = (feature.geometry as { coordinates?: [number, number] } | undefined)?.coordinates
    if (!Array.isArray(coords) || coords.length < 2) return
    const [lng, lat] = coords
    if (lng >= swLng - margin && lng <= neLng + margin && lat >= swLat - margin && lat <= neLat + margin) {
      features.push(feature)
    }
  })
  return { type: "FeatureCollection", features: features.slice(0, 800) }
}

// 정비구역(폴리곤)은 중심점 기준으로 필터하므로 마진을 넉넉히 잡는다
type RegStoreEntry = { feature: Record<string, unknown>; lat: number; lng: number }

function regCollectionFromStore(
  store: Map<string, RegStoreEntry>,
  swLng: number,
  swLat: number,
  neLng: number,
  neLat: number,
): FeatureCollection {
  const margin = 0.03
  const features: Array<Record<string, unknown>> = []
  store.forEach((entry) => {
    if (entry.lng >= swLng - margin && entry.lng <= neLng + margin && entry.lat >= swLat - margin && entry.lat <= neLat + margin) {
      features.push(entry.feature)
    }
  })
  return { type: "FeatureCollection", features: features.slice(0, 300) }
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
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null)
  const [activeLayers, setActiveLayers] = useState<Record<LayerKey, boolean>>({
    transactions: true,
    regulations: true,
  })
  const txStoreRef = useRef<Map<string, Record<string, unknown>>>(new Map())
  const txTilesRef = useRef<Set<string>>(new Set())
  const regStoreRef = useRef<Map<string, RegStoreEntry>>(new Map())
  const regTilesRef = useRef<Set<string>>(new Set())
  const attemptedPnuRef = useRef<string | null>(null)

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

  const searchAddress = useCallback(async (query: string): Promise<AddressSuggestion[]> => {
    const trimmed = query.trim()
    if (trimmed.length < 2) return []
    const kakaoMaps = await loadKakaoMaps()

    const addressMatches = await new Promise<AddressSuggestion[]>((resolve) => {
      const geocoder = new kakaoMaps.services.Geocoder()
      geocoder.addressSearch(trimmed, (result, status) => {
        if (status !== kakaoMaps.services.Status.OK) {
          resolve([])
          return
        }
        resolve(result.slice(0, 4).map((item) => ({
          label: item.road_address_name || item.address_name || trimmed,
          address: item.address_name || item.road_address_name || trimmed,
          lat: Number(item.y),
          lng: Number(item.x),
        })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng)))
      })
    })

    const placeMatches = await new Promise<AddressSuggestion[]>((resolve) => {
      const places = new kakaoMaps.services.Places()
      places.keywordSearch(trimmed, (result, status) => {
        if (status !== kakaoMaps.services.Status.OK) {
          resolve([])
          return
        }
        resolve(result.slice(0, 5).map((item) => ({
          label: item.place_name || item.road_address_name || item.address_name || trimmed,
          address: item.road_address_name || item.address_name || item.place_name || trimmed,
          lat: Number(item.y),
          lng: Number(item.x),
        })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng)))
      })
    })

    const seen = new Set<string>()
    return [...addressMatches, ...placeMatches].filter((item) => {
      const key = `${item.lat.toFixed(6)},${item.lng.toFixed(6)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 6)
  }, [])

  const selectAddress = useCallback(async (suggestion: AddressSuggestion) => {
    setFocusTarget({ lat: suggestion.lat, lng: suggestion.lng, nonce: Date.now() })
    try {
      const response = await fetch(`/api/map/feature-at?lat=${encodeURIComponent(String(suggestion.lat))}&lng=${encodeURIComponent(String(suggestion.lng))}`, {
        cache: "no-store",
      })
      if (!response.ok) return
      const payload = (await response.json()) as Record<string, unknown>
      applyFeaturePayload(payload)
    } catch {
      // Map focus still works even when the clicked coordinate has no parcel in our cache.
    }
  }, [applyFeaturePayload])

  useEffect(() => {
    if (!mapViewport) return
    const controller = new AbortController()

    const [swLng, swLat, neLng, neLat] = mapViewport.bboxParam.split(",").map(Number)
    const band = mapViewport.zoom >= 16 ? "hi" : "lo"
    const snapped = snapBboxOutward(swLng, swLat, neLng, neLat)
    const snappedParam = snapped.map((value) => value.toFixed(3)).join(",")
    const visibleTiles = tileKeysForBbox(swLng, swLat, neLng, neLat, band)
    const missingTiles = visibleTiles.filter((key) => !txTilesRef.current.has(key))
    const regVisibleTiles = tileKeysForBbox(swLng, swLat, neLng, neLat, "reg")
    const regMissingTiles = regVisibleTiles.filter((key) => !regTilesRef.current.has(key))

    // 이미 본 지역은 메모리 캐시에서 즉시 렌더 — 재방문 딜레이 제거
    if (txStoreRef.current.size) {
      const cached = txCollectionFromStore(txStoreRef.current, swLng, swLat, neLng, neLat)
      if (cached.features.length) {
        setTransactionFeatures(cached)
        setTransactionApi({ status: "ready", count: cached.features.length, source: "client-tile-cache" })
      }
    }
    if (regStoreRef.current.size) {
      const cached = regCollectionFromStore(regStoreRef.current, swLng, swLat, neLng, neLat)
      if (cached.features.length) {
        setRegulationFeatures(cached)
        setRegulationApi({ status: "ready", count: cached.features.length, source: "client-tile-cache" })
      }
    }

    const loadViewportSignals = async () => {
      try {
        setBboxApi((current) => ({ ...current, status: "loading" }))
        if (missingTiles.length) {
          setTransactionApi((current) => ({ ...current, status: "loading" }))
        }
        if (regMissingTiles.length) {
          setRegulationApi((current) => ({ ...current, status: "loading" }))
        }

        const params = new URLSearchParams({
          bbox: snappedParam,
          level: String(Math.round(mapViewport.zoom)),
          limit: "220",
        })
        const transactionParams = new URLSearchParams({
          bbox: snappedParam,
          limit: band === "hi" ? "500" : "260",
          date_from: "2025-01-01",
        })
        const regulationParams = new URLSearchParams({
          bbox: snappedParam,
          limit: "160",
        })

        const [buildingResult, transactionResult, regulationResult] = await Promise.allSettled([
          fetch(`/api/map/building-signals?${params.toString()}`, { signal: controller.signal }),
          missingTiles.length
            ? fetch(`/api/map/transactions?${transactionParams.toString()}`, { signal: controller.signal })
            : Promise.resolve(null),
          regMissingTiles.length
            ? fetch(`/api/map/regulations?${regulationParams.toString()}`, { signal: controller.signal })
            : Promise.resolve(null),
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

        // 새로 받은 실거래를 타일 스토어에 누적하고, 현재 뷰포트 기준으로 렌더
        if (transactionResponse?.ok && Array.isArray(transactionData.features)) {
          transactionData.features.forEach((feature) => {
            const props = ((feature as Record<string, unknown>).properties ?? {}) as Record<string, unknown>
            const key = String(props.transaction_id ?? props.id ?? "")
            if (key) txStoreRef.current.set(key, feature as Record<string, unknown>)
          })
          visibleTiles.forEach((key) => txTilesRef.current.add(key))
          if (txStoreRef.current.size > 8000) {
            // 스토어가 넘치면 오래된 절반을 비우고 타일 기록도 초기화(다음 방문 때 재조회)
            const keys = Array.from(txStoreRef.current.keys()).slice(0, 4000)
            keys.forEach((key) => txStoreRef.current.delete(key))
            txTilesRef.current.clear()
          }
        }
        const merged = txCollectionFromStore(txStoreRef.current, swLng, swLat, neLng, neLat)
        if (merged.features.length || transactionResponse) {
          setTransactionFeatures(merged.features.length ? merged : emptyFeatureCollection)
        }
        setTransactionApi({
          status: transactionResponse ? (transactionResponse.ok ? "ready" : "error") : "ready",
          count: merged.features.length,
          source: transactionResponse
            ? (typeof transactionData.source === "string" ? transactionData.source : "commerce_seoul_transactions")
            : "client-tile-cache",
        })

        // 새로 받은 정비구역을 타일 스토어에 누적하고, 현재 뷰포트 기준으로 렌더
        if (regulationResponse?.ok && Array.isArray(regulationData.features)) {
          regulationData.features.forEach((feature) => {
            const record = feature as Record<string, unknown>
            const props = (record.properties ?? {}) as Record<string, unknown>
            const key = String(props.zone_key ?? props.id ?? "")
            if (!key) return
            const center = geometryCenter(record.geometry as MapGeometry | undefined)
            if (!center) return
            regStoreRef.current.set(key, { feature: record, lat: center.lat, lng: center.lng })
          })
          regVisibleTiles.forEach((key) => regTilesRef.current.add(key))
          if (regStoreRef.current.size > 1500) {
            const keys = Array.from(regStoreRef.current.keys()).slice(0, 750)
            keys.forEach((key) => regStoreRef.current.delete(key))
            regTilesRef.current.clear()
          }
        }
        const regMerged = regCollectionFromStore(regStoreRef.current, swLng, swLat, neLng, neLat)
        if (regMerged.features.length || regulationResponse) {
          setRegulationFeatures(regMerged.features.length ? regMerged : emptyFeatureCollection)
        }
        setRegulationApi({
          status: regulationResponse ? (regulationResponse.ok ? "ready" : "error") : "ready",
          count: regMerged.features.length,
          source: regulationResponse
            ? (typeof regulationData.source === "string" ? regulationData.source : "map_redevelopment_zones")
            : "client-tile-cache",
        })
      } catch {
        if (controller.signal.aborted) return
        setBboxApi((current) => ({ ...current, status: "error" }))
        setTransactionApi((current) => ({ ...current, status: "error" }))
        setRegulationApi((current) => ({ ...current, status: "error" }))
      }
    }

    // 드래그 중 발생하는 중간 viewport의 fetch를 막는다 (캐시 렌더는 위에서 즉시 수행됨)
    const debounce = window.setTimeout(loadViewportSignals, 250)
    return () => {
      window.clearTimeout(debounce)
      controller.abort()
    }
  }, [mapViewport])

  // PNU 변경 시: bbox에 이미 로드된 데이터 우선 사용, 없을 때만 API 호출
  useEffect(() => {
    if (!selected.pnu) return

    const localItems = transactionFeatures.features
      .filter((f) => (f.properties as Record<string, unknown>)?.pnu === selected.pnu)
      .map((f) => f.properties as TransactionItem)

    if (localItems.length > 0) {
      setSelectedTransactions(localItems)
      return
    }

    // 같은 pnu로는 한 번만 폴백 조회 — transactionFeatures 갱신마다 재요청하는 루프 방지
    if (attemptedPnuRef.current === selected.pnu) return
    attemptedPnuRef.current = selected.pnu

    // bbox 밖 필지이거나 아직 로드 안 됐을 때 fallback
    const controller = new AbortController()
    const params = new URLSearchParams({ pnu: selected.pnu, limit: "40", date_from: "2025-01-01" })
    fetch(`/api/map/transactions?${params.toString()}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setSelectedTransactions((data.items ?? []) as TransactionItem[]) })
      .catch(() => {})
    return () => controller.abort()
  }, [selected.pnu, transactionFeatures])

  return (
    <main className="h-screen overflow-hidden bg-background text-foreground">
      <section className="relative h-full w-full overflow-hidden">
        <MapSurface
          activeLayers={activeLayers}
          features={mapFeatures}
          selected={selected}
          transactionFeatures={transactionFeatures}
          regulationFeatures={regulationFeatures}
          viewMode={viewMode}
          focusTarget={focusTarget}
          onFeaturePayload={applyFeaturePayload}
          onViewportChange={setMapViewport}
        />

        <LeftParcelPanel
          selected={selected}
          transactions={selectedTransactions}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onSearchAddress={searchAddress}
          onSelectAddress={selectAddress}
        />

        <div className="absolute left-[420px] top-3 z-30 flex items-center gap-2">
          <Button
            variant="outline"
            className={cn("h-12 rounded-lg border-border bg-background/90 px-4 shadow-lg backdrop-blur", filterOpen && "border-zinc-950 bg-zinc-950 text-white")}
            onClick={() => setFilterOpen((open) => !open)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            필터
          </Button>
          <div className="rounded-lg border border-border bg-background/90 p-1 shadow-lg backdrop-blur">
            <Button
              variant="ghost"
              className={cn("h-10 rounded-md px-8 text-base font-semibold", viewMode === "map" && "bg-zinc-950 text-white hover:bg-zinc-950 hover:text-white")}
              onClick={() => setViewMode("map")}
            >
              지도
            </Button>
            <Button
              variant="ghost"
              className={cn("h-10 rounded-md px-8 text-base font-semibold", viewMode === "roadview" && "bg-zinc-950 text-white hover:bg-zinc-950 hover:text-white")}
              onClick={() => setViewMode("roadview")}
            >
              로드뷰
            </Button>
          </div>
        </div>

        <div className="absolute left-[420px] top-[68px] z-30 flex flex-wrap gap-1.5 rounded-lg border border-border bg-background/88 px-2.5 py-2 text-[11px] font-bold text-zinc-700 shadow-lg backdrop-blur">
          {transactionLegend.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/80 px-2 py-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>

        {filterOpen && (
          <div className="absolute left-[420px] top-[112px] z-40 w-72 rounded-lg border border-border bg-background/90 p-3 shadow-xl backdrop-blur">
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
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", layerColors[key])} />
                    {layerLabels[key]}
                  </span>
                  <span className={cn("text-xs font-semibold", activeLayers[key] ? "text-zinc-950" : "text-zinc-400")}>
                    {activeLayers[key] ? "ON" : "OFF"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-[420px] z-20 rounded-lg border border-border bg-background/85 px-3 py-2 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
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
  focusTarget,
  onFeaturePayload,
  onViewportChange,
}: {
  activeLayers: Record<LayerKey, boolean>
  features: MapFeature[]
  selected: MapFeature
  transactionFeatures: FeatureCollection
  regulationFeatures: FeatureCollection
  viewMode: ViewMode
  focusTarget: FocusTarget | null
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
  const selectedZoneKeyRef = useRef<string | null>(null)
  const drawOverlaysRef = useRef<() => void>(() => {})
  const featuresRef = useRef(features)
  const selectedRef = useRef(selected)
  const transactionFeaturesRef = useRef(transactionFeatures)
  const regulationFeaturesRef = useRef(regulationFeatures)
  const activeLayersRef = useRef(activeLayers)
  const viewModeRef = useRef(viewMode)
  const onFeaturePayloadRef = useRef(onFeaturePayload)
  const onViewportChangeRef = useRef(onViewportChange)
  const setMessage = ignoreMapMessage
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
  }, [activeLayers, features, focusTarget, onFeaturePayload, onViewportChange, selected, transactionFeatures, regulationFeatures, viewMode])

  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach((overlay) => overlay.setMap(null))
    overlaysRef.current = []
  }, [])

  const publishViewport = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map) return
    onViewportChangeRef.current(bboxFromKakaoMap(map))
  }, [])

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
  }, [setMessage])

  // 좌표 hit-test는 겹치는 필지에서 다른 필지를 잡을 수 있으므로, pnu를 아는 경우 직접 조회한다
  const selectParcelByPnu = useCallback(async (pnu: string) => {
    try {
      setMessage("필지 정보 조회 중")
      const response = await fetch(`/api/map/features/${encodeURIComponent(pnu)}/summary`, { cache: "no-store" })
      if (!response.ok) {
        setMessage("필지 정보를 찾지 못했습니다")
        return
      }
      const payload = (await response.json()) as Record<string, unknown>
      onFeaturePayloadRef.current(payload)
      setMessage("필지/건물 경계 강조")
    } catch {
      setMessage("필지 정보 API 연결 대기")
    }
  }, [setMessage])

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
        const props = (feature.properties ?? {}) as Record<string, unknown>
        const zoneKey = textValue(props.zone_key ?? props.id, "")
        const isZoneSelected = zoneKey !== "" && selectedZoneKeyRef.current === zoneKey
        geometryToKakaoPaths(geometry, kakaoMaps).forEach((path) => {
          const polygon = new kakaoMaps.Polygon({
            map,
            path,
            strokeWeight: isZoneSelected ? 3 : 1.25,
            strokeColor: isZoneSelected ? "#d97706" : "#f59e0b",
            strokeOpacity: isZoneSelected ? 1 : 0.72,
            fillColor: isZoneSelected ? "#f59e0b" : "#fbbf24",
            fillOpacity: isZoneSelected ? 0.3 : 0.11,
            zIndex: isZoneSelected ? 30 : 18,
          }) as KakaoOverlay
          overlaysRef.current.push(polygon)
        })
        const center = geometryCenter(geometry)
        const name = textValue(props.name, "")
        if (center && name) {
          const label = document.createElement("div")
          label.className = "max-w-[132px] cursor-pointer truncate rounded-full border border-amber-500/30 bg-white/82 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 shadow-sm backdrop-blur"
          label.textContent = name
          const overlay = new kakaoMaps.CustomOverlay({
            position: new kakaoMaps.LatLng(center.lat, center.lng),
            content: label,
            yAnchor: 0.5,
            zIndex: 24,
            clickable: true,
          }) as KakaoOverlay
          // 실거래 말풍선 등에 가려져 있어도 hover 시 제목이 앞으로 나온다
          label.addEventListener("mouseenter", () => overlay.setZIndex?.(80))
          label.addEventListener("mouseleave", () => overlay.setZIndex?.(24))
          // 제목 클릭 시 해당 정비사업 영역을 하이라이트 (재클릭하면 해제)
          label.addEventListener("click", (event) => {
            event.stopPropagation()
            if (!zoneKey) return
            selectedZoneKeyRef.current = selectedZoneKeyRef.current === zoneKey ? null : zoneKey
            drawOverlaysRef.current()
          })
          overlay.setMap(map)
          overlaysRef.current.push(overlay)
        }
      })
    }

    if (selectedFeature.geometry) {
      geometryToKakaoPaths(selectedFeature.geometry, kakaoMaps).forEach((path) => {
        const polygon = new kakaoMaps.Polygon({
          map,
          path,
          strokeWeight: 2.5,
          strokeColor: "#111827",
          strokeOpacity: 0.9,
          strokeStyle: "shortdash",
          fillColor: "#111827",
          fillOpacity: 0.08,
          zIndex: 45,
        }) as KakaoOverlay
        overlaysRef.current.push(polygon)
      })
    }

    geometryToKakaoPaths(selectedFeature.buildingGeometry, kakaoMaps).forEach((path) => {
      const polygon = new kakaoMaps.Polygon({
        map,
        path,
        strokeWeight: 2,
        strokeColor: "#18181b",
        strokeOpacity: 0.82,
        fillColor: "#18181b",
        fillOpacity: 0.1,
        zIndex: 55,
      }) as KakaoOverlay
      overlaysRef.current.push(polygon)
    })

    if (layers.transactions) {
      groupedTransactionFeatures(transactionFeaturesRef.current).slice(0, 140).forEach(({ feature, count }) => {
        const geometry = feature.geometry as { type?: string; coordinates?: unknown } | undefined
        const coords = geometry?.coordinates
        if (!Array.isArray(coords) || coords.length < 2) return
        const lng = Number(coords[0])
        const lat = Number(coords[1])
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
        const props = (feature.properties ?? {}) as Record<string, unknown>
        const amountLabel = formatTransactionAmount(props)
        const category = transactionCategoryFromProps(props)
        const accent = transactionAccent(category)
        const content = document.createElement("div")
        const countBadge = count > 1 ? `<span style="position:absolute;right:-5px;top:-6px;min-width:17px;height:17px;border-radius:9999px;background:#111827;color:#fff;border:2px solid #fff;font-size:9px;line-height:13px;text-align:center;font-weight:900">${count}</span>` : ""
        content.className = "relative cursor-pointer overflow-visible pb-2"
        content.innerHTML = `
          ${countBadge}
          <div style="position:relative;min-width:62px;overflow:hidden;border-radius:9999px;border:1px solid rgba(9,9,11,0.1);background:#fff;padding:4px 10px 4px 13px;text-align:center;font-size:11px;font-weight:800;line-height:1.1;color:#09090b;box-shadow:0 2px 8px rgba(0,0,0,0.18)">
            <span style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${accent.color}"></span>
            <span>${escapeHtml(amountLabel)}</span><br>
            <span style="font-size:10px;font-weight:700;color:#71717a">${escapeHtml(props.deal_date_label ?? "-")}</span>
          </div>
          <span title="${escapeHtml(accent.label)}" style="position:absolute;left:50%;bottom:3px;width:8px;height:8px;border-radius:9999px;background:${accent.color};transform:translateX(-50%);box-shadow:0 0 0 2px #fff"></span>
        `
        const overlay = new kakaoMaps.CustomOverlay({
          position: new kakaoMaps.LatLng(lat, lng),
          content,
          yAnchor: 1,
          zIndex: 35,
          clickable: true,
        }) as KakaoOverlay
        // 겹쳐 있는 다른 말풍선 위로 hover한 말풍선을 끌어올린다
        content.addEventListener("mouseenter", () => overlay.setZIndex?.(80))
        content.addEventListener("mouseleave", () => overlay.setZIndex?.(35))
        // 말풍선 클릭 시 뒤의 지도가 아니라 말풍선의 필지가 선택되도록 한다
        const bubblePnu = textValue(props.pnu, "")
        content.addEventListener("click", (event) => {
          event.stopPropagation()
          if (bubblePnu) void selectParcelByPnu(bubblePnu)
          else void hitTestParcel(lat, lng)
        })
        overlay.setMap(map)
        overlaysRef.current.push(overlay)
      })
    }
  }, [clearOverlays, hitTestParcel, selectParcelByPnu])

  useEffect(() => {
    drawOverlaysRef.current = drawOverlays
  }, [drawOverlays])

  useEffect(() => {
    const kakaoMaps = window.kakao?.maps
    const map = mapInstanceRef.current
    if (!kakaoMaps || !map || !focusTarget) return
    const position = new kakaoMaps.LatLng(focusTarget.lat, focusTarget.lng)
    if (typeof map.panTo === "function") map.panTo(position)
    else map.setCenter?.(position)
    window.setTimeout(() => {
      publishViewport()
      drawOverlays()
    }, 180)
  }, [drawOverlays, focusTarget, publishViewport])

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
  }, [setMessage])

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
  }, [clearOverlays, drawOverlays, hitTestParcel, openRoadviewAt, publishViewport, setMessage])

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
  }, [roadviewActive, setMessage, viewMode])

  useEffect(() => {
    if (!roadviewActive) return
    window.setTimeout(() => roadviewInstanceRef.current?.relayout?.(), 120)
  }, [roadviewActive])

  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      <div ref={mapRef} className="absolute inset-0" />
      <div
        ref={roadviewRef}
        className={cn(
          "absolute inset-0 z-20 bg-zinc-900 transition-opacity",
          roadviewActive && viewMode === "roadview" ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

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
  onSearchAddress,
  onSelectAddress,
}: {
  selected: MapFeature
  transactions: TransactionItem[]
  activeSection: PanelSection
  onSectionChange: (section: PanelSection) => void
  onSearchAddress: (query: string) => Promise<AddressSuggestion[]>
  onSelectAddress: (suggestion: AddressSuggestion) => void
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [transactionMode, setTransactionMode] = useState<"sale" | "jeonse" | "rent">("sale")
  const [addressQuery, setAddressQuery] = useState(selected.address)
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const sectionRefs = useRef<Record<PanelSection, HTMLElement | null>>({
    transactions: null,
    land: null,
    building: null,
    analysis: null,
  })
  const visibleTransactions = transactionMode === "sale" ? transactions : []
  const latestTransaction = visibleTransactions[0]
  const analysisHref = `/analysis?address=${encodeURIComponent(selected.address)}&price=38&loan=22&rate=4.8&rent=320&deposit=5000&from=map`

  useEffect(() => {
    const timer = window.setTimeout(() => setAddressQuery(selected.address), 0)
    return () => window.clearTimeout(timer)
  }, [selected.address])

  useEffect(() => {
    const query = addressQuery.trim()
    if (query.length < 2 || query === selected.address) {
      const resetTimer = window.setTimeout(() => {
        setAddressSuggestions([])
        setIsSearchingAddress(false)
      }, 0)
      return () => window.clearTimeout(resetTimer)
    }
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setIsSearchingAddress(true)
      try {
        const results = await onSearchAddress(query)
        if (!cancelled) setAddressSuggestions(results)
      } catch {
        if (!cancelled) setAddressSuggestions([])
      } finally {
        if (!cancelled) setIsSearchingAddress(false)
      }
    }, 220)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [addressQuery, onSearchAddress, selected.address])

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
    <aside className="absolute bottom-0 left-0 top-0 z-40 flex w-[396px] flex-col border-r border-border bg-white/60 shadow-2xl backdrop-blur-xl">
      <div className="shrink-0 border-b border-border bg-white/72">
        <div className="flex h-16 items-center gap-3 px-4">
          <Link href="/analysis" className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100" aria-label="분석으로 이동">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-950">{selected.address}</p>
            <p className="truncate text-xs text-zinc-500">{selected.district} · {selected.use}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href={analysisHref}
              className="rounded-md bg-zinc-950 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-zinc-800"
            >
              분석기
            </Link>
            <button
              type="button"
              className="rounded-md border border-zinc-300 bg-white/80 px-2.5 py-1.5 text-xs font-bold text-zinc-500"
              disabled
            >
              비교함
            </button>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={addressQuery}
              onChange={(event) => setAddressQuery(event.target.value)}
              className="h-10 rounded-lg border-border bg-white/85 pl-9 pr-16 text-xs"
              aria-label="주소 검색"
              placeholder="주소, 건물명, 동을 입력"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-zinc-400">
              {isSearchingAddress ? "검색" : "자동"}
            </span>
            {addressSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[44px] z-50 overflow-hidden rounded-lg border border-border bg-white shadow-xl">
                {addressSuggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.lat}-${suggestion.lng}-${suggestion.label}`}
                    type="button"
                    className="block w-full border-b border-zinc-100 px-3 py-2 text-left last:border-b-0 hover:bg-zinc-50"
                    onClick={() => {
                      setAddressQuery(suggestion.address)
                      setAddressSuggestions([])
                      onSelectAddress(suggestion)
                    }}
                  >
                    <span className="block truncate text-xs font-bold text-zinc-950">{suggestion.label}</span>
                    <span className="block truncate text-[11px] text-zinc-500">{suggestion.address}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 border-t border-border">
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
                "h-11 border-r border-border text-sm font-semibold last:border-r-0",
                activeSection === key ? "bg-zinc-950 text-white" : "bg-white/70 text-zinc-700 hover:bg-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-transparent">
        <section
          ref={(node) => {
            sectionRefs.current.transactions = node
          }}
          className="border-b-8 border-white/35 px-5 py-5"
        >
          <SectionTitle icon={CircleDollarSign} title="실거래가" />
          <div className="mb-4 grid grid-cols-3 rounded-lg border border-border bg-white/75 p-1">
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
                  transactionMode === key ? "bg-zinc-950 text-white shadow-sm" : "text-zinc-700 hover:bg-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mb-4 grid grid-cols-[1fr_120px] gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-500">최근 실거래가</p>
              <p className="mt-1 text-2xl font-extrabold text-zinc-950">{formatTransactionAmount(latestTransaction)}</p>
              <p className="mt-1 text-sm font-medium text-zinc-500">{latestTransaction?.deal_date_label ?? "거래내역 없음"}</p>
            </div>
            <button
              type="button"
              className="h-14 self-end rounded-lg border border-border bg-white/85 text-sm font-bold text-zinc-500"
            >
              타입면적
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-950">거래내역 ({visibleTransactions.length}건)</h3>
            <span className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700">총액</span>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-white/88">
            <div className="grid grid-cols-[86px_1fr_74px_40px] bg-zinc-50/90 px-3 py-2 text-xs font-bold text-zinc-500">
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
                  <span className="font-bold text-zinc-950">{formatTransactionAmount(transaction)}</span>
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

          <div className="mt-5 rounded-lg border border-border bg-white/70 px-4 py-4">
            <p className="text-sm font-bold text-zinc-950">우리동네 중개사</p>
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-sm font-bold text-zinc-700">BM</div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-zinc-950">BuildMore 인증 중개사</p>
                <p className="truncate text-xs text-zinc-500">실거래 및 현장 확인 연결 준비</p>
              </div>
              <button type="button" className="h-10 rounded-lg bg-zinc-950 px-3 text-sm font-bold text-white">
                연결
              </button>
            </div>
          </div>
        </section>

        <section
          ref={(node) => {
            sectionRefs.current.land = node
          }}
          className="border-b-8 border-white/35 px-5 py-5"
        >
          <SectionTitle icon={Ruler} title="토지 정보" />
          <InfoRows
            rows={[
              ["면적", selected.area],
              ["지목", selected.use],
              ["지역", valueWithCode(selected.zoningLabel, selected.zoningCode)],
              ["지구", districtZoneLabel(selected)],
              ["현재 건폐율(법정 최대건폐율)", legalPairLabel(selected.buildingCoverageRatio, selected.legalMaxBuildingCoverageRatio)],
              ["용적률(법정 최대용적률)", legalPairLabel(selected.floorAreaRatio, selected.legalMaxFloorAreaRatio)],
              ...(selected.legalRelaxationNote
                ? ([["한시 완화", `${selected.temporaryFloorAreaRatio ? percentLabel(selected.temporaryFloorAreaRatio) : "확인 필요"} · ${selected.legalRelaxationNote}`]] as Array<[string, string]>)
                : []),
              ["위반건축물 여부", selected.violationBuildingLabel ?? "확인 필요"],
              ["소유권자수", selected.ownerCount ? `${selected.ownerCount.toLocaleString("ko-KR")}명` : "확인 필요"],
            ]}
          />
        </section>

        <section
          ref={(node) => {
            sectionRefs.current.building = node
          }}
          className="border-b-8 border-white/35 px-5 py-5"
        >
          <SectionTitle icon={Building2} title="건물 정보" />
          <div className="mb-3 rounded-lg bg-zinc-950 px-4 py-3 text-white">
            <p className="text-xs font-semibold opacity-80">건축물대장 선택</p>
            <p className="mt-1 text-lg font-bold">{selected.buildingName && selected.buildingName !== "-" ? selected.buildingName : selected.address.split(" ").slice(-1)[0]}</p>
            <p className="text-xs font-medium opacity-85">{selected.buildingCount || 0}개 동 · 사용승인 {selected.approvalYear ?? "-"}</p>
          </div>
          <InfoRows
            rows={[
              ["건물명", selected.buildingName ?? "-"],
              ["주용도", selected.buildingRegister?.use_label ?? selected.use],
              ["구조", selected.buildingRegister?.structure_label ?? "-"],
              ["높이", selected.heightM ? `${selected.heightM}m` : "-"],
              ["지상/지하", `${selected.groundFloors ?? "-"} / ${selected.undergroundFloors ?? "-"}`],
              ["대지면적", compactArea(selected.areaM2)],
              ["건축면적", compactArea(selected.buildingAreaM2)],
              ["연면적", compactArea(selected.totalFloorAreaM2)],
              ["총 주차대수", typeof selected.parkingCount === "number" ? `${selected.parkingCount.toLocaleString("ko-KR")}대` : "확인 필요"],
              ["자주식 주차", parkingSplitLabel(selected.parkingSelfCount, selected.parkingIndoorSelfCount, selected.parkingOutdoorSelfCount)],
              ["기계식 주차", parkingSplitLabel(selected.parkingMechanicalCount, selected.parkingIndoorMechanicalCount, selected.parkingOutdoorMechanicalCount)],
              ["승용승강기수", typeof selected.passengerElevatorCount === "number" ? `${selected.passengerElevatorCount.toLocaleString("ko-KR")}대` : "확인 필요"],
              ...(shouldShowHouseholdCount(selected)
                ? ([["세대수", typeof selected.householdCount === "number" ? `${selected.householdCount.toLocaleString("ko-KR")}세대` : "확인 필요"]] as Array<[string, string]>)
                : []),
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

          <div className="mt-4 rounded-lg border border-border bg-white/80 px-3 py-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-zinc-950">{selected.locationSignal}</span>
              <span className="text-zinc-600">신뢰도 {selected.confidence}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-700">{selected.hiddenYield}</p>
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
        <div key={label} className="grid grid-cols-[minmax(0,1fr)_minmax(92px,auto)] gap-3 py-3 text-sm">
          <div className="min-w-0 break-keep font-medium leading-5 text-zinc-500">{label}</div>
          <div className="min-w-0 break-keep text-right font-semibold leading-5 text-zinc-950">{value ?? "-"}</div>
        </div>
      ))}
    </div>
  )
}

function CoreMetric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-white/88 px-3 py-2">
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
    <div className={cn("rounded-lg border border-border bg-white/88 p-3", className)}>
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
