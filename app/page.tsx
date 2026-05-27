"use client"

import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  Check,
  ChevronRight,
  Database,
  FileText,
  LineChart,
  MapPin,
  Menu,
  Radar,
  Scale,
  Search,
  Sparkles,
  WalletCards,
  X,
  Zap,
} from "lucide-react"
import { ComponentType, ReactNode, useEffect, useMemo, useRef, useState } from "react"

type Icon = ComponentType<{ className?: string }>

const demoSummaries: Array<{ title: string; value: string; desc: string; icon: Icon }> = [
  {
    title: "Scenario",
    value: "리모델링·증축·신축",
    desc: "한 주소의 세 가지 전략",
    icon: Calculator,
  },
  {
    title: "Max Bid",
    value: "42.5억",
    desc: "수익 기준 매입 상한가",
    icon: LineChart,
  },
  {
    title: "Risk Map",
    value: "중간",
    desc: "인허가·공사·금융 리스크",
    icon: Radar,
  },
]

const coreValues: Array<{ title: string; subtitle: string; desc: string; icon: Icon; chips: string[] }> = [
  {
    title: "Decision Coverage",
    subtitle: "매입·개발·금융·리스크·리포트",
    desc: "토지·건물·실거래·임대·상권·금융·법규를 한 화면에 결합합니다. 부분 정보가 아닌 의사결정 전 과정입니다.",
    icon: MapPin,
    chips: ["매입 판단", "금융 구조", "실행 리포트"],
  },
  {
    title: "Scenario Intelligence",
    subtitle: "리모델링·증축·신축 비교",
    desc: "추천 용도, 공사비, 공사 기간, NOI, 자기자본 ROE를 같은 기준으로 비교합니다. 가장 수익성 있는 전략을 찾습니다.",
    icon: Calculator,
    chips: ["리모델링", "증축", "신축"],
  },
  {
    title: "Data Compounding",
    subtitle: "쌓일수록 정교한 판단",
    desc: "공공데이터·실거래·상권·정책 자료를 LLM Wiki와 Delta Engine으로 누적합니다. 같은 질문에 더 나은 답을 만듭니다.",
    icon: Database,
    chips: ["LLM Wiki", "Delta Engine", "유사 사례"],
  },
  {
    title: "Execution-Ready Output",
    subtitle: "바로 쓰는 실행 산출물",
    desc: "투자자 카드, 후보 비교 보드, 심층 PDF, 전문가 검토까지 연결합니다. 분석 이후의 실행까지 이어집니다.",
    icon: FileText,
    chips: ["공유 카드", "PDF", "전문가 검토"],
  },
]

const workflow = [
  ["01", "매물 입력", "주소·매입가·개발 방향만 넣으면 토지·건물 기본 정보가 채워집니다."],
  ["02", "데이터 결합", "실거래·임대·상권·금리·법규·뉴스가 주소 기준으로 정리됩니다."],
  ["03", "시나리오 계산", "리모델링·증축·신축별 공사비, NOI, ROE, 최대 매입가, 리스크를 산출합니다."],
  ["04", "비교와 리포트", "후보를 저장·비교하고 투자자용·투심용·전문가 검토용 리포트로 전환합니다."],
]

const scenarioRows = [
  ["추천 용도", "F&B + 근생", "근생 + 오피스", "근생 + 주거"],
  ["공사비", "8억", "18억", "42억"],
  ["공사 기간", "4개월", "10개월", "22개월"],
  ["안정 NOI", "2.8억", "4.1억", "6.5억"],
  ["자기자본 ROE", "18.4%", "14.2%", "11.8%"],
  ["인허가 난이도", "낮음", "중간", "높음"],
]

const targetUsers: Array<{ title: string; desc: string; icon: Icon }> = [
  {
    title: "중개사",
    desc: "투자자에게 보낼 분석 카드와 비교 리포트. 상담 속도와 신뢰를 높이고, 왜 이 매물인지 숫자로 설명합니다.",
    icon: Search,
  },
  {
    title: "꼬마빌딩 투자자·자산가",
    desc: "어떤 매물이 돈이 되는지, 얼마까지 사도 되는지, 어떤 리스크가 큰지 같은 기준으로 비교합니다.",
    icon: WalletCards,
  },
  {
    title: "소형 개발사·시행사",
    desc: "용도 변경, 리모델링, 증축, 신축 가능성을 수익성·공사비·인허가 리스크와 함께 검토합니다.",
    icon: Scale,
  },
]

const dataSources = [
  ["국토부 실거래", "매입가 비교 기준"],
  ["상권·유동인구", "임대수익 맥락"],
  ["금리·금융", "대출 조건과 상환 부담"],
  ["법규·용도지역", "인허가 리스크"],
  ["뉴스·정책", "시장 신호와 타이밍"],
  ["LLM Wiki", "누적 판단 근거"],
  ["PostgreSQL", "데이터 코어"],
  ["pgvector", "유사 사례 검색"],
]

const pricingPlans = [
  [
    "Quick Simulation",
    "주소 기반 빠른 스크리닝",
    "무료/저가",
    ["추천 용도·공사 방향", "매입 상한가·ROE 요약", "핵심 리스크 요약"],
  ],
  [
    "Comparison Board",
    "후보 비교와 우선순위",
    "월 구독",
    ["후보 매물 ROE 랭킹", "최대 매입가 비교", "투자자 공유 카드", "후보 메모·피드백 관리"],
  ],
  [
    "Report & Expert",
    "실행 단계용 리포트",
    "건별/프리미엄",
    ["심층 투자자 리포트", "3~5개 후보 비교 보고서", "개발 타당성·인허가 검토", "전문가 자문 연결"],
  ],
]

function AnimatedSection({
  children,
  className = "",
  delay = 0,
  id,
}: {
  children: ReactNode
  className?: string
  delay?: number
  id?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: "-8% 0px -8% 0px", threshold: 0.15 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      id={id}
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  desc,
  center = false,
}: {
  eyebrow: string
  title: ReactNode
  desc?: string
  center?: boolean
}) {
  return (
    <AnimatedSection
      className={
        center
          ? "mx-auto mb-10 max-w-4xl px-4 text-center sm:px-6 lg:mb-14"
          : "mx-auto mb-10 grid max-w-7xl gap-5 px-4 sm:px-6 lg:mb-14 lg:grid-cols-[0.75fr_1.25fr]"
      }
    >
      <p className="text-lg font-semibold uppercase tracking-normal text-emerald-700 sm:text-xl">{eyebrow}</p>
      <div>
        <h2 className="text-3xl font-semibold leading-tight tracking-normal text-stone-950 sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {desc ? (
          <p className={`mt-5 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg ${center ? "mx-auto" : ""}`}>
            {desc}
          </p>
        ) : null}
      </div>
    </AnimatedSection>
  )
}

function DemoCard() {
  return (
    <div className="border border-stone-200 bg-white p-4 shadow-[0_30px_80px_rgba(28,25,23,0.08)] sm:p-5">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
          <span className="size-2 rounded-full bg-emerald-500" />
          매매·개발 시뮬레이션 미리보기
        </div>
        <span className="text-xs text-stone-400">성수동 후보 매물</span>
      </div>

      <div className="mt-5 border border-stone-200 bg-[#f7f7f2] p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-500">Deal Fit Score</p>
          <BadgeCheck className="size-5 text-emerald-700" />
        </div>
        <div className="mt-5 flex items-end gap-3">
          <span className="text-7xl font-semibold leading-none text-stone-950">84</span>
          <span className="pb-2 text-stone-500">/ 100</span>
        </div>
        <div className="mt-5 h-2 overflow-hidden bg-stone-200">
          <div className="h-full w-[84%] bg-emerald-600" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {demoSummaries.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-stone-500">{item.title}</p>
                <Icon className="size-4 text-stone-500" />
              </div>
              <p className="mt-3 text-lg font-semibold text-stone-950">{item.value}</p>
              <p className="mt-2 text-xs leading-5 text-stone-500">{item.desc}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-4 border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 size-4 shrink-0 text-emerald-700" />
          <p className="text-sm leading-6 text-emerald-950">
            1층 F&B·상층 근생 리모델링의 ROE가 가장 높습니다. 현 호가는 협상 여지가 있고, 주차·용도지역은
            인허가 사전검토 대상입니다.
          </p>
        </div>
      </div>
    </div>
  )
}

function DataMarquee({ reverse = false }: { reverse?: boolean }) {
  const items = useMemo(() => [...dataSources, ...dataSources], [])

  return (
    <div className="overflow-hidden border-y border-stone-200 bg-white">
      <div
        className={`flex w-max gap-3 py-3 ${
          reverse ? "animate-[marqueeReverse_34s_linear_infinite]" : "animate-[marquee_34s_linear_infinite]"
        }`}
      >
        {items.map(([name, type], index) => (
          <div
            key={`${name}-${index}`}
            className="flex h-16 w-56 shrink-0 items-center justify-between border border-stone-200 bg-[#f7f7f2] px-4"
          >
            <div>
              <p className="text-sm font-semibold text-stone-950">{name}</p>
              <p className="mt-1 text-xs text-stone-500">{type}</p>
            </div>
            <div className="grid size-8 place-items-center border border-stone-300 bg-white text-xs font-semibold text-emerald-700">
              {name.slice(0, 1)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [open, setOpen] = useState(false)

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f7f2] text-stone-950">
      <style jsx global>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes marqueeReverse {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-stone-200 bg-[#f7f7f2]/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold" aria-label="BuildMore 홈">
            <span className="grid size-8 place-items-center bg-stone-950 text-sm text-white">B</span>
            BuildMore
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-stone-600 md:flex">
            <a href="#core-value" className="hover:text-stone-950">
              핵심 가치
            </a>
            <a href="#workflow" className="hover:text-stone-950">
              Workflow
            </a>
            <a href="#scenario" className="hover:text-stone-950">
              Scenario
            </a>
            <a href="#pricing" className="hover:text-stone-950">
              Pricing
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="text-sm font-medium text-stone-600 hover:text-stone-950">
              로그인
            </Link>
            <Link
              href="/analysis"
              className="inline-flex h-10 items-center justify-center gap-2 bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800"
            >
              매물 분석 시작
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <button
            type="button"
            className="grid size-10 place-items-center border border-stone-300 bg-white md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-stone-200 bg-[#f7f7f2] px-4 py-4 md:hidden">
            <div className="grid gap-4 text-sm font-medium text-stone-700">
              <a href="#core-value" onClick={() => setOpen(false)}>
                핵심 가치
              </a>
              <a href="#workflow" onClick={() => setOpen(false)}>
                Workflow
              </a>
              <a href="#scenario" onClick={() => setOpen(false)}>
                Scenario
              </a>
              <Link
                href="/analysis"
                className="mt-1 inline-flex h-11 items-center justify-center bg-stone-950 px-4 text-white"
              >
                매물 분석 시작
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <section className="relative border-b border-stone-200">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:py-24">
          <AnimatedSection className="flex flex-col justify-center">
            <p className="mb-6 inline-flex w-fit items-center gap-2 border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-normal text-emerald-700">
              <Sparkles className="size-3.5" />
              AI Real Estate Deal Solution
            </p>
            <h1 className="max-w-4xl text-[2.75rem] font-semibold leading-[0.98] tracking-normal text-stone-950 sm:text-6xl lg:text-7xl">
              <span className="sm:hidden">
                주소 하나로,
                <br />
                매입부터 개발까지
                <br />
                실행 판단
                <br />
                끝.
              </span>
              <span className="hidden sm:inline">
                주소 하나로,
                <br />
                매입부터 개발까지 실행 판단 끝.
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-600">
              토지·건물·실거래·상권·금융·법규 데이터를 결합해 리모델링·증축·신축을 비교합니다.
              최대 매입가, ROE, 리스크, 리포트까지 한 번에 제공합니다.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/analysis"
                className="inline-flex h-12 items-center justify-center gap-2 bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-stone-800"
              >
                분석 시작
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#demo"
                className="inline-flex h-12 items-center justify-center gap-2 border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-950 hover:bg-stone-100"
              >
                샘플 리포트
                <ChevronRight className="size-4" />
              </a>
            </div>
          </AnimatedSection>

          <AnimatedSection id="demo" delay={160}>
            <DemoCard />
          </AnimatedSection>
        </div>
      </section>

      <section id="core-value" className="border-b border-stone-200 bg-white py-18 sm:py-24">
        <SectionHeading
          eyebrow="Core Value"
          title={
            <>
              정보보다 중요한 건,
              <br />
              의사결정 흐름.
            </>
          }
          desc="BuildMore는 매입 판단, 개발 시나리오, 금융 구조, 리스크, 리포트를 하나의 흐름으로 연결합니다."
        />
        <div className="mx-auto grid max-w-7xl border-l border-t border-stone-200 px-4 sm:px-6 md:grid-cols-2">
          {coreValues.map((item, index) => {
            const Icon = item.icon
            return (
              <AnimatedSection
                key={item.title}
                delay={index * 90}
                className="min-h-80 border-b border-r border-stone-200 bg-white p-5 sm:p-6"
              >
                <div className="flex items-center justify-start">
                  <Icon className="size-10 text-emerald-700 sm:size-11" />
                </div>
                <p className="mt-12 text-sm font-semibold uppercase text-emerald-700">{item.title}</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-normal text-stone-950 sm:text-3xl">
                  {item.subtitle}
                </h3>
                <p className="mt-4 max-w-xl leading-7 text-stone-600">{item.desc}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {item.chips.map((chip) => (
                    <span key={chip} className="border border-stone-200 bg-[#f7f7f2] px-3 py-1 text-xs text-stone-600">
                      {chip}
                    </span>
                  ))}
                </div>
              </AnimatedSection>
            )
          })}
        </div>
      </section>

      <section id="workflow" className="border-b border-stone-200 bg-[#f7f7f2] py-18 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[390px_1fr]">
          <AnimatedSection>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">Workflow</p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-normal text-stone-950 sm:text-4xl lg:text-5xl">
              주소 입력부터 실행 리포트까지.
            </h2>
            <p className="mt-5 leading-7 text-stone-600">
              입력은 짧게, 판단은 끝까지.
            </p>
          </AnimatedSection>

          <div className="grid gap-3">
            {workflow.map(([no, title, desc], index) => (
              <AnimatedSection key={no} delay={index * 90} className="group border border-stone-200 bg-white p-5">
                <div className="grid gap-4 sm:grid-cols-[80px_1fr_36px] sm:items-center">
                  <span className="text-3xl font-semibold text-stone-300 group-hover:text-emerald-700">{no}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-stone-950">{title}</h3>
                    <p className="mt-2 leading-7 text-stone-600">{desc}</p>
                  </div>
                  <ChevronRight className="hidden size-5 text-stone-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-700 sm:block" />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section id="scenario" className="border-b border-stone-200 bg-white py-18 sm:py-24">
        <SectionHeading
          center
          eyebrow="Scenario"
          title={
            <>
              하나의 매물,
              <br />
              세 가지 전략.
            </>
          }
          desc="같은 주소의 리모델링·증축·신축을 동시에 만들고, 가장 수익성 있는 방향을 비교합니다."
        />
        <AnimatedSection className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="overflow-x-auto border border-stone-200 bg-white">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead className="bg-[#f7f7f2]">
                <tr>
                  <th className="border-b border-r border-stone-200 p-4 text-sm font-semibold text-stone-500">비교 항목</th>
                  <th className="border-b border-r border-stone-200 p-4 text-lg font-semibold text-emerald-700">리모델링</th>
                  <th className="border-b border-r border-stone-200 p-4 text-lg font-semibold text-stone-950">증축</th>
                  <th className="border-b border-stone-200 p-4 text-lg font-semibold text-stone-950">신축</th>
                </tr>
              </thead>
              <tbody>
                {scenarioRows.map(([label, remodeling, extension, newBuild]) => (
                  <tr key={label}>
                    <th className="border-r border-t border-stone-200 p-4 text-sm font-semibold text-stone-500">{label}</th>
                    <td className="border-r border-t border-stone-200 p-4 font-semibold text-stone-950">{remodeling}</td>
                    <td className="border-r border-t border-stone-200 p-4 text-stone-700">{extension}</td>
                    <td className="border-t border-stone-200 p-4 text-stone-700">{newBuild}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 text-center text-sm leading-7 text-stone-500">
            용도지역, 건폐율·용적률, 주차 기준, 임대 시세, 공사비, 금융 조건을 함께 반영한 결과입니다.
          </p>
        </AnimatedSection>
      </section>

      <section className="border-b border-stone-200 py-18 sm:py-24">
        <SectionHeading
          center
          eyebrow="For"
          title={
            <>
              중개사·투자자·시행사,
              <br />
              같은 숫자, 같은 대화.
            </>
          }
          desc="매물 검토, 투자자 설명, 인허가·공사·금융 실행을 맡는 실무자를 위한 워크벤치입니다."
        />
        <div className="mx-auto grid max-w-7xl items-stretch gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:gap-8">
          {targetUsers.map((card, index) => {
            const Icon = card.icon
            return (
              <AnimatedSection key={card.title} delay={index * 110} className="border border-stone-200 bg-white p-6">
                <Icon className="size-8 text-emerald-700" />
                <h3 className="mt-14 text-2xl font-semibold text-stone-950">{card.title}</h3>
                <p className="mt-4 leading-7 text-stone-600">{card.desc}</p>
              </AnimatedSection>
            )
          })}
        </div>
      </section>

      <section className="border-b border-stone-200 bg-white py-18 sm:py-24">
        <SectionHeading
          eyebrow="Data Core"
          title={
            <>
              데이터에서,
              <br />
              판단 근거로.
            </>
          }
          desc="실거래·임대·상권·금리·법규·뉴스·정책 자료를 모으고, LLM Wiki와 Delta Engine으로 분석 카드와 리포트에 반영합니다."
        />
        <DataMarquee />
        <DataMarquee reverse />
      </section>

      <section id="pricing" className="border-b border-stone-200 py-18 sm:py-24">
        <SectionHeading
          eyebrow="Pricing"
          title="반복 분석은 가볍게, 큰 결정은 깊게."
          desc="빠른 시뮬레이션과 후보 저장에서 시작해 비교 리포트, 심층 리포트, 전문가 검토로 이어집니다."
        />
        <div className="mx-auto grid max-w-7xl items-stretch gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:gap-8">
          {pricingPlans.map(([name, sub, price, features], index) => (
            <AnimatedSection
              key={String(name)}
              delay={index * 100}
              className={`flex h-full flex-col border p-6 ${
                index === 1 ? "border-emerald-700 bg-white shadow-[0_24px_70px_rgba(4,120,87,0.14)]" : "border-stone-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-400">0{index + 1}</p>
                {index === 1 ? <span className="bg-emerald-700 px-2 py-1 text-xs font-semibold text-white">추천</span> : null}
              </div>
              <h3 className="mt-8 text-2xl font-semibold text-stone-950">{name}</h3>
              <p className="mt-1 text-stone-500">{sub}</p>
              <p className="mt-8 text-3xl font-semibold text-stone-950">{price}</p>
              <ul className="mb-8 mt-8 flex-1 space-y-3">
                {(features as string[]).map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-stone-600">
                    <Check className="size-4 shrink-0 text-emerald-700" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/analysis"
                className="mt-auto inline-flex h-11 w-full items-center justify-center bg-stone-950 text-sm font-semibold text-white hover:bg-stone-800"
              >
                시작하기
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-stone-950 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="grid h-full grid-cols-6 gap-px sm:grid-cols-10">
            {Array.from({ length: 60 }).map((_, index) => (
              <span key={index} className="border border-white/10" />
            ))}
          </div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <AnimatedSection className="mx-auto max-w-3xl text-center">
            <p className="mx-auto mb-5 inline-flex items-center gap-2 border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              <Zap className="size-3.5" />
              Build, compare, execute
            </p>
            <h2 className="text-4xl font-semibold leading-tight tracking-normal sm:text-6xl">
              더 많은 매물보다, 더 정확한 판단.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl leading-8 text-stone-300">
              주소를 입력해 첫 시뮬레이션을 시작하세요. 후보를 저장·비교하고 투자자·내부 투심용 리포트로 전환할 수 있습니다.
            </p>
            <div className="mt-9 flex justify-center">
              <Link
                href="/analysis"
                className="inline-flex h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-stone-950 hover:bg-stone-200"
              >
                첫 분석 시작
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <footer className="bg-stone-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 border-t border-white/10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-sm font-semibold">BuildMore</p>
            <p className="mt-3 max-w-none leading-7 text-stone-400 md:whitespace-nowrap">
              주소 하나로 매매·개발 의사결정을 끝내는 AI 솔루션
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-sm text-stone-400">
            <div>
              <p className="font-semibold text-white">서비스</p>
              <Link href="/analysis" className="mt-3 block hover:text-white">
                분석
              </Link>
              <Link href="/demo" className="mt-2 block hover:text-white">
                데모
              </Link>
            </div>
            <div>
              <p className="font-semibold text-white">제품</p>
              <a href="#core-value" className="mt-3 block hover:text-white">
                기능
              </a>
              <a href="#scenario" className="mt-2 block hover:text-white">
                시나리오
              </a>
            </div>
            <div>
              <p className="font-semibold text-white">회사</p>
              <Link href="/about" className="mt-3 block hover:text-white">
                소개
              </Link>
              <Link href="/login" className="mt-2 block hover:text-white">
                로그인
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
