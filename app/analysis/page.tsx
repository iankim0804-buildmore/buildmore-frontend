"use client"

import { useState, useCallback, useEffect } from "react"

// Types
interface MapProperty {
  id: string
  address: string
  price: number
  rent: number
  area: string
  position: { left: string; top: string }
}

const mapProperties: MapProperty[] = [
  { id: 'mp1', address: '서울특별시 마포구 합정동 410-12', price: 42.0, rent: 290, area: '300㎡', position: { left: '17%', top: '18%' } },
  { id: 'mp2', address: '서울특별시 마포구 서교동 395-10', price: 33.0, rent: 260, area: '220㎡', position: { left: '53%', top: '14%' } },
  { id: 'mp3', address: '서울특별시 마포구 상수동 72-1', price: 28.5, rent: 210, area: '180㎡', position: { left: '73%', top: '24%' } },
  { id: 'mp4', address: '서울특별시 마포구 합정동 428-5', price: 38.0, rent: 320, area: '210㎡', position: { left: '23%', top: '46%' } },
  { id: 'mp5', address: '서울특별시 마포구 망원동 379-7', price: 26.8, rent: 190, area: '160㎡', position: { left: '67%', top: '48%' } },
  { id: 'mp6', address: '서울특별시 마포구 합정동 601-3', price: 47.0, rent: 360, area: '350㎡', position: { left: '80%', top: '72%' } },
  { id: 'mp7', address: '서울특별시 마포구 서교동 510-2', price: 36.5, rent: 280, area: '250㎡', position: { left: '28%', top: '79%' } },
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

export default function AnalysisPage() {
  // Input states
  const [address, setAddress] = useState('서울특별시 마포구 합정동 428-5')
  const [price, setPrice] = useState(38.0)
  const [loan, setLoan] = useState(22.0)
  const [rate, setRate] = useState(4.8)
  const [rent, setRent] = useState(320)
  const [deposit, setDeposit] = useState(5000)
  const [vacancy, setVacancy] = useState(20)
  const [scenario, setScenario] = useState<'현황' | '증축' | '신축' | '리모델링'>('현황')
  const [gfa, setGfa] = useState(420)
  const [constructionCost, setConstructionCost] = useState(500)
  const [elevator, setElevator] = useState<'있음' | '없음' | '설치예정'>('있음')
  
  // Analysis options
  const [financeScenario, setFinanceScenario] = useState(true)
  const [vacancyScenario, setVacancyScenario] = useState(true)
  const [roadRisk, setRoadRisk] = useState(true)
  const [autoReport, setAutoReport] = useState(false)
  
  // UI states
  const [showHistory, setShowHistory] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<MapProperty>(mapProperties[3])
  const [activeTab, setActiveTab] = useState('실거래 비교')
  
  // Calculated values
  const [noi, setNoi] = useState(0)
  const [dscr, setDscr] = useState(0)
  const [ltv, setLtv] = useState(0)
  const [cap, setCap] = useState(0)
  const [bankabilityScore, setBankabilityScore] = useState(0)
  const [dealSignal, setDealSignal] = useState<'매수' | '가격협상' | '매수보류'>('가격협상')
  
  // Recalculate on input change
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
  
  // Handle map property selection
  const handleAnalyzeSelected = () => {
    setAddress(selectedProperty.address)
    setPrice(selectedProperty.price)
    setRent(selectedProperty.rent)
    setShowMapModal(false)
  }
  
  // Today's date
  const today = new Date()
  const todayStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')} 최신값`
  
  // History items
  const historyItems = [
    '서울특별시 마포구 합정동 428-5',
    '서울특별시 마포구 합정동 410-12',
    '서울특별시 서교동 395-10',
    '서울특별시 망원동 379-7',
    '서울특별시 상수동 72-1',
  ]

  return (
    <div className="min-h-screen bg-[#f6f6f7]" style={{ fontFamily: "Inter, Pretendard, 'Noto Sans KR', system-ui, sans-serif" }}>
      {/* Shell */}
      <div className="w-[1560px] h-[1020px] mx-auto my-[18px] bg-white border border-[#e7e7ea] rounded-[24px] shadow-[0_12px_36px_rgba(0,0,0,.08)] overflow-hidden">
        
        {/* TopBar */}
        <div className="h-[66px] grid grid-cols-[170px_1fr_360px] items-center border-b border-[#e7e7ea] bg-[rgba(255,255,255,.96)]">
          <div className="px-5 font-extrabold tracking-[.04em] text-[22px]">BUILDMORE</div>
          
          <div className="flex items-center gap-2.5 pr-[18px]">
            <div className="relative w-[420px]">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-[42px] border border-[#e7e7ea] rounded-[10px] px-3.5 pr-10 text-sm bg-white outline-none"
              />
              <div 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] text-base cursor-pointer select-none"
                onClick={() => setShowHistory(!showHistory)}
              >
                ⌄
              </div>
              {showHistory && (
                <div className="absolute left-0 top-12 w-full bg-white border border-[#e7e7ea] rounded-xl shadow-[0_12px_36px_rgba(0,0,0,.08)] overflow-hidden z-10">
                  {historyItems.map((item, i) => (
                    <div 
                      key={i} 
                      className="grid grid-cols-[1fr_24px] gap-2 px-3 py-2.5 border-b border-[#f0f0f2] last:border-b-0 text-[13px] cursor-pointer hover:bg-gray-50"
                      onClick={() => { setAddress(item); setShowHistory(false) }}
                    >
                      <span>{item}</span>
                      <span className="text-center">×</span>
                    </div>
                  ))}
                  <div className="px-3 py-2.5 border-t border-[#e7e7ea] text-[#73737c] text-xs">◷ 검색 기록 관리</div>
                </div>
              )}
            </div>
            <button 
              className="h-10 px-3.5 rounded-[10px] border border-[#e7e7ea] bg-white font-semibold cursor-pointer"
              onClick={() => setShowMapModal(true)}
            >
              지도
            </button>
          </div>
          
          <div className="flex gap-2 justify-end pr-[18px]">
            <div className="h-8 inline-flex items-center px-3 rounded-full border border-[#e7e7ea] bg-[#fafafa] text-xs text-[#444] font-semibold">제2종일반주거</div>
            <div className="h-8 inline-flex items-center px-3 rounded-full border border-[#e7e7ea] bg-[#fafafa] text-xs text-[#444] font-semibold">법정 건폐율 60%</div>
            <div className="h-8 inline-flex items-center px-3 rounded-full border border-[#e7e7ea] bg-[#fafafa] text-xs text-[#444] font-semibold">법정 용적률 200%</div>
            <div className="h-8 inline-flex items-center px-3 rounded-full border border-[#e7e7ea] bg-[#fafafa] text-xs text-[#444] font-semibold">대지 210㎡</div>
          </div>
        </div>
        
        {/* KPI Strip */}
        <div className="h-[72px] border-b border-[#e7e7ea] grid grid-cols-[160px_1fr_180px] items-center px-[18px]">
          <div>
            <button className="h-10 w-[108px] bg-[#0f0f11] text-white border-0 rounded-[10px] font-bold text-sm cursor-pointer">분석 실행</button>
          </div>
          
          <div className="flex items-center justify-center gap-7">
            <div className="flex gap-1.5 mr-[18px]">
              <div className="h-[26px] px-2.5 inline-flex items-center rounded-full border border-[#e7e7ea] bg-white text-[11px] text-[#555] font-semibold">합정 생활상권</div>
              <div className="h-[26px] px-2.5 inline-flex items-center rounded-full border border-[#e7e7ea] bg-white text-[11px] text-[#555] font-semibold">역세권</div>
              <div className="h-[26px] px-2.5 inline-flex items-center rounded-full border border-[#e7e7ea] bg-white text-[11px] text-[#555] font-semibold">팝업</div>
              <div className="h-[26px] px-2.5 inline-flex items-center rounded-full border border-[#e7e7ea] bg-white text-[11px] text-[#555] font-semibold">주거상권</div>
            </div>
            
            <div className="min-w-[102px] text-center relative after:content-[''] after:absolute after:right-[-14px] after:top-1/2 after:-translate-y-1/2 after:w-px after:h-7 after:bg-[#e7e7ea]">
              <div className="text-[11px] tracking-[.08em] text-[#888] font-bold">NOI</div>
              <div className="mt-0.5 text-[17px] font-semibold text-[#111]">{Math.round(noi).toLocaleString('ko-KR')}만</div>
            </div>
            <div className="min-w-[102px] text-center relative after:content-[''] after:absolute after:right-[-14px] after:top-1/2 after:-translate-y-1/2 after:w-px after:h-7 after:bg-[#e7e7ea]">
              <div className="text-[11px] tracking-[.08em] text-[#888] font-bold">DSCR</div>
              <div className="mt-0.5 text-[17px] font-semibold text-[#111]">{dscr.toFixed(2)}</div>
            </div>
            <div className="min-w-[102px] text-center relative after:content-[''] after:absolute after:right-[-14px] after:top-1/2 after:-translate-y-1/2 after:w-px after:h-7 after:bg-[#e7e7ea]">
              <div className="text-[11px] tracking-[.08em] text-[#888] font-bold">LTV</div>
              <div className="mt-0.5 text-[17px] font-semibold text-[#111]">{ltv.toFixed(1)}%</div>
            </div>
            <div className="min-w-[102px] text-center">
              <div className="text-[11px] tracking-[.08em] text-[#888] font-bold">CAP</div>
              <div className="mt-0.5 text-[17px] font-semibold text-[#111]">{cap.toFixed(1)}%</div>
            </div>
          </div>
          
          <div className="justify-self-end flex items-center gap-2 text-[#2563eb] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#2563eb]"></span>
            <span>실시간 데이터 분석중</span>
          </div>
        </div>
        
        {/* Main */}
        <div className="grid grid-cols-[340px_1fr] h-[882px]">
          {/* Sidebar */}
          <div className="border-r border-[#e7e7ea] bg-[#fbfbfb] p-3.5 overflow-auto">
            {/* Panel A: 매입 조건 */}
            <div className="bg-white border border-[#e7e7ea] rounded-2xl mb-3 overflow-hidden">
              <div className="h-[42px] flex items-center justify-between px-3 border-b border-[#e7e7ea] text-[13px] font-bold">
                <span>A 매입 조건</span>
              </div>
              <div className="p-3">
                <NumField label="매입가격" unit="억원" value={price} onChange={setPrice} step={0.1} decimals={1} />
                <NumField label="대출금액" unit="억원" value={loan} onChange={setLoan} step={0.1} decimals={1} />
                <NumField label="금리" unit="%" value={rate} onChange={setRate} step={0.1} decimals={1} />
                <div className="mb-3">
                  <div className="flex justify-between mb-1.5 text-xs font-semibold text-[#222]">
                    <span>LTV (기본설정은 AI 분석값입니다.)</span>
                    <span className="text-[#888] font-medium">{ltv.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#ebebef] relative overflow-hidden">
                    <span className="absolute inset-y-0 left-0 bg-[#111] rounded-full" style={{ width: `${Math.min(100, ltv)}%` }}></span>
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-[#777]">
                    <span>급매</span>
                    <span>AI 할인 5~10% 적용</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Panel B: 임대 조건 */}
            <div className="bg-white border border-[#e7e7ea] rounded-2xl mb-3 overflow-hidden">
              <div className="h-[42px] flex items-center justify-between px-3 border-b border-[#e7e7ea] text-[13px] font-bold">
                <span>B 임대 조건</span>
              </div>
              <div className="p-3">
                <NumField label="월세" unit="만원" value={rent} onChange={setRent} step={10} decimals={0} />
                <NumField label="보증금" unit="만원" value={deposit} onChange={setDeposit} step={500} decimals={0} useComma />
                <div className="mb-3">
                  <div className="flex justify-between mb-1.5 text-xs font-semibold text-[#222]">
                    <span>공실률</span>
                    <span className="text-[#888] font-medium">%</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[30, 20, 10].map((v) => (
                      <button
                        key={v}
                        onClick={() => setVacancy(v)}
                        className={`h-[30px] flex-1 border rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          vacancy === v 
                            ? 'bg-[#111] text-white border-[#111]' 
                            : 'bg-white text-[#444] border-[#e7e7ea]'
                        }`}
                      >
                        {v === 30 ? '보수 30' : v === 20 ? '적정 20' : '긍정 10'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-0">
                  <div className="flex justify-between mb-1.5 text-xs font-semibold text-[#222]">
                    <span>공실민감도</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#ebebef] relative overflow-hidden">
                    <span className="absolute inset-y-0 left-0 bg-[#111] rounded-full" style={{ width: '42%' }}></span>
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-[#777]">
                    <span>공실률 변화에 따른 NOI 민감도 조정</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Panel C: 건축물대장 표제부 */}
            <div className="bg-white border border-[#e7e7ea] rounded-2xl mb-3 overflow-hidden">
              <div className="h-[42px] flex items-center justify-between px-3 border-b border-[#e7e7ea] text-[13px] font-bold">
                <span>C 건축물대장 표제부</span>
                <small className="text-[11px] text-[#888] font-semibold">{todayStr}</small>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-4 gap-2">
                  <MiniInfo label="허가연도" value="2000" />
                  <MiniInfo label="사용승인 연도" value="2001" />
                  <MiniInfo label="대장상 연면적" value="420㎡" />
                  <MiniInfo label="신축 최대 연면적" value="420㎡" />
                </div>
              </div>
            </div>
            
            {/* Panel D: 건축조건 */}
            <div className="bg-white border border-[#e7e7ea] rounded-2xl mb-3 overflow-hidden">
              <div className="h-[42px] flex items-center justify-between px-3 border-b border-[#e7e7ea] text-[13px] font-bold">
                <span>D 건축조건</span>
              </div>
              <div className="p-3">
                <div className="flex gap-2 flex-wrap mb-3">
                  {(['현황', '증축', '신축', '리모델링'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setScenario(s)}
                      className={`h-[30px] flex-1 border rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        scenario === s 
                          ? 'bg-[#111] text-white border-[#111]' 
                          : 'bg-white text-[#444] border-[#e7e7ea]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <NumField 
                  label="연면적" 
                  unit="㎡" 
                  value={gfa} 
                  onChange={setGfa} 
                  step={10} 
                  decimals={0} 
                  disabled={scenario === '현황'}
                  max={420}
                />
                <NumField label="시공비" unit="만원/㎡ · 50만원 단위" value={constructionCost} onChange={setConstructionCost} step={50} decimals={0} />
                <div className="mb-0">
                  <div className="flex justify-between mb-1.5 text-xs font-semibold text-[#222]">
                    <span>엘리베이터</span>
                    <span className="text-[#888] font-medium">공사비 반영</span>
                  </div>
                  <div className="flex gap-2">
                    {(['있음', '없음', '설치예정'] as const).map((e) => (
                      <button
                        key={e}
                        onClick={() => setElevator(e)}
                        className={`h-[30px] flex-1 border rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          elevator === e 
                            ? 'bg-[#111] text-white border-[#111]' 
                            : 'bg-white text-[#444] border-[#e7e7ea]'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Panel E: 분석 옵션 */}
            <div className="bg-white border border-[#e7e7ea] rounded-2xl mb-3 overflow-hidden">
              <div className="h-[42px] flex items-center justify-between px-3 border-b border-[#e7e7ea] text-[13px] font-bold">
                <span>E 분석 옵션</span>
              </div>
              <div className="p-3">
                <label className="flex items-center gap-2 mb-2.5 text-[13px] cursor-pointer">
                  <input type="checkbox" checked={financeScenario} onChange={(e) => setFinanceScenario(e.target.checked)} className="w-4 h-4" />
                  금융비용 시나리오 분석
                </label>
                <label className="flex items-center gap-2 mb-2.5 text-[13px] cursor-pointer">
                  <input type="checkbox" checked={vacancyScenario} onChange={(e) => setVacancyScenario(e.target.checked)} className="w-4 h-4" />
                  공실률 시나리오 분석
                </label>
                <label className="flex items-center gap-2 mb-2.5 text-[13px] cursor-pointer">
                  <input type="checkbox" checked={roadRisk} onChange={(e) => setRoadRisk(e.target.checked)} className="w-4 h-4" />
                  도로확폭 리스크 반영
                </label>
                <label className="flex items-center gap-2 mb-0 text-[13px] cursor-pointer">
                  <input type="checkbox" checked={autoReport} onChange={(e) => setAutoReport(e.target.checked)} className="w-4 h-4" />
                  AI 리포트 자동생성
                </label>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-3.5 overflow-auto">
            <div className="text-[26px] font-extrabold mt-0.5 mb-3 ml-0.5">분석 결과</div>
            
            {/* Top Cards */}
            <div className="grid grid-cols-[1.7fr_0.8fr_0.95fr] gap-3 items-stretch">
              {/* Bankability Card */}
              <div className="bg-white border border-[#e7e7ea] rounded-2xl overflow-hidden">
                <div className="px-[18px] pt-4 font-extrabold text-[15px]">BANKABILITY</div>
                <div className="px-[18px] py-3.5 pb-[18px]">
                  <div className="text-[48px] font-medium text-[#111] tracking-tight">
                    {bankabilityScore} <small className="text-[22px] text-[#111] font-medium">/ 100</small>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#ececef] my-3.5 overflow-hidden">
                    <span className="block h-full bg-[#111] rounded-full" style={{ width: `${bankabilityScore}%` }}></span>
                  </div>
                  <div className="grid grid-cols-[74px_1fr] gap-y-3 gap-x-3.5 text-[13px]">
                    <div className="text-[#666] font-bold">상권</div>
                    <div className="text-[#222] leading-relaxed">합정 생활상권 / 역세권 / 팝업 / 주거상권</div>
                    <div className="text-[#666] font-bold">입력값</div>
                    <div className="text-[#222] leading-relaxed">매입가 {price.toFixed(1)}억, 대출 {loan.toFixed(1)}억, 금리 {rate.toFixed(1)}%, 월세 {rent}만, 공실률 {vacancy}%</div>
                    <div className="text-[#666] font-bold">분석엔진</div>
                    <div className="text-[#222] leading-relaxed">Delta Engine + LLM Wiki 통합 분석</div>
                    <div className="text-[#666] font-bold">설명</div>
                    <div className="text-[#222] leading-relaxed">해당 주소지는 합정 생활상권에 속하고, 사용자가 입력한 매입가·대출·금리·임대조건 기준으로 Delta Engine과 LLM Wiki 통합 분석 결과 bankability {bankabilityScore}점으로 산출.</div>
                  </div>
                </div>
              </div>
              
              {/* Deal Signal Card */}
              <div className="bg-white border border-[#e7e7ea] rounded-2xl overflow-hidden">
                <div className="px-[18px] pt-4 font-extrabold text-[15px]">DEAL SIGNAL</div>
                <div className="px-[18px] py-3.5 pb-[18px]">
                  <div 
                    className="text-[28px] font-bold mt-[18px] mb-3.5"
                    style={{ color: dealSignal === '매수' ? '#111' : '#dc2626' }}
                  >
                    {dealSignal}
                  </div>
                  <div className="text-[13px] text-[#555] leading-relaxed">
                    Bankability {bankabilityScore}점, DSCR {dscr.toFixed(2)}, {dealSignal === '매수' ? '주요 리스크 통제 가능' : dealSignal === '매수보류' ? '리스크 탭 강한 경고 반영' : '공실 및 도로확폭 리스크 반영'}
                  </div>
                  <div className="mt-[18px] px-2">
                    <div className="h-1 bg-[#ececef] rounded-full relative">
                      <div 
                        className="absolute top-1/2 w-3.5 h-3.5 -translate-y-1/2 rounded-full bg-[#dc2626]"
                        style={{ left: dealSignal === '매수' ? '10%' : dealSignal === '가격협상' ? '48%' : '85%' }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2 text-[11px] text-[#777] font-bold">
                      <span>매수</span>
                      <span style={{ color: dealSignal === '가격협상' ? '#dc2626' : '#777' }}>가격협상</span>
                      <span>매수보류</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Map Card */}
              <div className="bg-white border border-[#e7e7ea] rounded-2xl overflow-hidden">
                <div className="px-[18px] pt-4 font-extrabold text-[15px] flex justify-between items-center">
                  <span>지도</span>
                  <span className="h-7 px-2.5 inline-flex items-center rounded-full border border-[#e7e7ea] bg-[#fafafa] text-[11px] font-semibold">{address.split(' ').slice(-1)[0]}</span>
                </div>
                <div className="px-[18px] py-2.5 pb-[18px]">
                  <div 
                    className="h-[284px] border border-[#e7e7ea] rounded-[14px] overflow-hidden relative cursor-pointer"
                    onClick={() => setShowMapModal(true)}
                    style={{
                      background: '#efeff1',
                      backgroundImage: `
                        linear-gradient(35deg, transparent 0 37%, rgba(0,0,0,.08) 37% 38.5%, transparent 38.5% 100%),
                        linear-gradient(118deg, transparent 0 50%, rgba(0,0,0,.07) 50% 51%, transparent 51% 100%),
                        repeating-linear-gradient(90deg, rgba(0,0,0,.03) 0 1px, transparent 1px 86px),
                        repeating-linear-gradient(0deg, rgba(0,0,0,.03) 0 1px, transparent 1px 72px)
                      `
                    }}
                  >
                    <div className="absolute left-[18%] top-[18%] bg-white border border-[#e7e7ea] px-2 py-1.5 rounded-xl text-[11px] font-bold shadow-sm">420㎡<br/>52.0억</div>
                    <div className="absolute left-[64%] top-[16%] bg-white border border-[#e7e7ea] px-2 py-1.5 rounded-xl text-[11px] font-bold shadow-sm">160㎡<br/>26.8억</div>
                    <div className="absolute left-[70%] top-[56%] bg-white border border-[#e7e7ea] px-2 py-1.5 rounded-xl text-[11px] font-bold shadow-sm">230㎡<br/>31.5억</div>
                    <div className="absolute left-[22%] top-[52%] bg-white border border-[#e7e7ea] px-2 py-1.5 rounded-xl text-[11px] font-bold shadow-sm">210㎡<br/>31.5억</div>
                    <div className="absolute left-[48%] top-[70%] bg-white border border-[#e7e7ea] px-2 py-1.5 rounded-xl text-[11px] font-bold shadow-sm">350㎡<br/>47.0억</div>
                    <div className="absolute left-[54%] top-[42%] w-[22px] h-[22px] rounded-[50%_50%_50%_0] -rotate-45 bg-[#111]">
                      <div className="absolute inset-[5px] bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Insights */}
            <div className="grid grid-cols-4 gap-2.5 mt-3">
              <InsightCard 
                label="연간 커버리지" 
                value={`${dscr.toFixed(2)}x`} 
                sub="NOI / 연간 금융비용"
                popover="현재 NOI가 연간 금융비용을 충분히 커버하지 못합니다. 통상 안정권으로 보는 DSCR 1.25 이상에 못 미치므로 금융 구조나 매입가 조정이 필요합니다."
              />
              <InsightCard 
                label="상권 강점" 
                value="합정 생활상권" 
                sub="역세권 + 주거 유입 안정"
                popover="합정역 접근성, 주거 기반 유입, 팝업·F&B 수요가 겹치는 상권입니다."
              />
              <InsightCard 
                label="밸류애드" 
                value="조건부 가능" 
                sub="용적 여력 제한적"
                popover="현황 대비 연면적 증가는 제한적이지만, 리모델링을 통한 효율 개선과 임차인 업종 재구성으로 수익성 개선 여지가 있습니다."
              />
              <InsightCard 
                label="핵심 리스크" 
                value="공실 · 도로확폭" 
                sub={`공실률 ${vacancy}%, 도로확폭 4m`}
                popover="인접도로가 4m 미만이면 도로확폭 대상이 될 수 있어 신축 시 유효 대지면적이 줄고 건폐율·용적률 산정에 불리해질 수 있습니다."
                isRed
              />
            </div>
            
            {/* Reports */}
            <div className="grid grid-cols-3 gap-2.5 mt-3">
              <ReportCard title="일반 PDF 다운로드" desc="분석 결과 요약 리포트를 PDF로 다운로드합니다." buttonText="다운로드" />
              <ReportCard title="심층 리포트 요청" desc="건축/금융/리스크 상세 분석을 포함한 심층 리포트를 받아보세요." buttonText="리포트 요청" />
              <ReportCard title="DEAL PACKAGE" desc="협상 전략, 금융 조건, 리스크 대응을 포함한 맞춤형 패키지를 제공합니다." buttonText="패키지 보기" />
            </div>
            
            {/* Table Box */}
            <div className="mt-3 bg-white border border-[#e7e7ea] rounded-2xl overflow-hidden">
              <div className="flex gap-6 px-[18px] h-[46px] items-end border-b border-[#e7e7ea]">
                {['금융 분석', 'NOI · DSCR', '건축조건', '리스크', '실거래 비교'].map((tab) => (
                  <div
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`h-full flex items-center pt-1 text-[13px] font-bold cursor-pointer border-b-[3px] transition-colors ${
                      activeTab === tab 
                        ? 'text-[#111] border-[#111]' 
                        : 'text-[#666] border-transparent'
                    }`}
                  >
                    {tab}
                  </div>
                ))}
              </div>
              <div className="h-[260px] overflow-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="px-[18px] py-3.5 border-b border-[#f1f1f3] text-left text-[11px] tracking-[.04em] uppercase text-[#777] sticky top-0 bg-[#fafafb] z-[1]">날짜</th>
                      <th className="px-[18px] py-3.5 border-b border-[#f1f1f3] text-left text-[11px] tracking-[.04em] uppercase text-[#777] sticky top-0 bg-[#fafafb] z-[1]">위치</th>
                      <th className="px-[18px] py-3.5 border-b border-[#f1f1f3] text-left text-[11px] tracking-[.04em] uppercase text-[#777] sticky top-0 bg-[#fafafb] z-[1]">면적</th>
                      <th className="px-[18px] py-3.5 border-b border-[#f1f1f3] text-left text-[11px] tracking-[.04em] uppercase text-[#777] sticky top-0 bg-[#fafafb] z-[1]">거래가</th>
                      <th className="px-[18px] py-3.5 border-b border-[#f1f1f3] text-left text-[11px] tracking-[.04em] uppercase text-[#777] sticky top-0 bg-[#fafafb] z-[1]">㎡당</th>
                      <th className="px-[18px] py-3.5 border-b border-[#f1f1f3] text-left text-[11px] tracking-[.04em] uppercase text-[#777] sticky top-0 bg-[#fafafb] z-[1]">유형</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => (
                      <tr key={i}>
                        <td className="px-[18px] py-3.5 border-b border-[#f1f1f3] text-[13px]">{tx.date}</td>
                        <td className="px-[18px] py-3.5 border-b border-[#f1f1f3] text-[13px]">{tx.location}</td>
                        <td className="px-[18px] py-3.5 border-b border-[#f1f1f3] text-[13px]">{tx.area}</td>
                        <td className="px-[18px] py-3.5 border-b border-[#f1f1f3] text-[13px]">{tx.price}</td>
                        <td className="px-[18px] py-3.5 border-b border-[#f1f1f3] text-[13px]">{tx.pricePerM2}</td>
                        <td className="px-[18px] py-3.5 border-b border-[#f1f1f3] text-[13px]">{tx.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Modal */}
      {showMapModal && (
        <div 
          className="fixed inset-0 bg-[rgba(10,10,12,.24)] flex items-center justify-center z-50"
          onClick={() => setShowMapModal(false)}
        >
          <div 
            className="w-[min(1260px,calc(100vw-32px))] h-[min(780px,calc(100vh-32px))] bg-white rounded-[20px] shadow-[0_12px_36px_rgba(0,0,0,.08)] overflow-hidden grid grid-rows-[58px_1fr]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-[18px] border-b border-[#e7e7ea] font-extrabold">
              <span>지도에서 물건을 선택하고 &apos;분석&apos;을 클릭하세요</span>
              <button 
                className="h-10 px-3.5 rounded-[10px] border border-[#e7e7ea] bg-white font-semibold cursor-pointer"
                onClick={() => setShowMapModal(false)}
              >
                ✕
              </button>
            </div>
            <div 
              className="relative"
              style={{
                background: '#ececef',
                backgroundImage: `
                  linear-gradient(35deg, transparent 0 37%, rgba(0,0,0,.08) 37% 38.5%, transparent 38.5% 100%),
                  linear-gradient(118deg, transparent 0 50%, rgba(0,0,0,.07) 50% 51%, transparent 51% 100%),
                  repeating-linear-gradient(90deg, rgba(0,0,0,.03) 0 1px, transparent 1px 110px),
                  repeating-linear-gradient(0deg, rgba(0,0,0,.03) 0 1px, transparent 1px 86px)
                `
              }}
            >
              {mapProperties.map((prop) => (
                <div
                  key={prop.id}
                  onClick={() => setSelectedProperty(prop)}
                  className={`absolute bg-white border border-[#e7e7ea] rounded-xl px-2.5 py-2 text-xs font-bold cursor-pointer shadow-sm transition-all ${
                    selectedProperty.id === prop.id ? 'outline outline-2 outline-[#111]' : ''
                  }`}
                  style={{ left: prop.position.left, top: prop.position.top }}
                >
                  {prop.area}<br/>{prop.price.toFixed(1)}억
                </div>
              ))}
              
              <div 
                className="absolute w-7 h-7 rounded-[50%_50%_50%_0] -rotate-45 bg-[#111]"
                style={{ left: selectedProperty.position.left, top: `calc(${selectedProperty.position.top} + 60px)` }}
              >
                <div className="absolute inset-[7px] bg-white rounded-full"></div>
              </div>
              
              <div className="absolute left-1/2 bottom-[26px] -translate-x-1/2 w-[280px] bg-white border border-[#e7e7ea] rounded-[14px] p-3.5 shadow-[0_12px_36px_rgba(0,0,0,.08)]">
                <div className="font-extrabold text-[22px] mb-1.5">{selectedProperty.address.split(' ').slice(-2).join(' ')}</div>
                <div className="text-xs text-[#666] leading-relaxed">대지 {selectedProperty.area.replace('㎡', '')}㎡ · 연면적 420㎡<br/>제2종일반주거 · 4m 도로</div>
                <button 
                  className="mt-3 w-full h-10 border-0 rounded-[10px] bg-[#111] text-white font-bold cursor-pointer"
                  onClick={handleAnalyzeSelected}
                >
                  분석
                </button>
              </div>
              
              <div className="absolute right-4 bottom-4 flex flex-col gap-1">
                <button className="w-8 h-8 border border-[#e7e7ea] rounded-lg bg-white font-bold cursor-pointer">+</button>
                <button className="w-8 h-8 border border-[#e7e7ea] rounded-lg bg-white font-bold cursor-pointer">−</button>
                <button className="w-8 h-8 border border-[#e7e7ea] rounded-lg bg-white font-bold cursor-pointer">⌖</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// NumField Component
function NumField({ 
  label, 
  unit, 
  value, 
  onChange, 
  step, 
  decimals = 0,
  disabled = false,
  max,
  useComma = false
}: { 
  label: string
  unit: string
  value: number
  onChange: (v: number) => void
  step: number
  decimals?: number
  disabled?: boolean
  max?: number
  useComma?: boolean
}) {
  const [showWarning, setShowWarning] = useState(false)
  
  const handleChange = (newVal: number) => {
    if (max && newVal > max) {
      setShowWarning(true)
      return
    }
    setShowWarning(false)
    onChange(newVal)
  }
  
  const displayValue = useComma ? value.toLocaleString('ko-KR') : (decimals > 0 ? value.toFixed(decimals) : String(value))
  
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1.5 text-xs font-semibold text-[#222]">
        <span>{label}</span>
        <span className="text-[#888] font-medium">{unit}</span>
      </div>
      <div className={`grid grid-cols-[1fr_34px_34px] border border-[#e7e7ea] rounded-[10px] overflow-hidden h-[38px] ${disabled ? 'bg-[#f3f3f4]' : 'bg-white'}`}>
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            const v = Number(e.target.value.replace(/,/g, '')) || 0
            handleChange(v)
          }}
          disabled={disabled}
          className={`border-0 outline-none px-2.5 text-sm font-medium ${disabled ? 'bg-[#f3f3f4] text-[#9a9aa1] cursor-not-allowed' : 'text-[#111]'}`}
        />
        <button 
          onClick={() => handleChange(value - step)}
          disabled={disabled}
          className={`border-0 border-l border-[#e7e7ea] text-base text-[#555] cursor-pointer ${disabled ? 'bg-[#f3f3f4] text-[#9a9aa1] cursor-not-allowed' : 'bg-white'}`}
        >
          −
        </button>
        <button 
          onClick={() => handleChange(value + step)}
          disabled={disabled}
          className={`border-0 border-l border-[#e7e7ea] text-base text-[#555] cursor-pointer ${disabled ? 'bg-[#f3f3f4] text-[#9a9aa1] cursor-not-allowed' : 'bg-white'}`}
        >
          +
        </button>
      </div>
      {showWarning && (
        <div className="mt-2 text-[#dc2626] text-[11px] font-semibold">법정 용적률을 초과할 수 없습니다.</div>
      )}
    </div>
  )
}

// MiniInfo Component
function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#e7e7ea] rounded-[10px] p-2">
      <div className="text-[10px] text-[#888] mb-1">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  )
}

// InsightCard Component
function InsightCard({ label, value, sub, popover, isRed = false }: { label: string; value: string; sub: string; popover: string; isRed?: boolean }) {
  return (
    <div className="bg-white border border-[#e7e7ea] rounded-[14px] p-3.5 relative transition-all duration-150 overflow-visible group hover:shadow-[0_10px_22px_rgba(0,0,0,.08)]">
      <div className="text-[11px] text-[#777] font-extrabold tracking-[.04em]">{label}</div>
      <div className={`mt-2.5 text-[19px] font-medium ${isRed ? 'text-[#dc2626]' : 'text-[#111]'}`}>{value}</div>
      <div className="mt-[7px] text-xs text-[#777]">{sub}</div>
      <div className="absolute left-3 top-[calc(100%+10px)] w-[240px] bg-white border border-[#e7e7ea] rounded-xl shadow-[0_12px_36px_rgba(0,0,0,.08)] p-3 text-xs text-[#444] leading-relaxed opacity-0 invisible translate-y-1.5 transition-all duration-150 z-[5] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
        {popover}
      </div>
    </div>
  )
}

// ReportCard Component
function ReportCard({ title, desc, buttonText }: { title: string; desc: string; buttonText: string }) {
  return (
    <div className="bg-white border border-[#e7e7ea] rounded-[14px] p-3.5 text-center">
      <div className="text-sm font-extrabold">{title}</div>
      <div className="my-2 mx-0 mb-3 text-xs text-[#777] leading-relaxed">{desc}</div>
      <button className="h-9 min-w-[110px] rounded-[10px] border border-[#e7e7ea] bg-white font-bold cursor-pointer">{buttonText}</button>
    </div>
  )
}
