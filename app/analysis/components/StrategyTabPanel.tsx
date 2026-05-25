export type StrategyPersonaKey = "broker_buyer" | "developer_builder" | "individual_investor"

type PersonaLens = {
  key: StrategyPersonaKey
  label: string
  focus: string
  primary_cta: string
}

type StrategyAction = {
  priority: number
  label: string
  description: string
  persona?: string
}

type StrategyEvidence = {
  key: string
  label: string
  value: string
  source_type: string
  confidence: string
  interpretation: string
}

type StrategyMetricCard = {
  key: string
  label: string
  value: string
  description: string
  tone: string
}

type StrategyTab = {
  key: string
  label: string
  headline: string
  verdict: string
  opportunity: string
  downside: string
  comparison: string
  timing: string
  next_actions: StrategyAction[]
  evidence: StrategyEvidence[]
  metric_cards?: StrategyMetricCard[]
}

export type AnalysisStrategy = {
  summary: string
  personas: PersonaLens[]
  tabs: StrategyTab[]
  execution_package?: {
    title: string
    summary: string
    ctas: StrategyAction[]
  }
  data_quality?: Array<{
    key: string
    label: string
    status: string
    source_type: string
    confidence: string
    message: string
  }>
}

type FallbackStrategyInput = {
  address: string
  price: number
  loan: number
  rate: number
  rent: number
  vacancyRate: number
  noi: number
  dscr: number
  ltv: number
  cap: number
  bankabilityScore: number
  dealSignal: string
  rentalInputGuide: string
  commercialHeadline: string
  topIndustryCount: number
}

type StrategyTabPanelProps = {
  strategy?: AnalysisStrategy | null
  activeTab: string
  onTabChange: (tab: string) => void
  selectedPersona: StrategyPersonaKey
  onPersonaChange: (persona: StrategyPersonaKey) => void
  fallback: FallbackStrategyInput
}

const personaFallback: PersonaLens[] = [
  {
    key: "broker_buyer",
    label: "중개인(매수측)",
    focus: "매수자 설득 논리와 가격협상 근거",
    primary_cta: "매수자 브리핑 생성",
  },
  {
    key: "developer_builder",
    label: "개발·시공·시행",
    focus: "개발 시나리오와 투자심의 체크포인트",
    primary_cta: "개발 검토 메모 생성",
  },
  {
    key: "individual_investor",
    label: "개인투자자",
    focus: "실행 순서, 전문가 질문, 손실 방어",
    primary_cta: "개인 실행 로드맵 생성",
  },
]

const toneClass: Record<string, string> = {
  positive: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  negative: "border-red-200 bg-red-50 text-red-900",
  danger: "border-red-200 bg-red-50 text-red-900",
  neutral: "border-gray-200 bg-gray-50 text-gray-900",
}

export function StrategyTabPanel({
  strategy,
  activeTab,
  onTabChange,
  selectedPersona,
  onPersonaChange,
  fallback,
}: StrategyTabPanelProps) {
  const finalStrategy = strategy || buildFallbackStrategy(fallback)
  const personas = finalStrategy.personas?.length ? finalStrategy.personas : personaFallback
  const tabs = finalStrategy.tabs || []
  const currentTab = tabs.find((tab) => tab.label === activeTab || tab.key === activeTab) || tabs[0]
  const persona = personas.find((item) => item.key === selectedPersona) || personas[0]
  const personaActions = currentTab?.next_actions?.filter((action) => !action.persona || action.persona === persona?.key)
  const visibleActions = personaActions?.length ? personaActions : currentTab?.next_actions || []

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {personas.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onPersonaChange(item.key)}
              className={`rounded-[8px] border px-3 py-2 text-xs font-semibold transition-colors ${
                selectedPersona === item.key
                  ? "border-gray-950 bg-gray-950 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {persona && (
          <p className="mt-2 text-xs leading-relaxed text-gray-500 break-keep">
            {persona.focus} · {persona.primary_cta}
          </p>
        )}
      </div>

      <div className="h-[46px] flex shrink-0 overflow-x-auto border-b border-border bg-white">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.label)}
            className={`shrink-0 px-4 text-sm transition-colors ${
              currentTab?.key === tab.key
                ? "border-b-[3px] border-foreground font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white p-5">
        {!currentTab ? (
          <div className="rounded-[8px] border border-gray-200 p-5 text-sm text-gray-600">
            분석 실행 후 4개 판단 탭이 표시됩니다.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[8px] border border-gray-200 p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                BUILDMORE HONEST CONVICTION
              </p>
              <h3 className="mt-2 text-xl font-bold text-gray-950 break-keep">
                {currentTab.headline}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 break-keep">
                {currentTab.verdict}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
              <ConvictionBox title="기회" body={currentTab.opportunity} tone="positive" />
              <ConvictionBox title="손실 방어" body={currentTab.downside} tone="warning" />
              <ConvictionBox title="비교 위치" body={currentTab.comparison} tone="neutral" />
              <ConvictionBox title="확인 시점" body={currentTab.timing} tone="neutral" />
            </div>

            {!!currentTab.metric_cards?.length && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {currentTab.metric_cards.map((card) => (
                  <div
                    key={card.key}
                    className={`rounded-[8px] border p-4 ${toneClass[card.tone] || toneClass.neutral}`}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{card.label}</p>
                    <p className="mt-2 text-xl font-bold tabular-nums">{card.value}</p>
                    <p className="mt-1 text-xs leading-relaxed opacity-80 break-keep">{card.description}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-[8px] border border-gray-200 p-4">
                <h4 className="text-sm font-bold text-gray-950">근거와 신뢰도</h4>
                <div className="mt-3 space-y-3">
                  {currentTab.evidence.map((item) => (
                    <div key={`${currentTab.key}-${item.key}`} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-950">{item.label}</p>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                          {item.confidence}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-gray-800">{item.value}</p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500 break-keep">
                        {item.interpretation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[8px] border border-gray-200 p-4">
                <h4 className="text-sm font-bold text-gray-950">다음 액션</h4>
                <div className="mt-3 space-y-3">
                  {visibleActions.map((action) => (
                    <div key={`${currentTab.key}-${action.priority}-${action.label}`} className="rounded-[8px] bg-gray-50 p-3">
                      <p className="text-sm font-bold text-gray-950">{action.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600 break-keep">
                        {action.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {!!finalStrategy.data_quality?.length && (
              <div className="rounded-[8px] border border-gray-200 p-4">
                <h4 className="text-sm font-bold text-gray-950">데이터 상태</h4>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {finalStrategy.data_quality.map((item) => (
                    <div key={item.key} className="rounded-[8px] bg-gray-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-gray-900">{item.label}</p>
                        <span className="text-[11px] font-semibold text-gray-500">{item.status}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500 break-keep">{item.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ConvictionBox({ title, body, tone }: { title: string; body: string; tone: string }) {
  return (
    <div className={`rounded-[8px] border p-4 ${toneClass[tone] || toneClass.neutral}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-relaxed break-keep">{body}</p>
    </div>
  )
}

function buildFallbackStrategy(input: FallbackStrategyInput): AnalysisStrategy {
  const dscrText = Number.isFinite(input.dscr) ? `${input.dscr.toFixed(2)}x` : "-"
  const stressGap = Math.max(0, input.loan * 10000 * ((input.rate + 0.5) / 100) / 12 - input.rent * 0.7)
  const comparison = input.bankabilityScore >= 68
    ? "내부 기준상 양호권에 가깝지만 주변 표본 확인이 필요합니다."
    : "현재 조건은 가격과 임대 조건을 보강해야 하는 평균 이하 구간입니다."
  const evidence: StrategyEvidence[] = [
    { key: "noi", label: "NOI", value: `${input.noi.toLocaleString("ko-KR")}만원/년`, source_type: "derived_formula", confidence: "medium", interpretation: "사용자 입력 임대료와 공실률을 기반으로 계산했습니다." },
    { key: "dscr", label: "DSCR", value: dscrText, source_type: "derived_formula", confidence: "medium", interpretation: "NOI가 연간 금융비용을 얼마나 커버하는지 보여줍니다." },
    { key: "ltv", label: "LTV", value: `${input.ltv.toFixed(1)}%`, source_type: "derived_formula", confidence: "medium", interpretation: "대출금액과 매입가 기준의 레버리지입니다." },
    { key: "cap", label: "Cap Rate", value: `${input.cap.toFixed(2)}%`, source_type: "derived_formula", confidence: "medium", interpretation: "현재 매입가 대비 순영업수익률입니다." },
  ]
  const actions: StrategyAction[] = [
    { priority: 1, label: "조건 재확인", description: "매입가, 대출, 월세, 공실률을 확정한 뒤 다시 실행하세요." },
    { priority: 2, label: "실사 항목 준비", description: "임대차계약서, 위반건축물, 도로, 공사비를 계약 전 확인하세요." },
  ]

  return {
    summary: `${input.address || "입력 주소"} 기준 임시 전략입니다.`,
    personas: personaFallback,
    tabs: [
      {
        key: "deal_decision",
        label: "딜 결론",
        headline: `이 딜은 '${input.dealSignal}' 구간입니다.`,
        verdict: `Bankability ${input.bankabilityScore}점, DSCR ${dscrText} 기준입니다.`,
        opportunity: input.bankabilityScore >= 68 ? "현재 조건에서도 진행 검토가 가능합니다." : "가격협상과 임대조건 보강 여지가 있습니다.",
        downside: stressGap > 0 ? `스트레스 조건에서 월 ${Math.round(stressGap).toLocaleString("ko-KR")}만원 보전 가능성을 봐야 합니다.` : "월 보전 부담은 제한적으로 보입니다.",
        comparison,
        timing: "분석 실행값과 주소 기반 데이터가 연결되면 더 정확해집니다.",
        next_actions: actions,
        evidence,
        metric_cards: [
          { key: "score", label: "Bankability", value: `${input.bankabilityScore}/100`, description: "현재 입력 조건 기준 점수입니다.", tone: input.bankabilityScore >= 68 ? "positive" : "warning" },
          { key: "dscr", label: "DSCR", value: dscrText, description: "은행식 원리금 커버리지입니다.", tone: input.dscr >= 1.2 ? "positive" : "warning" },
          { key: "signal", label: "Deal Signal", value: input.dealSignal, description: "매수·가격협상·보류 판단입니다.", tone: "neutral" },
        ],
      },
      {
        key: "price_finance",
        label: "가격·금융",
        headline: "가격은 금융이 버티는 선에서 다시 봅니다.",
        verdict: input.rentalInputGuide,
        opportunity: "협상 성공 시 자기자본 부담과 LTV를 동시에 낮출 수 있습니다.",
        downside: stressGap > 0 ? `금리와 공실이 나빠지면 월 ${Math.round(stressGap).toLocaleString("ko-KR")}만원 보전 여지가 생깁니다.` : "현재 스트레스 월 보전액은 제한적입니다.",
        comparison,
        timing: "금리, 공실률, 임대료 입력 변경 시 즉시 다시 계산됩니다.",
        next_actions: actions,
        evidence,
        metric_cards: [],
      },
      {
        key: "development_operation",
        label: "개발·운영",
        headline: "개발 방향은 시나리오별 손익으로 판단해야 합니다.",
        verdict: "현황, 리모델링, 증축, 신축은 인허가와 공사비 확인 전 확정할 수 없습니다.",
        opportunity: "리모델링과 임차인 재구성으로 NOI 개선 여지를 먼저 봅니다.",
        downside: "도로, 주차, 일조, 공사비 증액 리스크를 확인해야 합니다.",
        comparison: `현재 NOI ${input.noi.toLocaleString("ko-KR")}만원/년 기준입니다.`,
        timing: "건축사 검토와 시공 견적 확보 후 판단 강도를 높이세요.",
        next_actions: actions,
        evidence,
        metric_cards: [],
      },
      {
        key: "location_future",
        label: "입지·미래가치",
        headline: "상권 지표를 가격과 임대 안정성의 의미로 번역합니다.",
        verdict: input.commercialHeadline,
        opportunity: `행정동 업종 Top ${input.topIndustryCount || 0}개 매출 데이터가 있으면 MD 판단이 선명해집니다.`,
        downside: "상권 키워드가 좋아도 매입가에 이미 반영되어 있으면 초과수익은 제한됩니다.",
        comparison: "주변 실거래와 상권 데이터 연결 후 시장 내 위치를 판단합니다.",
        timing: "확인된 데이터만 사용하고 과장된 실시간 압박 문구는 쓰지 않습니다.",
        next_actions: actions,
        evidence,
        metric_cards: [],
      },
    ],
    data_quality: [
      { key: "fallback", label: "전략 상태", status: "partial", source_type: "derived_formula", confidence: "medium", message: "백엔드 전략 응답 전에는 입력값 기반 임시 판단을 표시합니다." },
    ],
  }
}
