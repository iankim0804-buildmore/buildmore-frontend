"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { getHealth, getSampleAnalysis, runAnalysis } from "@/lib/api/analysis"
import { isApiConfigured } from "@/lib/api/client"
import { adaptApiResponse, type DisplayAnalysis } from "@/lib/api/adapters"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  Landmark,
  FileText,
  Settings,
  FolderOpen,
  MapPin,
  Database,
  Plus,
  Send,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Building2,
  TrendingUp,
  Shield,
  FileBarChart,
  Clock,
  Banknote,
  Calculator,
  Scale,
  CircleDot,
  ExternalLink,
  Edit3,
  X,
  Loader2,
} from "lucide-react"
import { MarketTrendSection } from "./components/market-trend-section"

// Deal condition type
interface DealConditions {
  address: string
  asset_type: string
  deal_amount: number
  deposit: number
  monthly_rent: number
  equity: number
  investment_purpose: string
  interest_rate: number
  vacancy_rate: number
  operating_expense_ratio: number
  remodeling_cost: number
}

// Default deal conditions
const defaultDealConditions: DealConditions = {
  address: "서울시 마포구 신수동 27-2",
  asset_type: "근린생활시설",
  deal_amount: 4200000000,
  deposit: 350000000,
  monthly_rent: 28000000,
  equity: 1850000000,
  investment_purpose: "리모델링 후 임대",
  interest_rate: 0.05,
  vacancy_rate: 0.10,
  operating_expense_ratio: 0.20,
  remodeling_cost: 0,
}

// Format number to Korean style (억/만)
function formatToKorean(value: number): string {
  if (value >= 100000000) {
    const billions = value / 100000000
    return `${billions % 1 === 0 ? billions : billions.toFixed(1)}억`
  } else if (value >= 10000) {
    const millions = value / 10000
    return `${millions.toLocaleString()}만`
  }
  return value.toLocaleString()
}

// Parse Korean format to number
function parseKoreanToNumber(value: string, unit: '억' | '만원'): number {
  const num = parseFloat(value.replace(/,/g, ''))
  if (isNaN(num)) return 0
  if (unit === '억') return num * 100000000
  if (unit === '만원') return num * 10000
  return num
}

// Mock data for the analysis (fallback)
const mockAnalysis = {
  address: "서울시 마포구 신수동 27-2",
  assetType: "근린생활시설",
  dealAmount: "42억",
  score: 72,
  grade: "B+",
  verdict: "조건부 검토 가능",
  financial: {
    ltv: "52~58%",
    loanAmount: "21.8억~24.4억",
    rate: "4.3~5.1%",
    monthlyInterest: "1,850만",
    equity: "18.5억",
    equityRatio: "44%",
  },
  noi: {
    deposit: "3.5억",
    monthlyRent: "2,800만",
    annualRent: "3.36억",
    noi: "2.1억",
    dscr: "1.21x",
    capRate: "5.0%",
  },
  risks: {
    legal: [
      { text: "도로 접도 조건 확인 필요", level: "warning" },
      { text: "주차대수 부족 가능성", level: "warning" },
      { text: "용도지역 확인 필요", level: "info" },
    ],
    financial: [
      { text: "공사비 상승 리스크", level: "error" },
      { text: "금리 인상 리스크", level: "warning" },
      { text: "임대 근거 보완 필요", level: "warning" },
    ],
  },
  comparables: [
    { address: "신수동 25-8", type: "근생", price: "38억", ltv: "55%", date: "2024.01" },
    { address: "신수동 31-1", type: "근생", price: "45억", ltv: "52%", date: "2023.11" },
    { address: "서강동 12-5", type: "근생", price: "41억", ltv: "58%", date: "2024.02" },
  ],
  dataSources: [
    "국토교통부 실거래가",
    "한국은행 ECOS",
    "한국부동산원 R-ONE",
    "통계청 KOSIS",
    "BuildMore LLM Wiki",
  ],
}

// Analysis process steps
const analysisProcessSteps = [
  "질문 의도 분석 중",
  "입력 조건 정리 중",
  "임대수익 추정 중",
  "LTV / 금리 시나리오 적용 중",
  "NOI / DSCR 계산 중",
  "리스크 체크 중",
  "Bankability Score 산정 중",
]

// API connection status type
type ApiStatus = 'connecting' | 'connected' | 'fallback' | 'analyzing'

// Chat message type
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function DemoAnalysisPage() {
  const [inputValue, setInputValue] = useState("")
  const [showSteps, setShowSteps] = useState(true)
  const [apiStatus, setApiStatus] = useState<ApiStatus>('connecting')
  const [analysisData, setAnalysisData] = useState<DisplayAnalysis | null>(null)
  
  // Deal conditions state
  const [dealConditions, setDealConditions] = useState<DealConditions>(defaultDealConditions)
  const [editMode, setEditMode] = useState(false)
  const [editConditions, setEditConditions] = useState<DealConditions>(defaultDealConditions)
  
  // Analysis process state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  
  // Chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'user', content: '마포구 신수동 27-2 근생을 42억에 매입해서 리모델링 후 임대하려고 해. 금융적으로 괜찮을까?' },
  ])
  
  // Score highlight animation
  const [scoreHighlight, setScoreHighlight] = useState(false)
  const previousApiStatus = useRef<ApiStatus>('connecting')

  // Fetch API data on mount
  const fetchApiData = useCallback(async () => {
    if (!isApiConfigured()) {
      setApiStatus('fallback')
      return
    }
    
    setApiStatus('connecting')
    
    try {
      const healthResponse = await getHealth()
      const analysisResponse = await getSampleAnalysis()
      
      if (analysisResponse.ok && analysisResponse.data) {
        const adapted = adaptApiResponse(analysisResponse.data, mockAnalysis)
        setAnalysisData(adapted)
        setApiStatus('connected')
      } else if (healthResponse.ok) {
        setApiStatus('fallback')
      } else {
        setApiStatus('fallback')
      }
    } catch (error) {
      console.log('[v0] API connection error:', error)
      setApiStatus('fallback')
    }
  }, [])

  useEffect(() => {
    fetchApiData()
  }, [fetchApiData])

  // Run analysis with current deal conditions
  const handleRunAnalysis = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setInputValue("")
    
    // Start analysis process visualization
    setIsAnalyzing(true)
    setCurrentStep(0)
    setCompletedSteps([])
    previousApiStatus.current = apiStatus
    setApiStatus('analyzing')
    
    // Simulate step progression
    const stepDelay = 400
    for (let i = 0; i < analysisProcessSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDelay))
      setCurrentStep(i)
      setCompletedSteps(prev => [...prev, i])
    }
    
    // Make API call
    try {
      const payload = {
        address: dealConditions.address,
        asset_type: dealConditions.asset_type,
        deal_amount: dealConditions.deal_amount,
        deposit: dealConditions.deposit,
        monthly_rent: dealConditions.monthly_rent,
        equity: dealConditions.equity,
        investment_purpose: dealConditions.investment_purpose,
        user_message: userMessage,
        interest_rate: dealConditions.interest_rate,
        vacancy_rate: dealConditions.vacancy_rate,
        operating_expense_ratio: dealConditions.operating_expense_ratio,
        remodeling_cost: dealConditions.remodeling_cost,
      }
      
      const response = await runAnalysis(payload)
      
      if (response.ok && response.data) {
        const adapted = adaptApiResponse(response.data, mockAnalysis)
        setAnalysisData(adapted)
        setApiStatus('connected')
        
        // Add AI response to chat
        const aiMessage = adapted.verdict 
          ? `현재 조건에서는 **${adapted.verdict}**입니다. 예상 LTV가 ${adapted.financial?.ltv ?? 'N/A'} 수준이며, DSCR ${adapted.noi?.dscr ?? 'N/A'}로 분석됩니다.`
          : '분석이 완료되었습니다. 결과를 확인해주세요.'
        setChatMessages(prev => [...prev, { role: 'assistant', content: aiMessage }])
        
        // Trigger score highlight
        setScoreHighlight(true)
        setTimeout(() => setScoreHighlight(false), 1500)
      } else {
        console.log('[v0] Analysis API failed:', response.error)
        setApiStatus('fallback')
        setChatMessages(prev => [...prev, { role: 'assistant', content: '분석 중 오류가 발생했습니다. Mock 데이터로 표시합니다.' }])
      }
    } catch (error) {
      console.log('[v0] Analysis error:', error)
      setApiStatus('fallback')
      setChatMessages(prev => [...prev, { role: 'assistant', content: '분석 중 오류가 발생했습니다. Mock 데이터로 표시합니다.' }])
    }
    
    setIsAnalyzing(false)
    setCurrentStep(-1)
  }, [dealConditions, apiStatus])

  // Handle new analysis button
  const handleNewAnalysis = useCallback(() => {
    setDealConditions(defaultDealConditions)
    setEditConditions(defaultDealConditions)
    setAnalysisData(null)
    setChatMessages([])
    setInputValue("")
    setShowSteps(true)
    setIsAnalyzing(false)
    setCurrentStep(-1)
    setCompletedSteps([])
    setEditMode(false)
    
    // Re-fetch sample data
    fetchApiData()
    
    toast.success("새 분석이 시작되었습니다.")
  }, [fetchApiData])

  // Handle edit mode
  const handleStartEdit = () => {
    setEditConditions({ ...dealConditions })
    setEditMode(true)
  }

  const handleCancelEdit = () => {
    setEditConditions({ ...dealConditions })
    setEditMode(false)
  }

  const handleApplyEdit = () => {
    setDealConditions({ ...editConditions })
    setEditMode(false)
    toast.success("딜 조건이 업데이트되었습니다.")
  }

  // Handle button clicks for not-yet-implemented features
  const handleComingSoon = (featureName: string) => {
    toast.info("이 기능은 다음 단계에서 활성화됩니다.", {
      description: featureName,
    })
  }

  const handlePdfReport = () => {
    toast.info("PDF 리포트 생성 기능은 다음 단계에서 활성화됩니다.", {
      description: "현재 분석 결과는 은행 제출용 리포트 구조로 변환될 예정입니다.",
    })
  }

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isAnalyzing) {
      handleRunAnalysis(inputValue)
    }
  }

  // Merge API data with mock data (API takes priority)
  const displayData = {
    address: analysisData?.address ?? mockAnalysis.address,
    assetType: analysisData?.assetType ?? mockAnalysis.assetType,
    dealAmount: analysisData?.dealAmount ?? formatToKorean(dealConditions.deal_amount),
    score: analysisData?.score ?? mockAnalysis.score,
    grade: analysisData?.grade ?? mockAnalysis.grade,
    verdict: analysisData?.verdict ?? mockAnalysis.verdict,
    financial: {
      ltv: analysisData?.financial?.ltv ?? mockAnalysis.financial.ltv,
      loanAmount: analysisData?.financial?.loanAmount ?? mockAnalysis.financial.loanAmount,
      rate: analysisData?.financial?.rate ?? mockAnalysis.financial.rate,
      monthlyInterest: analysisData?.financial?.monthlyInterest ?? mockAnalysis.financial.monthlyInterest,
      equity: analysisData?.financial?.equity ?? formatToKorean(dealConditions.equity),
      equityRatio: analysisData?.financial?.equityRatio ?? mockAnalysis.financial.equityRatio,
    },
    noi: {
      deposit: analysisData?.noi?.deposit ?? formatToKorean(dealConditions.deposit),
      monthlyRent: analysisData?.noi?.monthlyRent ?? formatToKorean(dealConditions.monthly_rent),
      annualRent: analysisData?.noi?.annualRent ?? mockAnalysis.noi.annualRent,
      noi: analysisData?.noi?.noi ?? mockAnalysis.noi.noi,
      dscr: analysisData?.noi?.dscr ?? mockAnalysis.noi.dscr,
      capRate: analysisData?.noi?.capRate ?? mockAnalysis.noi.capRate,
    },
    risks: {
      legal: analysisData?.risks?.legal ?? mockAnalysis.risks.legal,
      financial: analysisData?.risks?.financial ?? mockAnalysis.risks.financial,
    },
    comparables: analysisData?.comparables ?? mockAnalysis.comparables,
    dataSources: analysisData?.dataSources ?? mockAnalysis.dataSources,
  }

  // Generate dynamic analysis steps based on current state
  const displaySteps = isAnalyzing 
    ? analysisProcessSteps.map((step, i) => ({
        step,
        status: completedSteps.includes(i) ? 'complete' : (currentStep === i ? 'running' : 'pending'),
        time: completedSteps.includes(i) ? `${(0.3 + Math.random() * 1.2).toFixed(1)}s` : '...',
      }))
    : [
        { step: "질문 의도 분석", status: "complete", time: "0.3s" },
        { step: "실거래 사례 확인", status: "complete", time: "1.2s" },
        { step: "임대수익 추정", status: "complete", time: "0.8s" },
        { step: "금리 및 LTV 시나리오 적용", status: "complete", time: "0.6s" },
        { step: "법규/개발 리스크 체크", status: "complete", time: "1.4s" },
        { step: "유사 사례 비교", status: "complete", time: "0.9s" },
        { step: "Bankability Score 산정", status: "complete", time: "0.4s" },
      ]

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Left Sidebar - Desktop Only - Fixed */}
      <aside className="hidden lg:flex w-60 flex-col bg-sidebar border-r border-sidebar-border fixed top-0 left-0 h-screen z-40">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border">
          <div className="w-7 h-7 bg-sidebar-primary rounded flex items-center justify-center">
            <Landmark className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground">BuildMore</span>
        </div>

        {/* Nav Items */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleNewAnalysis}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">새 분석</span>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => handleComingSoon("내 분석 기록")}
            >
              <FolderOpen className="w-4 h-4" />
              <span className="text-sm">내 분석 기록</span>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => handleComingSoon("관심 지역")}
            >
              <MapPin className="w-4 h-4" />
              <span className="text-sm">관심 지역</span>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => handleComingSoon("리포트 보관함")}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">리포트 보관함</span>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => handleComingSoon("데이터 출처")}
            >
              <Database className="w-4 h-4" />
              <span className="text-sm">데이터 출처</span>
            </Button>
          </nav>

          <div className="mt-6 px-3">
            <p className="text-xs text-sidebar-foreground/50 uppercase tracking-wider px-3 mb-2">최근 분석</p>
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground bg-sidebar-accent"
                onClick={() => handleComingSoon("최근 분석: 마포구 신수동 27-2")}
              >
                <Building2 className="w-4 h-4" />
                <div className="flex-1 text-left">
                  <p className="text-xs truncate">마포구 신수동 27-2</p>
                  <p className="text-xs text-sidebar-foreground/50">{formatToKorean(dealConditions.deal_amount)}</p>
                </div>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={() => handleComingSoon("최근 분석: 강남구 역삼동 123-4")}
              >
                <Building2 className="w-4 h-4" />
                <div className="flex-1 text-left">
                  <p className="text-xs truncate">강남구 역삼동 123-4</p>
                  <p className="text-xs text-sidebar-foreground/50">68억</p>
                </div>
              </Button>
            </div>
          </div>
        </ScrollArea>

        {/* Bottom */}
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground mb-2">
            <Settings className="w-4 h-4" />
            <span className="text-sm">설정</span>
          </Button>
            <div className="px-3 py-2 bg-sidebar-accent rounded text-xs">
            <div className="flex items-center gap-2 text-sidebar-foreground/70">
              <div className="w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
              <span>LLM Wiki Active</span>
            </div>
            <div className="flex items-center gap-2 text-sidebar-foreground/70 mt-1.5">
              <div className={`w-2 h-2 rounded-full ${
                apiStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                apiStatus === 'connected' ? 'bg-chart-2' :
                apiStatus === 'analyzing' ? 'bg-blue-500 animate-pulse' :
                'bg-orange-400'
              }`} />
              <span className="text-sidebar-foreground/50">
                {apiStatus === 'connecting' ? 'API 연결 중...' :
                 apiStatus === 'connected' ? 'API 연결됨' :
                 apiStatus === 'analyzing' ? '분석 중...' :
                 'Mock 데이터'}
              </span>
            </div>
            <p className="text-sidebar-foreground/50 mt-1">v1.1.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content - Offset by sidebar width on desktop */}
      <div className="flex-1 flex flex-col h-screen lg:ml-60">
        {/* Top Header - Fixed */}
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0 fixed top-0 left-0 right-0 lg:left-60 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile Logo */}
            <Link href="/" className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
                <Landmark className="w-4 h-4 text-primary-foreground" />
              </div>
            </Link>
            <Link href="/" className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>홈으로</span>
            </Link>
            <div className="hidden sm:block h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground truncate max-w-[120px] sm:max-w-none">{dealConditions.address.split(' ').slice(-2).join(' ')}</span>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
              {displayData.assetType}
            </Badge>
            <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
              {displayData.dealAmount}
            </Badge>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* API Status Indicator - Small and subtle */}
            <Badge 
              variant="outline" 
              className={`text-[10px] px-1.5 py-0.5 ${
                apiStatus === 'connecting' 
                  ? 'border-yellow-500/30 text-yellow-600 bg-yellow-50' 
                  : apiStatus === 'connected' 
                    ? 'border-chart-2/30 text-chart-2 bg-chart-2/5' 
                    : apiStatus === 'analyzing'
                      ? 'border-blue-500/30 text-blue-600 bg-blue-50'
                      : 'border-orange-400/30 text-orange-500 bg-orange-50'
              }`}
            >
              <div className={`w-1 h-1 rounded-full mr-1 ${
                apiStatus === 'connecting' 
                  ? 'bg-yellow-500 animate-pulse' 
                  : apiStatus === 'connected' 
                    ? 'bg-chart-2' 
                    : apiStatus === 'analyzing'
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-orange-400'
              }`} />
              {apiStatus === 'connecting' ? 'API...' : apiStatus === 'connected' ? 'API' : apiStatus === 'analyzing' ? '분석 중' : 'Mock'}
            </Badge>
            <Badge className={`text-xs ${isAnalyzing ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-chart-2/10 text-chart-2 border-chart-2/20'}`}>
              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isAnalyzing ? 'bg-blue-500 animate-pulse' : 'bg-chart-2'}`} />
              {isAnalyzing ? '분석 중...' : '분석 완료'}
            </Badge>
            <Button 
              size="sm" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 hidden sm:flex"
              onClick={handlePdfReport}
            >
              <FileBarChart className="w-4 h-4" />
              PDF 리포트 생성
            </Button>
          </div>
        </header>

        {/* Content Area - Different layout for mobile vs desktop */}
        {/* Desktop Layout - Below fixed header */}
        <div className="hidden lg:flex flex-1 flex-row overflow-hidden pt-14">
          {/* Center Panel: Chat/Input - Fixed */}
          <div className="w-[420px] xl:w-[480px] flex flex-col border-r border-border bg-white fixed top-14 bottom-0 left-60 z-20">
            {/* Deal Conditions Card - Fixed at top */}
            <div className="p-4 border-b border-border bg-white shrink-0">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-muted-foreground" />
                      딜 조건
                    </CardTitle>
                    {!editMode ? (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleStartEdit}>
                        <Edit3 className="w-3 h-3 mr-1" />
                        조건 수정
                      </Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleCancelEdit}>
                          <X className="w-3 h-3 mr-1" />
                          취소
                        </Button>
                        <Button size="sm" className="h-7 px-2 text-xs" onClick={handleApplyEdit}>
                          적용
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  {editMode ? (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">주소</p>
                        <Input 
                          value={editConditions.address}
                          onChange={(e) => setEditConditions(prev => ({ ...prev, address: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">매입가 (억)</p>
                        <Input 
                          type="number"
                          step="0.1"
                          value={editConditions.deal_amount / 100000000}
                          onChange={(e) => setEditConditions(prev => ({ ...prev, deal_amount: parseFloat(e.target.value) * 100000000 || 0 }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">예상 보증금 (억)</p>
                        <Input 
                          type="number"
                          step="0.1"
                          value={editConditions.deposit / 100000000}
                          onChange={(e) => setEditConditions(prev => ({ ...prev, deposit: parseFloat(e.target.value) * 100000000 || 0 }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">예상 월세 (만원)</p>
                        <Input 
                          type="number"
                          step="100"
                          value={editConditions.monthly_rent / 10000}
                          onChange={(e) => setEditConditions(prev => ({ ...prev, monthly_rent: parseFloat(e.target.value) * 10000 || 0 }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">자기자본 (억)</p>
                        <Input 
                          type="number"
                          step="0.1"
                          value={editConditions.equity / 100000000}
                          onChange={(e) => setEditConditions(prev => ({ ...prev, equity: parseFloat(e.target.value) * 100000000 || 0 }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">투자 목적</p>
                        <Input 
                          value={editConditions.investment_purpose}
                          onChange={(e) => setEditConditions(prev => ({ ...prev, investment_purpose: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">주소</p>
                        <p className="font-medium text-foreground">{dealConditions.address}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">매입가</p>
                        <p className="font-medium text-foreground">{formatToKorean(dealConditions.deal_amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">예상 보증금</p>
                        <p className="font-medium text-foreground">{formatToKorean(dealConditions.deposit)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">예상 월세</p>
                        <p className="font-medium text-foreground">{formatToKorean(dealConditions.monthly_rent)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">자기자본</p>
                        <p className="font-medium text-foreground">{formatToKorean(dealConditions.equity)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">투자 목적</p>
                        <p className="font-medium text-foreground">{dealConditions.investment_purpose}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Chat Messages - Scrollable */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {chatMessages.map((message, i) => (
                  message.role === 'user' ? (
                    <div key={i} className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-lg rounded-br-sm px-4 py-3 max-w-[85%]">
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                        <Landmark className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="bg-secondary rounded-lg rounded-tl-sm px-4 py-3">
                          <p className="text-sm text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </ScrollArea>

            {/* Analysis Process Toggle + Input Area - Fixed at bottom */}
            <div className="border-t border-border bg-white shrink-0">
              {/* Analysis Process Toggle */}
              {(chatMessages.length > 0 || isAnalyzing) && (
                <div className="border-b border-border">
                  <button 
                    onClick={() => setShowSteps(!showSteps)}
                    className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      분석 프로세스 {isAnalyzing ? '' : '(5.6s)'}
                    </span>
                    {showSteps ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <div 
                    className={`overflow-hidden transition-all duration-200 ease-out ${showSteps ? 'max-h-[300px]' : 'max-h-0'}`}
                  >
                    <div className="px-4 pb-3 space-y-2">
                      {displaySteps.map((step, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            step.status === 'complete' ? 'bg-chart-2/10' :
                            step.status === 'running' ? 'bg-blue-500/10' :
                            'bg-muted'
                          }`}>
                            {step.status === 'complete' ? (
                              <CheckCircle2 className="w-3 h-3 text-chart-2" />
                            ) : step.status === 'running' ? (
                              <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                            )}
                          </div>
                          <span className={`flex-1 ${step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>{step.step}</span>
                          <span className="text-muted-foreground font-mono">{step.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Input Area - Desktop */}
              <div className="p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    placeholder="추가 질문을 입력하세요..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1"
                    disabled={isAnalyzing}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isAnalyzing || !inputValue.trim()}
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                  예: &quot;자기자본을 20억으로 늘리면 어떻게 될까?&quot; &quot;인근 실거래 사례를 더 보여줘&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel: Analysis Results - Scrollable, offset by chat panel width */}
          <div className="flex-1 bg-background overflow-hidden ml-[420px] xl:ml-[480px]">
            <ScrollArea className="h-[calc(100vh-56px)]">
              <div className="p-4 lg:p-6 space-y-4">
                <AnalysisResultsContent 
                  analysisData={displayData} 
                  showSteps={showSteps} 
                  setShowSteps={setShowSteps} 
                  scoreHighlight={scoreHighlight}
                  onPdfReport={handlePdfReport}
                />
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Mobile Layout - Chat-style with fixed bottom input */}
        <div className="flex lg:hidden flex-1 flex-col relative">
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto pb-[140px]">
            <div className="p-4 space-y-4">
              {/* Bankability Score Card - Most Important First */}
              <Card className={`border-border bg-white overflow-hidden transition-all duration-500 ${scoreHighlight ? 'ring-2 ring-primary/50 shadow-lg' : ''}`}>
                <div className="bg-primary/5 border-b border-border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bankability Score</p>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-bold text-foreground transition-all duration-500 ${scoreHighlight ? 'scale-110' : ''}`}>{displayData.score}</span>
                        <span className="text-lg text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                    <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20 text-xs px-2 py-1">
                      {displayData.grade} · {displayData.verdict}
                    </Badge>
                  </div>
                  <div className="w-full bg-border rounded-full h-2 mb-2">
                    <div className="bg-chart-3 h-2 rounded-full transition-all duration-500" style={{ width: `${displayData.score}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    선임대 계약 확보 시 금융기관 사전 협의 가능
                  </p>
                </div>
              </Card>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-border bg-white p-3">
                  <p className="text-xs text-muted-foreground mb-1">예상 LTV</p>
                  <p className="text-xl font-bold text-foreground">{displayData.financial.ltv}</p>
                </Card>
                <Card className="border-border bg-white p-3">
                  <p className="text-xs text-muted-foreground mb-1">DSCR</p>
                  <p className="text-xl font-bold text-foreground">{displayData.noi.dscr}</p>
                </Card>
                <Card className="border-border bg-white p-3">
                  <p className="text-xs text-muted-foreground mb-1">NOI (연)</p>
                  <p className="text-xl font-bold text-foreground">{displayData.noi.noi}</p>
                </Card>
                <Card className="border-border bg-white p-3">
                  <p className="text-xs text-muted-foreground mb-1">예상 대출</p>
                  <p className="text-xl font-bold text-foreground">{displayData.financial.loanAmount.split('~')[0]}억+</p>
                </Card>
              </div>

              {/* Main Risk Alert */}
              <Card className="border-chart-3/30 bg-chart-3/5">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-chart-3 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">주요 리스크</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {displayData.risks.financial.slice(0, 3).map((risk, i) => (
                          <li key={i}>• {risk.text}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chat Thread */}
              <div className="space-y-3">
                {chatMessages.map((message, i) => (
                  message.role === 'user' ? (
                    <div key={i} className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-lg rounded-br-sm px-3 py-2 max-w-[85%]">
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex gap-2">
                      <div className="w-7 h-7 rounded bg-secondary flex items-center justify-center shrink-0">
                        <Landmark className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-secondary rounded-lg rounded-tl-sm px-3 py-2">
                          <p className="text-sm text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* Deal Condition Summary */}
              <Card className="border-border bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-muted-foreground" />
                      딜 조건
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleStartEdit}>
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">매입가</p>
                    <p className="font-medium text-foreground">{formatToKorean(dealConditions.deal_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">예상 월세</p>
                    <p className="font-medium text-foreground">{formatToKorean(dealConditions.monthly_rent)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">자기자본</p>
                    <p className="font-medium text-foreground">{formatToKorean(dealConditions.equity)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">자기자본 비율</p>
                    <p className="font-medium text-foreground">{displayData.financial.equityRatio}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Analysis Card */}
              <Card className="border-border bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-chart-1" />
                    금융 가능성
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">예상 대출 가능액</span>
                    <span className="font-semibold text-foreground">{displayData.financial.loanAmount}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">예상 금리</span>
                    <span className="font-semibold text-foreground">{displayData.financial.rate}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">월 이자 부담</span>
                    <span className="font-semibold text-foreground">{displayData.financial.monthlyInterest}</span>
                  </div>
                </CardContent>
              </Card>

              {/* NOI / DSCR Card */}
              <Card className="border-border bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-chart-2" />
                    NOI / DSCR
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">연 임대수입</span>
                    <span className="font-semibold text-foreground">{displayData.noi.annualRent}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Cap Rate</span>
                    <span className="font-semibold text-foreground">{displayData.noi.capRate}</span>
                  </div>
                  <div className="p-2 bg-chart-3/5 rounded-lg border border-chart-3/10 mt-2">
                    <p className="text-xs text-muted-foreground">
                      DSCR 1.21x는 최소 기준. 1.25x 이상 확보 권장.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Legal Risks */}
              <Card className="border-border bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-chart-3" />
                    법규/개발 리스크
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {displayData.risks.legal.map((risk, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-secondary/30 rounded-lg">
                      <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        risk.level === 'error' ? 'text-destructive' : 
                        risk.level === 'warning' ? 'text-chart-3' : 'text-chart-1'
                      }`} />
                      <span className="text-xs text-foreground">{risk.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Execution Conditions */}
              <Card className="border-border bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">실행 조건</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-chart-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 긍정
                      </p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li className="flex items-center gap-1"><CircleDot className="w-2 h-2" /> 대학가 배후수요</li>
                        <li className="flex items-center gap-1"><CircleDot className="w-2 h-2" /> 역세권 접근성</li>
                        <li className="flex items-center gap-1"><CircleDot className="w-2 h-2" /> 리모델링 업사이드</li>
                      </ul>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-chart-3 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> 조건
                      </p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li className="flex items-center gap-1"><CircleDot className="w-2 h-2" /> 선임대 계약 확보</li>
                        <li className="flex items-center gap-1"><CircleDot className="w-2 h-2" /> 자기자본 40%+</li>
                        <li className="flex items-center gap-1"><CircleDot className="w-2 h-2" /> 공사비 상한 설정</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comparable Transactions */}
              <Card className="border-border bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-chart-5" />
                    인근 실거래 비교
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {displayData.comparables.map((comp, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-foreground">{comp.address}</p>
                          <p className="text-xs text-muted-foreground">{comp.type} · {comp.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{comp.price}</p>
                          <p className="text-xs text-muted-foreground">LTV {comp.ltv}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Market Trend Section */}
              <MarketTrendSection />

              {/* Report CTA */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <FileBarChart className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground mb-1">은행 제출용 리포트</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        투자위원회 메모와 사업계획서 양식으로 확장 가능
                      </p>
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 w-full" onClick={handlePdfReport}>
                        <FileText className="w-3.5 h-3.5" />
                        PDF 리포트 생성
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Sources */}
              <Card className="border-border bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Database className="w-3.5 h-3.5" />
                    조회된 데이터 출처
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {displayData.dataSources.map((source, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-normal">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Fixed Bottom Input - Mobile Only */}
          <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-30" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            {/* Quick Action Buttons */}
            <div className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs h-8" onClick={handlePdfReport}>
                <FileText className="w-3.5 h-3.5" />
                PDF 리포트
              </Button>
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs h-8" onClick={() => handleComingSoon("유사 사례")}>
                <Building2 className="w-3.5 h-3.5" />
                유사 사례
              </Button>
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs h-8" onClick={() => handleComingSoon("은행 제출 패키지")}>
                <Banknote className="w-3.5 h-3.5" />
                은행 제출 패키지
              </Button>
            </div>
            {/* Input Area */}
            <div className="px-4 pb-2">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  placeholder="추가 질문을 입력하세요..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 h-10"
                  disabled={isAnalyzing}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 shrink-0"
                  disabled={isAnalyzing || !inputValue.trim()}
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Edit Modal */}
      {editMode && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">딜 조건 수정</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">주소</p>
                <Input 
                  value={editConditions.address}
                  onChange={(e) => setEditConditions(prev => ({ ...prev, address: e.target.value }))}
                  className="h-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">��입가 (억)</p>
                  <Input 
                    type="number"
                    step="0.1"
                    value={editConditions.deal_amount / 100000000}
                    onChange={(e) => setEditConditions(prev => ({ ...prev, deal_amount: parseFloat(e.target.value) * 100000000 || 0 }))}
                    className="h-10"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">보증금 (억)</p>
                  <Input 
                    type="number"
                    step="0.1"
                    value={editConditions.deposit / 100000000}
                    onChange={(e) => setEditConditions(prev => ({ ...prev, deposit: parseFloat(e.target.value) * 100000000 || 0 }))}
                    className="h-10"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">월세 (만원)</p>
                  <Input 
                    type="number"
                    step="100"
                    value={editConditions.monthly_rent / 10000}
                    onChange={(e) => setEditConditions(prev => ({ ...prev, monthly_rent: parseFloat(e.target.value) * 10000 || 0 }))}
                    className="h-10"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">자기자본 (억)</p>
                  <Input 
                    type="number"
                    step="0.1"
                    value={editConditions.equity / 100000000}
                    onChange={(e) => setEditConditions(prev => ({ ...prev, equity: parseFloat(e.target.value) * 100000000 || 0 }))}
                    className="h-10"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">투자 목적</p>
                <Input 
                  value={editConditions.investment_purpose}
                  onChange={(e) => setEditConditions(prev => ({ ...prev, investment_purpose: e.target.value }))}
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={handleCancelEdit}>취소</Button>
              <Button className="flex-1" onClick={handleApplyEdit}>적용</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Extracted component for Analysis Results (used in desktop right panel)
interface AnalysisDisplayData {
  address: string
  assetType: string
  dealAmount: string
  score: number
  grade: string
  verdict: string
  financial: {
    ltv: string
    loanAmount: string
    rate: string
    monthlyInterest: string
    equity: string
    equityRatio: string
  }
  noi: {
    deposit: string
    monthlyRent: string
    annualRent: string
    noi: string
    dscr: string
    capRate: string
  }
  risks: {
    legal: Array<{ text: string; level: string }>
    financial: Array<{ text: string; level: string }>
  }
  comparables: Array<{ address: string; type: string; price: string; ltv: string; date: string }>
  dataSources: string[]
}

function AnalysisResultsContent({ 
  analysisData, 
  showSteps, 
  setShowSteps,
  scoreHighlight,
  onPdfReport,
}: { 
  analysisData: AnalysisDisplayData
  showSteps: boolean
  setShowSteps: (v: boolean) => void
  scoreHighlight?: boolean
  onPdfReport?: () => void
}) {
  return (
    <>
      {/* Bankability Score Card */}
      <Card className={`border-border bg-white overflow-hidden transition-all duration-500 ${scoreHighlight ? 'ring-2 ring-primary/50 shadow-lg' : ''}`}>
        <div className="bg-primary/5 border-b border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bankability Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold text-foreground transition-all duration-500 ${scoreHighlight ? 'scale-110' : ''}`}>{analysisData.score}</span>
                <span className="text-xl text-muted-foreground">/ 100</span>
              </div>
            </div>
            <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20 text-sm px-3 py-1">
              {analysisData.grade} · {analysisData.verdict}
            </Badge>
          </div>
          <div className="w-full bg-border rounded-full h-3 mb-3">
            <div className="bg-chart-3 h-3 rounded-full transition-all duration-500" style={{ width: `${analysisData.score}%` }} />
          </div>
          <p className="text-sm text-muted-foreground">
            임대수익은 양호하나, 자기자본 확보와 공사비 리스크 보완이 필요합니다. 선임대 계약 확보 시 금융기관 사전 협의 가능합니다.
          </p>
        </div>
      </Card>

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
          <TabsTrigger value="financial" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm">
            금융 분석
          </TabsTrigger>
          <TabsTrigger value="noi" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm">
            NOI / DSCR
          </TabsTrigger>
          <TabsTrigger value="risk" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm">
            리스크
          </TabsTrigger>
          <TabsTrigger value="comparable" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm">
            실거래 비교
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="mt-4 space-y-4">
          {/* Financial Metrics */}
          <Card className="border-border bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Banknote className="w-4 h-4 text-chart-1" />
                금융 가능성 분석
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">예상 LTV</p>
                  <p className="text-2xl font-bold text-foreground">{analysisData.financial.ltv}</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">예상 금리</p>
                  <p className="text-2xl font-bold text-foreground">{analysisData.financial.rate}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">예상 대출 가능액</span>
                  <span className="text-sm font-semibold text-foreground">{analysisData.financial.loanAmount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">자기자본 필요액</span>
                  <span className="text-sm font-semibold text-foreground">{analysisData.financial.equity}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">자기자본 비율</span>
                  <span className="text-sm font-semibold text-foreground">{analysisData.financial.equityRatio}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">월 이자 부담</span>
                  <span className="text-sm font-semibold text-foreground">{analysisData.financial.monthlyInterest}</span>
                </div>
              </div>
              <div className="p-3 bg-chart-1/5 rounded-lg border border-chart-1/10">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-chart-1 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">은행 관점:</strong> 선임대 근거와 감정평가 보완 필요. 자기자본 40% 이상 확보 시 금융기관 사전 협의 가능.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="noi" className="mt-4 space-y-4">
          <Card className="border-border bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-chart-2" />
                NOI / DSCR 분석
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-chart-2/5 rounded-lg border border-chart-2/10">
                  <p className="text-xs text-muted-foreground mb-1">NOI (연)</p>
                  <p className="text-2xl font-bold text-foreground">{analysisData.noi.noi}</p>
                </div>
                <div className="p-4 bg-chart-2/5 rounded-lg border border-chart-2/10">
                  <p className="text-xs text-muted-foreground mb-1">DSCR</p>
                  <p className="text-2xl font-bold text-foreground">{analysisData.noi.dscr}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">예상 보증금</span>
                  <span className="text-sm font-semibold text-foreground">{analysisData.noi.deposit}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">예상 월세</span>
                  <span className="text-sm font-semibold text-foreground">{analysisData.noi.monthlyRent}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">연 임대수입</span>
                  <span className="text-sm font-semibold text-foreground">{analysisData.noi.annualRent}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Cap Rate</span>
                  <span className="text-sm font-semibold text-foreground">{analysisData.noi.capRate}</span>
                </div>
              </div>
              <div className="p-3 bg-chart-3/5 rounded-lg border border-chart-3/10">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-chart-3 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    DSCR 1.21x는 대출 원리금 부담을 겨우 커버하는 수준입니다. 1.25x 이상 확보 권장.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="mt-4 space-y-4">
          {/* Legal Risks */}
          <Card className="border-border bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-chart-3" />
                법규 리스크
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysisData.risks.legal.map((risk, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${
                    risk.level === 'error' ? 'text-destructive' : 
                    risk.level === 'warning' ? 'text-chart-3' : 'text-chart-1'
                  }`} />
                  <span className="text-sm text-foreground">{risk.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Financial Risks */}
          <Card className="border-border bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Scale className="w-4 h-4 text-destructive" />
                금융/사업 리스크
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysisData.risks.financial.map((risk, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${
                    risk.level === 'error' ? 'text-destructive' : 
                    risk.level === 'warning' ? 'text-chart-3' : 'text-chart-1'
                  }`} />
                  <span className="text-sm text-foreground">{risk.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Verdict Summary */}
          <Card className="border-border bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">실행 조건</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-chart-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 긍정
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-1"><CircleDot className="w-2 h-2" /> 대학가 배후수요</li>
                    <li className="flex items-center gap-1"><CircleDot className="w-2 h-2" /> 역세권 접근성</li>
                    <li className="flex items-center gap-1"><CircleDot className="w-2 h-2" /> 리모델링 업사이드</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-chart-3 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> 조건
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-1"><CircleDot className="w-2 h-2" /> 선임대 계약 확보</li>
                    <li className="flex items-center gap-1"><CircleDot className="w-2 h-2" /> 자기자본 40%+</li>
                    <li className="flex items-center gap-1"><CircleDot className="w-2 h-2" /> 공사비 상한 ���정</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparable" className="mt-4 space-y-4">
          <Card className="border-border bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-chart-5" />
                인근 실거래 비교
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisData.comparables.map((comp, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{comp.address}</p>
                      <p className="text-xs text-muted-foreground">{comp.type} · {comp.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{comp.price}</p>
                      <p className="text-xs text-muted-foreground">LTV {comp.ltv}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                더 많은 실거래 사례 보기
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Market Trend Section */}
      <MarketTrendSection />

      {/* Report CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <FileBarChart className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-1">은행 제출용 리포트</h3>
              <p className="text-xs text-muted-foreground mb-3">
                투자위원회 메모와 사업계획서 양식으로 확장할 수 있습니다.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5" onClick={onPdfReport}>
                  <FileText className="w-3.5 h-3.5" />
                  PDF 리포트 생성
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={onPdfReport}>
                  Bank Package 문의
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card className="border-border bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <Database className="w-3.5 h-3.5" />
            조회된 데이터 출처
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysisData.dataSources.map((source, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">
                {source}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
