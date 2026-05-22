"use client"

import { useMemo, useState } from "react"
import type React from "react"
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  Landmark,
  Layers3,
  MapPin,
  MessageSquareText,
  Plus,
  Share2,
  ShieldAlert,
  Sparkles,
  WalletCards,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ViewMode = "quick" | "compare" | "report"

const candidates = [
  {
    id: "A",
    area: "성수동",
    address: "서울 성동구 성수동2가 315-8",
    price: "38.0억",
    roe: 11.3,
    profit: "4.2억",
    equity: "13.8억",
    maxPrice: "35.5억",
    scenario: "리모델링 + 근생",
    risk: "중간",
    signal: "2.5억 협상 필요",
    rank: 1,
  },
  {
    id: "B",
    area: "합정동",
    address: "서울 마포구 합정동 412-3",
    price: "31.5억",
    roe: 9.7,
    profit: "2.8억",
    equity: "11.9억",
    maxPrice: "32.2억",
    scenario: "증축 + 공유오피스",
    risk: "낮음",
    signal: "매입가 적정",
    rank: 2,
  },
  {
    id: "C",
    area: "역삼동",
    address: "서울 강남구 역삼동 721-14",
    price: "52.0억",
    roe: 6.4,
    profit: "2.1억",
    equity: "20.4억",
    maxPrice: "46.8억",
    scenario: "신축 + 병의원",
    risk: "높음",
    signal: "보류",
    rank: 3,
  },
]

const scenarioRows = [
  { name: "리모델링", cost: "5.4억", months: "5개월", roe: "11.3%", noi: "+4,900만", verdict: "추천" },
  { name: "증축", cost: "9.8억", months: "9개월", roe: "9.1%", noi: "+6,200만", verdict: "검토" },
  { name: "신축", cost: "18.6억", months: "16개월", roe: "6.8%", noi: "+8,100만", verdict: "보류" },
]

const metricCards = [
  { label: "자기자본수익률", value: "11.3%", helper: "입지 평균 7.2%", tone: "good" },
  { label: "예상 순이익", value: "4.2억", helper: "세후 추정", tone: "good" },
  { label: "필요 자기자본", value: "13.8억", helper: "LTV 58%", tone: "neutral" },
  { label: "최대 매입 가능가", value: "35.5억", helper: "현재가 대비 -2.5억", tone: "warn" },
]

function metricTone(tone: string) {
  if (tone === "good") return "border-emerald-200 bg-emerald-50 text-emerald-950"
  if (tone === "warn") return "border-amber-200 bg-amber-50 text-amber-950"
  return "border-slate-200 bg-white text-slate-950"
}

function scoreBar(value: number) {
  return { width: `${Math.max(8, Math.min(100, value * 7))}%` }
}

export default function AnalysisMockupPage() {
  const [mode, setMode] = useState<ViewMode>("quick")
  const activeCandidate = candidates[0]

  const activeTitle = useMemo(() => {
    if (mode === "compare") return "비교 보드"
    if (mode === "report") return "보고서 데스크"
    return "Quick Simulation"
  }, [mode])

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex min-h-14 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-slate-950 text-xs font-black text-white">
              BM
            </div>
            <div>
              <p className="text-sm font-black tracking-wide">BUILDMORE</p>
              <p className="hidden text-xs text-slate-500 sm:block">AI Deal Underwriting Workspace</p>
            </div>
          </div>
          <div className="hidden items-center rounded-md border border-slate-200 bg-slate-50 p-1 md:flex">
            {[
              ["quick", "Quick"],
              ["compare", "Compare"],
              ["report", "Report"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={cn(
                  "h-8 rounded px-3 text-xs font-semibold text-slate-500",
                  mode === key && "bg-white text-slate-950 shadow-sm",
                )}
                onClick={() => setMode(key as ViewMode)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex">
              <Eye className="size-4" />
              투자자 미리보기
            </Button>
            <Button size="sm">
              <Plus className="size-4" />
              후보 추가
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 border-t border-slate-200 md:hidden">
          {[
            ["quick", "Quick"],
            ["compare", "비교"],
            ["report", "보고서"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={cn(
                "h-11 text-xs font-bold text-slate-500",
                mode === key && "border-b-2 border-slate-950 bg-white text-slate-950",
              )}
              onClick={() => setMode(key as ViewMode)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="grid gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">{activeTitle}</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              여러 후보 중 돈 되는 딜을 먼저 고릅니다.
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniStat label="저장 후보" value="5" />
            <MiniStat label="비교 중" value="3" />
            <MiniStat label="보고서 후보" value="2" />
            <MiniStat label="링크 열람" value="14" />
          </div>
        </div>
      </section>

      {mode === "quick" && <QuickSimulation activeCandidate={activeCandidate} />}
      {mode === "compare" && <ComparisonBoard />}
      {mode === "report" && <ReportDesk />}
    </main>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  )
}

function QuickSimulation({ activeCandidate }: { activeCandidate: (typeof candidates)[number] }) {
  return (
    <div className="grid gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-slate-700" />
            <h2 className="text-sm font-black">30초 Quick Simulation</h2>
          </div>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-bold text-slate-600">주소</span>
              <Input className="mt-1" value="서울 성동구 성수동2가 315-8" readOnly />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600">매입가</span>
              <div className="mt-1 flex rounded-md border border-slate-200 bg-white">
                <Input className="border-0 shadow-none" value="38.0" readOnly />
                <span className="flex items-center px-3 text-sm font-bold text-slate-500">억원</span>
              </div>
            </label>
            <div>
              <span className="text-xs font-bold text-slate-600">방향</span>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <Button className="h-10">비주거</Button>
                <Button variant="outline" className="h-10">주거</Button>
              </div>
            </div>
            <Button className="h-11 w-full">
              분석 실행
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-black">자동 조회값</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              ["대지면적", "142m²"],
              ["연면적", "420m²"],
              ["용도지역", "2종일반"],
              ["준공", "2001년"],
              ["상권", "성수 업무권"],
              ["공실률", "20%"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-slate-50 p-3">
                <p className="text-[11px] font-medium text-slate-500">{label}</p>
                <p className="mt-1 text-sm font-black">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <div className="space-y-4">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric) => (
            <div key={metric.label} className={cn("rounded-lg border p-4 shadow-sm", metricTone(metric.tone))}>
              <p className="text-xs font-bold opacity-70">{metric.label}</p>
              <p className="mt-2 text-3xl font-black tracking-tight">{metric.value}</p>
              <p className="mt-1 text-xs font-semibold opacity-80">{metric.helper}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge variant="outline">1순위 후보</Badge>
                <h2 className="mt-2 text-2xl font-black">성수동 후보 A</h2>
                <p className="mt-1 text-sm text-slate-500">{activeCandidate.address}</p>
              </div>
              <div className="rounded-md bg-slate-950 px-4 py-3 text-right text-white">
                <p className="text-[11px] font-bold text-slate-300">BuildMore 판단</p>
                <p className="text-lg font-black">가격협상 후 매수</p>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-950">현재 38.0억은 수익률 기준보다 2.5억 높습니다.</p>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                리모델링 후 근린생활시설 임대 전략이 가장 유리합니다. 단, DSCR은 낮아 매입가 협상 또는
                보증금 구조 조정이 먼저 필요합니다.
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {scenarioRows.map((row) => (
                <div key={row.name} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-black">{row.name}</p>
                    <Badge className={cn(row.verdict === "추천" ? "bg-emerald-600" : "bg-slate-600")}>{row.verdict}</Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    <ScenarioLine label="자기자본수익률" value={row.roe} strong />
                    <ScenarioLine label="공사비" value={row.cost} />
                    <ScenarioLine label="공사기간" value={row.months} />
                    <ScenarioLine label="NOI 개선" value={row.noi} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-black">지도와 상권 신호</h3>
              <div className="mt-3 aspect-[4/3] rounded-md border border-slate-200 bg-[linear-gradient(135deg,#eef2f7_25%,#ffffff_25%,#ffffff_50%,#eef2f7_50%,#eef2f7_75%,#ffffff_75%)] bg-[length:24px_24px] p-4">
                <div className="flex h-full items-center justify-center">
                  <div className="rounded-full bg-slate-950 p-3 text-white shadow-lg">
                    <MapPin className="size-5" />
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <Signal label="상권 성장성" value="상위 18%" good />
                <Signal label="주거 배후" value="안정" good />
                <Signal label="도로 리스크" value="4m 도로폭" />
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-black">다음 액션</h3>
              <div className="mt-3 grid gap-2">
                <Button className="justify-between">
                  후보 저장
                  <Plus className="size-4" />
                </Button>
                <Button variant="outline" className="justify-between">
                  비교 보드에 추가
                  <BarChart3 className="size-4" />
                </Button>
                <Button variant="outline" className="justify-between">
                  투자자용 보고서 만들기
                  <FileText className="size-4" />
                </Button>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  )
}

function ScenarioLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className={cn("text-sm font-bold", strong && "text-base text-emerald-700")}>{value}</span>
    </div>
  )
}

function Signal({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className={cn("text-xs font-black", good ? "text-emerald-700" : "text-amber-700")}>{value}</span>
    </div>
  )
}

function ComparisonBoard() {
  return (
    <div className="space-y-4 px-4 py-4 sm:px-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">이번 주 후보 3건 비교</h2>
            <p className="mt-1 text-sm text-slate-500">자기자본수익률 기준으로 먼저 정렬하고, 리스크와 협상 여지를 함께 봅니다.</p>
          </div>
          <Button>
            3건 비교 리포트 요청
            <FileText className="size-4" />
          </Button>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {candidates.map((candidate) => (
          <article
            key={candidate.id}
            className={cn(
              "rounded-lg border bg-white p-4 shadow-sm",
              candidate.rank === 1 ? "border-slate-950" : "border-slate-200",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge className={cn(candidate.rank === 1 ? "bg-slate-950" : "bg-slate-600")}>#{candidate.rank}</Badge>
                <h3 className="mt-3 text-lg font-black">{candidate.area} 후보 {candidate.id}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{candidate.address}</p>
              </div>
              {candidate.rank === 1 ? <Check className="size-5 text-emerald-600" /> : null}
            </div>
            <div className="mt-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500">자기자본수익률</p>
                  <p className="text-3xl font-black">{candidate.roe}%</p>
                </div>
                <p className="text-sm font-black text-slate-500">{candidate.price}</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-slate-950" style={scoreBar(candidate.roe)} />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <BoardStat label="예상 순이익" value={candidate.profit} />
              <BoardStat label="필요 자기자본" value={candidate.equity} />
              <BoardStat label="최대 매입가" value={candidate.maxPrice} />
              <BoardStat label="리스크" value={candidate.risk} />
            </div>
            <div className="mt-4 rounded-md bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-500">추천 시나리오</p>
              <p className="mt-1 text-sm font-black">{candidate.scenario}</p>
              <p className="mt-2 text-xs font-bold text-amber-700">{candidate.signal}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid min-w-[780px] grid-cols-[1.2fr_repeat(6,1fr)] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-500">
            <span>후보</span>
            <span>ROE</span>
            <span>순이익</span>
            <span>자기자본</span>
            <span>공사비</span>
            <span>최대가</span>
            <span>판단</span>
          </div>
          <div className="overflow-x-auto">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="grid min-w-[780px] grid-cols-[1.2fr_repeat(6,1fr)] items-center border-b border-slate-100 px-4 py-4 text-sm last:border-0">
                <span className="font-black">{candidate.area} {candidate.id}</span>
                <span className="font-black text-emerald-700">{candidate.roe}%</span>
                <span>{candidate.profit}</span>
                <span>{candidate.equity}</span>
                <span>{candidate.id === "A" ? "5.4억" : candidate.id === "B" ? "9.8억" : "18.6억"}</span>
                <span>{candidate.maxPrice}</span>
                <span className="font-bold">{candidate.signal}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-black">최종 추천</h3>
          <p className="mt-3 text-2xl font-black">1순위 성수동 A</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            ROE가 가장 높고 상권 성장성이 강합니다. 단, 현재 매입가는 높으므로 35.5억 이하 협상에 실패하면 합정동 B가 더 안정적인 대안입니다.
          </p>
          <div className="mt-4 space-y-2">
            <DecisionLine icon={<WalletCards className="size-4" />} text="35.5억 이하 협상" />
            <DecisionLine icon={<Landmark className="size-4" />} text="보증금 상향 구조 검토" />
            <DecisionLine icon={<ShieldAlert className="size-4" />} text="도로폭 리스크 확인" />
          </div>
        </aside>
      </section>
    </div>
  )
}

function BoardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  )
}

function DecisionLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm font-bold">
      {icon}
      <span>{text}</span>
    </div>
  )
}

function ReportDesk() {
  return (
    <div className="grid gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[1fr_420px]">
      <section className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge variant="outline">Investor Report</Badge>
              <h2 className="mt-3 text-2xl font-black">투자자 발송용 보고서</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                중개사가 바로 보낼 수 있도록 숫자, 판단, 리스크, 협상 포인트를 한 장 흐름으로 정리합니다.
              </p>
            </div>
            <Button>
              <Share2 className="size-4" />
              공유 링크 생성
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-bold text-slate-500">BUILDMORE DEAL MEMO</p>
              <h3 className="mt-1 text-xl font-black">성수동 후보 A 매입 검토</h3>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500">핵심 결론</p>
              <p className="text-lg font-black text-amber-700">가격협상 후 매수</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <MemoMetric label="ROE" value="11.3%" good />
            <MemoMetric label="순이익" value="4.2억" good />
            <MemoMetric label="필요자본" value="13.8억" />
            <MemoMetric label="협상가" value="35.5억" warn />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <MemoBlock
              icon={<Building2 className="size-4" />}
              title="추천 개발 방향"
              body="리모델링 후 근린생활시설 임대 전략이 가장 높은 자기자본수익률을 만듭니다."
            />
            <MemoBlock
              icon={<Layers3 className="size-4" />}
              title="가격협상 근거"
              body="현재 매입가 38.0억은 목표 ROE 기준보다 2.5억 높아 35.5억 이하 협상이 필요합니다."
            />
            <MemoBlock
              icon={<ShieldAlert className="size-4" />}
              title="주요 리스크"
              body="DSCR이 낮고 도로폭 조건이 제한적입니다. 금융구조와 인허가 검토를 먼저 확인해야 합니다."
            />
            <MemoBlock
              icon={<ClipboardList className="size-4" />}
              title="다음 액션"
              body="보증금 상향, 월세 1,109만원 이상 확보 가능성, 매입가 조정 여지를 순서대로 확인합니다."
            />
          </div>

          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black text-slate-500">워터마크</p>
            <p className="mt-1 text-sm font-bold">Generated by BUILDMORE - 여러 매물 중, 진짜 돈 되는 딜만 골라드립니다.</p>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-black">공유 링크 피드백</h3>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniStat label="열람" value="14" />
            <MiniStat label="재열람" value="6" />
            <MiniStat label="문의" value="2" />
          </div>
          <div className="mt-4 space-y-3">
            <FeedbackItem name="김OO 투자자" action="보고서 3회 열람" hot />
            <FeedbackItem name="박OO 대표" action="협상가 섹션 공유" />
            <FeedbackItem name="이OO 투자자" action="전문가 검토 클릭" hot />
          </div>
        </section>

        <section className="rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <h3 className="text-sm font-black text-orange-950">유료 전환</h3>
          <p className="mt-2 text-sm leading-6 text-orange-900">
            이 후보는 단건 브리핑보다 3건 비교분석 리포트로 전환시키는 편이 적합합니다.
          </p>
          <div className="mt-4 grid gap-2">
            <Button className="bg-orange-600 hover:bg-orange-700">
              3건 비교 리포트 만들기
              <ArrowUpRight className="size-4" />
            </Button>
            <Button variant="outline" className="border-orange-300 bg-white">
              전문가 검토 요청
              <MessageSquareText className="size-4" />
            </Button>
          </div>
        </section>
      </aside>
    </div>
  )
}

function MemoMetric({ label, value, good = false, warn = false }: { label: string; value: string; good?: boolean; warn?: boolean }) {
  return (
    <div className={cn("rounded-md border p-3", good && "border-emerald-200 bg-emerald-50", warn && "border-amber-200 bg-amber-50")}>
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  )
}

function MemoBlock({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="text-sm font-black">{title}</h4>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  )
}

function FeedbackItem({ name, action, hot = false }: { name: string; action: string; hot?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
      <div>
        <p className="text-sm font-black">{name}</p>
        <p className="text-xs text-slate-500">{action}</p>
      </div>
      <Badge className={cn(hot ? "bg-red-600" : "bg-slate-600")}>{hot ? "hot" : "view"}</Badge>
    </div>
  )
}
