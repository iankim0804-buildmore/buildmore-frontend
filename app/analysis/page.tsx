"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
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
  role: 'user' | 'assistant'
  content: string
}

// ============================================================
// DATA
// ============================================================
const mapProperties: MapProperty[] = [
  { id: 'mp1', shortAddress: '합정동 410-12', address: '서울특별시 마포구 합정동 410-12', price: 42.0, rent: 290, area: '300㎡', position: { left: '17%', top: '18%' } },
  { id: 'mp2', shortAddress: '서교동 395-10', address: '서울특별시 마포구 서교동 395-10', price: 33.0, rent: 260, area: '220㎡', position: { left: '53%', top: '14%' } },
  { id: 'mp3', shortAddress: '상수동 72-1', address: '서울특별시 마포구 상수동 72-1', price: 28.5, rent: 210, area: '180㎡', position: { left: '73%', top: '24%' } },
  { id: 'mp4', shortAddress: '합정동 428-5', address: '서울특별시 마포구 합정동 428-5', price: 38.0, rent: 320, area: '210㎡', position: { left: '23%', top: '46%' } },
  { id: 'mp5', shortAddress: '망원동 379-7', address: '서울특별시 마포구 망원동 379-7', price: 26.8, rent: 190, area: '160㎡', position: { left: '67%', top: '48%' } },
  { id: 'mp6', shortAddress: '합정동 601-3', address: '서울특별시 마포구 합정동 601-3', price: 47.0, rent: 360, area: '350㎡', position: { left: '80%', top: '72%' } },
  { id: 'mp7', shortAddress: '서교동 510-2', address: '서울특별시 마포구 서교동 510-2', price: 36.5, rent: 280, area: '250㎡', position: { left: '28%', top: '79%' } },
]

const transactions = [
  { date: '2025.05.23', location: '합정동', area: '142㎡', price: '58.2억', pricePerM2: '4,099만', type: '상업' },
  { date: '2025.04.11', location: '서교동', area: '165㎡', price: '62.0억', pricePerM2: '3,758만', type: '다세대' },
  { date: '2025.03.28', location: '상수동', area: '118㎡', price: '45.6억', pricePerM2: '3,864만', type: '상업' },
  { date: '2025.02.14', location: '망원동', area: '132㎡', price: '41.8억', pricePerM2: '3,167만', type: '상업' },
  { date: '2025.01.19', location: '합정동', area: '156㎡', price: '54.4억', pricePerM2: '3,487만', type: '근생' },
  { date: '2024.12.07', location: '서교동', area: '149㎡', price: '50.1억', pricePerM2: '3,362만', type: '상업' },
  { date: '2024.11.22', location: '상수동', area: '171㎡', price: '64.5억', pricePerM2: '3,772만', type: '상업' },
]

const recentAnalyses = [
  { address: '합정동 428-5', score: 43, date: '방금 전' },
  { address: '서교동 395-10', score: 67, date: '어제' },
  { address: '상수동 72-1', score: 55, date: '3일 전' },
]

const addressHistory = [
  '서울특별시 마포구 합정동 428-5',
  '서울특별시 마포구 서교동 395-10',
  '서울특별시 강남구 역삼동 123-4',
  '서울특별시 서초구 서초동 456-7',
  '서울특별시 송파구 잠실동 789-0',
]

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AnalysisPage() {
  // ============================================================
  // A. SIDEBAR STATE (maintained from demo page)
  // ============================================================
  const [apiStatus, setApiStatus] = useState<'connected' | 'connecting'>('connecting')
  
  // ============================================================
  // B. CHAT STATE
  // ============================================================
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'user', content: '합정동 428-5 근생을 38억에 매입해서 임대하려고 해. 금융적으로 괜찮을까?' },
    { role: 'assistant', content: '분석을 시작합니다. 우측 패널에서 상세한 금융 분석 결과를 확인하실 수 있습니다.\n\n현재 DSCR이 0.91로 금융비용 커버리지가 다소 부족합니다. 매입가 협상이나 임대조건 개선을 권장드립니다.' },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // ============================================================
  // C. ANALYSIS PANEL STATE
  // ============================================================
  // Address & history
  const [address, setAddress] = useState('서울특별시 마포구 합정동 428-5')
  const [showHistory, setShowHistory] = useState(false)
  
  // Panel A: 매입조건
  const [price, setPrice] = useState(38.00)
  const [loan, setLoan] = useState(22.00)
  const [rate, setRate] = useState(4.80)
  
  // Panel B: 임대조건
  const [rent, setRent] = useState(320)
  const [deposit, setDeposit] = useState(5000)
  const [vacancyRate, setVacancyRate] = useState(20) // 공실률: 긍정 10 / 적정 20 / 보수 30
  const [vacancySensitivity, setVacancySensitivity] = useState(20) // 공실민감도: 게이지바 별도 값
  
  // Panel C: 건축물대장 (read-only from API, using defaults)
  const buildingData = { permitYear: 2000, approvalYear: 2001, registerArea: 420, maxGfa: 420 }
  
  // Panel D: 건축조건
  const [scenario, setScenario] = useState<'현황' | '증축' | '신축' | '리모델링'>('현황')
  const [gfa, setGfa] = useState(420)
  const [constructionCost, setConstructionCost] = useState(500)
  const [elevator, setElevator] = useState<'있음' | '없음' | '설치예정'>('있음')
  const [basement, setBasement] = useState('없음')
  const [remodelingRange, setRemodelingRange] = useState('부분 리모델링')
  
  // Panel E: 분석옵션
  const [financeScenario, setFinanceScenario] = useState(true)
  const [vacancyScenario, setVacancyScenario] = useState(true)
  const [roadRisk, setRoadRisk] = useState(true)
  const [autoReport, setAutoReport] = useState(false)
  
  // Map modal
  const [showMapModal, setShowMapModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<MapProperty>(mapProperties[3])
  
  // Table tabs
  const [activeTab, setActiveTab] = useState('실거래 비교')
  const tabs = ['금융 분석', 'NOI · DSCR', '건축조건', '리스크', '실거래 비교']
  
  // Calculated values
  const [noi, setNoi] = useState(0)
  const [dscr, setDscr] = useState(0)
  const [ltv, setLtv] = useState(0)
  const [cap, setCap] = useState(0)
  const [bankabilityScore, setBankabilityScore] = useState(0)
  const [dealSignal, setDealSignal] = useState<'매수' | '가격협상' | '매수보류'>('가격협상')

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
    // 공실률 패널티: 공실률 * 공실민감도 * 가중치 (공실률 높을수록, 민감도 높을수록 점수 감소)
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

  // Simulate API connection
  useEffect(() => {
    const timer = setTimeout(() => setApiStatus('connected'), 1500)
    return () => clearTimeout(timer)
  }, [])

  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  const handleNewAnalysis = () => {
    setChatMessages([])
    setInputValue('')
    toast.success('새 분석을 시작합니다.')
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isAnalyzing) return
    
    setChatMessages(prev => [...prev, { role: 'user', content: inputValue }])
    setInputValue('')
    setIsAnalyzing(true)
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '분석을 완료했습니다. 우측 패널에서 업데이트된 결과를 확인하세요.' 
      }])
      setIsAnalyzing(false)
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 1500)
  }

  const handleAddressSelect = (addr: string) => {
    setAddress(addr)
    setShowHistory(false)
    // Find matching property if exists
    const prop = mapProperties.find(p => p.address === addr)
    if (prop) {
      setPrice(prop.price)
      setRent(prop.rent)
    }
  }

  const handleAnalyzeSelected = () => {
    setAddress(selectedProperty.address)
    setPrice(selectedProperty.price)
    setRent(selectedProperty.rent)
    setShowMapModal(false)
    recalc()
    toast.success(`${selectedProperty.shortAddress} 분석을 시작합니다.`)
  }

  const handleComingSoon = (feature: string) => {
    toast.info(`${feature} 기능은 준비 중입니다.`)
  }

  // Number input increment/decrement
  const NumField = ({ 
    value, 
    onChange, 
    step, 
    min = 0,
    disabled = false,
    isLoan = false,
    decimals = 0,
  }: { 
    value: number
    onChange: (v: number) => void
    step: number
    min?: number
    disabled?: boolean
    isLoan?: boolean
    decimals?: number
  }) => {
    const formatValue = (v: number) => {
      if (decimals > 0) return v.toFixed(decimals)
      return v
    }
    
    return (
    <div className="grid grid-cols-[1fr_34px_34px] h-[38px] border border-border rounded-[10px] overflow-hidden">
      <input
        type="number"
        value={formatValue(value)}
        onChange={(e) => onChange(Math.max(min, parseFloat(e.target.value) || 0))}
        disabled={disabled}
        className="border-0 px-2.5 text-sm bg-background disabled:bg-muted focus:outline-none focus:ring-0"
        step={decimals > 0 ? `0.${'0'.repeat(decimals - 1)}1` : "any"}
      />
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={disabled}
        className="border-l border-border bg-background hover:bg-muted disabled:opacity-50 text-base"
      >
        −
      </button>
      <button
        onClick={() => onChange(value + step)}
        disabled={disabled}
        className="border-l border-border bg-background hover:bg-muted disabled:opacity-50 text-base"
      >
        +
      </button>
    </div>
  )
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
      <p className="text-sm font-medium text-[#666] break-keep mb-2">{label}</p>
      <p className="text-[22px] font-bold whitespace-nowrap">{value}</p>
      <p className="text-xs text-[#999] leading-relaxed mt-1 break-keep">{sub}</p>
    </div>
  )

  // Get today's date
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '')

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* ============================================================ */}
      {/* TOPBAR (66px) - FULL WIDTH */}
      {/* ============================================================ */}
      <header className="h-[66px] bg-white border-b border-border px-5 grid grid-cols-[170px_1fr_400px] items-center flex-shrink-0">
        {/* Logo */}
        <div className="text-[22px] font-extrabold text-foreground tracking-tight">BUILDMORE</div>
        
        {/* Address search */}
        <div className="flex justify-center">
          <div className="relative w-[420px]">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={() => setShowHistory(true)}
              className="h-[42px] pr-20 text-sm"
              placeholder="주소를 입력하세요"
            />
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
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
                {addressHistory.map((addr, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddressSelect(addr)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted text-left"
                  >
                    <span className="truncate">{addr}</span>
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground flex-shrink-0" />
                  </button>
                ))}
                <button
                  onClick={() => handleComingSoon('검색 기록 관리')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted border-t border-border"
                >
                  <Clock className="w-3.5 h-3.5" />
                  검색 기록 관리
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Pills */}
        <div className="flex justify-end gap-1 flex-nowrap">
          <span className="px-2.5 py-1 bg-muted text-[12px] rounded-full whitespace-nowrap">제2종일반주거</span>
          <span className="px-2.5 py-1 bg-muted text-[12px] rounded-full whitespace-nowrap">법정 건폐율 60%</span>
          <span className="px-2.5 py-1 bg-muted text-[12px] rounded-full whitespace-nowrap">법정 용적률 200%</span>
          <span className="px-2.5 py-1 bg-muted text-[12px] rounded-full whitespace-nowrap">대지 210㎡</span>
        </div>
      </header>

      {/* MAIN LAYOUT - Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* ============================================================ */}
        {/* A. LEFT NAVIGATION SIDEBAR (160px) */}
        {/* ============================================================ */}
        <aside className="w-40 flex-shrink-0 flex flex-col bg-card border-r border-border">
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
            {recentAnalyses.map((item, i) => (
              <Button 
                key={i}
                variant="ghost" 
                size="sm"
                className={`w-full justify-start gap-2 text-xs h-auto py-1.5 ${i === 0 ? 'bg-accent' : ''}`}
                onClick={() => handleComingSoon(item.address)}
              >
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                <div className="flex-1 text-left truncate">
                  <p className="text-[11px] truncate">{item.address}</p>
                  <p className="text-[10px] text-muted-foreground">{item.date}</p>
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
      {/* B. CHAT AREA (flex-1) */}
      {/* ============================================================ */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-background border-r border-border">
        {/* Chat header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-card">
          <h2 className="text-sm font-medium text-foreground">대화</h2>
          <span className="text-xs text-muted-foreground">{chatMessages.length}개 메시지</span>
        </div>

        {/* Chat messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isAnalyzing && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  분석 중...
                  </div>
                )}

                {/* 실거래 비교 */}
                {activeTab === '실거래 비교' && (
                  <div className="space-y-0">
                    <table className="w-full whitespace-normal break-keep leading-relaxed">
                      <thead className="sticky top-0 bg-[#fafafb]">
                        <tr>
                          <th className="text-left text-xs uppercase text-[#777] font-medium px-4 py-3 tracking-wide">거래일</th>
                          <th className="text-left text-xs uppercase text-[#777] font-medium px-4 py-3 tracking-wide">위치</th>
                          <th className="text-left text-xs uppercase text-[#777] font-medium px-4 py-3 tracking-wide">면적</th>
                          <th className="text-left text-xs uppercase text-[#777] font-medium px-4 py-3 tracking-wide">거래가</th>
                          <th className="text-left text-xs uppercase text-[#777] font-medium px-4 py-3 tracking-wide">㎡당</th>
                          <th className="text-left text-xs uppercase text-[#777] font-medium px-4 py-3 tracking-wide">유형</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, i) => (
                          <tr key={i} className="border-b border-[#f1f1f3]">
                            <td className="px-4 py-3 text-sm break-keep">{tx.date}</td>
                            <td className="px-4 py-3 text-sm break-keep">{tx.location}</td>
                            <td className="px-4 py-3 text-sm break-keep">{tx.area}</td>
                            <td className="px-4 py-3 text-sm font-semibold tabular-nums">{tx.price}</td>
                            <td className="px-4 py-3 text-sm tabular-nums">{tx.pricePerM2}</td>
                            <td className="px-4 py-3 text-sm break-keep">{tx.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

              </div>
            </div>
          </ScrollArea>
        </div>
      )}

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
            
            {/* Map body */}
            <div 
              className="relative bg-gray-100"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(0,0,0,0.04) 30px, rgba(0,0,0,0.04) 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(0,0,0,0.04) 30px, rgba(0,0,0,0.04) 31px)'
              }}
            >
              {/* Property markers */}
              {mapProperties.map(prop => (
                <button
                  key={prop.id}
                  onClick={() => setSelectedProperty(prop)}
                  className={`absolute bg-white border-2 rounded-xl px-2.5 py-1.5 text-xs shadow-sm transition-all hover:shadow-md ${
                    selectedProperty.id === prop.id ? 'border-foreground ring-2 ring-foreground/20' : 'border-border'
                  }`}
                  style={{ left: prop.position.left, top: prop.position.top }}
                >
                  <p className="font-medium">{prop.shortAddress}</p>
                  <p className="text-muted-foreground">{prop.area} / {prop.price}억</p>
                </button>
              ))}
              
              {/* Selected pin */}
              <div 
                className="absolute w-7 h-7 bg-foreground rounded-full rounded-br-none -rotate-45 pointer-events-none"
                style={{ 
                  left: `calc(${selectedProperty.position.left} + 40px)`, 
                  top: `calc(${selectedProperty.position.top} + 10px)` 
                }}
              />
              
              {/* Pick card */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[280px] bg-white border border-border rounded-[14px] p-4 shadow-lg">
                <p className="text-[22px] font-bold mb-1">{selectedProperty.shortAddress}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {selectedProperty.area} · {selectedProperty.price.toFixed(1)}억 · 월 {selectedProperty.rent}만
                </p>
                <Button className="w-full" onClick={handleAnalyzeSelected}>
                  분석
                </Button>
              </div>
              
              {/* Zoom controls */}
              <div className="absolute right-4 bottom-4 flex flex-col gap-1">
                <button className="w-9 h-9 bg-white border border-border rounded-lg flex items-center justify-center hover:bg-muted">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button className="w-9 h-9 bg-white border border-border rounded-lg flex items-center justify-center hover:bg-muted">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button className="w-9 h-9 bg-white border border-border rounded-lg flex items-center justify-center hover:bg-muted">
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
