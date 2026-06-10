"use client"

import { useState, useCallback, useEffect, useRef, type SetStateAction } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { AnalysisCTA } from "./components/AnalysisCTA"
import { NewsTicker } from "./components/NewsTicker"
import { KpiGroup } from "./components/KpiGroup"
import {
  StrategyTabPanel,
  type AnalysisStrategy,
  type StrategyPersonaKey,
} from "./components/StrategyTabPanel"
import { useDealAnalysis } from "@/hooks/useDealAnalysis"
import { useKakaoMap } from "@/hooks/useKakaoMap"
import type { DealInput } from "@/lib/analysis/dealAnalysisEngine"
import ReactMarkdown from "react-markdown"
import {
  Plus,
  FolderOpen,
  MapPin,
  FileText,
  Database,
  Building2,
  Settings,
  Send,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Map,
  Clock,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from "lucide-react"

// ============================================================
// TYPES
// ============================================================
interface MapProperty {
  id: string
  address: string
  shortAddress: string
  price: number
  rent: number
  area: string
  position: { left: string; top: string }
}

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: Date
  suggestedQuestions?: Array<{
    id: string
    label: string
    prompt: string
  }>
}

interface AddressProps {
  zoning: string | null
  bcrat: number | null
  vlrat: number | null
  area_m2: number | null
  land_price_per_m2: number | null
  built_year: number | null
  floors_above: number | null
}

interface BuildingRegistryTitle {
  permit_year: number | null
  use_approval_year: number | null
  floor_area_ratio: number | null
  building_coverage_ratio: number | null
  total_floor_area_m2: number | null
  source?: string
  status?: string
}

interface RentalContextMetric {
  metric_key: string
  label?: string
  metric_name_ko?: string
  value: number | string | boolean | null
  unit?: string
  source_type?: 'external_api' | 'internal_prefetch' | 'user_input' | 'derived_formula'
  status?: 'ready' | 'prefetched' | 'waiting_user_input' | 'waiting_dependency' | 'api_failed'
  missing_inputs?: string[]
  missing_dependencies?: string[]
}

interface RentalContext {
  status: string
  ready_metrics?: number
  waiting_user_input?: string[]
  waiting_user_input_labels?: string[]
  source_groups?: Record<string, string[]>
  api_probe?: Record<string, { label?: string; reason?: string; source_status?: string }>
  required_api_sites?: Array<{
    source_key: string
    site_name: string
    official_url?: string
    required_env?: string[]
    used_for?: string[]
  }>
  prefetched?: Record<string, number | string | null>
  metrics?: RentalContextMetric[]
  computed_at?: string
}

interface CommercialMetric {
  label: string
  value: number | string | null
  unit?: string
  source?: string
  status?: string
}

interface CommercialVitalityContext {
  commercial_area?: {
    trdar_cd?: string | null
    name?: string | null
    region_2depth?: string | null
    region_3depth?: string | null
    stat_year?: number | null
    stat_quarter?: number | null
  } | null
  metrics?: Record<string, CommercialMetric>
  axis_scores?: Record<string, number>
  derived_features?: Record<string, number | string | null>
  evidence?: string[]
  admin_dong_industry_sales?: {
    status?: string
    message?: string | null
    resolved_admin_dong?: {
      adstrd_cd?: string | null
      adstrd_cd_nm?: string | null
      sigungu?: string | null
      resolution?: string | null
    }
    top_industries?: Array<{
      quarter?: string | null
      adstrd_cd_nm?: string | null
      industry_code?: string | null
      industry_name?: string | null
      sales_amount_krw?: number | null
      sales_amount_manwon?: number | null
      transaction_count?: number | null
      weekend_sales_ratio?: number | null
      female_sales_ratio?: number | null
      dominant_age_group?: string | null
    }>
  }
  missing_metrics?: string[]
  insight?: {
    headline?: string
    area_type?: string
    strengths?: string[]
    weaknesses?: string[]
    finance_impact?: string
    next_actions?: string[]
    confidence_note?: string
    llm_status?: string
    model?: string
  } | null
}

interface SearchHistoryItem {
  address: string
  timestamp: number
}

type DealInputField = 'price' | 'loan' | 'rate' | 'rent' | 'deposit'

interface AddressSuggestion {
  address_name: string
  display_address?: string
  road_address?: string | null
  jibun_address?: string | null
  lat: number
  lng: number
  bjd_code?: string | null
  is_bjd_matched?: boolean
  region_1depth?: string | null
  region_2depth?: string | null
  region_3depth?: string | null
}

interface AnalysisHistoryItem {
  address: string
  score: number
  dealSignal: string
  timestamp: number
}


// ============================================================
// DATA
// ============================================================

const transactions = [
  { date: '2025.05.23', location: '합정동', area: '142㎡', price: '58.2억', pricePerM2: '4,099만', type: '상업' },
  { date: '2025.04.11', location: '서교동', area: '165㎡', price: '62.0억', pricePerM2: '3,758만', type: '다세대' },
  { date: '2025.03.28', location: '상수동', area: '118㎡', price: '45.6억', pricePerM2: '3,864만', type: '상업' },
  { date: '2025.02.14', location: '망원동', area: '132㎡', price: '41.8억', pricePerM2: '3,167만', type: '상업' },
  { date: '2025.01.19', location: '합정동', area: '156㎡', price: '54.4억', pricePerM2: '3,487만', type: '근생' },
  { date: '2024.12.07', location: '서교동', area: '149㎡', price: '50.1억', pricePerM2: '3,362만', type: '상업' },
  { date: '2024.11.22', location: '상수동', area: '171㎡', price: '64.5억', pricePerM2: '3,772만', type: '상업' },
]


function NumField({
  value,
  onChange,
  step,
  min = 0,
  disabled = false,
  isLoan = false,
  decimals = 0,
  displayDecimals,
}: {
  value: number
  onChange: (v: SetStateAction<number>) => void
  step: number
  min?: number
  disabled?: boolean
  isLoan?: boolean
  decimals?: number
  displayDecimals?: number
}) {
  const displayDecimal = displayDecimals !== undefined ? displayDecimals : decimals
  const formatValue = (v: number) =>
    displayDecimal > 0 ? v.toFixed(displayDecimal) : Math.round(v).toString()

  const [localValue, setLocalValue] = useState<string | null>(null)
  const isEditing = localValue !== null
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const repeatInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const detachReleaseListenersRef = useRef<(() => void) | null>(null)

  const stopRepeat = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    if (repeatInterval.current) {
      clearInterval(repeatInterval.current)
      repeatInterval.current = null
    }
    if (detachReleaseListenersRef.current) {
      detachReleaseListenersRef.current()
      detachReleaseListenersRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      stopRepeat()
    }
  }, [stopRepeat])

  const changeBy = useCallback((delta: number) => {
    onChange((prev) => parseFloat(Math.max(min, prev + delta).toFixed(decimals || 0)))
  }, [decimals, min, onChange])

  const startRepeat = useCallback((delta: number, pointerId: number, target: HTMLButtonElement) => {
    stopRepeat()
    target.setPointerCapture(pointerId)
    changeBy(delta)

    const stopAndDetach = () => {
      stopRepeat()
    }
    detachReleaseListenersRef.current = () => {
      window.removeEventListener('pointerup', stopAndDetach)
      window.removeEventListener('pointercancel', stopAndDetach)
      window.removeEventListener('touchend', stopAndDetach)
      window.removeEventListener('blur', stopAndDetach)
    }

    window.addEventListener('pointerup', stopAndDetach)
    window.addEventListener('pointercancel', stopAndDetach)
    window.addEventListener('touchend', stopAndDetach)
    window.addEventListener('blur', stopAndDetach)

    pressTimer.current = setTimeout(() => {
      repeatInterval.current = setInterval(() => {
        changeBy(delta)
      }, 80)
    }, 300)
  }, [changeBy, stopRepeat])

  const commitEdit = () => {
    if (localValue === null) return
    const parsed = parseFloat(localValue.replace(/,/g, ''))
    onChange(Math.max(min, isNaN(parsed) ? value : parseFloat(parsed.toFixed(decimals || 0))))
    setLocalValue(null)
  }

  return (
    <div className="grid grid-cols-[1fr_34px_34px] h-[38px] border border-border rounded-[10px] overflow-hidden">
      <input
        type="text"
        inputMode="decimal"
        value={isEditing ? localValue! : formatValue(value)}
        disabled={disabled}
        onFocus={() => setLocalValue(formatValue(value))}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { commitEdit(); (e.target as HTMLInputElement).blur() }
          if (e.key === 'Escape') { setLocalValue(null); (e.target as HTMLInputElement).blur() }
        }}
        className="border-0 px-2.5 text-sm bg-background disabled:bg-muted focus:outline-none focus:ring-0 cursor-text select-all"
      />
      <button
        onPointerDown={(e) => {
          e.preventDefault()
          startRepeat(-step, e.pointerId, e.currentTarget)
        }}
        onPointerUp={stopRepeat}
        onPointerCancel={stopRepeat}
        onLostPointerCapture={stopRepeat}
        disabled={disabled}
        className="border-l border-border bg-background hover:bg-muted disabled:opacity-50 text-base select-none touch-none"
        aria-label="값 감소"
      >
        −
      </button>
      <button
        onPointerDown={(e) => {
          e.preventDefault()
          startRepeat(step, e.pointerId, e.currentTarget)
        }}
        onPointerUp={stopRepeat}
        onPointerCancel={stopRepeat}
        onLostPointerCapture={stopRepeat}
        disabled={disabled}
        className="border-l border-border bg-background hover:bg-muted disabled:opacity-50 text-base select-none touch-none"
        aria-label="값 증가"
      >
        +
      </button>
    </div>
  )
}


// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AnalysisPage() {
  const hydratedFromMapRef = useRef(false)
  // ============================================================
  // A. SIDEBAR STATE (maintained from demo page)
  // ============================================================
  const [apiStatus, setApiStatus] = useState<'connected' | 'connecting'>('connecting')
  
  // ============================================================
  // B. CHAT STATE (Legacy - kept for reference)
  // ============================================================
  const initialChatMessages: ChatMessage[] = [
    {
      role: 'assistant',
      content: '분석을 시작합니다. 우측 패널에서 매입조건, 임대조건, 건축조건을 조정한 뒤 "분석 실행"을 누르면 이 매물의 매수 판단과 협상 포인트를 요약해드릴게요.'
    }
  ]
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages)
  const [inputValue, setInputValue] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // ============================================================
  // B-2. ANALYSIS HOOKS (New)
  // ============================================================
  const dealAnalysis = useDealAnalysis()
  const [hasRunAnalysis, setHasRunAnalysis] = useState(false)
  const [isCtaOpen, setIsCtaOpen] = useState(false)
  const [chatProvidedDealFields, setChatProvidedDealFields] = useState<DealInputField[]>([])
  const [chatPendingDealValues, setChatPendingDealValues] = useState<Partial<Record<DealInputField, number>>>({})
  const markDealFieldProvided = useCallback((field: DealInputField) => {
    setChatProvidedDealFields(prev => prev.includes(field) ? prev : [...prev, field])
  }, [])
  
  // ============================================================
  // B-3. SIDEBAR STATE (New)
  // ============================================================
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [applyTrigger, setApplyTrigger] = useState(0)

  // Address & history
  const [address, setAddress] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [addressProps, setAddressProps] = useState<AddressProps | null>(null)
  const [buildingRegistryTitle, setBuildingRegistryTitle] = useState<BuildingRegistryTitle | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [isSuggestingAddress, setIsSuggestingAddress] = useState(false)
  const [selectedAddressMeta, setSelectedAddressMeta] = useState<AddressSuggestion | null>(null)
  const [confirmedLocation, setConfirmedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('bm_search_history') || '[]') } catch { return [] }
  })
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('bm_analysis_history') || '[]') } catch { return [] }
  })
  
  // ============================================================
  // B-4. KAKAO MAP HOOK
  // ============================================================
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const { 
    mapRef, 
    modalMapRef,
    isLoading: mapLoading, 
    error: mapError,
    initModalMap 
  } = useKakaoMap({
    address: addressConfirmed ? address : '',
    latitude: addressConfirmed ? confirmedLocation?.lat : undefined,
    longitude: addressConfirmed ? confirmedLocation?.lng : undefined,
    zoom: 3,
  })

  // ============================================================
  // C. ANALYSIS PANEL STATE
  // ============================================================
  
  // Panel A: 매입조건
  const [price, setPrice] = useState(38.00)
  const [loan, setLoan] = useState(22.00)
  const [rate, setRate] = useState(4.80)
  
  // Panel B: 임대조건
  const [rent, setRent] = useState(320)
  const [deposit, setDeposit] = useState(5000)
  const [vacancyRate, setVacancyRate] = useState(20) // 공실률: 긍정 10 / 적정 20 / 보수 30
  const [vacancySensitivity, setVacancySensitivity] = useState(20) // 공실민감도: 게이지바 별도 값

  useEffect(() => {
    if (hydratedFromMapRef.current) return
    hydratedFromMapRef.current = true
    const searchParams = new URLSearchParams(window.location.search)

    const mapAddress = searchParams.get("address")
    if (!mapAddress) return

    const numeric = (key: string, fallback: number) => {
      const value = Number(searchParams.get(key))
      return Number.isFinite(value) && value > 0 ? value : fallback
    }

    const timer = window.setTimeout(() => {
      setAddress(mapAddress)
      setAddressConfirmed(true)
      setPrice(numeric("price", 38))
      setLoan(numeric("loan", 22))
      setRate(numeric("rate", 4.8))
      setRent(numeric("rent", 320))
      setDeposit(numeric("deposit", 5000))
      setChatProvidedDealFields(["price", "loan", "rate", "rent", "deposit"])
      setInputValue(`${mapAddress} 기준으로 기본 조건을 넣어줘`)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])
  
  // Panel D: 건축조건
  const [scenario, setScenario] = useState<'현황' | '증축' | '신축' | '리모델링'>('현황')
  const [gfa, setGfa] = useState(420)
  const [constructionCost, setConstructionCost] = useState(500)
  const [elevator, setElevator] = useState<'있음' | '없음' | '설치예정'>('있음')
  const [basement, setBasement] = useState('없���')
  const [remodelingRange, setRemodelingRange] = useState('부분 리모델링')
  
  // Panel E: 분석옵션
  const [financeScenario, setFinanceScenario] = useState(true)
  const [vacancyScenario, setVacancyScenario] = useState(true)
  const [roadRisk, setRoadRisk] = useState(true)
  const [autoReport, setAutoReport] = useState(false)
  
  // Map modal
  const [showMapModal, setShowMapModal] = useState(false)
  
  // Detail tabs - 4개 의사결정 탭 + 사용자군 렌즈
  const [activeTab, setActiveTab] = useState('딜 결론')
  const [selectedPersona, setSelectedPersona] = useState<StrategyPersonaKey>('broker_buyer')
  
  // Calculated values
  const [noi, setNoi] = useState(0)
  const [dscr, setDscr] = useState(0)
  const [ltv, setLtv] = useState(0)
  const [cap, setCap] = useState(0)
  const [bankabilityScore, setBankabilityScore] = useState(0)
  const [dealSignal, setDealSignal] = useState<'매수' | '가격협상' | '매수보류'>('가격협상')
  const [rentalContext, setRentalContext] = useState<RentalContext | null>(null)
  const [, setIsRentalContextLoading] = useState(false)
  const [commercialContext, setCommercialContext] = useState<CommercialVitalityContext | null>(null)
  const [, setIsCommercialContextLoading] = useState(false)

  // ============================================================
  // CALCULATION LOGIC
  // ============================================================
  const recalc = useCallback(() => {
    const noiVal = Math.max(0, rent * 12 * (1 - vacancyRate / 100) - 82)
    const annualDebt = loan * 10000 * (rate / 100)
    const dscrVal = annualDebt ? noiVal / annualDebt : 0
    const ltvVal = price ? (loan / price) * 100 : 0
    const capVal = price ? (noiVal / (price * 10000)) * 100 : 0
    
    // DEAL SIGNAL 점수 계산
    // 기본 점수: 63점
    // DSCR 패널티: (0.95 - DSCR) * 24 (DSCR 낮을수록 점수 감소)
    // 공실률 패널티: 공실률 * 공실민감도 * 가중치 (공실률 높을수록, 민감도 ���을수록 점수 감���)
    // 엘리베이터 미설치: -3점
    const vacancyPenalty = (vacancyRate - 10) * (vacancySensitivity / 100) * 1.2 // 공실률 10% 기준, 민감도 반영
    const scoreVal = Math.max(18, Math.min(88,
      Math.round(63 - (0.95 - dscrVal) * 24 - Math.max(0, vacancyPenalty) - (elevator === '설치예정' ? 3 : 0))
    ))
    
    setNoi(noiVal)
    setDscr(dscrVal)
    setLtv(ltvVal)
    setCap(capVal)
    setBankabilityScore(scoreVal)
    
    // 점수 기반 dealSignal 판정
    // <33: 매수보류 (낮은 점수 = 높은 리스크)
    // 33-66: 가격협상 (중간 점수)
    // >66: 매수 (높은 점수 = 좋은 조건)
    if (scoreVal >= 66) {
      setDealSignal('매수')
    } else if (scoreVal >= 33) {
      setDealSignal('가격협상')
    } else {
      setDealSignal('매수보류')
    }
  }, [price, loan, rate, rent, vacancyRate, vacancySensitivity, elevator])

  useEffect(() => {
    recalc()
  }, [recalc])

  useEffect(() => {
    const trimmedAddress = address.trim()
    if (!trimmedAddress || !addressConfirmed) return

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsRentalContextLoading(true)
      try {
        const rentalPayload: Record<string, string | number> = {
          address: trimmedAddress,
          vacancy_rate: vacancyRate,
          operating_expense_ratio: 15,
        }
        if (chatProvidedDealFields.includes('price')) rentalPayload.purchase_price = Math.round(price * 100_000_000)
        if (chatProvidedDealFields.includes('loan')) rentalPayload.loan_amount = Math.round(loan * 100_000_000)
        if (chatProvidedDealFields.includes('rate')) rentalPayload.annual_interest_rate = rate
        if (chatProvidedDealFields.includes('rent')) rentalPayload.monthly_rent = Math.round(rent * 10_000)
        if (chatProvidedDealFields.includes('deposit')) rentalPayload.deposit = Math.round(deposit * 10_000)

        const response = await fetch('/api/rental-profitability/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(rentalPayload),
        })
        if (!response.ok) throw new Error('rental context failed')
        const data: RentalContext = await response.json()
        setRentalContext(data)

        const metrics = data.metrics || []
        const metricValue = (key: string): number | null => {
          const raw = metrics.find((metric) => metric.metric_key === key)?.value
          return typeof raw === 'number' && Number.isFinite(raw) ? raw : null
        }
        const noiWon = metricValue('noi_annual')
        const dscrValue = metricValue('dscr')
        const capValue = metricValue('cap_rate')
        if (noiWon != null) setNoi(Math.round(noiWon / 10000))
        if (dscrValue != null) setDscr(dscrValue)
        if (capValue != null) setCap(capValue)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setRentalContext((prev) => prev)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsRentalContextLoading(false)
        }
      }
    }, 280)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [address, addressConfirmed, price, loan, rate, rent, deposit, vacancyRate, chatProvidedDealFields])

  useEffect(() => {
    const trimmedAddress = address.trim()
    if (!trimmedAddress || !addressConfirmed) return

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsCommercialContextLoading(true)
      try {
        const response = await fetch('/api/commercial-vitality/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ address: trimmedAddress, use_llm: true }),
        })
        if (!response.ok) throw new Error('commercial vitality context failed')
        const data: CommercialVitalityContext = await response.json()
        setCommercialContext(data)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setCommercialContext((prev) => prev)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCommercialContextLoading(false)
        }
      }
    }, 320)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [address, addressConfirmed])

  // Simulate API connection
  useEffect(() => {
    const timer = setTimeout(() => setApiStatus('connected'), 1500)
    return () => clearTimeout(timer)
  }, [])
  
  // Handle Analysis Run
  const handleRunAnalysis = useCallback(async () => {
    const input: DealInput = {
      address,
      price,
      loan,
      rate,
      rent,
      deposit,
      vacancyRate
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[analysis] run clicked with input:', input)
    }

    // 분석 시작 - 로딩 상태 표시
    setHasRunAnalysis(true)

    try {
      // 분석 실행
      await dealAnalysis.runAnalysis(input)

      if (process.env.NODE_ENV === 'development') {
        console.log('[analysis] result:', dealAnalysis.result)
      }

      // 분석 결과가 있으면 요약을 대화창에 추가
      let summary = dealAnalysis.summary

      // summary가 없으면 fallback 생성
      if (!summary) {
        summary = generateAnalysisSummary(input)
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[chat] summary to append:', summary)
      }

      const suggestedQuestions = [
        {
          id: "negotiation-price",
          label: "얼마까지 가격협상해야 할까?",
          prompt:
            "현재 입력 조건과 주소지 특성을 기준으로, 이 매물은 얼마까지 가격협상해야 하는지 협상 논리와 함께 분석해줘.",
        },
        {
          id: "cashflow-risk",
          label: "대출 후 버틸 수 있는 구조일까?",
          prompt:
            "현재 대출금액과 금리, 월세 조건을 기준으로 이 매물이 대출 이후에도 안정적으로 버틸 수 있는 구조인지 분석해줘.",
        },
        {
          id: "closing-checklist",
          label: "계약 전 반드시 확인할 리스크는?",
          prompt:
            "이 매물을 계약하기 전에 반드시 확인해야 할 리스크와 실사 체크리스트를 우선순위별로 정리해줘.",
        },
      ]

      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: summary,
        createdAt: new Date(),
        suggestedQuestions,
      }

      setChatMessages((prev) => {
        const updated = [...prev, newMessage]
        if (process.env.NODE_ENV === 'development') {
          console.log('[chat] messages after append:', updated)
        }
        return updated
      })

      // Save to analysis history (max 20)
      setAnalysisHistory(prev => {
        const newItem: AnalysisHistoryItem = {
          address,
          score: bankabilityScore,
          dealSignal,
          timestamp: Date.now(),
        }
        const updated = [newItem, ...prev.filter(h => h.address !== address)].slice(0, 20)
        if (typeof window !== 'undefined') {
          localStorage.setItem('bm_analysis_history', JSON.stringify(updated))
        }
        return updated
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[analysis] error:', error)
      }

      // API 실패 시 fallback 메시지
      const fallbackSummary = generateAnalysisSummary(input)

      const suggestedQuestions = [
        {
          id: "negotiation-price",
          label: "얼마까지 가격협상해야 할까?",
          prompt:
            "현재 입력 조건과 주소지 특성을 기준으로, 이 매물은 얼마까지 가격협상해야 하는지 협상 논리와 함께 분석해줘.",
        },
        {
          id: "cashflow-risk",
          label: "대출 후 버틸 수 있는 구조일까?",
          prompt:
            "현재 대출금액과 금리, 월세 조건을 기준으로 이 매물이 대출 이후에도 안정적으로 버틸 수 있는 구조인지 분석해줘.",
        },
        {
          id: "closing-checklist",
          label: "계약 전 반드시 확인할 리스크는?",
          prompt:
            "이 매물을 계약하기 전에 반드시 확인해야 할 리스크와 실사 체크리스트를 우선순위별로 정리해줘.",
        },
      ]

      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: fallbackSummary,
        createdAt: new Date(),
        suggestedQuestions,
      }

      setChatMessages((prev) => [...prev, newMessage])
    }
  }, [address, price, loan, rate, rent, deposit, vacancyRate, dealAnalysis])

  // 분석 요약 생성 함수
  const generateAnalysisSummary = (input: DealInput): string => {
    const vacancyLoss = input.rent * 12 * (vacancyRate / 100)
    const effectiveIncome = input.rent * 12 - vacancyLoss
    const annualInterestCost = input.loan * 10000 * (input.rate / 100)
    const dscr = annualInterestCost > 0 ? effectiveIncome / annualInterestCost : 0
    const ltv = input.price > 0 ? (input.loan / input.price) * 100 : 0

    return `${input.address} 기준으로 분석을 업데이트했습니다.

현재 입력 조건은 매입가 ${input.price.toFixed(1)}억, 대출금 ${input.loan.toFixed(1)}억, 금리 ${input.rate.toFixed(1)}%, 월세 ${input.rent}만원, 보증금 ${(input.deposit / 10000).toFixed(1)}억입니다. 이 조건에서는 LTV가 ${ltv.toFixed(1)}% 수준이고, 임대수익 대비 금융 부담이 ${dscr < 1 ? '높은' : '적정한'} 편입니다.

주소지는 생활상권과 역세권 특성이 있어 임대수요 측면에서는 긍정적입니다. 다만 현재 매입가와 대출 조건을 함께 보면 즉시 매수보다는 가격협상 후 재검토가 적절합니다.

BuildMore 판단:
이 매물은 "나쁜 매물"이라기보다, 현재 가격 그대로 들어가기에는 금융 안정성과 현금흐름 부담이 있는 딜입니다. 협상 기준가를 먼저 잡고, 공실률과 금리 민감도를 반영한 보수 시나리오를 확인하는 것이 좋습니다.`
  }

  // 이전 useEffect 제거 (더 이상 필요 없음)
  
  // 대화 메시지 전송
  const handleSendChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return
    
    // 사용자 메시지 추가
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      createdAt: new Date(),
    }
    
    setChatMessages(prev => [...prev, userMsg])
    
    setIsChatLoading(true)
    
    try {
      const response = await fetch('/api/analysis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          analysisResult: dealAnalysis.result,
          analysisContext: {
            address,
            deal_amount: Math.round(price * 100_000_000),
            loan_amount: Math.round(loan * 100_000_000),
            equity: Math.round((price - loan) * 100_000_000),
            monthly_rent: Math.round(rent * 10_000),
            deposit: deposit > 0 ? Math.round(deposit * 10_000) : 0,
            interest_rate: rate / 100,
            vacancy_rate: vacancyRate / 100,
            score_cards: (dealAnalysis.result as any)?.bankabilityScore
              ? { bankability_score: (dealAnalysis.result as any).bankabilityScore }
              : undefined,
            feasibility_card: (dealAnalysis.result as any)?.kpis
              ? {
                  annual_noi: ((dealAnalysis.result as any).kpis.noi || 0) * 10_000,
                  dscr: (dealAnalysis.result as any).kpis.dscr,
                  ltv: (dealAnalysis.result as any).kpis.ltv,
                  cap_rate: (dealAnalysis.result as any).kpis.capRate,
                }
              : undefined,
            conclusion_card: (dealAnalysis.result as any)?.dealSignal
              ? { verdict: (dealAnalysis.result as any).dealSignal }
              : undefined,
            delta_engine: (dealAnalysis.result as any)?.delta_engine || (dealAnalysis.result as any)?.deltaEngine,
          },
          dealInputState: {
            providedFields: chatProvidedDealFields,
            values: {
              price: chatPendingDealValues.price ?? price,
              loan: chatPendingDealValues.loan ?? loan,
              rate: chatPendingDealValues.rate ?? rate,
              rent: chatPendingDealValues.rent ?? rent,
              deposit: chatPendingDealValues.deposit ?? deposit,
            },
          },
          history: chatMessages.map((m: any) => ({ role: m.role, content: m.content })),
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '응답 생성 중 오류가 발생했습니다.')
      }
      
      // 어시스턴트 응답 추가
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.response,
        createdAt: new Date(),
      }
      
      setChatMessages(prev => [...prev, assistantMsg])

      if (data.parsed_deal_fields) {
        setChatPendingDealValues(prev => ({ ...prev, ...data.parsed_deal_fields }))
        setChatProvidedDealFields(prev => {
          const next = new Set<DealInputField>(prev)
          ;(Object.keys(data.parsed_deal_fields) as DealInputField[]).forEach((field) => next.add(field))
          return Array.from(next)
        })
      }

      // apply_to_analyzer: LLM이 제안한 값을 패널에 반영하고 분석 재실행
      if (data.apply_to_analyzer) {
        const apply = data.apply_to_analyzer
        if (apply.price != null) setPrice(apply.price)
        if (apply.loan != null) setLoan(apply.loan)
        if (apply.rate != null) setRate(apply.rate)
        if (apply.rent != null) setRent(apply.rent)
        if (apply.deposit != null) setDeposit(apply.deposit)
        if (apply.vacancyRate != null) setVacancyRate(apply.vacancyRate)
        setChatProvidedDealFields(['price', 'loan', 'rate', 'rent', 'deposit'])
        setChatPendingDealValues({
          price: apply.price,
          loan: apply.loan,
          rate: apply.rate,
          rent: apply.rent,
          deposit: apply.deposit,
        })

        const applyFields = Object.entries(apply)
          .filter(([k]) => ['price','loan','rate','rent','deposit','vacancyRate'].includes(k))
          .map(([k, v]) => {
            const labels: Record<string, string> = {
              price: '매입가', loan: '대출', rate: '금리',
              rent: '월세', deposit: '보증금', vacancyRate: '공실률'
            }
            const units: Record<string, string> = {
              price: '억', loan: '억', rate: '%',
              rent: '만원', deposit: '만원', vacancyRate: '%'
            }
            return `${labels[k]} ${v}${units[k]}`
          }).join(' · ')

        const confirmMsg: ChatMessage = {
          id: `msg-${Date.now() + 2}`,
          role: 'assistant',
          content: `분석기에 값을 적용했습니다 (${applyFields}). 분석을 실행합니다...`,
          createdAt: new Date(),
        }
        setChatMessages(prev => [...prev, confirmMsg])
        setApplyTrigger(n => n + 1)
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[chat] LLM response appended:', data.response)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[chat] LLM error, using fallback:', error)
      }
      
      const fallbackAnswer = dealAnalysis.result 
        ? '죄송합니다. 응답을 생성하지 못했습니다. 다시 시도해주세요.'
        : '먼저 우측 패널에서 분석 실행을 누르면 더 정확한 답변을 제공할 수 있습니다.'
      
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: fallbackAnswer,
        createdAt: new Date(),
      }
      
      setChatMessages(prev => [...prev, fallbackMsg])
    } finally {
      setIsChatLoading(false)
    }
  }, [
    address,
    chatMessages,
    chatPendingDealValues,
    chatProvidedDealFields,
    dealAnalysis.result,
    deposit,
    loan,
    price,
    rate,
    rent,
    vacancyRate,
  ])

  // apply_to_analyzer — 상태 업데이트 후 handleRunAnalysis 안전하게 호출
  useEffect(() => {
    if (applyTrigger > 0) {
      handleRunAnalysis()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyTrigger])

  // 추천 질문 클릭 핸들러
  const handleSuggestedQuestionClick = async (question: {
    id: string
    label: string
    prompt: string
  }) => {
    await handleSendChatMessage(question.prompt)
  }
  
  // 자동 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])
  
  useEffect(() => {
    const query = address.trim()

    if (query.length < 2 || addressConfirmed) {
      setAddressSuggestions([])
      setIsSuggestingAddress(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsSuggestingAddress(true)
      try {
        const resp = await fetch(`/api/address/suggest?q=${encodeURIComponent(query)}&size=7`, {
          signal: controller.signal,
        })
        if (!resp.ok) throw new Error('address suggest failed')
        const data = await resp.json()
        setAddressSuggestions(Array.isArray(data.suggestions) ? data.suggestions : [])
        setShowHistory(true)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setAddressSuggestions([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSuggestingAddress(false)
        }
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [address, addressConfirmed])

  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  const handleNewAnalysis = () => {
    setChatMessages([])
    setInputValue('')
    toast.success('새 분석을 시작합니다.')
  }



  const handleAddressConfirm = useCallback(async (confirmedAddress: string, meta?: AddressSuggestion | null) => {
    if (!confirmedAddress.trim()) return
    setIsBootstrapping(true)
    setShowHistory(false)
    setAddressConfirmed(false)
    setBuildingRegistryTitle(null)
    setSelectedAddressMeta(meta ?? null)

    try {
      // 카카오 Geocoder로 lat/lng/bjd_code 먼저 조회 후 bootstrap에 함께 전달
      let _lat: number | null = meta?.lat ?? null
      let _lng: number | null = meta?.lng ?? null
      let _bjd_code: string | null = meta?.bjd_code ?? null
      try {
        if ((!_lat || !_lng || !_bjd_code) && typeof window !== 'undefined' && (window as any).kakao?.maps?.services?.Geocoder) {
          await new Promise<void>((resolve) => {
            const geocoder = new (window as any).kakao.maps.services.Geocoder()
            geocoder.addressSearch(confirmedAddress, (result: any[], status: string) => {
              if (status === 'OK' && result.length > 0) {
                _lat = parseFloat(result[0].y)
                _lng = parseFloat(result[0].x)
                _bjd_code = result[0].address?.b_code ?? null
              }
              resolve()
            })
          })
        }
      } catch { /* geocoding 실패 시 무시 */ }

      const resp = await fetch('/api/analysis/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_address: confirmedAddress, lat: _lat, lng: _lng, bjd_code: _bjd_code }),
      })

      if (!resp.ok) throw new Error('bootstrap 실패')
      const data = await resp.json()

      setAddressProps(data.address_props ?? null)
      setBuildingRegistryTitle(data.building_registry_title ?? null)
      setRentalContext(data.rental_context ?? null)
      if (_lat && _lng) {
        setConfirmedLocation({ lat: _lat, lng: _lng })
      } else {
        setConfirmedLocation(null)
      }
      setAddressConfirmed(true)

      const si = data.sample_inputs
      if (si) {
        // Backend sends AnalysisRunRequest-compatible units: won / decimal ratio
        if (si.deal_amount) setPrice(Math.round(si.deal_amount / 1e7) / 10) // eok
        if (si.deal_amount) setLoan(Math.round(si.deal_amount * 0.6 / 1e7) / 10)
        if (si.interest_rate) setRate(Math.round(si.interest_rate * 1000) / 10) // %
        if (si.monthly_rent) setRent(Math.round(si.monthly_rent / 10000)) // 만원
        if (si.deposit) setDeposit(Math.round(si.deposit / 10000)) // 만원
        if (si.vacancy_rate) setVacancyRate(Math.round(si.vacancy_rate * 1000) / 10) // %
      }

      // Save to search history (max 5)
      const newSearchHistory: SearchHistoryItem[] = [
        { address: confirmedAddress, timestamp: Date.now() },
        ...searchHistory.filter(h => h.address !== confirmedAddress),
      ].slice(0, 5)
      setSearchHistory(newSearchHistory)
      if (typeof window !== 'undefined') {
        localStorage.setItem('bm_search_history', JSON.stringify(newSearchHistory))
      }

      // Add bootstrap assistant message
      const props = data.address_props ?? {}
      const parts: string[] = []
      if (props.zoning) parts.push(props.zoning)
      if (props.bcrat != null) parts.push(`건폐율 ${props.bcrat}%`)
      if (props.vlrat != null) parts.push(`용적률 ${props.vlrat}%`)
      if (props.area_m2 != null) parts.push(`대지 ${Math.round(props.area_m2)}㎡`)

      const compMsg = data.comparable_count > 0
        ? `인근 유사 거래 **${data.comparable_count}건**을 참고해 초기 조건을 설정했습니다. `
        : ''

      // If bootstrap returned analysis, inject it directly (skip second /api/analysis/run call)
      if (data.analysis) {
        dealAnalysis.injectResult(data.analysis)
        setHasRunAnalysis(true)

        // Save to analysis history
        const score = data.analysis?.score_cards?.bankability_score ?? 0
        const dealSignal = data.analysis?.conclusion_card?.overall_grade ?? ''
        const newAnalysisHistory: AnalysisHistoryItem[] = [
          { address: confirmedAddress, score, dealSignal, timestamp: Date.now() },
          ...analysisHistory.filter((h: AnalysisHistoryItem) => h.address !== confirmedAddress),
        ].slice(0, 20)
        setAnalysisHistory(newAnalysisHistory)
        if (typeof window !== 'undefined') {
          localStorage.setItem('bm_analysis_history', JSON.stringify(newAnalysisHistory))
        }
      } else {
        // Fallback: trigger analysis run via existing flow
        setApplyTrigger(n => n + 1)
      }

      const bootstrapMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `**${confirmedAddress}** 주소가 확정되었습니다.\n\n${parts.length > 0 ? '> ' + parts.join(' · ') + '\n\n' : ''}${compMsg}${data.analysis ? `Bankability Score **${data.analysis?.score_cards?.bankability_score ?? '-'}점** (${data.analysis?.conclusion_card?.overall_grade ?? ''})` : '우측 패널 조건을 확인하고 **분석 실행**을 눌러주세요.'}`,
        createdAt: new Date(),
      }
      setChatMessages(prev => [...prev, bootstrapMsg])

    } catch {
      toast.error('주소 정보를 불러오지 못했습니다. 조건을 직접 입력해 분석을 실행해주세요.')
    } finally {
      setIsBootstrapping(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchHistory])

  const handleAddressSelect = (addr: string, meta?: AddressSuggestion | null) => {
    const confirmedAddress = meta?.display_address || meta?.address_name || addr
    setAddress(confirmedAddress)
    setShowHistory(false)
    setAddressSuggestions([])
    handleAddressConfirm(confirmedAddress, meta)
  }



  const handleComingSoon = (feature: string) => {
    toast.info(`${feature} 기능은 준비 중입니다.`)
  }

  // Metric Card Component for consistent styling
  const MetricCard = ({ 
    label, 
    value, 
    sub 
  }: { 
    label: string
    value: string | number
    sub: string
  }) => (
    <div className="bg-white border border-[#e7e7ea] rounded-[16px] p-[14px]">
      <p className="text-[11px] font-medium text-[#666] uppercase tracking-wide break-keep mb-2">{label}</p>
      <p className="text-[17px] font-semibold tabular-nums text-gray-950 whitespace-nowrap mt-1">{value}</p>
      <p className="text-[11px] text-[#999] leading-relaxed mt-1.5 break-keep">{sub}</p>
    </div>
  )

  const formatPercent = (value: number | null | undefined) => {
    if (value == null || Number.isNaN(Number(value))) return '-'
    return `${Number(value).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}%`
  }
  const formatArea = (value: number | null | undefined) => {
    if (value == null || Number.isNaN(Number(value))) return '-'
    return `${Math.round(Number(value)).toLocaleString('ko-KR')}㎡`
  }
  const hasBuildingRegistryTitle = Boolean(
    buildingRegistryTitle
    && [
      buildingRegistryTitle.permit_year,
      buildingRegistryTitle.use_approval_year,
      buildingRegistryTitle.floor_area_ratio,
      buildingRegistryTitle.building_coverage_ratio,
      buildingRegistryTitle.total_floor_area_m2,
    ].some((value) => value != null)
  )
  const missingRentalInputLabels = rentalContext?.waiting_user_input_labels?.length
    ? rentalContext.waiting_user_input_labels
    : (rentalContext?.waiting_user_input || []).map((field) => ({
        purchase_price: '매입가',
        loan_amount: '대출금액',
        annual_interest_rate: '금리',
        monthly_rent: '월세',
        deposit: '보증금',
      }[field] || field))
  const rentalInputGuide = missingRentalInputLabels.length > 0
    ? `${missingRentalInputLabels.slice(0, 3).join(', ')}${missingRentalInputLabels.length > 3 ? ' 등' : ''}을 입력하면 NOI, DSCR, 수익률이 자동 계산됩니다.`
    : '입력값 변경 시 NOI, DSCR, 수익률이 자동 갱신됩니다.'
  const topDongIndustries = commercialContext?.admin_dong_industry_sales?.top_industries || []
  const hasHangulFinalConsonant = (value: string) => {
    const lastChar = value.trim().at(-1)
    if (!lastChar) return false
    const code = lastChar.charCodeAt(0)
    if (code < 0xac00 || code > 0xd7a3) return false
    return (code - 0xac00) % 28 !== 0
  }
  const topicJosa = (value: string) => (hasHangulFinalConsonant(value) ? '은' : '는')
  const commercialSubject = address.trim() || '주소지'
  const commercialZoneName = commercialContext?.commercial_area?.name || 'Z상권'
  const commercialAreaType = 'F/G형'
  const commercialCheckFactors = ['A', 'B', 'C']
  const commercialHeadline = `${commercialSubject}${topicJosa(commercialSubject)} ${commercialZoneName}에 있는 ${commercialAreaType} 상권으로, ${commercialCheckFactors.join(', ')}를 함께 확인해야 합니다.`
  const analysisStrategy = (dealAnalysis.result?.analysisStrategy ?? null) as AnalysisStrategy | null

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* ============================================================ */}
      {/* TOPBAR (66px) - FULL WIDTH */}
      {/* ============================================================ */}
      <header className="h-[66px] bg-white border-b border-border px-5 grid grid-cols-[170px_1fr_auto] items-center flex-shrink-0">
        {/* Logo */}
        <Link href="/" className="text-[22px] font-extrabold text-foreground tracking-tight hover:opacity-80 transition-opacity">
          BUILDMORE
        </Link>
        
        {/* Address search */}
        <div className="flex justify-center">
          <div className="relative w-[420px]">
            <Input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value)
                setAddressConfirmed(false)
                setSelectedAddressMeta(null)
                setConfirmedLocation(null)
              }}
              onFocus={() => setShowHistory(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && address.trim()) {
                  e.preventDefault()
                  handleAddressSelect(address.trim())
                }
              }}
              className="h-[42px] pr-20 text-sm"
              placeholder="주소 입력 후 Enter로 확정"
            />
            {isBootstrapping ? (
              <Loader2 className="absolute right-[52px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
            ) : (
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="absolute right-[52px] top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowMapModal(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs border border-border rounded hover:bg-muted"
            >
              지도
            </button>
            
            {/* History dropdown */}
            {showHistory && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50">
                {address.trim().length >= 2 ? (
                  <div className="py-1">
                    {isSuggestingAddress && (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        주소 검색 중
                      </div>
                    )}
                    {!isSuggestingAddress && addressSuggestions.length === 0 && (
                      <p className="px-3 py-3 text-sm text-muted-foreground">일치하는 주소가 없습니다.</p>
                    )}
                    {addressSuggestions.map((item) => {
                      const label = item.display_address || item.address_name
                      const subLabel = item.jibun_address && item.jibun_address !== label
                        ? item.jibun_address
                        : [item.region_2depth, item.region_3depth].filter(Boolean).join(' ')

                      return (
                        <button
                          key={`${label}-${item.bjd_code || item.lat}-${item.lng}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleAddressSelect(label, item)}
                          className="w-full px-3 py-2 text-left hover:bg-muted"
                        >
                          <span className="block truncate text-sm font-medium">{label}</span>
                          <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                            {item.bjd_code ? (
                              <span className="rounded bg-muted px-1.5 py-0.5 font-mono">BJD {item.bjd_code}</span>
                            ) : (
                              <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600">법정동 코드 없음</span>
                            )}
                            {subLabel && <span className="truncate">{subLabel}</span>}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : searchHistory.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-muted-foreground">검색 기록이 없습니다.</p>
                ) : searchHistory.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddressSelect(item.address)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted text-left"
                  >
                    <span className="truncate">{item.address}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const updated = searchHistory.filter((_, idx) => idx !== i)
                        setSearchHistory(updated)
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('bm_search_history', JSON.stringify(updated))
                        }
                      }}
                      className="ml-2 flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </button>
                ))}
                {address.trim().length < 2 && searchHistory.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchHistory([])
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('bm_search_history')
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted border-t border-border"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    검색 기록 전체 삭제
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
          <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/login" className="text-sm font-medium text-foreground bg-foreground/5 hover:bg-foreground/10 px-4 py-2 rounded-lg transition-colors">
            로그인
          </Link>
        </nav>
      </header>

      {/* MAIN LAYOUT - Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ============================================================ */}
        {/* A. LEFT NAVIGATION SIDEBAR (160px - OVERLAY DRAWER) */}
        {/* ============================================================ */}
        <aside className={cn(
          "fixed left-0 top-[66px] z-40 h-[calc(100vh-66px)] w-40 flex flex-col bg-card border-r border-border transition-transform duration-300 ease-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
        {/* Nav Items */}
        <ScrollArea className="flex-1 py-3">
          <nav className="px-2 space-y-0.5">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full justify-start gap-2 text-xs h-8"
              onClick={handleNewAnalysis}
            >
              <Plus className="w-3.5 h-3.5" />
              새 분석
            </Button>
            
            <div className="pt-2 space-y-0.5">
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full justify-start gap-2 text-xs h-8 text-muted-foreground hover:text-foreground"
                onClick={() => handleComingSoon('내 분석 기록')}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                내 분석 기록
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full justify-start gap-2 text-xs h-8 text-muted-foreground hover:text-foreground"
                onClick={() => handleComingSoon('관심 지역')}
              >
                <MapPin className="w-3.5 h-3.5" />
                관심 지역
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full justify-start gap-2 text-xs h-8 text-muted-foreground hover:text-foreground"
                onClick={() => handleComingSoon('리포트 보관함')}
              >
                <FileText className="w-3.5 h-3.5" />
                리포트 보관함
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full justify-start gap-2 text-xs h-8 text-muted-foreground hover:text-foreground"
                onClick={() => handleComingSoon('데이터 출처')}
              >
                <Database className="w-3.5 h-3.5" />
                데이터 출처
              </Button>
            </div>

            <Separator className="my-3" />

            {/* Recent Analyses */}
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 mb-1">최근 분석</p>
            {analysisHistory.length === 0 ? (
              <p className="text-[10px] text-muted-foreground px-2 py-1">분석 기록이 없습니다.</p>
            ) : analysisHistory.slice(0, 5).map((item, i) => (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                className={`w-full justify-start gap-2 text-xs h-auto py-1.5 ${i === 0 && item.address === address ? 'bg-accent' : ''}`}
                onClick={() => handleAddressSelect(item.address)}
              >
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                <div className="flex-1 text-left truncate">
                  <p className="text-[11px] truncate">{item.address.split(' ').slice(-2).join(' ')}</p>
                  <p className="text-[10px] text-muted-foreground">점수 {item.score} · {item.dealSignal}</p>
                </div>
              </Button>
            ))}

            <Separator className="my-3" />

            <Button 
              variant="ghost" 
              size="sm"
              className="w-full justify-start gap-2 text-xs h-8 text-muted-foreground hover:text-foreground"
              onClick={() => handleComingSoon('설정')}
            >
              <Settings className="w-3.5 h-3.5" />
              설정
            </Button>
          </nav>
        </ScrollArea>

        {/* Status bar */}
        <div className="p-3 border-t border-border bg-muted/50 text-[10px] space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-muted-foreground">LLM Wiki Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'connected' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-muted-foreground">{apiStatus === 'connected' ? 'API 연결됨' : 'API 연결 중...'}</span>
          </div>
          <p className="text-muted-foreground/70 pt-1">v1.1.0</p>
        </div>
      </aside>
      
      {/* ============================================================ */}
      {/* A-2. SIDEBAR HANDLE (TOGGLE DRAWER) */}
      {/* ============================================================ */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed left-0 top-1/2 z-50 -translate-y-1/2 rounded-r-lg border border-border bg-white px-1.5 py-6 shadow-sm hover:bg-muted transition-colors"
        title={isSidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
      >
        {isSidebarOpen ? (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* ============================================================ */}
      {/* B. CHAT AREA (축소된 폭) */}
      {/* ============================================================ */}
      <div className="w-[420px] flex-shrink-0 flex flex-col bg-background border-r border-border">
        {/* Chat header */}
        <div className="flex-shrink-0 border-b border-border bg-card">
          <div className="h-12 flex items-center justify-between px-4">
            <h2 className="text-sm font-medium text-foreground">대화</h2>
            <span className="text-xs text-muted-foreground">{chatMessages.length}개 메시지</span>
          </div>
          {/* Current address */}
          <div className="px-4 pt-2.5 pb-1">
            <p className="text-xs text-muted-foreground">분석 대상</p>
            <p className="text-sm font-medium text-foreground mt-0.5 truncate">
              {address || '주소를 입력하고 Enter로 확정하세요'}
              {address && !addressConfirmed && !isBootstrapping && (
                <span className="ml-1.5 text-[11px] text-amber-600 font-normal">미확정</span>
              )}
            </p>
          </div>
          {/* Address and building-registry pills (dynamic from bootstrap) */}
          <div className="px-3 pb-2.5 flex flex-wrap gap-1.5">
            {isBootstrapping ? (
              <span className="px-2 py-0.5 bg-muted text-[11px] rounded-full text-muted-foreground animate-pulse">주소/건축물대장 조회 중...</span>
            ) : (addressProps || buildingRegistryTitle) ? (
              <>
                {selectedAddressMeta?.bjd_code && (
                  <span className="px-2 py-0.5 bg-muted text-[11px] rounded-full whitespace-nowrap font-mono">BJD {selectedAddressMeta.bjd_code}</span>
                )}
                {addressProps?.zoning && (
                  <span className="px-2 py-0.5 bg-muted text-[11px] rounded-full whitespace-nowrap">{addressProps.zoning}</span>
                )}
                {addressProps?.area_m2 != null && (
                  <span className="px-2 py-0.5 bg-muted text-[11px] rounded-full whitespace-nowrap">대지 {formatArea(addressProps.area_m2)}</span>
                )}
                {hasBuildingRegistryTitle ? (
                  <>
                    <span className="px-2 py-0.5 bg-slate-950 text-white text-[11px] rounded-full whitespace-nowrap">허가 {buildingRegistryTitle?.permit_year ?? '-'}</span>
                    <span className="px-2 py-0.5 bg-slate-950 text-white text-[11px] rounded-full whitespace-nowrap">사용승인 {buildingRegistryTitle?.use_approval_year ?? '-'}</span>
                    <span className="px-2 py-0.5 bg-slate-950 text-white text-[11px] rounded-full whitespace-nowrap">용적률 {formatPercent(buildingRegistryTitle?.floor_area_ratio)}</span>
                    <span className="px-2 py-0.5 bg-slate-950 text-white text-[11px] rounded-full whitespace-nowrap">건폐율 {formatPercent(buildingRegistryTitle?.building_coverage_ratio)}</span>
                    <span className="px-2 py-0.5 bg-slate-950 text-white text-[11px] rounded-full whitespace-nowrap">연면적 {formatArea(buildingRegistryTitle?.total_floor_area_m2)}</span>
                  </>
                ) : addressConfirmed ? (
                  <span className="px-2 py-0.5 bg-muted text-[11px] rounded-full text-muted-foreground whitespace-nowrap">건축물대장 미확인</span>
                ) : null}
                {addressProps?.bcrat != null && !hasBuildingRegistryTitle && (
                  <span className="px-2 py-0.5 bg-muted text-[11px] rounded-full whitespace-nowrap">건폐율 {formatPercent(addressProps.bcrat)}</span>
                )}
                {addressProps?.vlrat != null && !hasBuildingRegistryTitle && (
                  <span className="px-2 py-0.5 bg-muted text-[11px] rounded-full whitespace-nowrap">용적률 {formatPercent(addressProps.vlrat)}</span>
                )}
              </>
            ) : (
              <span className="px-2 py-0.5 bg-muted/50 text-[11px] rounded-full text-muted-foreground italic">주소 확정 후 표제부 표시</span>
            )}
          </div>
        </div>

        {/* Chat content */}
        <div className="flex-1 p-3 overflow-hidden flex flex-col min-w-0">
          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-4">
              {chatMessages.map((msg, idx) => (
                <div key={msg.id || idx} className="space-y-2">
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-foreground text-background'
                        : 'bg-white border border-border text-foreground'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown
                          components={{
                            h3: ({children}) => <p className="font-semibold text-[13px] text-foreground mt-2.5 mb-1 first:mt-0">{children}</p>,
                            h4: ({children}) => <p className="font-semibold text-[12px] text-foreground mt-2 mb-0.5">{children}</p>,
                            p:  ({children}) => <p className="text-[13px] leading-relaxed mb-1.5 last:mb-0">{children}</p>,
                            ul: ({children}) => <ul className="text-[13px] space-y-0.5 my-1 pl-4 list-disc">{children}</ul>,
                            ol: ({children}) => <ol className="text-[13px] space-y-0.5 my-1 pl-4 list-decimal">{children}</ol>,
                            li: ({children}) => <li className="leading-relaxed">{children}</li>,
                            strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                            table: ({children}) => <table className="text-[12px] w-full my-2 border-collapse">{children}</table>,
                            th: ({children}) => <th className="border border-border px-2 py-1 text-left font-semibold bg-muted">{children}</th>,
                            td: ({children}) => <td className="border border-border px-2 py-1">{children}</td>,
                            hr: () => <hr className="my-2 border-border" />,
                          }}
                        >{msg.content}</ReactMarkdown>
                      ) : msg.content}
                    </div>
                  </div>
                  
                  {/* Suggested Questions (Assistant messages only) */}
                  {msg.role === 'assistant' && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="flex justify-start">
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestedQuestions.map((question) => (
                          <button
                            key={question.id}
                            type="button"
                            onClick={() => handleSuggestedQuestionClick(question)}
                            disabled={isChatLoading}
                            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {question.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-border rounded-lg px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
          
          {/* Input */}
          <form onSubmit={(e) => {
            e.preventDefault()
            handleSendChatMessage(inputValue)
            setInputValue('')
          }} className="mt-3 flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="질문을 입력하세요..."
              className="flex-1 text-sm h-8"
              disabled={isChatLoading}
            />
            <Button 
              type="submit" 
              size="sm"
              disabled={!inputValue.trim() || isChatLoading}
            >
              <Send className="w-3 h-3" />
            </Button>
          </form>
        </div>
      </div>

      {/* ============================================================ */}
      {/* C. ANALYSIS PANEL (remaining width) */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col bg-[#f8f8f9] overflow-hidden">
        {/* KPI STRIP (72px) */}
        <div className="h-[72px] bg-white border-b border-border px-5 flex items-center gap-4 flex-shrink-0">
          {/* Run button */}
          <Button 
            className="w-[108px] h-10 bg-foreground text-background hover:bg-foreground/90 text-sm font-medium flex-shrink-0"
            onClick={handleRunAnalysis}
            disabled={dealAnalysis.isLoading}
          >
            {dealAnalysis.isLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-2" />
                분석 중...
              </>
            ) : (
              '분석 실행'
            )}
          </Button>
          
          {/* News ticker with gap and background */}
          <div className="ml-4 flex-1 min-w-0 rounded-full border border-border bg-white px-4 py-2 shadow-sm">
            <NewsTicker onAddressSelect={handleAddressSelect} />
          </div>
          
          {/* KPIs - right aligned */}
          <div className="ml-auto flex-shrink-0">
            <KpiGroup noi={noi} dscr={dscr} ltv={ltv} cap={cap} />
          </div>
        </div>

        {/* MAIN AREA */}
        <div className="flex-1 grid grid-cols-[340px_1fr] overflow-hidden">
          {/* ============================================================ */}
          {/* LEFT SIDEBAR - 5 PANELS */}
          {/* ============================================================ */}
          <ScrollArea className="bg-[#fbfbfb] p-3.5 h-full overflow-y-auto">
            <div className="space-y-3">
              {/* Panel A: 매입조건 */}
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="h-[42px] px-4 flex items-center border-b border-border">
                  <span className="text-[13px] font-bold">매입조건</span>
                </div>
                <div className="p-3 space-y-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">매입가격 (억원)</label>
                    <NumField value={price} onChange={(value) => { markDealFieldProvided('price'); setPrice(value) }} step={0.1} decimals={1} displayDecimals={1} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">대출금액 (억원)</label>
                    <NumField value={loan} onChange={(value) => { markDealFieldProvided('loan'); setLoan(value) }} step={0.1} isLoan={true} decimals={1} displayDecimals={1} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">금리 (%)</label>
                    <NumField value={rate} onChange={(value) => { markDealFieldProvided('rate'); setRate(value) }} step={0.01} decimals={2} />
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={ltv}
                        onChange={(e) => { markDealFieldProvided('loan'); setLoan((price * parseFloat(e.target.value)) / 100) }}
                        className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #1a1a1a 0%, #1a1a1a ${ltv}%, #f5f5f5 ${ltv}%, #f5f5f5 100%)`,
                          outline: 'none'
                        }}
                      />
                    </div>
                    <p className="text-center text-[12px] font-semibold text-foreground mt-2">LTV {ltv.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* Panel B: 임대조건 */}
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="h-[42px] px-4 flex items-center border-b border-border">
                  <span className="text-[13px] font-bold">임대조건</span>
                </div>
                <div className="p-3 space-y-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">월세 (만원)</label>
                    <NumField value={rent} onChange={(value) => { markDealFieldProvided('rent'); setRent(value) }} step={10} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">보증금 (만원)</label>
                    <NumField value={deposit} onChange={(value) => { markDealFieldProvided('deposit'); setDeposit(value) }} step={100} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">공실률</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([10, 20, 30] as const).map(v => (
                        <button
                          key={v}
                          onClick={() => setVacancyRate(v)}
                          className={`h-[32px] rounded-lg text-xs border transition-colors ${
                            vacancyRate === v 
                              ? 'bg-foreground text-background border-foreground' 
                              : 'bg-white border-border hover:bg-muted'
                          }`}
                        >
                          {v === 10 ? '긍정 10' : v === 20 ? '적정 20' : '보수 30'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">공실민감도</label>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={vacancySensitivity}
                        onChange={(e) => setVacancySensitivity(parseInt(e.target.value))}
                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${vacancySensitivity}%, #f5f5f5 ${vacancySensitivity}%, #f5f5f5 100%)`,
                          outline: 'none'
                        }}
                      />
                    </div>
                    <p className="text-center text-[12px] font-semibold text-foreground mt-2">공실민감도 {vacancySensitivity}%</p>
                  </div>
                </div>
              </div>

              {/* Panel D: 건축조건 */}
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="h-[42px] px-4 flex items-center border-b border-border">
                  <span className="text-[13px] font-bold">건축조건</span>
                </div>
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['현황', '증축', '신축', '리모델링'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setScenario(s)}
                        className={`h-[32px] rounded-lg text-xs border transition-colors ${
                          scenario === s 
                            ? 'bg-foreground text-background border-foreground' 
                            : 'bg-white border-border hover:bg-muted'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">연면적 (㎡)</label>
                    <NumField value={gfa} onChange={setGfa} step={10} disabled={scenario === '현황'} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">시공비 (만원/㎡)</label>
                    <NumField value={constructionCost} onChange={setConstructionCost} step={50} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">엘리베이터</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['있음', '없음', '설치예정'] as const).map(e => (
                        <button
                          key={e}
                          onClick={() => setElevator(e)}
                          className={`h-[32px] rounded-lg text-xs border transition-colors ${
                            elevator === e 
                              ? 'bg-foreground text-background border-foreground' 
                              : 'bg-white border-border hover:bg-muted'
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel E: 분석옵션 */}
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="h-[42px] px-4 flex items-center border-b border-border">
                  <span className="text-[13px] font-bold">분석옵션</span>
                </div>
                <div className="p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={financeScenario} onCheckedChange={(c) => setFinanceScenario(!!c)} />
                    <span className="text-xs">금융비용 시나리오 분석</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={vacancyScenario} onCheckedChange={(c) => setVacancyScenario(!!c)} />
                    <span className="text-xs">공실률 시나리오 분석</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={roadRisk} onCheckedChange={(c) => setRoadRisk(!!c)} />
                    <span className="text-xs">도로확폭 리스크 반영</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={autoReport} onCheckedChange={(c) => setAutoReport(!!c)} />
                    <span className="text-xs">AI 리포트 자동생성</span>
                  </label>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* ============================================================ */}
          {/* RIGHT CONTENT AREA */}
          {/* ============================================================ */}
          <div className="relative flex flex-col h-full overflow-hidden">
          <ScrollArea className={cn(
            "flex-1 p-3.5 transition-[padding-bottom] duration-300",
            isCtaOpen ? "pb-[300px]" : "pb-[72px]"
          )}>
            <h1 className="text-[26px] font-extrabold text-foreground mb-4">분석 결과</h1>

            {/* Top result cards */}
            <div className="grid min-w-[980px] grid-cols-[minmax(220px,1.05fr)_minmax(160px,0.75fr)_minmax(250px,0.9fr)_minmax(280px,1.05fr)] gap-3 mb-3">
              {/* DEAL SCORE */}
              <div className="bg-white border border-border rounded-[14px] p-3 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-950 mb-2">DEAL SCORE</h3>
                    <p className="text-xs leading-relaxed text-gray-600 break-keep">이 매물의 종합 딜 매력도를 평가한 점수입니다.</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="inline-flex items-baseline">
                      <span className="text-5xl font-black leading-none tracking-tight tabular-nums text-gray-950">
                        {bankabilityScore}
                      </span>
                      <span className="ml-1 text-base font-semibold text-gray-500">
                        /100
                      </span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-foreground transition-all" style={{ width: `${bankabilityScore}%` }} />
                </div>
                <div className="grid grid-cols-[74px_1fr] gap-y-2 text-[13px] mb-3">
                  <span className="text-muted-foreground font-bold">상권</span>
                  <span className="whitespace-normal break-keep leading-relaxed">합정 생활상권 · 역세권 · 팝업/F&B</span>
                  <span className="text-muted-foreground font-bold">입력값</span>
                  <span className="whitespace-normal break-keep leading-relaxed">매입 {price.toFixed(1)}억 / 대출 {loan.toFixed(1)}억 / 금리 {rate.toFixed(1)}%</span>
                  <span className="text-muted-foreground font-bold">분석엔진</span>
                  <span className="whitespace-normal break-keep leading-relaxed">BuildMore v2.1</span>
                </div>
                <div className="border-t border-gray-100 pt-2">
                  <p className="text-xs font-semibold text-gray-500 mb-1">설명</p>
                  <p className="whitespace-normal break-keep leading-relaxed text-xs text-gray-600">
                    {dscr >= 1 && bankabilityScore >= 68
                      ? 'DSCR 및 수익률이 양호합니다. 현재 조건으로 매수를 검토할 수 있습니다.'
                      : dscr >= 1
                        ? `DSCR ${dscr.toFixed(2)}x로 금융비용은 커버되나, 종합 점수 개선이 필요합니다.`
                        : `DSCR ${dscr.toFixed(2)}x — 금융비용 미달. 매입가 협상 또는 월세 ${Math.ceil((loan * 10000 * (rate / 100) + 82) / (12 * (1 - vacancyRate / 100)))}만 이상 확보를 권장합니다.`
                    }
                  </p>
                </div>
              </div>

              {/* DEAL SIGNAL */}
              <div className="bg-white border border-border rounded-[14px] p-3 flex flex-col h-full">
                <p className="text-[15px] font-bold mb-3">DEAL SIGNAL</p>
                <p className="text-2xl font-semibold leading-tight text-black mb-3">
                  {dealSignal}
                </p>
                <div className="relative h-1.5 bg-muted rounded-full mb-2">
                  <div
                    className="absolute w-3 h-3 bg-foreground rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2"
                    style={{ left: `${dealSignal === '매수보류' ? 10 : dealSignal === '가격협상' ? 50 : 90}%` }}
                  />
                </div>
                <div className="flex justify-between mb-auto text-[11px] text-muted-foreground">
                  <span>보류</span>
                  <span>가격협상</span>
                  <span>매수</span>
                </div>
                <div className="mt-auto border-t border-gray-100 pt-2">
                  <p className="text-xs font-semibold text-gray-500 mb-1">설명</p>
                  <p className="text-xs leading-relaxed text-gray-600 break-keep">
                    {dealSignal === '매수보류'
                      ? 'DSCR 및 수익률 양호'
                      : dealSignal === '가격협상'
                        ? 'DSCR 기준 미달, 매입가 협상 권장'
                        : '공실률 과다, 재검토 필요'}
                  </p>
                </div>
              </div>

              {/* Insight cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { k: '연간 커버리지', v: `${dscr.toFixed(2)}x`, s: 'NOI / 연간 부채상환액', pop: '현재 NOI가 연간 부채상환액을 충분히 커버하는지 판단합니다.' },
                  { k: '상권 강점', v: '합정 생활상권', s: '역세권 + 주거 유입 안정', pop: '합정역 접근성과 주거 기반 유입, 상업/F&B 수요가 겹치는 상권입니다.' },
                  { k: '밸류에드', v: '조건부 가능', s: '임대 개선 여력 확인', pop: '리모델링, 업종 재구성, 임대료 재협상을 통해 수익성 개선 여지가 있습니다.' },
                  { k: '핵심 리스크', v: '공실 · 도로화폭', s: `공실률 ${vacancyRate}%, 도로화폭 4m`, pop: '공실률과 접도 조건은 대출 심사와 매입가 협상에서 핵심 확인 항목입니다.', red: true },
                ].map((item, i) => (
                  <div key={i} className="bg-white border border-border rounded-[14px] p-3 hover:shadow-md transition-shadow group relative min-w-0">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1 truncate">{item.k}</p>
                    <p className={`text-[17px] font-semibold leading-tight mb-0.5 break-keep ${item.red ? 'text-red-600' : 'text-gray-950'}`}>{item.v}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug break-keep">{item.s}</p>
                    <div className="absolute left-0 top-full mt-2 w-60 bg-white border border-border rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-xs">
                      {item.pop}
                    </div>
                  </div>
                ))}
              </div>

              {/* Map */}
              <div className="bg-white border border-border rounded-[14px] p-3 flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[15px] font-bold">지도</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-muted text-[10px] rounded-full">{address.split(' ').slice(-2).join(' ')}</span>
                    {!mapError && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMapModal(true)
                          setTimeout(() => initModalMap(), 100)
                        }}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title="지도 확대"
                      >
                        <ZoomIn className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>

                {mapError ? (
                  <div className="flex-1 bg-gray-50 border border-dashed border-gray-200 rounded-lg flex items-center justify-center px-3 py-4">
                    <div className="text-center">
                      <p className="text-xs font-semibold text-gray-800 mb-2">Kakao 지도를 불러오지 못했습니다.</p>
                      <p className="text-[11px] text-gray-600 mb-2 break-keep leading-relaxed">{mapError}</p>
                      <p className="text-[10px] text-gray-400">브라우저 콘솔(F12)에서 [kakao-map] 로그를 확인해주세요.</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex-1 min-h-[140px] overflow-hidden rounded-lg bg-gray-100">
                    {/* Map container - always rendered */}
                    <div 
                      ref={mapRef}
                      className="absolute inset-0 h-full w-full"
                    />

                    {/* Loading overlay */}
                    {mapLoading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/80">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">지도 로딩 중...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Legacy insight cards moved into top row */}
            <div className="hidden">
              {[
                { k: '연간 커버리지', v: `${dscr.toFixed(2)}x`, s: 'NOI / 연간 금융비용', pop: '현재 NOI가 연간 금융비용을 충분히 커버하지 못합니다.' },
                { k: '상권 강점', v: '합정 생활상권', s: '역세권 + 주거 유입 안정', pop: '합정역 접근성, 주거 기반 유입, 팝업·F&B 수요가 겹치는 상권입니다.' },
                { k: '밸류애드', v: '조건부 가능', s: '용적 여력 제한적', pop: '리모델링을 통한 효율 개선과 임차인 업종 재구성으로 수익성 개선 여지가 있습니다.' },
                { k: '핵심 리스크', v: '공실 · 도로확폭', s: `공실률 ${vacancyRate}%, 도로확폭 4m`, pop: '인접도로가 4m 미만이면 도로확폭 대상이 될 수 있습니다.', red: true },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-border rounded-[14px] p-3.5 hover:shadow-md transition-shadow group relative">
                  <p className="text-[11px] text-muted-foreground font-bold uppercase mb-1">{item.k}</p>
                  <p className={`text-[19px] font-medium mb-0.5 ${item.red ? 'text-red-600' : ''}`}>{item.v}</p>
                  <p className="text-[12px] text-muted-foreground">{item.s}</p>
                  <div className="absolute left-0 top-full mt-2 w-60 bg-white border border-border rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-xs">
                    {item.pop}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-border rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0 relative">
              <StrategyTabPanel
                strategy={analysisStrategy}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                selectedPersona={selectedPersona}
                onPersonaChange={setSelectedPersona}
                fallback={{
                  address,
                  price,
                  loan,
                  rate,
                  rent,
                  vacancyRate,
                  noi,
                  dscr,
                  ltv,
                  cap,
                  bankabilityScore,
                  dealSignal,
                  rentalInputGuide,
                  commercialHeadline,
                  topIndustryCount: topDongIndustries.length,
                }}
              />
            </div>
            
          </ScrollArea>
          
          {/* Fixed CTA at bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-30 mx-3.5 mb-3.5">
            <div className="bg-white rounded-[8px] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border border-border overflow-hidden">
              <AnalysisCTA
                isOpen={isCtaOpen}
                onToggle={() => setIsCtaOpen((open) => !open)}
              />
            </div>
          </div>
          </div>
        </div>
      </div>
      </div>

      {/* ============================================================ */}
      {/* MAP MODAL */}
      {/* ============================================================ */}
      {showMapModal && (
        <div 
          className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4"
          onClick={() => setShowMapModal(false)}
        >
          <div 
            className="w-full max-w-[1260px] h-[780px] max-h-[calc(100vh-32px)] bg-white rounded-[20px] overflow-hidden grid grid-rows-[58px_1fr]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 border-b border-border">
              <p className="text-sm">지도에서 물건을 선택하고 &apos;분석&apos;을 클릭하세요</p>
              <button onClick={() => setShowMapModal(false)} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Map body - Kakao Map */}
            <div className="relative">
              {/* Kakao Map Container */}
              <div 
                ref={modalMapRef}
                className="w-full h-full bg-gray-100"
              />
              
              {/* Overlay: Property Info Card */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[320px] bg-white border border-border rounded-[14px] p-4 shadow-lg z-10">
                <p className="text-[22px] font-bold mb-1">{address.split(' ').slice(-2).join(' ')}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {address}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowMapModal(false)}>
                    닫기
                  </Button>
                  <Button className="flex-1" onClick={() => {
                    setShowMapModal(false)
                    handleRunAnalysis()
                  }}>
                    분석 실행
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

