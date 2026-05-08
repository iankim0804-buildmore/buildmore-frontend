"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Search,
  MapPin,
  Building2,
  ChevronDown,
  ChevronRight,
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Landmark,
  X,
  RefreshCw,
} from "lucide-react"

// ============================================================================
// TYPES
// ============================================================================

interface DealInputs {
  // A. 매입조건
  deal_amount: number         // 매입가 (억)
  equity: number              // 자기자본 (억)
  interest_rate: number       // 금리 (%)
  loan_period: number         // 대출기간 (년)
  
  // B. 임대조건
  deposit: number             // 보증금 (억)
  monthly_rent: number        // 월세 (만원)
  vacancy_rate: number        // 공실률 (%)
  operating_expense_ratio: number // 운영비율 (%)
  
  // C. 건축물대장 (auto-filled)
  land_area_m2: number
  building_area_m2: number
  total_floor_area_m2: number
  floors_above: number
  floors_below: number
  built_year: number
  structure: string
  main_use: string
  
  // D. 건축조건
  has_elevator: string
  exterior_remodel: string
  facility_condition: string
  
  // E. 분석옵션
  rent_arrear_level: string
  eviction_difficulty: string
  lease_status: string
}

interface KPIValues {
  noi: number           // 순영업이익 (만원/월)
  dscr: number          // 원리금상환비율
  ltv: number           // 담보대출비율 (%)
  cap_rate: number      // 자본환원율 (%)
  bankability: number   // Bankability Score (0-100)
}

interface Transaction {
  id: string
  address: string
  distance_m: number
  transaction_date: string
  price: number
  price_per_m2: number
  floors: number
  built_year: number
  main_use: string
}

// ============================================================================
// CALCULATION UTILS
// ============================================================================

function calculateKPIs(inputs: DealInputs): KPIValues {
  const dealAmountWon = inputs.deal_amount * 100000000
  const equityWon = inputs.equity * 100000000
  const depositWon = inputs.deposit * 100000000
  const monthlyRentWon = inputs.monthly_rent * 10000
  
  // Gross rental income per month
  const grossRentalIncome = monthlyRentWon
  
  // Vacancy loss
  const vacancyLoss = grossRentalIncome * (inputs.vacancy_rate / 100)
  
  // Effective Gross Income
  const effectiveGrossIncome = grossRentalIncome - vacancyLoss
  
  // Operating expenses
  const operatingExpenses = effectiveGrossIncome * (inputs.operating_expense_ratio / 100)
  
  // NOI (monthly)
  const noi = Math.round((effectiveGrossIncome - operatingExpenses) / 10000)
  
  // Annual NOI
  const annualNOI = (effectiveGrossIncome - operatingExpenses) * 12
  
  // Loan amount
  const loanAmount = dealAmountWon - equityWon - depositWon
  
  // Monthly mortgage payment (PMT formula)
  const monthlyRate = inputs.interest_rate / 100 / 12
  const numPayments = inputs.loan_period * 12
  let monthlyDebtService = 0
  if (monthlyRate > 0 && numPayments > 0 && loanAmount > 0) {
    monthlyDebtService = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                         (Math.pow(1 + monthlyRate, numPayments) - 1)
  }
  
  // DSCR
  const dscr = monthlyDebtService > 0 ? (effectiveGrossIncome - operatingExpenses) / monthlyDebtService : 0
  
  // LTV
  const ltv = dealAmountWon > 0 ? (loanAmount / dealAmountWon) * 100 : 0
  
  // CAP Rate
  const capRate = dealAmountWon > 0 ? (annualNOI / dealAmountWon) * 100 : 0
  
  // Bankability Score (simplified calculation)
  let bankability = 50
  
  // DSCR contribution (max 25 points)
  if (dscr >= 1.5) bankability += 25
  else if (dscr >= 1.2) bankability += 20
  else if (dscr >= 1.0) bankability += 10
  else bankability -= 10
  
  // LTV contribution (max 15 points)
  if (ltv <= 60) bankability += 15
  else if (ltv <= 70) bankability += 10
  else if (ltv <= 80) bankability += 5
  else bankability -= 10
  
  // CAP Rate contribution (max 10 points)
  if (capRate >= 6) bankability += 10
  else if (capRate >= 4) bankability += 5
  
  // Clamp to 0-100
  bankability = Math.max(0, Math.min(100, Math.round(bankability)))
  
  return {
    noi,
    dscr: Math.round(dscr * 100) / 100,
    ltv: Math.round(ltv * 10) / 10,
    cap_rate: Math.round(capRate * 100) / 100,
    bankability,
  }
}

// Format number to Korean style
function formatKorean(value: number, unit: '억' | '만' = '억'): string {
  if (unit === '억') {
    return `${value.toFixed(1)}억`
  }
  return `${value.toLocaleString()}만`
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultInputs: DealInputs = {
  // A. 매입조건
  deal_amount: 53,
  equity: 15,
  interest_rate: 4.5,
  loan_period: 20,
  
  // B. 임대조건
  deposit: 8,
  monthly_rent: 2800,
  vacancy_rate: 5,
  operating_expense_ratio: 15,
  
  // C. 건축물대장
  land_area_m2: 198.5,
  building_area_m2: 320.4,
  total_floor_area_m2: 892.6,
  floors_above: 5,
  floors_below: 1,
  built_year: 1992,
  structure: '철근콘크리트조',
  main_use: '근린생활시설',
  
  // D. 건축조건
  has_elevator: 'no',
  exterior_remodel: 'unnecessary',
  facility_condition: 'normal',
  
  // E. 분석옵션
  rent_arrear_level: 'none',
  eviction_difficulty: 'normal',
  lease_status: 'full',
}

const mockTransactions: Transaction[] = [
  { id: '1', address: '마포구 신수동 25-3', distance_m: 120, transaction_date: '2024.03', price: 4800000000, price_per_m2: 12500000, floors: 4, built_year: 1995, main_use: '근린생활시설' },
  { id: '2', address: '마포구 신수동 31-8', distance_m: 180, transaction_date: '2024.01', price: 5200000000, price_per_m2: 13200000, floors: 5, built_year: 1998, main_use: '근린생활시설' },
  { id: '3', address: '마포구 신수동 18-5', distance_m: 250, transaction_date: '2023.11', price: 4500000000, price_per_m2: 11800000, floors: 4, built_year: 1990, main_use: '근린생활시설' },
  { id: '4', address: '마포구 현석동 55-2', distance_m: 320, transaction_date: '2023.09', price: 6100000000, price_per_m2: 14100000, floors: 6, built_year: 2002, main_use: '근린생활시설' },
  { id: '5', address: '마포구 신수동 42-1', distance_m: 380, transaction_date: '2023.08', price: 4200000000, price_per_m2: 10500000, floors: 3, built_year: 1988, main_use: '근린생활시설' },
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AnalysisPage() {
  const [address, setAddress] = useState('서울특별시 마포구 신수동 27-2')
  const [inputs, setInputs] = useState<DealInputs>(defaultInputs)
  const [kpis, setKpis] = useState<KPIValues>(() => calculateKPIs(defaultInputs))
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('transactions')
  
  // Panel collapse states
  const [panelStates, setPanelStates] = useState({
    A: true,
    B: true,
    C: false,
    D: false,
    E: false,
  })
  
  // Recalculate KPIs when inputs change
  useEffect(() => {
    const newKpis = calculateKPIs(inputs)
    setKpis(newKpis)
  }, [inputs])
  
  // Update input handler
  const updateInput = useCallback((key: keyof DealInputs, value: number | string) => {
    setInputs(prev => ({ ...prev, [key]: value }))
  }, [])
  
  // Toggle panel
  const togglePanel = useCallback((panel: keyof typeof panelStates) => {
    setPanelStates(prev => ({ ...prev, [panel]: !prev[panel] }))
  }, [])
  
  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-600'
  }
  
  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ================================================================== */}
      {/* TOP BAR (66px) */}
      {/* ================================================================== */}
      <header className="h-[66px] bg-white border-b border-slate-200 flex items-center px-6 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900">BuildMore</span>
        </div>
        
        {/* Address Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="주소 검색 (예: 마포구 신수동 27-2)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="pl-10 pr-4 h-10 bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-6 mx-8">
          <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">분석 기능</a>
          <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">프로세스</a>
          <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">리포트</a>
          <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">가격</a>
        </nav>
        
        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-600">
            로그인
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            시작하기
          </Button>
        </div>
      </header>

      {/* ================================================================== */}
      {/* KPI STRIP (72px) */}
      {/* ================================================================== */}
      <div className="h-[72px] bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0">
        {/* NOI */}
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg">
          <div className="text-xs text-slate-500 uppercase tracking-wide">NOI</div>
          <div className="text-lg font-semibold text-slate-900">{kpis.noi.toLocaleString()}만/월</div>
        </div>
        
        {/* DSCR */}
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg">
          <div className="text-xs text-slate-500 uppercase tracking-wide">DSCR</div>
          <div className={`text-lg font-semibold ${kpis.dscr >= 1.2 ? 'text-emerald-600' : kpis.dscr >= 1.0 ? 'text-amber-600' : 'text-red-600'}`}>
            {kpis.dscr.toFixed(2)}x
          </div>
        </div>
        
        {/* LTV */}
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg">
          <div className="text-xs text-slate-500 uppercase tracking-wide">LTV</div>
          <div className={`text-lg font-semibold ${kpis.ltv <= 70 ? 'text-emerald-600' : kpis.ltv <= 80 ? 'text-amber-600' : 'text-red-600'}`}>
            {kpis.ltv.toFixed(1)}%
          </div>
        </div>
        
        {/* CAP Rate */}
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg">
          <div className="text-xs text-slate-500 uppercase tracking-wide">CAP</div>
          <div className={`text-lg font-semibold ${kpis.cap_rate >= 5 ? 'text-emerald-600' : kpis.cap_rate >= 3 ? 'text-amber-600' : 'text-red-600'}`}>
            {kpis.cap_rate.toFixed(2)}%
          </div>
        </div>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Bankability Score */}
        <div className="flex items-center gap-4 px-5 py-2 bg-slate-900 rounded-lg">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Bankability</div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${kpis.bankability >= 70 ? 'text-emerald-400' : kpis.bankability >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {kpis.bankability}
            </span>
            <span className="text-slate-500 text-sm">/100</span>
          </div>
          <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${getScoreBgColor(kpis.bankability)}`}
              style={{ width: `${kpis.bankability}%` }}
            />
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* MAIN CONTENT */}
      {/* ================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* ============================================================== */}
        {/* SIDEBAR (340px) */}
        {/* ============================================================== */}
        <aside className="w-[340px] bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {/* Panel A: 매입조건 */}
              <Collapsible open={panelStates.A} onOpenChange={() => togglePanel('A')}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded flex items-center justify-center">A</span>
                      <span className="font-medium text-slate-900">매입조건</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${panelStates.A ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 space-y-3 border-x border-b border-slate-100 rounded-b-lg">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">매입가 (억)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={inputs.deal_amount}
                          onChange={(e) => updateInput('deal_amount', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">자기자본 (억)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={inputs.equity}
                          onChange={(e) => updateInput('equity', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">금리 (%)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={inputs.interest_rate}
                          onChange={(e) => updateInput('interest_rate', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">대출기간 (년)</label>
                        <Input
                          type="number"
                          value={inputs.loan_period}
                          onChange={(e) => updateInput('loan_period', parseInt(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    {/* Quick summary */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">대출금액</span>
                        <span className="font-medium text-slate-700">
                          {(inputs.deal_amount - inputs.equity - inputs.deposit).toFixed(1)}억
                        </span>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Panel B: 임대조건 */}
              <Collapsible open={panelStates.B} onOpenChange={() => togglePanel('B')}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-emerald-600 text-white text-xs font-bold rounded flex items-center justify-center">B</span>
                      <span className="font-medium text-slate-900">임대조건</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${panelStates.B ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 space-y-3 border-x border-b border-slate-100 rounded-b-lg">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">보증금 (억)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={inputs.deposit}
                          onChange={(e) => updateInput('deposit', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">월세 (만원)</label>
                        <Input
                          type="number"
                          step="10"
                          value={inputs.monthly_rent}
                          onChange={(e) => updateInput('monthly_rent', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">공실률 (%)</label>
                        <Input
                          type="number"
                          step="1"
                          value={inputs.vacancy_rate}
                          onChange={(e) => updateInput('vacancy_rate', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">운영비율 (%)</label>
                        <Input
                          type="number"
                          step="1"
                          value={inputs.operating_expense_ratio}
                          onChange={(e) => updateInput('operating_expense_ratio', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Panel C: 건축물대장 */}
              <Collapsible open={panelStates.C} onOpenChange={() => togglePanel('C')}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-purple-600 text-white text-xs font-bold rounded flex items-center justify-center">C</span>
                      <span className="font-medium text-slate-900">건축물대장</span>
                      <Badge variant="secondary" className="text-[10px] h-5">자동</Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${panelStates.C ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 space-y-2 border-x border-b border-slate-100 rounded-b-lg text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">대지면적</span>
                      <span className="font-medium">{inputs.land_area_m2}m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">건축면적</span>
                      <span className="font-medium">{inputs.building_area_m2}m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">연면적</span>
                      <span className="font-medium">{inputs.total_floor_area_m2}m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">층수</span>
                      <span className="font-medium">지상 {inputs.floors_above}층 / 지하 {inputs.floors_below}층</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">준공년도</span>
                      <span className="font-medium">{inputs.built_year}년</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">구조</span>
                      <span className="font-medium">{inputs.structure}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">용도</span>
                      <span className="font-medium">{inputs.main_use}</span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Panel D: 건축조건 */}
              <Collapsible open={panelStates.D} onOpenChange={() => togglePanel('D')}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-amber-600 text-white text-xs font-bold rounded flex items-center justify-center">D</span>
                      <span className="font-medium text-slate-900">건축조건</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${panelStates.D ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 space-y-3 border-x border-b border-slate-100 rounded-b-lg">
                    <div>
                      <label className="text-xs text-slate-500 mb-2 block">엘리베이터</label>
                      <div className="flex gap-2">
                        {['yes', 'no', 'possible'].map(v => (
                          <Button
                            key={v}
                            size="sm"
                            variant={inputs.has_elevator === v ? 'default' : 'outline'}
                            className={`flex-1 h-8 text-xs ${inputs.has_elevator === v ? 'bg-blue-600' : ''}`}
                            onClick={() => updateInput('has_elevator', v)}
                          >
                            {v === 'yes' ? '있음' : v === 'no' ? '없음' : '설치가능'}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-2 block">외관 리모델링</label>
                      <div className="flex gap-2">
                        {['unnecessary', 'partial', 'full'].map(v => (
                          <Button
                            key={v}
                            size="sm"
                            variant={inputs.exterior_remodel === v ? 'default' : 'outline'}
                            className={`flex-1 h-8 text-xs ${inputs.exterior_remodel === v ? 'bg-blue-600' : ''}`}
                            onClick={() => updateInput('exterior_remodel', v)}
                          >
                            {v === 'unnecessary' ? '불필요' : v === 'partial' ? '부분' : '전체'}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-2 block">설비 상태</label>
                      <div className="flex gap-2">
                        {['good', 'normal', 'poor'].map(v => (
                          <Button
                            key={v}
                            size="sm"
                            variant={inputs.facility_condition === v ? 'default' : 'outline'}
                            className={`flex-1 h-8 text-xs ${inputs.facility_condition === v ? 'bg-blue-600' : ''}`}
                            onClick={() => updateInput('facility_condition', v)}
                          >
                            {v === 'good' ? '양호' : v === 'normal' ? '보통' : '불량'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Panel E: 분석옵션 */}
              <Collapsible open={panelStates.E} onOpenChange={() => togglePanel('E')}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-rose-600 text-white text-xs font-bold rounded flex items-center justify-center">E</span>
                      <span className="font-medium text-slate-900">분석옵션</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${panelStates.E ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 space-y-3 border-x border-b border-slate-100 rounded-b-lg">
                    <div>
                      <label className="text-xs text-slate-500 mb-2 block">월세연체</label>
                      <div className="flex gap-2">
                        {['none', 'partial', 'severe'].map(v => (
                          <Button
                            key={v}
                            size="sm"
                            variant={inputs.rent_arrear_level === v ? 'default' : 'outline'}
                            className={`flex-1 h-8 text-xs ${
                              inputs.rent_arrear_level === v 
                                ? v === 'none' ? 'bg-emerald-600' : v === 'partial' ? 'bg-amber-600' : 'bg-red-600'
                                : ''
                            }`}
                            onClick={() => updateInput('rent_arrear_level', v)}
                          >
                            {v === 'none' ? '없음' : v === 'partial' ? '일부' : '심각'}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-2 block">명도난이도</label>
                      <div className="flex gap-2">
                        {['easy', 'normal', 'hard'].map(v => (
                          <Button
                            key={v}
                            size="sm"
                            variant={inputs.eviction_difficulty === v ? 'default' : 'outline'}
                            className={`flex-1 h-8 text-xs ${
                              inputs.eviction_difficulty === v 
                                ? v === 'easy' ? 'bg-emerald-600' : v === 'normal' ? 'bg-blue-600' : 'bg-red-600'
                                : ''
                            }`}
                            onClick={() => updateInput('eviction_difficulty', v)}
                          >
                            {v === 'easy' ? '용이' : v === 'normal' ? '보통' : '어려움'}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-2 block">임대현황</label>
                      <div className="flex gap-2">
                        {['full', 'partial', 'empty'].map(v => (
                          <Button
                            key={v}
                            size="sm"
                            variant={inputs.lease_status === v ? 'default' : 'outline'}
                            className={`flex-1 h-8 text-xs ${
                              inputs.lease_status === v 
                                ? v === 'full' ? 'bg-emerald-600' : v === 'partial' ? 'bg-amber-600' : 'bg-red-600'
                                : ''
                            }`}
                            onClick={() => updateInput('lease_status', v)}
                          >
                            {v === 'full' ? '만실' : v === 'partial' ? '일부공실' : '공실'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </ScrollArea>
        </aside>

        {/* ============================================================== */}
        {/* CONTENT AREA */}
        {/* ============================================================== */}
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Row 1: Score Cards + Map */}
              <div className="grid grid-cols-3 gap-4">
                {/* Bankability Card */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-400 text-sm">Bankability Score</span>
                      <Badge className="bg-white/10 text-white border-0">AI 분석</Badge>
                    </div>
                    <div className="flex items-end gap-2 mb-4">
                      <span className={`text-5xl font-bold ${kpis.bankability >= 70 ? 'text-emerald-400' : kpis.bankability >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {kpis.bankability}
                      </span>
                      <span className="text-slate-500 text-lg mb-1">/100</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${getScoreBgColor(kpis.bankability)}`}
                        style={{ width: `${kpis.bankability}%` }}
                      />
                    </div>
                    <div className="mt-4 text-sm text-slate-400">
                      {kpis.bankability >= 70 ? '대출 승인 가능성 높음' : kpis.bankability >= 50 ? '추가 검토 필요' : '대출 어려움 예상'}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Deal Signal Card */}
                <Card className="border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-500 text-sm">Deal Signal</span>
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        긍정적
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-slate-700">DSCR 1.2x 이상</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-slate-700">LTV 70% 이하</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {kpis.cap_rate >= 4 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="text-sm text-slate-700">CAP Rate {kpis.cap_rate >= 4 ? '양호' : '주의'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Map Preview Card */}
                <Card className="border-slate-200 cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setIsMapOpen(true)}>
                  <CardContent className="p-0 h-full">
                    <div className="h-full bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-100" />
                      <div className="relative z-10 text-center">
                        <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <span className="text-sm text-slate-600">지도에서 보기</span>
                      </div>
                      <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs text-slate-500">
                        반경 500m
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Insight Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="text-xs text-slate-500 mb-1">인근 평균가</div>
                    <div className="text-lg font-semibold text-slate-900">52.3억</div>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>+3.2% vs 제시가</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="text-xs text-slate-500 mb-1">예상 임대료</div>
                    <div className="text-lg font-semibold text-slate-900">2,650만/월</div>
                    <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                      <TrendingDown className="w-3 h-3" />
                      <span>-5.4% vs 현재</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="text-xs text-slate-500 mb-1">건물연령</div>
                    <div className="text-lg font-semibold text-slate-900">{new Date().getFullYear() - inputs.built_year}년</div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Info className="w-3 h-3" />
                      <span>리모델링 권장</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="text-xs text-slate-500 mb-1">위반건축물</div>
                    <div className="text-lg font-semibold text-emerald-600">없음</div>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>확인 완료</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: Report Buttons */}
              <div className="flex gap-3">
                <Button className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <FileText className="w-4 h-4" />
                  기본 분석 리포트 (무료)
                </Button>
                <Button variant="outline" className="flex-1 h-12 border-blue-200 text-blue-600 hover:bg-blue-50 gap-2">
                  <Download className="w-4 h-4" />
                  심층 분석 리포트 (30,000원)
                </Button>
              </div>

              {/* Row 4: Data Table with Tabs */}
              <Card className="border-slate-200">
                <CardHeader className="pb-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-slate-100">
                      <TabsTrigger value="transactions" className="data-[state=active]:bg-white">
                        인근 거래
                      </TabsTrigger>
                      <TabsTrigger value="loans" className="data-[state=active]:bg-white">
                        대출 이력
                      </TabsTrigger>
                      <TabsTrigger value="registry" className="data-[state=active]:bg-white">
                        등기부등본
                      </TabsTrigger>
                      <TabsTrigger value="tenants" className="data-[state=active]:bg-white">
                        임차인
                      </TabsTrigger>
                      <TabsTrigger value="permits" className="data-[state=active]:bg-white">
                        건축허가
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent className="pt-4">
                  <Tabs value={activeTab}>
                    <TabsContent value="transactions" className="m-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="text-left py-3 px-4 font-medium text-slate-500">주소</th>
                              <th className="text-right py-3 px-4 font-medium text-slate-500">거리</th>
                              <th className="text-right py-3 px-4 font-medium text-slate-500">거래일</th>
                              <th className="text-right py-3 px-4 font-medium text-slate-500">거래가</th>
                              <th className="text-right py-3 px-4 font-medium text-slate-500">평당가</th>
                              <th className="text-right py-3 px-4 font-medium text-slate-500">층수</th>
                              <th className="text-right py-3 px-4 font-medium text-slate-500">준공</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mockTransactions.map((tx) => (
                              <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 text-slate-900">{tx.address}</td>
                                <td className="py-3 px-4 text-right text-slate-600">{tx.distance_m}m</td>
                                <td className="py-3 px-4 text-right text-slate-600">{tx.transaction_date}</td>
                                <td className="py-3 px-4 text-right font-medium text-slate-900">
                                  {(tx.price / 100000000).toFixed(1)}억
                                </td>
                                <td className="py-3 px-4 text-right text-slate-600">
                                  {(tx.price_per_m2 / 10000).toFixed(0)}만/m²
                                </td>
                                <td className="py-3 px-4 text-right text-slate-600">{tx.floors}층</td>
                                <td className="py-3 px-4 text-right text-slate-600">{tx.built_year}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="loans" className="m-0">
                      <div className="text-center py-12 text-slate-500">
                        <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p>대출 이력 데이터를 불러오는 중...</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="registry" className="m-0">
                      <div className="text-center py-12 text-slate-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p>등기부등본 데이터를 불러오는 중...</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="tenants" className="m-0">
                      <div className="text-center py-12 text-slate-500">
                        <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p>임차인 데이터를 불러오는 중...</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="permits" className="m-0">
                      <div className="text-center py-12 text-slate-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p>건축허가 데이터를 불러오는 중...</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </main>
      </div>

      {/* ================================================================== */}
      {/* MAP MODAL */}
      {/* ================================================================== */}
      {isMapOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-xl w-full max-w-4xl h-[600px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">인근 실거래 현황</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsMapOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 bg-slate-100 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-slate-600">지도 API 연동 예정</p>
                <p className="text-sm text-slate-400 mt-1">반경 500m 내 {mockTransactions.length}건의 거래</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
