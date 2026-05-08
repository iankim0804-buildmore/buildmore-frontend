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
  const [price, setPrice] = useState(38.0)
  const [loan, setLoan] = useState(22.0)
  const [rate, setRate] = useState(4.8)
  
  // Panel B: 임대조건
  const [rent, setRent] = useState(320)
  const [deposit, setDeposit] = useState(5000)
  const [vacancy, setVacancy] = useState<10 | 20 | 30>(20)
  
  // Panel C: 건축물대장 (read-only from API, using defaults)
  const buildingData = { permitYear: 2000, approvalYear: 2001, registerArea: 420, maxGfa: 420 }
  
  // Panel D: 건축조건
  const [scenario, setScenario] = useState<'현황' | '증축' | '신축' | '리모델링'>('현황')
  const [gfa, setGfa] = useState(420)
  const [constructionCost, setConstructionCost] = useState(500)
  const [elevator, setElevator] = useState<'있음' | '없음' | '설치예정'>('있음')
  
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
    const noiVal = Math.max(0, rent * 12 * (1 - vacancy / 100) - 82)
    const annualDebt = loan * 10000 * (rate / 100)
    const dscrVal = annualDebt ? noiVal / annualDebt : 0
    const ltvVal = price ? (loan / price) * 100 : 0
    const capVal = price ? (noiVal / (price * 10000)) * 100 : 0
    const scoreVal = Math.max(18, Math.min(88,
      Math.round(63 - (0.95 - dscrVal) * 24 - Math.max(0, vacancy - 10) * 0.7 - (elevator === '설치예정' ? 3 : 0))
    ))
    
    setNoi(noiVal)
    setDscr(dscrVal)
    setLtv(ltvVal)
    setCap(capVal)
    setBankabilityScore(scoreVal)
    
    if (scoreVal >= 68 && dscrVal >= 0.9) {
      setDealSignal('매수')
    } else if (scoreVal <= 35 || vacancy >= 30) {
      setDealSignal('매수보류')
    } else {
      setDealSignal('가격협상')
    }
  }, [price, loan, rate, rent, vacancy, elevator])

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
  }: { 
    value: number
    onChange: (v: number) => void
    step: number
    min?: number
    disabled?: boolean
  }) => (
    <div className="grid grid-cols-[1fr_34px_34px] h-[38px] border border-border rounded-[10px] overflow-hidden">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Math.max(min, parseFloat(e.target.value) || 0))}
        disabled={disabled}
        className="border-0 px-2.5 text-sm bg-background disabled:bg-muted focus:outline-none focus:ring-0"
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

  // Get today's date
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '')

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* ============================================================ */}
      {/* A. LEFT NAVIGATION SIDEBAR (160px) */}
      {/* ============================================================ */}
      <aside className="w-40 flex-shrink-0 flex flex-col bg-card border-r border-border">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border">
          <Link href="/" className="text-foreground font-bold text-sm">BuildMore</Link>
        </div>

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
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        {/* Chat input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="질문을 입력하세요..."
              className="flex-1 text-sm"
              disabled={isAnalyzing}
            />
            <Button type="submit" size="icon" disabled={isAnalyzing || !inputValue.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            예: &quot;이 물건 DSCR이 낮은데 어떻게 하면 좋을까?&quot;
          </p>
        </form>
      </div>

      {/* ============================================================ */}
      {/* C. ANALYSIS PANEL (remaining width) */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col bg-[#f8f8f9] overflow-hidden">
        {/* TOPBAR (66px) */}
        <header className="h-[66px] bg-white border-b border-border px-5 grid grid-cols-[170px_1fr_360px] items-center">
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
          <div className="flex justify-end gap-2">
            <span className="px-2.5 py-1 bg-muted text-[11px] rounded-full">제2종일반주거</span>
            <span className="px-2.5 py-1 bg-muted text-[11px] rounded-full">법정 건폐율 60%</span>
            <span className="px-2.5 py-1 bg-muted text-[11px] rounded-full">법정 용적률 200%</span>
            <span className="px-2.5 py-1 bg-muted text-[11px] rounded-full">대지 210㎡</span>
          </div>
        </header>

        {/* KPI STRIP (72px) */}
        <div className="h-[72px] bg-white border-b border-border px-5 grid grid-cols-[160px_1fr_180px] items-center">
          {/* Run button */}
          <Button 
            className="w-[108px] h-10 bg-foreground text-background hover:bg-foreground/90 text-sm font-medium"
            onClick={() => {
              recalc()
              toast.success('분석이 완료되었습니다.')
            }}
          >
            분석 실행
          </Button>
          
          {/* Tags + KPIs */}
          <div className="flex items-center gap-4">
            {/* Tags */}
            <div className="flex gap-1.5">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] rounded">합정 생활상권</span>
              <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[11px] rounded">역세권</span>
              <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[11px] rounded">팝업/F&B</span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[11px] rounded">주거 유입</span>
            </div>
            
            <div className="w-px h-8 bg-border" />
            
            {/* KPIs */}
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">NOI</p>
                <p className="text-[17px] font-semibold">{noi.toLocaleString('ko-KR')}만</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">DSCR</p>
                <p className={`text-[17px] font-semibold ${dscr < 1 ? 'text-red-600' : ''}`}>{dscr.toFixed(2)}x</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">LTV</p>
                <p className="text-[17px] font-semibold">{ltv.toFixed(1)}%</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">CAP</p>
                <p className="text-[17px] font-semibold">{cap.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          {/* Live indicator */}
          <div className="flex items-center justify-end gap-2 text-blue-600 text-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            실시간 데이터 분석중
          </div>
        </div>

        {/* MAIN AREA */}
        <div className="flex-1 grid grid-cols-[340px_1fr] overflow-hidden">
          {/* ============================================================ */}
          {/* LEFT SIDEBAR - 5 PANELS */}
          {/* ============================================================ */}
          <ScrollArea className="bg-[#fbfbfb] p-3.5">
            <div className="space-y-3">
              {/* Panel A: 매입조건 */}
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="h-[42px] px-4 flex items-center border-b border-border">
                  <span className="text-[13px] font-bold">A 매입조건</span>
                </div>
                <div className="p-3 space-y-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">매입가격 (억원)</label>
                    <NumField value={price} onChange={setPrice} step={0.1} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">대출금액 (억원)</label>
                    <NumField value={loan} onChange={setLoan} step={0.1} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">금리 (%)</label>
                    <NumField value={rate} onChange={setRate} step={0.1} />
                  </div>
                  <div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-foreground transition-all" style={{ width: `${ltv}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>급매</span>
                      <span>LTV {ltv.toFixed(1)}%</span>
                      <span>AI 할인 5~10% 적용</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel B: 임대조건 */}
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="h-[42px] px-4 flex items-center border-b border-border">
                  <span className="text-[13px] font-bold">B 임대조건</span>
                </div>
                <div className="p-3 space-y-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">월세 (만원)</label>
                    <NumField value={rent} onChange={setRent} step={10} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">보증금 (만원)</label>
                    <NumField value={deposit} onChange={setDeposit} step={500} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">공실률</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([30, 20, 10] as const).map(v => (
                        <button
                          key={v}
                          onClick={() => setVacancy(v)}
                          className={`h-[32px] rounded-lg text-xs border transition-colors ${
                            vacancy === v 
                              ? 'bg-foreground text-background border-foreground' 
                              : 'bg-white border-border hover:bg-muted'
                          }`}
                        >
                          {v === 30 ? '보수 30' : v === 20 ? '적정 20' : '긍정 10'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: '42%' }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">공실민감도</p>
                  </div>
                </div>
              </div>

              {/* Panel C: 건축물대장 */}
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="h-[42px] px-4 flex items-center justify-between border-b border-border">
                  <span className="text-[13px] font-bold">C 건축물대장 표제부</span>
                  <span className="text-[10px] text-muted-foreground">{today} 최신값</span>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  <div className="border border-border rounded-[10px] p-2">
                    <p className="text-[10px] text-muted-foreground">허가연도</p>
                    <p className="text-sm font-bold">{buildingData.permitYear}</p>
                  </div>
                  <div className="border border-border rounded-[10px] p-2">
                    <p className="text-[10px] text-muted-foreground">사용승인연도</p>
                    <p className="text-sm font-bold">{buildingData.approvalYear}</p>
                  </div>
                  <div className="border border-border rounded-[10px] p-2">
                    <p className="text-[10px] text-muted-foreground">대장상연면적</p>
                    <p className="text-sm font-bold">{buildingData.registerArea}㎡</p>
                  </div>
                  <div className="border border-border rounded-[10px] p-2">
                    <p className="text-[10px] text-muted-foreground">신축최대연면적</p>
                    <p className="text-sm font-bold">{buildingData.maxGfa}㎡</p>
                  </div>
                </div>
              </div>

              {/* Panel D: 건축조건 */}
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="h-[42px] px-4 flex items-center border-b border-border">
                  <span className="text-[13px] font-bold">D 건축조건</span>
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
                    {gfa > buildingData.maxGfa && scenario !== '현황' && (
                      <p className="text-[10px] text-red-600 mt-1">법정 용적률 초과</p>
                    )}
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
                  <span className="text-[13px] font-bold">E 분석옵션</span>
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
          <ScrollArea className="p-3.5">
            <h1 className="text-[26px] font-extrabold text-foreground mb-4">분석 결과</h1>

            {/* Top 3 cards */}
            <div className="grid grid-cols-[1.7fr_0.8fr_0.95fr] gap-3 mb-3">
              {/* BANKABILITY */}
              <div className="bg-white border border-border rounded-[14px] p-4">
                <p className="text-[15px] font-bold mb-3">BANKABILITY</p>
                <p className="text-[48px] font-medium tracking-tight leading-none mb-3">
                  {bankabilityScore} <span className="text-xl text-muted-foreground">/ 100</span>
                </p>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-foreground transition-all" style={{ width: `${bankabilityScore}%` }} />
                </div>
                <div className="grid grid-cols-[74px_1fr] gap-y-3 text-[13px]">
                  <span className="text-muted-foreground font-bold">상권</span>
                  <span>합정 생활상권 · 역세권 · 팝업/F&B</span>
                  <span className="text-muted-foreground font-bold">입력값</span>
                  <span>매입 {price.toFixed(1)}억 / 대출 {loan.toFixed(1)}억 / 금리 {rate.toFixed(1)}%</span>
                  <span className="text-muted-foreground font-bold">분석엔진</span>
                  <span>BuildMore v2.1</span>
                  <span className="text-muted-foreground font-bold">설명</span>
                  <span>
                    {dscr >= 1 && bankabilityScore >= 68
                      ? 'DSCR 및 수익률이 양호합니다. 현재 조건으로 매수를 검토할 수 있습니다.'
                      : dscr >= 1
                        ? `DSCR ${dscr.toFixed(2)}x로 금융비용은 커버되나, 종합 점수 개선이 필요합니다.`
                        : `DSCR ${dscr.toFixed(2)}x — 금융비용 미달. 매입가 협상 또는 월세 ${Math.ceil((loan * 10000 * (rate / 100) + 82) / (12 * (1 - vacancy / 100)))}만 이상 확보를 권장합니다.`
                    }
                  </span>
                </div>
              </div>

              {/* DEAL SIGNAL */}
              <div className="bg-white border border-border rounded-[14px] p-4">
                <p className="text-[15px] font-bold mb-3">DEAL SIGNAL</p>
                <p className={`text-[28px] font-bold mb-2 ${dealSignal !== '매수' ? 'text-red-600' : ''}`}>
                  {dealSignal}
                </p>
                <p className="text-[13px] text-muted-foreground mb-4">
                  {dealSignal === '매수' 
                    ? 'DSCR 및 수익률 양호' 
                    : dealSignal === '가격협상'
                      ? 'DSCR 기준 미달, 매입가 협상 권장'
                      : '공실률 과다, 재검토 필요'}
                </p>
                <div className="relative h-1 bg-muted rounded-full">
                  <div 
                    className="absolute w-3.5 h-3.5 bg-foreground rounded-full -top-1.5"
                    style={{ left: `${dealSignal === '매수' ? 10 : dealSignal === '가격협상' ? 50 : 90}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
                  <span>매수</span>
                  <span className="text-red-600">가격협상</span>
                  <span>매수보류</span>
                </div>
              </div>

              {/* Map */}
              <div className="bg-white border border-border rounded-[14px] p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[15px] font-bold">지도</p>
                  <span className="px-2 py-0.5 bg-muted text-[11px] rounded-full">합정동 428-5</span>
                </div>
                <div 
                  className="h-[200px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg relative cursor-pointer"
                  onClick={() => setShowMapModal(true)}
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.03) 20px, rgba(0,0,0,0.03) 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.03) 20px, rgba(0,0,0,0.03) 21px)'
                  }}
                >
                  {/* Bubbles */}
                  <div className="absolute left-[18%] top-[18%] bg-white border border-border rounded-xl px-2 py-1 text-[10px] shadow-sm">
                    420㎡ / 52.0억
                  </div>
                  <div className="absolute left-[64%] top-[16%] bg-white border border-border rounded-xl px-2 py-1 text-[10px] shadow-sm">
                    160㎡ / 26.8억
                  </div>
                  <div className="absolute left-[70%] top-[56%] bg-white border border-border rounded-xl px-2 py-1 text-[10px] shadow-sm">
                    230㎡ / 31.5억
                  </div>
                  <div className="absolute left-[22%] top-[52%] bg-white border border-border rounded-xl px-2 py-1 text-[10px] shadow-sm">
                    210㎡ / 31.5억
                  </div>
                  <div className="absolute left-[48%] top-[70%] bg-white border border-border rounded-xl px-2 py-1 text-[10px] shadow-sm">
                    350㎡ / 47.0억
                  </div>
                  {/* Pin */}
                  <div 
                    className="absolute w-4 h-4 bg-foreground rounded-full rounded-br-none -rotate-45"
                    style={{ left: '54%', top: '42%' }}
                  />
                </div>
              </div>
            </div>

            {/* Insight cards */}
            <div className="grid grid-cols-4 gap-2.5 mb-3">
              {[
                { k: '연간 커버리지', v: `${dscr.toFixed(2)}x`, s: 'NOI / 연간 금융비용', pop: '현재 NOI가 연간 금융비용을 충분히 커버하지 못합니다.' },
                { k: '상권 강점', v: '합정 생활상권', s: '역세권 + 주거 유입 안정', pop: '합정역 접근성, 주거 기반 유입, 팝업·F&B 수요가 겹치는 상권입니다.' },
                { k: '밸류애드', v: '조건부 가능', s: '용적 여력 제한적', pop: '리모델링을 통한 효율 개선과 임차인 업종 재구성으로 수익성 개선 여지가 있습니다.' },
                { k: '핵심 리스크', v: '공실 · 도로확폭', s: `공실률 ${vacancy}%, 도로확폭 4m`, pop: '인접도로가 4m 미만이면 도로확폭 대상이 될 수 있습니다.', red: true },
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

            {/* Report cards */}
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              {[
                { t: '일반 PDF 다운로드', s: '분석 결과 요약 리포트를 PDF로 다운로드합니다.', btn: '다운로드' },
                { t: '심층 리포트 요청', s: '건축/금융/리스크 상세 분석을 포함한 심층 리포트를 받아보세요.', btn: '리포트 요청' },
                { t: 'DEAL PACKAGE', s: '협상 전략, 금융 조건, 리스크 대응을 포함한 맞춤형 패키지를 제공합니다.', btn: '패키지 보기' },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-border rounded-[14px] p-3.5 text-center">
                  <p className="text-sm font-bold mb-1">{item.t}</p>
                  <p className="text-xs text-muted-foreground mb-3">{item.s}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-9"
                    onClick={() => handleComingSoon(item.t)}
                  >
                    {item.btn}
                  </Button>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              {/* Tabs */}
              <div className="h-[46px] flex border-b border-border">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 text-sm transition-colors ${
                      activeTab === tab 
                        ? 'text-foreground border-b-[3px] border-foreground font-medium' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              {/* Table content */}
              <div className="h-[260px] overflow-auto">
                {/* 금융 분석 */}
                {activeTab === '금융 분석' && (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-muted/50">
                      <tr>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">항목</th>
                        <th className="text-right text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">값</th>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">설명</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: '매입가', value: `${price.toFixed(1)}억`, desc: '총 취득 비용 기준' },
                        { label: '대출금액', value: `${loan.toFixed(1)}억`, desc: `LTV ${ltv.toFixed(1)}%` },
                        { label: '자기자본', value: `${(price - loan).toFixed(1)}억`, desc: `매입가 대비 ${((price - loan) / price * 100).toFixed(1)}%` },
                        { label: '금리', value: `${rate.toFixed(1)}%`, desc: '연간 고정금리 기준' },
                        { label: '연간 이자비용', value: `${(loan * rate / 100 * 10000).toLocaleString('ko-KR')}만`, desc: `대출 ${loan.toFixed(1)}억 × ${rate.toFixed(1)}%` },
                        { label: '월 이자비용', value: `${Math.round(loan * rate / 100 * 10000 / 12).toLocaleString('ko-KR')}만`, desc: '연간 이자 ÷ 12개월' },
                        { label: 'NOI', value: `${noi.toLocaleString('ko-KR')}만`, desc: `월세 ${rent}만 × 12 × (1 - 공실 ${vacancy}%) - 운영비` },
                        { label: 'DSCR', value: `${dscr.toFixed(2)}x`, desc: dscr >= 1 ? '금융비용 충분히 커버' : '금융비용 미달 — 개선 필요' },
                        { label: 'CAP Rate', value: `${cap.toFixed(2)}%`, desc: `NOI ÷ 매입가 ${price.toFixed(1)}억` },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="px-4 py-3 text-[13px] text-muted-foreground">{row.label}</td>
                          <td className={`px-4 py-3 text-[13px] font-semibold text-right ${row.label === 'DSCR' && dscr < 1 ? 'text-red-600' : ''}`}>{row.value}</td>
                          <td className="px-4 py-3 text-[13px]">{row.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* NOI · DSCR */}
                {activeTab === 'NOI · DSCR' && (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-muted/50">
                      <tr>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">시나리오</th>
                        <th className="text-right text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">NOI (연간)</th>
                        <th className="text-right text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">DSCR</th>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">판정</th>
                      </tr>
                    </thead>
                    <tbody>
                      {([10, 20, 30] as const).map((v) => {
                        const noiV = Math.max(0, rent * 12 * (1 - v / 100) - 82)
                        const annualDebt = loan * 10000 * (rate / 100)
                        const dscrV = annualDebt ? noiV / annualDebt : 0
                        const isActive = v === vacancy
                        return (
                          <tr key={v} className={`border-b border-border/50 ${isActive ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                            <td className="px-4 py-3 text-[13px]">
                              {v === 10 ? '낙관 (공실 10%)' : v === 20 ? '기본 (공실 20%)' : '보수 (공실 30%)'}
                              {isActive && <span className="ml-2 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">현재</span>}
                            </td>
                            <td className="px-4 py-3 text-[13px] font-semibold text-right">{noiV.toLocaleString('ko-KR')}만</td>
                            <td className={`px-4 py-3 text-[13px] font-semibold text-right ${dscrV < 1 ? 'text-red-600' : 'text-green-600'}`}>{dscrV.toFixed(2)}x</td>
                            <td className="px-4 py-3 text-[13px]">{dscrV >= 1 ? '적격' : dscrV >= 0.8 ? '부족' : '부적격'}</td>
                          </tr>
                        )
                      })}
                      <tr className="border-b border-border/50 hover:bg-muted/30 bg-muted/20">
                        <td className="px-4 py-3 text-[13px] font-medium">손익분기 월세</td>
                        <td className="px-4 py-3 text-[13px] text-right" colSpan={2}>
                          {Math.ceil((loan * 10000 * (rate / 100) + 82) / (12 * (1 - vacancy / 100))).toLocaleString('ko-KR')}만원
                        </td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground">DSCR = 1.0 기준</td>
                      </tr>
                      <tr className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-[13px] font-medium">현재 월세와의 차이</td>
                        <td className="px-4 py-3 text-[13px] text-right" colSpan={2}>
                          {(rent - Math.ceil((loan * 10000 * (rate / 100) + 82) / (12 * (1 - vacancy / 100)))).toLocaleString('ko-KR')}만원
                        </td>
                        <td className={`px-4 py-3 text-[13px] ${rent >= Math.ceil((loan * 10000 * (rate / 100) + 82) / (12 * (1 - vacancy / 100))) ? 'text-green-600' : 'text-red-600'}`}>
                          {rent >= Math.ceil((loan * 10000 * (rate / 100) + 82) / (12 * (1 - vacancy / 100))) ? '흑자' : '적자'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {/* 건축조건 */}
                {activeTab === '건축조건' && (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-muted/50">
                      <tr>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">항목</th>
                        <th className="text-right text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">값</th>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: '시나리오', value: scenario, desc: '현재 선택된 건축 시나리오' },
                        { label: '대장상 연면적', value: `${buildingData.registerArea}㎡`, desc: '건축물대장 등록 기준' },
                        { label: '신축 최대 연면적', value: `${buildingData.maxGfa}㎡`, desc: '법정 용적률 적용' },
                        { label: '분석 연면적', value: `${gfa}㎡`, desc: scenario === '현황' ? '현황 유지' : gfa > buildingData.maxGfa ? '법정 용적률 초과' : '가능 범위 내' },
                        { label: '시공비 단가', value: `${constructionCost.toLocaleString()}만원/㎡`, desc: '공사비 산정 기준' },
                        { label: '총 시공비', value: `${(gfa * constructionCost).toLocaleString()}만원`, desc: scenario === '현황' ? '해당 없음' : `${gfa}㎡ × ${constructionCost}만원` },
                        { label: '엘리베이터', value: elevator, desc: elevator === '설치예정' ? '설치 예정 (Bankability -3점)' : elevator === '있음' ? '기설치 완료' : '없음 — 임차인 유치 불리' },
                        { label: '허가연도', value: String(buildingData.permitYear), desc: '건축 허가 기준년도' },
                        { label: '사용승인연도', value: String(buildingData.approvalYear), desc: `준공 후 ${new Date().getFullYear() - buildingData.approvalYear}년 경과` },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="px-4 py-3 text-[13px] text-muted-foreground">{row.label}</td>
                          <td className={`px-4 py-3 text-[13px] font-semibold text-right ${row.label === '분석 연면적' && gfa > buildingData.maxGfa && scenario !== '현황' ? 'text-red-600' : ''}`}>{row.value}</td>
                          <td className="px-4 py-3 text-[13px]">{row.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 리스크 */}
                {activeTab === '리스크' && (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-muted/50">
                      <tr>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">리스크 항목</th>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">수준</th>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">영향</th>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">대응</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          label: 'DSCR 미달',
                          level: dscr >= 1 ? '낮음' : dscr >= 0.8 ? '중간' : '높음',
                          color: dscr >= 1 ? 'text-green-600' : dscr >= 0.8 ? 'text-amber-600' : 'text-red-600',
                          impact: `현재 ${dscr.toFixed(2)}x — ${dscr >= 1 ? '금융비용 충분 커버' : '금융비용 미달'}`,
                          action: dscr >= 1 ? '현 구조 유지 가능' : '매입가 협상 또는 월세 인상 검토',
                        },
                        {
                          label: '공실 리스크',
                          level: vacancy <= 10 ? '낮음' : vacancy <= 20 ? '중간' : '높음',
                          color: vacancy <= 10 ? 'text-green-600' : vacancy <= 20 ? 'text-amber-600' : 'text-red-600',
                          impact: `공실률 ${vacancy}% 가정`,
                          action: '임차인 업종 다양화, 장기 임대 계약 유도',
                        },
                        {
                          label: 'LTV 리스크',
                          level: ltv <= 60 ? '낮음' : ltv <= 75 ? '중간' : '높음',
                          color: ltv <= 60 ? 'text-green-600' : ltv <= 75 ? 'text-amber-600' : 'text-red-600',
                          impact: `LTV ${ltv.toFixed(1)}% — ${ltv > 70 ? '고레버리지 구조' : '안정적 레버리지'}`,
                          action: ltv > 70 ? '자기자본 비중 확대 권장' : '현 구조 유지 가능',
                        },
                        {
                          label: '도로확폭',
                          level: roadRisk ? '중간' : '낮음',
                          color: roadRisk ? 'text-amber-600' : 'text-green-600',
                          impact: roadRisk ? '인접도로 4m 미만 — 확폭 대상 가능성' : '도로확폭 리스크 미반영',
                          action: '도시계획도로 저촉 여부 확인 필요',
                        },
                        {
                          label: '엘리베이터',
                          level: elevator === '있음' ? '낮음' : elevator === '설치예정' ? '중간' : '중간',
                          color: elevator === '있음' ? 'text-green-600' : 'text-amber-600',
                          impact: elevator === '있음' ? '기설치 — 임차인 유치 유리' : elevator === '설치예정' ? 'Bankability -3점 반영' : '미설치 — 임차인 선호도 저하',
                          action: elevator !== '있음' ? '엘리베이터 설치 검토 (비용 대비 임대수익 증가 확인)' : '현 상태 유지',
                        },
                        {
                          label: 'CAP Rate',
                          level: cap >= 5 ? '낮음' : cap >= 3.5 ? '중간' : '높음',
                          color: cap >= 5 ? 'text-green-600' : cap >= 3.5 ? 'text-amber-600' : 'text-red-600',
                          impact: `CAP ${cap.toFixed(2)}% — ${cap >= 5 ? '수익성 양호' : cap >= 3.5 ? '수익성 보통' : '수익성 낮음'}`,
                          action: cap < 3.5 ? '매입가 인하 또는 임대수익 개선 필요' : '현 구조 유지 가능',
                        },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="px-4 py-3 text-[13px] font-medium">{row.label}</td>
                          <td className={`px-4 py-3 text-[13px] font-semibold ${row.color}`}>{row.level}</td>
                          <td className="px-4 py-3 text-[13px]">{row.impact}</td>
                          <td className="px-4 py-3 text-[13px] text-muted-foreground">{row.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 실거래 비교 */}
                {activeTab === '실거래 비교' && (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-muted/50">
                      <tr>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">거래일</th>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">위치</th>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">면적</th>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">거래가</th>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">㎡당</th>
                        <th className="text-left text-[11px] uppercase text-muted-foreground font-medium px-4 py-3">유형</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="px-4 py-3 text-[13px]">{tx.date}</td>
                          <td className="px-4 py-3 text-[13px]">{tx.location}</td>
                          <td className="px-4 py-3 text-[13px]">{tx.area}</td>
                          <td className="px-4 py-3 text-[13px] font-medium">{tx.price}</td>
                          <td className="px-4 py-3 text-[13px]">{tx.pricePerM2}</td>
                          <td className="px-4 py-3 text-[13px]">{tx.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </ScrollArea>
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
