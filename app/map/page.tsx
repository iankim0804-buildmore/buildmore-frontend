"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { MouseEvent, PointerEvent } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Building2,
  ChevronRight,
  CircleDollarSign,
  Database,
  FileText,
  MapPin,
  MessageSquareText,
  RefreshCw,
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

type BuildingSignal = {
  id: string
  address: string
  district: string
  use: string
  coordinates: { lat: number; lng: number }
  position: { left: string; top: string }
  price: string
  area: string
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
  redevelopment: string
  redevelopmentSignal: "strong" | "medium" | "watch"
  hiddenYield: string
  confidence: string
  status: DataStatus
  lastChecked: string
  risks: string[]
  nextActions: string[]
  scenarios: string[]
}

type LayerKey = "redevelopment" | "transactions" | "vitality" | "saved"

type MockPromptKey = "bankability" | "price" | "redevelopment" | "risk"

type KakaoLoadStatus = "loading" | "ready" | "fallback"

type MapViewport = {
  swLat: number
  swLng: number
  neLat: number
  neLng: number
  level: number
  bboxParam: string
}

type BboxApiState = {
  status: "idle" | "loading" | "ready" | "error"
  count: number
  bboxLabel: string
  source: string
}

type KakaoLatLng = {
  getLat: () => number
  getLng: () => number
}

type KakaoBounds = {
  getSouthWest: () => KakaoLatLng
  getNorthEast: () => KakaoLatLng
}

type KakaoMapInstance = {
  getBounds: () => KakaoBounds
  getLevel: () => number
}

type KakaoCustomOverlayInstance = {
  setMap: (map: KakaoMapInstance | null) => void
}

type KakaoPolygonInstance = {
  setMap: (map: KakaoMapInstance | null) => void
}

type KakaoMapsApi = {
  load: (callback: () => void) => void
  LatLng: new (lat: number, lng: number) => KakaoLatLng
  Map: new (container: HTMLElement, options: Record<string, unknown>) => KakaoMapInstance
  CustomOverlay: new (options: Record<string, unknown>) => KakaoCustomOverlayInstance
  Polygon: new (options: Record<string, unknown>) => KakaoPolygonInstance
  event?: {
    addListener: (target: KakaoMapInstance, eventName: string, callback: () => void) => void
  }
}

function getKakaoMaps() {
  return window.kakao?.maps ? (window.kakao.maps as unknown as KakaoMapsApi) : null
}

const KAKAO_SCRIPT_ID = "buildmore-map-kakao-sdk"
const mapCenter = { lat: 37.5523, lng: 126.9139 }

function createFallbackViewport(): MapViewport {
  const swLat = mapCenter.lat - 0.012
  const swLng = mapCenter.lng - 0.018
  const neLat = mapCenter.lat + 0.012
  const neLng = mapCenter.lng + 0.018

  return {
    swLat,
    swLng,
    neLat,
    neLng,
    level: 4,
    bboxParam: [swLng, swLat, neLng, neLat].map((value) => value.toFixed(6)).join(","),
  }
}

function getBuildingViewportPosition(building: BuildingSignal, viewport: MapViewport | null) {
  if (!viewport) return building.position

  const lngSpan = viewport.neLng - viewport.swLng
  const latSpan = viewport.neLat - viewport.swLat
  if (lngSpan <= 0 || latSpan <= 0) return building.position

  const left = ((building.coordinates.lng - viewport.swLng) / lngSpan) * 100
  const top = ((viewport.neLat - building.coordinates.lat) / latSpan) * 100

  return {
    left: `${left}%`,
    top: `${top}%`,
  }
}

function createMockParcelPath(building: BuildingSignal) {
  const lat = building.coordinates.lat
  const lng = building.coordinates.lng
  const latDelta = 0.000085
  const lngDelta = 0.00011

  return [
    { lat: lat + latDelta, lng: lng - lngDelta },
    { lat: lat + latDelta, lng: lng + lngDelta },
    { lat: lat - latDelta, lng: lng + lngDelta },
    { lat: lat - latDelta, lng: lng - lngDelta },
  ]
}

const layerLabels: Record<LayerKey, string> = {
  redevelopment: "정비사업",
  transactions: "실거래",
  vitality: "상권",
  saved: "저장 후보",
}

const promptLabels: Record<MockPromptKey, string> = {
  bankability: "은행 제출 가능성",
  price: "매입가 낮춰야 할까",
  redevelopment: "정비사업 영향",
  risk: "리스크 먼저 보기",
}

const layerColors: Record<LayerKey, string> = {
  redevelopment: "bg-amber-500",
  transactions: "bg-sky-500",
  vitality: "bg-emerald-500",
  saved: "bg-violet-500",
}

const buildings: BuildingSignal[] = [
  {
    id: "bm-map-001",
    address: "서울 마포구 합정동 414-16",
    district: "합정역 6번 출구권",
    use: "근린생활시설",
    coordinates: { lat: 37.5496, lng: 126.9142 },
    position: { left: "58%", top: "43%" },
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
    redevelopment: "가로주택정비 180m",
    redevelopmentSignal: "strong",
    hiddenYield: "검토 가능",
    confidence: "중상",
    status: "ready",
    lastChecked: "2026.06.06 05:42",
    risks: ["임대료 표본 6건", "노후도 보수 반영 필요"],
    nextActions: ["임대차 명세 확인", "인근 거래 12개월 비교", "은행 제출 메모 초안"],
    scenarios: ["리모델링", "증축"],
  },
  {
    id: "bm-map-002",
    address: "서울 마포구 서교동 357-1",
    district: "홍대입구 배후상권",
    use: "상업업무용",
    coordinates: { lat: 37.5562, lng: 126.9235 },
    position: { left: "42%", top: "31%" },
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
    redevelopment: "신속통합기획 520m",
    redevelopmentSignal: "medium",
    hiddenYield: "검토 필요",
    confidence: "중간",
    status: "partial",
    lastChecked: "2026.06.06 05:38",
    risks: ["공실률 보정 필요", "최근 고가 거래 영향"],
    nextActions: ["공실 임대료 재산정", "대출한도 보수 시나리오", "매입가 하향 기준 산출"],
    scenarios: ["유지보수", "리모델링"],
  },
  {
    id: "bm-map-003",
    address: "서울 마포구 망원동 399-4",
    district: "망리단길 생활상권",
    use: "제2종근린생활시설",
    coordinates: { lat: 37.5551, lng: 126.9064 },
    position: { left: "31%", top: "60%" },
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
    redevelopment: "재정비촉진 310m",
    redevelopmentSignal: "watch",
    hiddenYield: "근거 부족",
    confidence: "보강 필요",
    status: "queued",
    lastChecked: "분석 대기",
    risks: ["좌표 보강 대기", "상권 매출 최신성 낮음"],
    nextActions: ["PNU 보강", "상권 반경 재조회", "현장 확인 후보 등록"],
    scenarios: ["리모델링", "신축"],
  },
]

const transactions = [
  { label: "2026.06", value: "58.2억", tone: "bg-sky-500" },
  { label: "2026.05", value: "50.1억", tone: "bg-cyan-500" },
  { label: "2026.04", value: "62.0억", tone: "bg-blue-500" },
  { label: "2026.03", value: "45.6억", tone: "bg-indigo-500" },
]

const zones = [
  {
    id: "zone-1",
    label: "가로주택정비",
    className: "left-[49%] top-[24%] h-[25%] w-[31%] rotate-[-10deg] bg-amber-400/28 border-amber-500/60",
  },
  {
    id: "zone-2",
    label: "신속통합기획",
    className: "left-[20%] top-[50%] h-[22%] w-[28%] rotate-[8deg] bg-rose-400/22 border-rose-500/50",
  },
  {
    id: "zone-3",
    label: "재정비촉진",
    className: "left-[64%] top-[58%] h-[19%] w-[23%] rotate-[4deg] bg-emerald-400/20 border-emerald-500/50",
  },
]

function statusBadge(status: DataStatus) {
  if (status === "ready") {
    return { label: "ready", className: "border-emerald-200 bg-emerald-50 text-emerald-700" }
  }
  if (status === "partial") {
    return { label: "partial", className: "border-amber-200 bg-amber-50 text-amber-700" }
  }
  return { label: "queued", className: "border-violet-200 bg-violet-50 text-violet-700" }
}

function signalTone(signal: BuildingSignal["redevelopmentSignal"]) {
  if (signal === "strong") return "border-amber-300 bg-amber-50 text-amber-800"
  if (signal === "medium") return "border-sky-300 bg-sky-50 text-sky-800"
  return "border-violet-300 bg-violet-50 text-violet-800"
}

function mockLlmAnswer(selected: BuildingSignal, prompt: MockPromptKey) {
  if (prompt === "price") {
    return `희망가 ${selected.price}는 역산 적정가 ${selected.maxPurchasePrice} 대비 높게 보입니다. 협상 기준은 DSCR ${selected.dscr} 유지와 월 이자 ${selected.interest} 부담을 동시에 맞추는 선으로 잡는 것이 좋습니다.`
  }
  if (prompt === "redevelopment") {
    return `${selected.redevelopment} 신호는 ${selected.hiddenYield} 단계입니다. 지금은 프리미엄 확정값이 아니라 거리, 단계, 표본 수, 좌표 정확도를 묶은 검토 신호로 표시하는 것이 안전합니다.`
  }
  if (prompt === "risk") {
    return `우선 리스크는 ${selected.risks.join(", ")}입니다. 은행 제출 전에는 임대차 명세, 최근 거래 비교, 보수적 대출한도 시나리오를 먼저 확인해야 합니다.`
  }
  return `${selected.district} 후보는 Bankability ${selected.bankability}점입니다. 핵심은 DSCR ${selected.dscr}, LTV ${selected.ltv}, NOI ${selected.noi}이고, 추천 시나리오는 ${selected.scenarios.join(" / ")}입니다.`
}

export default function MapPage() {
  const [selectedId, setSelectedId] = useState(buildings[0].id)
  const [statusOpen, setStatusOpen] = useState(false)
  const [capsuleOpen, setCapsuleOpen] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const [activePrompt, setActivePrompt] = useState<MockPromptKey>("bankability")
  const [selectedScenario, setSelectedScenario] = useState(buildings[0].scenarios[0])
  const [savedIds, setSavedIds] = useState<string[]>([buildings[0].id])
  const [viewedBuildingIds, setViewedBuildingIds] = useState<string[]>(buildings.slice(0, 3).map((building) => building.id))
  const [isKakaoReady, setIsKakaoReady] = useState(false)
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null)
  const [bboxApi, setBboxApi] = useState<BboxApiState>({
    status: "idle",
    count: buildings.length,
    bboxLabel: "mock bbox 대기",
    source: "local-mock",
  })
  const [activeLayers, setActiveLayers] = useState<Record<LayerKey, boolean>>({
    redevelopment: true,
    transactions: true,
    vitality: true,
    saved: true,
  })

  const selected = useMemo(
    () => buildings.find((building) => building.id === selectedId) ?? buildings[0],
    [selectedId]
  )

  const selectedStatus = statusBadge(selected.status)
  const isSaved = savedIds.includes(selected.id)
  const viewedBuildings = useMemo(
    () =>
      viewedBuildingIds
        .map((id) => buildings.find((building) => building.id === id))
        .filter((building): building is BuildingSignal => Boolean(building)),
    [viewedBuildingIds]
  )

  const toggleLayer = (key: LayerKey) => {
    setActiveLayers((current) => ({ ...current, [key]: !current[key] }))
  }

  const selectBuilding = useCallback((id: string) => {
    const next = buildings.find((building) => building.id === id)
    if (!next) return
    setSelectedId(id)
    setViewedBuildingIds((current) => [id, ...current.filter((currentId) => currentId !== id)].slice(0, 3))
    setSelectedScenario(next.scenarios[0] ?? "")
    setActivePrompt("bankability")
    setStatusOpen(true)
    setCapsuleOpen(true)
  }, [])

  const toggleSaved = () => {
    setSavedIds((current) =>
      current.includes(selected.id)
        ? current.filter((id) => id !== selected.id)
        : [...current, selected.id]
    )
  }

  const closeCapsule = useCallback(() => {
    setCapsuleOpen(false)
    setStatusOpen(false)
  }, [])

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
        setBboxApi((current) => ({
          ...current,
          status: "loading",
          bboxLabel: mapViewport.bboxParam,
        }))

        const params = new URLSearchParams({
          bbox: mapViewport.bboxParam,
          level: String(mapViewport.level),
        })
        const response = await fetch(`/api/map/building-signals?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("bbox API failed")
        }

        const data = (await response.json()) as {
          count?: number
          bbox?: string
          source?: string
        }

        setBboxApi({
          status: "ready",
          count: data.count ?? buildings.length,
          bboxLabel: data.bbox ?? mapViewport.bboxParam,
          source: data.source ?? "local-mock",
        })
      } catch {
        if (controller.signal.aborted) return
        setBboxApi((current) => ({
          ...current,
          status: "error",
          source: "local-mock",
        }))
      }
    }

    loadBboxSignals()

    return () => controller.abort()
  }, [mapViewport])

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
              <h1 className="text-lg font-semibold leading-tight text-zinc-950">서울 딜 레이더</h1>
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
                className={cn(
                  "h-10 rounded-lg border-zinc-200 bg-white",
                  filterOpen && "border-zinc-900 bg-zinc-100"
                )}
                onClick={() => setFilterOpen((open) => !open)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                필터
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
          isKakaoReady={isKakaoReady}
          mapViewport={mapViewport}
          savedIds={savedIds}
          selected={selected}
          selectedScenario={selectedScenario}
          capsuleOpen={capsuleOpen}
          onScenarioChange={setSelectedScenario}
          onSelect={selectBuilding}
          onCloseCapsule={closeCapsule}
          onCloseBuildingPanels={closeBuildingPanels}
          onKakaoReadyChange={setIsKakaoReady}
          onViewportChange={handleViewportChange}
        />

        <div
          className={cn(
            "absolute left-4 top-4 z-30 flex w-[calc(100%-2rem)] max-w-[380px] flex-col rounded-lg border border-white/80 bg-white/70 shadow-2xl backdrop-blur-md transition-[bottom] duration-300 md:left-5 md:top-5",
            statusOpen ? "bottom-[calc(33vh+1.25rem)]" : "bottom-5"
          )}
        >
          <div className="flex items-center justify-between border-b border-white/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-zinc-700" />
              <div>
                <p className="text-sm font-semibold">BuildMore LLM</p>
                <p className="text-[11px] text-zinc-500">선택 건물 근거와 다음 액션</p>
              </div>
            </div>
            <Badge className={cn("rounded-md border px-2 py-1 text-xs", selectedStatus.className)}>
              {selectedStatus.label}
            </Badge>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-zinc-500">후보 quick switch</p>
              <div className="grid gap-2">
                {viewedBuildings.map((building) => (
                  <button
                    key={building.id}
                    type="button"
                    onClick={() => selectBuilding(building.id)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition",
                      selected.id === building.id
                        ? "border-zinc-900 bg-zinc-950 text-white"
                        : "border-zinc-200 bg-white/90 text-zinc-800 hover:border-zinc-300 hover:bg-white"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold">{building.district}</span>
                      <span className={cn("block text-[11px]", selected.id === building.id ? "text-zinc-300" : "text-zinc-500")}>
                        {building.price} · {building.scenarios.join(" / ")}
                      </span>
                    </span>
                    <span className={cn("rounded border px-1.5 py-0.5 text-[10px]", statusBadge(building.status).className)}>
                      {statusBadge(building.status).label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-zinc-950/95 px-3 py-2.5 text-sm leading-6 text-white shadow-sm">
              {mockLlmAnswer(selected, activePrompt)}
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white/90 px-3 py-2.5 text-sm leading-6 text-zinc-700 shadow-sm">
              숨은 수익률은 확정값보다 <span className="font-semibold text-zinc-950">신호/근거/신뢰도</span>로
              봐야 합니다. 하단 상태창에서 표본, 리스크, 다음 액션을 함께 확인하세요.
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(promptLabels) as MockPromptKey[]).map((key) => (
                <PromptChip
                  key={key}
                  label={promptLabels[key]}
                  active={activePrompt === key}
                  onClick={() => setActivePrompt(key)}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-white/60 p-3">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/90 px-3 py-2 shadow-sm">
              <Input
                readOnly
                value={promptLabels[activePrompt]}
                className="h-8 border-0 px-0 text-sm shadow-none focus-visible:ring-0"
                aria-label="LLM 질문"
              />
              <Button size="icon" className="h-8 w-8 shrink-0 rounded-md bg-zinc-950 text-white">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {filterOpen && (
          <div className="absolute right-4 top-4 z-40 w-[calc(100%-2rem)] max-w-sm rounded-lg border border-white/80 bg-white/95 p-4 shadow-2xl backdrop-blur md:right-5 md:top-20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">지도 필터 mock</p>
                <p className="text-xs text-zinc-500">실제 bbox API 연결 전 화면 상태를 먼저 검증합니다.</p>
              </div>
              <Button variant="outline" size="sm" className="h-8 rounded-md" onClick={() => setFilterOpen(false)}>
                닫기
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-zinc-500">레이어</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(layerLabels) as LayerKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleLayer(key)}
                      className={cn(
                        "flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition",
                        activeLayers[key]
                          ? "border-zinc-300 bg-white text-zinc-900 shadow-sm"
                          : "border-zinc-200 bg-zinc-100 text-zinc-400"
                      )}
                    >
                      <span className={cn("h-2.5 w-2.5 rounded-full", layerColors[key])} />
                      {layerLabels[key]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-zinc-500">금융 조건</p>
                <div className="grid grid-cols-3 gap-2">
                  <FilterChip label="Bank 70+" active />
                  <FilterChip label="DSCR 1.2+" active />
                  <FilterChip label="LTV 60↓" />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-zinc-500">개발 시나리오</p>
                <div className="grid grid-cols-4 gap-2">
                  {["유지보수", "리모델링", "증축", "신축"].map((scenario) => (
                    <FilterChip key={scenario} label={scenario} active={selected.scenarios.includes(scenario)} />
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-600">
                bbox API: {bboxApi.status} · 줌 {mapViewport?.level ?? "-"} · 후보 {bboxApi.count}건 · 저장{" "}
                {savedIds.length}건
                <span className="mt-1 block truncate text-[11px] text-zinc-500">
                  {bboxApi.source} · {bboxApi.bboxLabel}
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setStatusOpen((open) => !open)}
          className={cn(
            "absolute left-1/2 z-40 flex h-11 w-16 -translate-x-1/2 items-center justify-center rounded-t-lg border border-zinc-200 bg-white text-zinc-900 shadow-lg transition",
            statusOpen ? "bottom-[33vh]" : "bottom-0"
          )}
          aria-label={statusOpen ? "건물 상태창 닫기" : "건물 상태창 열기"}
        >
          {statusOpen ? <ArrowDown className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
        </button>

        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-30 h-[33vh] min-h-[250px] max-h-[380px] border-t border-zinc-200 bg-white/70 shadow-2xl backdrop-blur-md transition-transform duration-300",
            statusOpen ? "translate-y-0" : "translate-y-full"
          )}
        >
          <StatusDrawer
            selected={selected}
            selectedScenario={selectedScenario}
            isSaved={isSaved}
            onScenarioChange={setSelectedScenario}
          />
        </div>
      </section>
    </main>
  )
}

function MapSurface({
  activeLayers,
  isKakaoReady,
  mapViewport,
  savedIds,
  selected,
  selectedScenario,
  capsuleOpen,
  onScenarioChange,
  onSelect,
  onCloseCapsule,
  onCloseBuildingPanels,
  onKakaoReadyChange,
  onViewportChange,
}: {
  activeLayers: Record<LayerKey, boolean>
  isKakaoReady: boolean
  mapViewport: MapViewport | null
  savedIds: string[]
  selected: BuildingSignal
  selectedScenario: string
  capsuleOpen: boolean
  onScenarioChange: (scenario: string) => void
  onSelect: (id: string) => void
  onCloseCapsule: () => void
  onCloseBuildingPanels: () => void
  onKakaoReadyChange: (ready: boolean) => void
  onViewportChange: (viewport: MapViewport) => void
}) {
  const pointerStartRef = useRef<{ x: number; y: number; dragged: boolean } | null>(null)

  const handleMapPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      dragged: false,
    }
  }

  const handleMapPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current
    if (!start) return

    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y)
    if (distance > 6) {
      start.dragged = true
    }
  }

  const handleMapClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.closest("[data-native-card]")) {
      pointerStartRef.current = null
      return
    }

    const start = pointerStartRef.current
    pointerStartRef.current = null

    if (start?.dragged) return
    onCloseBuildingPanels()
  }

  return (
    <div
      className="absolute inset-0"
      onClick={handleMapClick}
      onPointerDown={handleMapPointerDown}
      onPointerMove={handleMapPointerMove}
    >
      <KakaoMapCanvas
        capsuleOpen={capsuleOpen}
        savedIds={savedIds}
        selected={selected}
        selectedScenario={selectedScenario}
        selectedId={selected.id}
        onKakaoReadyChange={onKakaoReadyChange}
        onCloseCapsule={onCloseCapsule}
        onScenarioChange={onScenarioChange}
        onSelect={onSelect}
        onViewportChange={onViewportChange}
      />
      {!isKakaoReady && (
        <>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(63,63,70,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(63,63,70,0.08)_1px,transparent_1px)] bg-[size:44px_44px] opacity-55" />

      {activeLayers.redevelopment && (
        <div className="absolute inset-0">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={cn("absolute rounded-lg border-2", zone.className)}
              style={{ clipPath: "polygon(12% 0, 100% 12%, 86% 100%, 0 72%)" }}
            >
              <span className="absolute left-3 top-3 rounded-md bg-white/85 px-2 py-1 text-xs font-semibold text-zinc-800 shadow-sm">
                {zone.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeLayers.transactions && (
        <div className="absolute bottom-5 left-5 z-10 hidden rounded-lg border border-white/70 bg-white/90 p-3 shadow-sm backdrop-blur md:block">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4" />
            주변 실거래
          </div>
          <div className="grid grid-cols-2 gap-2">
            {transactions.map((item) => (
              <div key={item.label} className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", item.tone)} />
                  <span className="text-xs text-zinc-500">{item.label}</span>
                </div>
                <p className="mt-1 text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

        </>
      )}

      {!isKakaoReady && buildings.map((building) => {
        const isSelected = building.id === selected.id
        const badge = statusBadge(building.status)
        const screenPosition = getBuildingViewportPosition(building, mapViewport)

        return (
          <button
            key={building.id}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onSelect(building.id)
            }}
            className={cn(
              "absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-lg border bg-white px-3 py-2 text-left shadow-lg transition hover:-translate-y-[54%] hover:shadow-xl",
              isSelected ? "border-zinc-950" : "border-white/80",
              savedIds.includes(building.id) && "ring-2 ring-emerald-400/70"
            )}
            style={screenPosition}
          >
            <span
              className={cn(
                "h-3 w-3 rounded-full",
                building.redevelopmentSignal === "strong"
                  ? "bg-amber-500"
                  : building.redevelopmentSignal === "medium"
                    ? "bg-sky-500"
                    : "bg-violet-500"
              )}
            />
            <span className="min-w-0">
              <span className="block max-w-32 truncate text-xs font-semibold">{building.district}</span>
              <span className="block text-[11px] text-zinc-500">{building.price}</span>
            </span>
            <span className={cn("rounded border px-1.5 py-0.5 text-[10px]", badge.className)}>{badge.label}</span>
          </button>
        )
      })}

      {capsuleOpen && !isKakaoReady && (
        <div
          className="absolute z-50 w-[310px] -translate-x-1/2 -translate-y-[118%] rounded-lg border border-white/80 bg-white/70 p-3 shadow-2xl backdrop-blur-md"
          style={getBuildingViewportPosition(selected, mapViewport)}
          onPointerDown={(event) => {
            event.stopPropagation()
            if ((event.target as HTMLElement).closest("[data-close-capsule]")) {
              onCloseCapsule()
            }
          }}
          onClick={(event) => event.stopPropagation()}
        >
        <div className="rounded-lg border border-zinc-200 bg-white/90 p-2.5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-zinc-500">{selected.district}</p>
              <h3 className="mt-1 text-sm font-semibold leading-snug">{selected.address}</h3>
            </div>
            <button
              type="button"
              onPointerDown={(event) => {
                event.stopPropagation()
                onCloseCapsule()
              }}
              onClick={(event) => {
                event.stopPropagation()
                onCloseCapsule()
              }}
              data-close-capsule
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
              aria-label="선택 건물 정보창 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Metric label="Bank" value={`${selected.bankability}`} small />
          <Metric label="DSCR" value={selected.dscr} small />
          <Metric label="Cap" value={selected.capRate} small />
        </div>
        <div className="mt-2 rounded-lg bg-zinc-950/95 px-3 py-2 text-xs text-white shadow-sm">
          {selected.redevelopment} · 숨은 수익률 {selected.hiddenYield}
        </div>
        <div className="mt-2 rounded-lg border border-zinc-200 bg-white/90 p-2 shadow-sm">
          <p className="mb-2 text-[11px] font-semibold text-zinc-500">추천 매각/개발 시나리오</p>
          <div className="flex flex-wrap gap-1.5">
            {selected.scenarios.map((scenario) => (
              <button
                key={scenario}
                type="button"
                onClick={() => onScenarioChange(scenario)}
                className={cn(
                  "rounded-md border px-2 py-1 text-[11px] font-semibold transition",
                  selectedScenario === scenario
                    ? "border-zinc-900 bg-zinc-950 text-white"
                    : "border-amber-200 bg-amber-50/95 text-amber-800 hover:border-amber-300"
                )}
              >
                {scenario}
              </button>
            ))}
          </div>
          <Link
            href="/analysis"
            className="mt-2 flex h-8 items-center justify-center rounded-md bg-zinc-950 px-3 text-xs font-semibold text-white transition hover:bg-zinc-800"
          >
            개발 시나리오 분석
          </Link>
        </div>
      </div>
      )}
      <div className="absolute bottom-5 right-5 z-20 flex gap-2" onClick={(event) => event.stopPropagation()}>
        <Button variant="outline" className="h-10 rounded-lg border-white/80 bg-white/92">
          <RefreshCw className="h-4 w-4" />
          새로고침
        </Button>
        <Button className="h-10 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800">
          <MapPin className="h-4 w-4" />
          선택 분석
        </Button>
      </div>
    </div>
  )
}

function KakaoMapCanvas({
  capsuleOpen,
  savedIds,
  selected,
  selectedScenario,
  selectedId,
  onKakaoReadyChange,
  onCloseCapsule,
  onScenarioChange,
  onSelect,
  onViewportChange,
}: {
  capsuleOpen: boolean
  savedIds: string[]
  selected: BuildingSignal
  selectedScenario: string
  selectedId: string
  onKakaoReadyChange: (ready: boolean) => void
  onCloseCapsule: () => void
  onScenarioChange: (scenario: string) => void
  onSelect: (id: string) => void
  onViewportChange: (viewport: MapViewport) => void
}) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<KakaoMapInstance | null>(null)
  const [status, setStatus] = useState<KakaoLoadStatus>("loading")
  const [message, setMessage] = useState("카카오맵을 불러오는 중")

  useEffect(() => {
    let cancelled = false

    const activateFallback = (nextMessage: string) => {
      if (cancelled) return
      onKakaoReadyChange(false)
      setStatus("fallback")
      setMessage(nextMessage)
      onViewportChange(createFallbackViewport())
    }

    const createMap = () => {
      const kakaoMaps = getKakaoMaps()
      if (cancelled || !mapRef.current || !kakaoMaps) return

      try {
        kakaoMaps.load(() => {
          const loadedKakaoMaps = getKakaoMaps()
          if (cancelled || !mapRef.current || !loadedKakaoMaps) return

          const center = new loadedKakaoMaps.LatLng(mapCenter.lat, mapCenter.lng)
          const map = new loadedKakaoMaps.Map(mapRef.current, {
            center,
            level: 4,
          })
          mapInstanceRef.current = map

          const publishViewport = () => {
            const bounds = map.getBounds()
            const southWest = bounds.getSouthWest()
            const northEast = bounds.getNorthEast()
            const swLat = southWest.getLat()
            const swLng = southWest.getLng()
            const neLat = northEast.getLat()
            const neLng = northEast.getLng()
            const bboxParam = [swLng, swLat, neLng, neLat].map((value) => value.toFixed(6)).join(",")

            onViewportChange({
              swLat,
              swLng,
              neLat,
              neLng,
              level: map.getLevel(),
              bboxParam,
            })
          }

          publishViewport()
          loadedKakaoMaps.event?.addListener(map, "idle", publishViewport)
          loadedKakaoMaps.event?.addListener(map, "zoom_changed", publishViewport)
          setStatus("ready")
          onKakaoReadyChange(true)
          setMessage("카카오맵 surface · bbox sync")
        })
      } catch {
        activateFallback("카카오맵 로딩 실패 · mock fallback · bbox mock")
      }
    }

    const loadMap = async () => {
      try {
        const response = await fetch("/api/config/kakao-map-key")
        if (!response.ok) {
          activateFallback("카카오맵 키 없음 · mock fallback · bbox mock")
          return
        }

        const data = (await response.json()) as { kakaoMapKey?: string }
        if (!data.kakaoMapKey) {
          activateFallback("카카오맵 키 없음 · mock fallback · bbox mock")
          return
        }

        const existingScript = document.getElementById(KAKAO_SCRIPT_ID)
        if (existingScript) {
          if (getKakaoMaps()) {
            createMap()
            return
          }
          existingScript.addEventListener("load", createMap, { once: true })
          existingScript.addEventListener(
            "error",
            () => {
              activateFallback("카카오맵 스크립트 실패 · mock fallback · bbox mock")
            },
            { once: true }
          )
          return
        }

        const script = document.createElement("script")
        script.id = KAKAO_SCRIPT_ID
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${data.kakaoMapKey}&autoload=false`
        script.async = true
        script.onload = createMap
        script.onerror = () => {
          activateFallback("카카오맵 도메인/스크립트 실패 · mock fallback · bbox mock")
        }
        document.head.appendChild(script)
      } catch {
        activateFallback("카카오맵 설정 API 실패 · mock fallback · bbox mock")
      }
    }

    loadMap()

    return () => {
      cancelled = true
      mapInstanceRef.current = null
      onKakaoReadyChange(false)
    }
  }, [onKakaoReadyChange, onViewportChange])

  useEffect(() => {
    const map = mapInstanceRef.current
    const kakaoMaps = getKakaoMaps()
    if (status !== "ready" || !map || !kakaoMaps) return

    const overlays = buildings.map((building) => {
      const isSelected = building.id === selectedId
      const isSaved = savedIds.includes(building.id)
      const tone =
        building.redevelopmentSignal === "strong"
          ? "#f59e0b"
          : building.redevelopmentSignal === "medium"
            ? "#0ea5e9"
            : "#8b5cf6"

      const content = document.createElement("div")
      content.setAttribute("aria-label", `${building.district} ${building.price} ${building.status}`)
      content.style.cssText = [
        "position:relative",
        "width:196px",
        "padding-bottom:12px",
        "font-family:inherit",
      ].join(";")
      content.innerHTML = `
        <button type="button" data-native-card style="
          display:flex;
          align-items:center;
          gap:8px;
          width:196px;
          padding:8px 10px;
          border-radius:8px;
          border:1px solid ${isSelected ? "#18181b" : "rgba(255,255,255,.85)"};
          background:rgba(255,255,255,.96);
          box-shadow:0 10px 22px rgba(15,23,42,.18);
          font-family:inherit;
          text-align:left;
          cursor:pointer;
          ${isSaved ? "outline:2px solid rgba(52,211,153,.72);" : "outline:none;"}
        ">
          <span style="width:12px;height:12px;border-radius:999px;background:${tone};flex:0 0 auto"></span>
          <span style="min-width:0;flex:1">
            <span style="display:block;max-width:128px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:700;color:#18181b">${building.district}</span>
            <span style="display:block;font-size:11px;color:#71717a">${building.price}</span>
          </span>
          <span style="border:1px solid #e4e4e7;border-radius:4px;padding:2px 6px;font-size:10px;color:#3f3f46;background:#fafafa">${building.status}</span>
        </button>
        <span aria-hidden="true" style="
          position:absolute;
          left:22px;
          bottom:0;
          width:18px;
          height:12px;
          background:rgba(255,255,255,.96);
          clip-path:polygon(0 0, 100% 0, 0 100%);
          filter:drop-shadow(0 5px 4px rgba(15,23,42,.16));
        "></span>
      `
      const stopNativeCardPropagation = (event: Event) => {
        event.stopPropagation()
      }
      content.addEventListener("pointerdown", stopNativeCardPropagation)
      content.addEventListener("mousedown", stopNativeCardPropagation)
      content.addEventListener("touchstart", stopNativeCardPropagation)
      content.addEventListener("click", (event) => {
        event.preventDefault()
        event.stopPropagation()
        onSelect(building.id)
      }, true)
      const cardButton = content.querySelector("[data-native-card]")
      cardButton?.addEventListener("click", (event) => {
        event.preventDefault()
        event.stopPropagation()
        onSelect(building.id)
      })

      const overlay = new kakaoMaps.CustomOverlay({
        map,
        position: new kakaoMaps.LatLng(building.coordinates.lat, building.coordinates.lng),
        content,
        xAnchor: 0.112,
        yAnchor: 1,
        zIndex: isSelected ? 40 : 30,
        clickable: true,
      })

      return overlay
    })

    if (capsuleOpen) {
      overlays.push(
        new kakaoMaps.Polygon({
          map,
          path: createMockParcelPath(selected).map(
            (point) => new kakaoMaps.LatLng(point.lat, point.lng)
          ),
          strokeWeight: 2,
          strokeColor: "#dc2626",
          strokeOpacity: 0.85,
          fillColor: "#ef4444",
          fillOpacity: 0.5,
          zIndex: 20,
        })
      )

      const capsule = document.createElement("div")
      capsule.style.cssText = [
        "width:310px",
        "padding:12px",
        "border-radius:8px",
        "border:1px solid rgba(255,255,255,.8)",
        "background:rgba(255,255,255,.72)",
        "box-shadow:0 22px 44px rgba(15,23,42,.24)",
        "backdrop-filter:blur(12px)",
        "font-family:inherit",
      ].join(";")
      capsule.innerHTML = `
        <div style="border:1px solid #e4e4e7;border-radius:8px;background:rgba(255,255,255,.92);padding:10px;box-shadow:0 1px 4px rgba(15,23,42,.06)">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
            <div>
              <p style="margin:0;font-size:12px;font-weight:500;color:#71717a">${selected.district}</p>
              <h3 style="margin:4px 0 0;font-size:14px;line-height:1.35;font-weight:700;color:#18181b">${selected.address}</h3>
            </div>
            <button type="button" data-native-close style="display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:6px;border:1px solid #e4e4e7;background:white;color:#71717a;cursor:pointer">×</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px">
          <div style="border:1px solid #e4e4e7;border-radius:8px;background:white;padding:8px"><p style="margin:0;font-size:11px;color:#71717a">Bank</p><p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#18181b">${selected.bankability}</p></div>
          <div style="border:1px solid #e4e4e7;border-radius:8px;background:white;padding:8px"><p style="margin:0;font-size:11px;color:#71717a">DSCR</p><p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#18181b">${selected.dscr}</p></div>
          <div style="border:1px solid #e4e4e7;border-radius:8px;background:white;padding:8px"><p style="margin:0;font-size:11px;color:#71717a">Cap</p><p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#18181b">${selected.capRate}</p></div>
        </div>
        <div style="margin-top:8px;border-radius:8px;background:rgba(24,24,27,.96);padding:8px 12px;font-size:12px;color:white">${selected.redevelopment} · 숨은 수익률 ${selected.hiddenYield}</div>
        <div style="margin-top:8px;border:1px solid #e4e4e7;border-radius:8px;background:rgba(255,255,255,.92);padding:8px;box-shadow:0 1px 4px rgba(15,23,42,.06)">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#71717a">추천 매각/개발 시나리오</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${selected.scenarios
              .map(
                (scenario) =>
                  `<button type="button" data-native-scenario="${scenario}" style="border-radius:6px;border:1px solid ${
                    selectedScenario === scenario ? "#18181b" : "#fde68a"
                  };background:${selectedScenario === scenario ? "#18181b" : "#fffbeb"};color:${
                    selectedScenario === scenario ? "white" : "#92400e"
                  };padding:4px 8px;font-size:11px;font-weight:700;cursor:pointer">${scenario}</button>`
              )
              .join("")}
          </div>
          <a href="/analysis" style="display:flex;height:32px;align-items:center;justify-content:center;margin-top:8px;border-radius:6px;background:#18181b;color:white;text-decoration:none;font-size:12px;font-weight:700">개발 시나리오 분석</a>
        </div>
      `
      capsule.addEventListener("click", (event) => {
        event.stopPropagation()
        const target = event.target as HTMLElement
        if (target.closest("[data-native-close]")) {
          onCloseCapsule()
          return
        }
        const scenario = target.closest("[data-native-scenario]")?.getAttribute("data-native-scenario")
        if (scenario) {
          onScenarioChange(scenario)
        }
      })
      const closeButton = capsule.querySelector("[data-native-close]")
      closeButton?.addEventListener("pointerdown", (event) => {
        event.preventDefault()
        event.stopPropagation()
      })
      closeButton?.addEventListener("click", (event) => {
        event.preventDefault()
        event.stopPropagation()
        onCloseCapsule()
      })

      overlays.push(
        new kakaoMaps.CustomOverlay({
          map,
          position: new kakaoMaps.LatLng(selected.coordinates.lat, selected.coordinates.lng),
          content: capsule,
          xAnchor: 0.5,
          yAnchor: 1.15,
          zIndex: 60,
          clickable: true,
        })
      )
    }

    return () => {
      overlays.forEach((overlay) => overlay.setMap(null))
    }
  }, [capsuleOpen, onCloseCapsule, onScenarioChange, onSelect, savedIds, selected, selectedId, selectedScenario, status])

  return (
    <div className="absolute inset-0 bg-[#dfe7dc]">
      <div ref={mapRef} className={cn("absolute inset-0", status !== "ready" && "opacity-0")} />
      {status !== "ready" && (
        <div className="absolute inset-0 bg-[#dfe7dc]">
          <div className="absolute left-[8%] top-[20%] h-4 w-[120%] rotate-[14deg] rounded-full bg-white/70 shadow-sm" />
          <div className="absolute left-[-15%] top-[48%] h-5 w-[120%] rotate-[-8deg] rounded-full bg-white/80 shadow-sm" />
          <div className="absolute left-[48%] top-[-5%] h-[120%] w-5 rotate-[5deg] rounded-full bg-white/75 shadow-sm" />
          <div className="absolute left-[22%] top-[10%] h-[95%] w-3 rotate-[-18deg] rounded-full bg-white/55" />
          <div className="absolute left-[76%] top-[12%] h-[80%] w-3 rotate-[20deg] rounded-full bg-white/55" />
        </div>
      )}
      <div className="absolute bottom-5 left-5 z-10 rounded-lg border border-white/70 bg-white/88 px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur">
        {message}
      </div>
    </div>
  )
}

function StatusDrawer({
  selected,
  selectedScenario,
  isSaved,
  onScenarioChange,
}: {
  selected: BuildingSignal
  selectedScenario: string
  isSaved: boolean
  onScenarioChange: (scenario: string) => void
}) {
  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden px-3 py-3 lg:px-5">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-zinc-500" />
            <p className="text-xs font-medium text-zinc-500">{selected.district}</p>
          </div>
          <h2 className="mt-0.5 text-base font-semibold leading-tight">{selected.address}</h2>
        </div>
        <Badge className={cn("rounded-md border px-2 py-1 text-xs", statusBadge(selected.status).className)}>
          {statusBadge(selected.status).label} · {selected.lastChecked} · {isSaved ? "저장됨" : "미저장"}
        </Badge>
      </div>

      <div className="grid flex-1 min-h-0 gap-2">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <CoreMetric icon={ShieldCheck} label="Bank" value={`${selected.bankability}`} />
          <CoreMetric icon={Activity} label="Ready" value={`${selected.readiness}`} />
          <CoreMetric icon={BarChart3} label="NOI" value={selected.noi} />
          <CoreMetric icon={CircleDollarSign} label="Equity" value={selected.equity} />
          <CoreMetric icon={TrendingUp} label="Cap" value={selected.capRate} />
          <CoreMetric icon={Database} label="DSCR/LTV" value={`${selected.dscr}/${selected.ltv}`} />
        </div>

        <div className="grid min-h-0 gap-2 md:grid-cols-[1.2fr_1fr_1fr]">
          <div className="rounded-lg border border-zinc-200 bg-white/90 p-2.5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold">딜 판단 핵심</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <CompactFact label="희망가" value={selected.price} />
              <CompactFact label="적정가" value={selected.maxPurchasePrice} />
              <CompactFact label="월 이자" value={selected.interest} />
            </div>
            <div className={cn("mt-2 rounded-lg border px-2.5 py-2", signalTone(selected.redevelopmentSignal))}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold">{selected.redevelopment}</span>
                <span>신뢰도 {selected.confidence}</span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200 bg-white/90 px-2.5 py-2 text-xs">
              <span className="mr-1 text-zinc-500">추천 진행안</span>
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

          <div className="rounded-lg border border-zinc-200 bg-white/90 p-2.5">
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

          <div className="rounded-lg border border-zinc-200 bg-white/90 p-2.5">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-600" />
              <h3 className="text-sm font-semibold">다음 액션</h3>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-700">
              {selected.nextActions.slice(0, 2).map((action, index) => (
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

function FilterChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-8 items-center justify-center rounded-lg border px-2 text-center text-[11px] font-semibold",
        active
          ? "border-zinc-900 bg-zinc-950 text-white"
          : "border-zinc-200 bg-white text-zinc-500"
      )}
    >
      {label}
    </span>
  )
}

function PromptChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
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

function CoreMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity
  label: string
  value: string
}) {
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

function CompactFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white/90 px-2 py-1.5">
      <p className="text-[10px] font-medium text-zinc-500">{label}</p>
      <p className="mt-0.5 truncate text-xs font-semibold text-zinc-950">{value}</p>
    </div>
  )
}

function Metric({
  label,
  value,
  small = false,
}: {
  label: string
  value: string
  small?: boolean
}) {
  return (
    <div className={cn("rounded-lg border border-zinc-200 bg-white", small ? "px-2 py-2" : "px-3 py-2")}>
      <p className="text-[11px] font-medium text-zinc-500">{label}</p>
      <p className={cn("mt-1 font-semibold text-zinc-950", small ? "text-sm" : "text-sm")}>{value}</p>
    </div>
  )
}
