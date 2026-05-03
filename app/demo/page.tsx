"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { getHealth, getSampleAnalysis } from "@/lib/api/analysis"
import { isApiConfigured } from "@/lib/api/client"
import { adaptApiResponse, type DisplayAnalysis } from "@/lib/api/adapters"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
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
} from "lucide-react"

// Mock data for the analysis
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

const analysisSteps = [
  { step: "질문 의도 분석", status: "complete", time: "0.3s" },
  { step: "실거래 사례 확인", status: "complete", time: "1.2s" },
  { step: "임대수익 추정", status: "complete", time: "0.8s" },
  { step: "금리 및 LTV 시나리오 적용", status: "complete", time: "0.6s" },
  { step: "법규/개발 리스크 체크", status: "complete", time: "1.4s" },
  { step: "유사 사례 비교", status: "complete", time: "0.9s" },
  { step: "Bankability Score 산정", status: "complete", time: "0.4s" },
]

// API connection status type
type ApiStatus = 'connecting' | 'connected' | 'fallback'

export default function DemoAnalysisPage() {
  const [inputValue, setInputValue] = useState("")
  const [showSteps, setShowSteps] = useState(true)
  const [apiStatus, setApiStatus] = useState<ApiStatus>('connecting')
  const [analysisData, setAnalysisData] = useState<DisplayAnalysis | null>(null)

  // Fetch API data on mount
  const fetchApiData = useCallback(async () => {
    // If API URL is not configured, immediately use mock data
    if (!isApiConfigured()) {
      setApiStatus('fallback')
      return
    }
    
    setApiStatus('connecting')
    
    try {
      // Try health check first, but don't block on failure
      const healthResponse = await getHealth()
      
      // Even if health check fails, still try to get sample analysis
      // (backend might have partial availability)
      const analysisResponse = await getSampleAnalysis()
      
      if (analysisResponse.ok && analysisResponse.data) {
        // Use adapter to transform API response to display structure
        const adapted = adaptApiResponse(analysisResponse.data, mockAnalysis)
        setAnalysisData(adapted)
        setApiStatus('connected')
      } else if (healthResponse.ok) {
        // Health OK but analysis failed - still show as connected but use mock
        setApiStatus('fallback')
      } else {
        // Both failed
        setApiStatus('fallback')
      }
    } catch {
      setApiStatus('fallback')
    }
  }, [])

  useEffect(() => {
    fetchApiData()
  }, [fetchApiData])

  // Merge API data with mock data (API takes priority)
  const displayData = {
    address: analysisData?.address ?? mockAnalysis.address,
    assetType: analysisData?.assetType ?? mockAnalysis.assetType,
    dealAmount: analysisData?.dealAmount ?? mockAnalysis.dealAmount,
    score: analysisData?.score ?? mockAnalysis.score,
    grade: analysisData?.grade ?? mockAnalysis.grade,
    verdict: analysisData?.verdict ?? mockAnalysis.verdict,
    financial: {
      ltv: analysisData?.financial?.ltv ?? mockAnalysis.financial.ltv,
      loanAmount: analysisData?.financial?.loanAmount ?? mockAnalysis.financial.loanAmount,
      rate: analysisData?.financial?.rate ?? mockAnalysis.financial.rate,
      monthlyInterest: analysisData?.financial?.monthlyInterest ?? mockAnalysis.financial.monthlyInterest,
      equity: analysisData?.financial?.equity ?? mockAnalysis.financial.equity,
      equityRatio: analysisData?.financial?.equityRatio ?? mockAnalysis.financial.equityRatio,
    },
    noi: {
      deposit: analysisData?.noi?.deposit ?? mockAnalysis.noi.deposit,
      monthlyRent: analysisData?.noi?.monthlyRent ?? mockAnalysis.noi.monthlyRent,
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-60 flex-col bg-sidebar border-r border-sidebar-border">
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
            <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Plus className="w-4 h-4" />
              <span className="text-sm">새 분석</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <FolderOpen className="w-4 h-4" />
              <span className="text-sm">내 분석 기록</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">관심 지역</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <FileText className="w-4 h-4" />
              <span className="text-sm">리포트 보관함</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Database className="w-4 h-4" />
              <span className="text-sm">데이터 출처</span>
            </Button>
          </nav>

          <div className="mt-6 px-3">
            <p className="text-xs text-sidebar-foreground/50 uppercase tracking-wider px-3 mb-2">최근 분석</p>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground bg-sidebar-accent">
                <Building2 className="w-4 h-4" />
                <div className="flex-1 text-left">
                  <p className="text-xs truncate">마포구 신수동 27-2</p>
                  <p className="text-xs text-sidebar-foreground/50">42억</p>
                </div>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
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
                'bg-orange-400'
              }`} />
              <span className="text-sidebar-foreground/50">
                {apiStatus === 'connecting' ? 'API 연결 중...' :
                 apiStatus === 'connected' ? 'API 연결됨' :
                 'Mock 데이터'}
              </span>
            </div>
            <p className="text-sidebar-foreground/50 mt-1">v1.1.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Top Header - Sticky on Mobile */}
        <header className="h-14 bg-white border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-20 lg:relative">
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
              <span className="text-sm font-medium text-foreground truncate max-w-[120px] sm:max-w-none">마포구 신수동 27-2</span>
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
                    : 'border-orange-400/30 text-orange-500 bg-orange-50'
              }`}
            >
              <div className={`w-1 h-1 rounded-full mr-1 ${
                apiStatus === 'connecting' 
                  ? 'bg-yellow-500 animate-pulse' 
                  : apiStatus === 'connected' 
                    ? 'bg-chart-2' 
                    : 'bg-orange-400'
              }`} />
              {apiStatus === 'connecting' ? 'API...' : apiStatus === 'connected' ? 'API' : 'Mock'}
            </Badge>
            <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mr-1.5" />
              분석 완료
            </Badge>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 hidden sm:flex">
              <FileBarChart className="w-4 h-4" />
              PDF 리포트 생성
            </Button>
          </div>
        </header>

        {/* Content Area - Different layout for mobile vs desktop */}
        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-1 flex-row overflow-hidden">
          {/* Center Panel: Chat/Input */}
          <div className="flex-1 flex flex-col border-r border-border bg-white lg:max-w-xl">
            <ScrollArea className="flex-1">
              <div className="p-4 lg:p-6 space-y-6">
                {/* Deal Input Card */}
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-muted-foreground" />
                      딜 조건
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">주소</p>
                      <p className="font-medium text-foreground">{displayData.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">매입가</p>
                      <p className="font-medium text-foreground">{displayData.dealAmount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">예상 보증금</p>
                      <p className="font-medium text-foreground">{displayData.noi.deposit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">예상 월세</p>
                      <p className="font-medium text-foreground">{displayData.noi.monthlyRent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">자기자본</p>
                      <p className="font-medium text-foreground">{displayData.financial.equity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">투자 목적</p>
                      <p className="font-medium text-foreground">리모델링 후 임대</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Chat Messages */}
                <div className="space-y-4">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-lg rounded-br-sm px-4 py-3 max-w-[85%]">
                      <p className="text-sm">마포구 신수동 27-2 근생을 42억에 매입해서 리모델링 후 임대하려고 해. 금융적으로 괜찮을까?</p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                      <Landmark className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="bg-secondary rounded-lg rounded-tl-sm px-4 py-3">
                        <p className="text-sm text-foreground leading-relaxed">
                          현재 조건에서는 <strong>조건부 검토 가능</strong>합니다. 예상 LTV가 52~58% 수준이며, DSCR 1.21x로 원리금 상환 비율은 최소 기준을 충족합니다. 다만 선임대 근거 확보와 공사비 리스크 보완이 필요합니다.
                        </p>
                      </div>

                      {/* Analysis Steps */}
                      <Card className="border-border">
                        <CardHeader className="pb-2">
                          <button 
                            onClick={() => setShowSteps(!showSteps)}
                            className="flex items-center justify-between w-full"
                          >
                            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" />
                              분석 프로세스 (5.6s)
                            </CardTitle>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showSteps ? '' : '-rotate-90'}`} />
                          </button>
                        </CardHeader>
                        {showSteps && (
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {analysisSteps.map((step, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs">
                                  <div className="w-4 h-4 rounded-full bg-chart-2/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-3 h-3 text-chart-2" />
                                  </div>
                                  <span className="flex-1 text-foreground">{step.step}</span>
                                  <span className="text-muted-foreground font-mono">{step.time}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Input Area - Desktop */}
            <div className="p-4 border-t border-border bg-white">
              <div className="flex gap-2">
                <Input
                  placeholder="추가 질문을 입력하세요..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1"
                />
                <Button size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                예: &quot;자기자본을 20억으로 늘리�� 어떻게 될까?&quot; &quot;인근 실거래 사례를 더 보여줘&quot;
              </p>
            </div>
          </div>

          {/* Right Panel: Analysis Results - Desktop */}
          <div className="flex-1 bg-background overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 lg:p-6 space-y-4">
                <AnalysisResultsContent analysisData={displayData} showSteps={showSteps} setShowSteps={setShowSteps} />
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
              <Card className="border-border bg-white overflow-hidden">
                <div className="bg-primary/5 border-b border-border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bankability Score</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-foreground">{displayData.score}</span>
                        <span className="text-lg text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                    <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20 text-xs px-2 py-1">
                      {displayData.grade} · {displayData.verdict}
                    </Badge>
                  </div>
                  <div className="w-full bg-border rounded-full h-2 mb-2">
                    <div className="bg-chart-3 h-2 rounded-full transition-all" style={{ width: `${displayData.score}%` }} />
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
                        <li>• 공사비 상승 리스크</li>
                        <li>• 선임대 근거 보완 필요</li>
                        <li>• 금리 인상 리스크</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chat Thread */}
              <div className="space-y-3">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg rounded-br-sm px-3 py-2 max-w-[85%]">
                    <p className="text-sm">마포구 신수동 27-2 근생을 42억에 매입해서 리모델링 후 임대하려고 해. 금융적으로 괜찮을까?</p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded bg-secondary flex items-center justify-center shrink-0">
                    <Landmark className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-secondary rounded-lg rounded-tl-sm px-3 py-2">
                      <p className="text-sm text-foreground leading-relaxed">
                        현재 조건에서는 <strong>조건부 검토 가능</strong>합니다. 예상 LTV가 52~58% 수준이며, DSCR 1.21x로 원리금 상환 비율은 최소 기준을 충족합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deal Condition Summary */}
              <Card className="border-border bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-muted-foreground" />
                    딜 조건
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">매입가</p>
                    <p className="font-medium text-foreground">{displayData.dealAmount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">예상 월세</p>
                    <p className="font-medium text-foreground">{displayData.noi.monthlyRent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">자기자본</p>
                    <p className="font-medium text-foreground">{displayData.financial.equity}</p>
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
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 w-full">
                        <FileText className="w-3.5 h-3.5" />
                        PDF 리포트 생성
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Fixed Bottom Input - Mobile Only */}
          <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-30" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            {/* Quick Action Buttons */}
            <div className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs h-8">
                <FileText className="w-3.5 h-3.5" />
                PDF 리포트
              </Button>
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs h-8">
                <Building2 className="w-3.5 h-3.5" />
                유사 사례
              </Button>
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs h-8">
                <Banknote className="w-3.5 h-3.5" />
                은행 제출 패키지
              </Button>
            </div>
            {/* Input Area */}
            <div className="px-4 pb-2">
              <div className="flex gap-2">
                <Input
                  placeholder="추가 질문을 입력하세요..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 h-10"
                />
                <Button size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
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

function AnalysisResultsContent({ analysisData, showSteps, setShowSteps }: { analysisData: AnalysisDisplayData, showSteps: boolean, setShowSteps: (v: boolean) => void }) {
  return (
    <>
      {/* Bankability Score Card */}
      <Card className="border-border bg-white overflow-hidden">
        <div className="bg-primary/5 border-b border-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bankability Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-foreground">{analysisData.score}</span>
                <span className="text-xl text-muted-foreground">/ 100</span>
              </div>
            </div>
            <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20 text-sm px-3 py-1">
              {analysisData.grade} · {analysisData.verdict}
            </Badge>
          </div>
          <div className="w-full bg-border rounded-full h-3 mb-3">
            <div className="bg-chart-3 h-3 rounded-full transition-all" style={{ width: `${analysisData.score}%` }} />
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
                    <li className="flex items-center gap-1"><CircleDot className="w-2 h-2" /> 공사비 상한 설정</li>
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
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  PDF 리포트 생성
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5">
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
