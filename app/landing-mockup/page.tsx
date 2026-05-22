"use client"

import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileBarChart2,
  Landmark,
  LineChart,
  MapPinned,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react"

const proofStats = [
  { label: "Bankability", value: "72", unit: "/100", note: "조건부 검토 가능" },
  { label: "예상 LTV", value: "55", unit: "%", note: "담보 여력 기준" },
  { label: "DSCR", value: "1.21", unit: "x", note: "상환 가능성 주의" },
]

const valueCards = [
  {
    icon: Landmark,
    eyebrow: "Pre-underwriting",
    title: "은행이 먼저 볼 숫자로 딜을 번역합니다",
    body: "매입가, 임대료, 금리, 보증금, 필요 자기자본을 연결해 대출 가능성과 심사 리스크를 한 화면에서 판단합니다.",
  },
  {
    icon: MapPinned,
    eyebrow: "Local evidence",
    title: "입지와 실거래를 금융 판단의 근거로 붙입니다",
    body: "주변 실거래, 상권, 개발 인허가, 교통 접근성 데이터를 비교해 가격 협상과 담보 설명에 쓸 수 있는 근거를 정리합니다.",
  },
  {
    icon: FileBarChart2,
    eyebrow: "Memo ready",
    title: "투자심의와 은행 제출용 메모까지 이어집니다",
    body: "점수에서 끝나지 않고, 리스크 보완 항목과 다음 실행 액션을 리포트 문장으로 바꿔 의사결정 시간을 줄입니다.",
  },
]

const dataSignals = [
  "국토부 실거래",
  "서울 열린데이터",
  "상권/유동인구",
  "개발 인허가",
  "금리/거시 지표",
  "정책/뉴스/RSS",
  "Kakao/VWorld 주소 보강",
  "LLM Wiki + Delta Engine",
]

const workflow = [
  { step: "01", title: "딜 입력", text: "주소, 매입가, 임대 조건, 예상 공사비를 입력합니다." },
  { step: "02", title: "근거 수집", text: "공공 데이터와 주변 거래를 붙여 딜의 현재 위치를 확인합니다." },
  { step: "03", title: "금융 해석", text: "LTV, NOI, DSCR, 자기자본, 월 이자 부담을 계산합니다." },
  { step: "04", title: "실행 메모", text: "은행 협의 전 보완할 조건과 협상 포인트를 뽑습니다." },
]

const reportRows = [
  ["대출 가능성", "조건부 검토 가능", "임대 근거 보강 후 1금융 사전 협의"],
  ["가격 판단", "협상 필요", "현재 호가 대비 2.5억 낮은 가격부터 검토"],
  ["운영 리스크", "중간", "공실률 20%와 용도 조건 확인 필요"],
  ["다음 액션", "3개", "임대차 증빙, 건축물대장, 금융기관 티저 메모"],
]

export default function LandingMockupPage() {
  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[#101820]">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f6f4ef]/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-[#101820] text-white">
              <Landmark className="size-5" />
            </div>
            <div>
              <p className="text-sm font-black tracking-[0.18em]">BUILDMORE</p>
              <p className="hidden text-xs font-semibold text-[#667085] sm:block">Deal Underwriting AI</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#475467] md:flex">
            <a href="#value" className="hover:text-[#101820]">핵심 가치</a>
            <a href="#system" className="hover:text-[#101820]">데이터 엔진</a>
            <a href="#memo" className="hover:text-[#101820]">리포트</a>
          </nav>
          <Link
            href="/analysis"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#101820] px-4 text-sm font-bold text-white transition hover:bg-[#243142]"
          >
            딜 분석 시작
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-black/10 bg-[#101820] text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=85"
            alt="도심 상업용 빌딩 전경"
            className="h-full w-full object-cover opacity-36"
          />
          <div className="absolute inset-0 bg-[#101820]/72" />
        </div>
        <div className="relative mx-auto grid min-h-[580px] max-w-7xl gap-10 px-4 pb-10 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/82">
              <Sparkles className="size-3.5" />
              은행 심사 전에 보는 AI 딜 메모
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              이 빌딩, 은행이 대출해줄 수 있을까?
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">
              BuildMore는 매물의 분위기가 아니라 금융 실행 가능성을 봅니다. LTV, NOI, DSCR, 필요 자기자본,
              월 이자 부담, 개발/법규 리스크를 연결해 딜의 다음 액션까지 제안합니다.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/analysis"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-black text-[#101820] transition hover:bg-[#e8edf2]"
              >
                무료로 딜 체크하기
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#memo"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/25 px-5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                샘플 메모 보기
                <FileBarChart2 className="size-4" />
              </a>
            </div>
          </div>

          <div className="flex items-center lg:justify-end">
            <div className="w-full max-w-[560px] overflow-hidden rounded-lg border border-white/18 bg-white text-[#101820] shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/10 bg-[#f8fafc] px-5 py-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#667085]">Deal Readiness Memo</p>
                  <p className="mt-1 text-sm font-bold">마포구 합정동 근린생활시설</p>
                </div>
                <span className="rounded-full bg-[#e9f8ef] px-3 py-1 text-xs font-black text-[#087443]">검토 가능</span>
              </div>
              <div className="grid gap-0 sm:grid-cols-3">
                {proofStats.map((stat) => (
                  <div key={stat.label} className="border-b border-r border-black/10 p-5 last:border-r-0 sm:border-b-0">
                    <p className="text-xs font-bold text-[#667085]">{stat.label}</p>
                    <p className="mt-2 text-4xl font-black tracking-tight">
                      {stat.value}
                      <span className="text-base font-bold text-[#667085]">{stat.unit}</span>
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[#475467]">{stat.note}</p>
                  </div>
                ))}
              </div>
              <div className="grid border-t border-black/10 lg:grid-cols-[1fr_0.82fr]">
                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#667085]">Underwriting signals</p>
                  <div className="mt-4 space-y-3">
                    <Signal label="NOI" value="2.1억" score="안정" />
                    <Signal label="월 이자 부담" value="1,850만" score="주의" warn />
                    <Signal label="필요 자기자본" value="18.5억" score="보강" warn />
                  </div>
                </div>
                <div className="border-t border-black/10 bg-[#fff7ed] p-5 lg:border-l lg:border-t-0">
                  <TriangleAlert className="size-5 text-[#b45309]" />
                  <p className="mt-3 text-sm font-black">은행 협의 전 보완 항목</p>
                  <p className="mt-2 text-sm leading-6 text-[#7c2d12]">
                    임대차 근거와 주차/용도 조건 확인 후 금융기관 티저 메모로 전환하는 것이 적합합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="value" className="border-b border-black/10 bg-white pb-20 pt-8 lg:pb-24 lg:pt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#b45309]">What We Do</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                매물을 사도 되는지보다, 실행 가능한 딜인지 먼저 봅니다.
              </h2>
            </div>
            <p className="text-base leading-8 text-[#475467] lg:text-lg">
              좋은 입지와 좋은 가격만으로는 대출, 투자심의, 내부 의사결정이 통과되지 않습니다. BuildMore는
              딜을 금융기관이 이해하는 언어로 정리해 매수 전 판단 속도를 높입니다.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {valueCards.map((item) => (
              <article key={item.title} className="rounded-lg border border-black/10 bg-[#fbfaf7] p-6">
                <item.icon className="size-7 text-[#b45309]" />
                <p className="mt-7 text-xs font-black uppercase tracking-[0.16em] text-[#667085]">{item.eyebrow}</p>
                <h3 className="mt-3 text-xl font-black leading-7">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#475467]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div className="overflow-hidden rounded-lg">
            <img
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=85"
              alt="분석 자료를 검토하는 금융 전문가"
              className="h-full min-h-[420px] w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#b45309]">Why Now</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              소형 빌딩 딜은 감보다 숫자, 숫자보다 근거가 중요해졌습니다.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#475467]">
              금리, 담보 인정, 임대 안정성, 개발 제한이 동시에 움직이는 시장에서는 “좋아 보이는 매물”과
              “은행이 받아들일 수 있는 딜” 사이의 간격이 커집니다.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                ["감정가 의존", "주변 거래와 임대 근거로 보정"],
                ["단일 수익률", "NOI와 DSCR로 상환력 확인"],
                ["리스크 메모 부재", "법규/개발/상권 리스크를 항목화"],
                ["다음 액션 불명확", "은행 협의 전 체크리스트 생성"],
              ].map(([bad, good]) => (
                <div key={bad} className="rounded-md border border-black/10 bg-white p-4">
                  <p className="text-xs font-bold text-[#667085]">{bad}</p>
                  <p className="mt-2 text-sm font-black">{good}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="system" className="border-b border-black/10 bg-[#101820] py-20 text-white lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#fbbf24]">Data Engine</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                데이터는 모으고, Wiki는 기억하고, Delta Engine은 변화를 잡습니다.
              </h2>
              <p className="mt-5 text-base leading-8 text-white/72">
                BuildMore의 분석은 한 번 만든 리포트가 아니라 계속 갱신되는 지식 레이어 위에서 움직입니다.
                정책, 실거래, 상권, 개발 신호가 바뀌면 딜 판단도 함께 바뀌어야 합니다.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {dataSignals.map((signal) => (
                <div key={signal} className="flex items-center gap-3 rounded-md border border-white/12 bg-white/8 px-4 py-3">
                  <BadgeCheck className="size-4 text-[#fbbf24]" />
                  <span className="text-sm font-bold text-white/86">{signal}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-4">
            {workflow.map((item, index) => (
              <article key={item.step} className="relative rounded-lg border border-white/12 bg-white/8 p-5">
                <p className="text-xs font-black text-[#fbbf24]">{item.step}</p>
                <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/68">{item.text}</p>
                {index < workflow.length - 1 && (
                  <ChevronRight className="absolute -right-3 top-1/2 hidden size-6 -translate-y-1/2 text-white/30 md:block" />
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="memo" className="border-b border-black/10 bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#b45309]">Sample Output</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                사람을 설득하는 결과물은 점수보다 판단 근거입니다.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#475467]">
                BuildMore의 목표는 예쁜 대시보드가 아니라 은행 담당자, 투자자, 내부 투자심의가 바로 읽을 수 있는
                실행 메모입니다.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  [ShieldCheck, "리스크 보완"],
                  [BarChart3, "금융 시나리오"],
                  [ClipboardCheck, "실행 체크리스트"],
                  [LineChart, "주변 비교 근거"],
                ].map(([Icon, label]) => (
                  <div key={label as string} className="flex items-center gap-3 rounded-md bg-[#f6f4ef] p-4">
                    <Icon className="size-5 text-[#b45309]" />
                    <span className="text-sm font-black">{label as string}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-black/10 bg-[#fbfaf7]">
              <div className="border-b border-black/10 bg-white px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#667085]">BuildMore Deal Memo</p>
                <h3 className="mt-2 text-xl font-black">합정동 42억 매입 검토</h3>
              </div>
              <div className="divide-y divide-black/10">
                {reportRows.map(([label, value, note]) => (
                  <div key={label} className="grid gap-2 px-5 py-4 sm:grid-cols-[0.8fr_0.9fr_1.3fr] sm:items-center">
                    <p className="text-xs font-bold text-[#667085]">{label}</p>
                    <p className="text-sm font-black">{value}</p>
                    <p className="text-sm leading-6 text-[#475467]">{note}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#101820] p-5 text-white">
                <p className="text-sm font-black">권장 결론</p>
                <p className="mt-2 text-sm leading-7 text-white/74">
                  현 호가 기준 즉시 매수보다 임대차 근거 보강과 가격 조정 협상이 선행되어야 합니다.
                  보완 자료 확보 시 1금융 사전 협의용 티저 메모로 전환 가능합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f4ef] py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#b45309]">For Deal Makers</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              중개사, 투자자, 시행 검토자 모두가 같은 근거를 보고 움직이게 합니다.
            </h2>
          </div>
          <div className="grid gap-3">
            {[
              "매수 전 3분 안에 대출 가능성의 윤곽을 확인",
              "좋은 매물의 강점과 약점을 금융 언어로 설명",
              "은행 제출 전 보완 자료와 협상 포인트 정리",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-md border border-black/10 bg-white p-4">
                <CheckCircle2 className="mt-0.5 size-5 text-[#087443]" />
                <p className="text-sm font-bold leading-6">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#101820] text-white">
        <img
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2200&q=85"
          alt="전문가들이 회의하는 사무실"
          className="absolute inset-0 h-full w-full object-cover opacity-24"
        />
        <div className="absolute inset-0 bg-[#101820]/78" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-24">
          <Building2 className="mx-auto size-9 text-[#fbbf24]" />
          <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
            매입 전에, 먼저 금융 실행 가능성을 확인하세요.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/74">
            BuildMore는 부동산 딜을 은행, 투자자, 내부 의사결정자가 이해할 수 있는 실행 가능한 언어로 바꿉니다.
          </p>
          <Link
            href="/analysis"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-black text-[#101820] transition hover:bg-[#e8edf2]"
          >
            첫 딜 체크하기
            <Banknote className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}

function Signal({ label, value, score, warn = false }: { label: string; value: string; score: string; warn?: boolean }) {
  return (
    <div className="grid grid-cols-[0.7fr_0.8fr_auto] items-center gap-3 rounded-md bg-[#f8fafc] px-3 py-3">
      <span className="text-xs font-bold text-[#667085]">{label}</span>
      <span className="text-sm font-black">{value}</span>
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${warn ? "bg-[#fff7ed] text-[#b45309]" : "bg-[#e9f8ef] text-[#087443]"}`}>
        {score}
      </span>
    </div>
  )
}
