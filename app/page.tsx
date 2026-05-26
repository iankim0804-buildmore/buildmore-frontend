"use client"

import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Calculator,
  Check,
  ChevronRight,
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

const metrics = [
  { value: "Top 3", label: "추천 개발·운영 시나리오", note: "용도와 공사 방향 자동 비교" },
  { value: "ROE", label: "자기자본 수익률 랭킹", note: "후보 매물 간 우선순위 판단" },
  { value: "Max", label: "역산 매입 가능가", note: "수익·금융 기준 가격 협상선" },
  { value: "Risk", label: "인허가·공사·금융 리스크", note: "실행 전 확인해야 할 변수" },
]

const capabilities: Array<{ no: string; title: string; desc: string; icon: Icon; chips: string[] }> = [
  {
    no: "01",
    title: "주소 하나로 매물의 실행 그림을 만듭니다",
    desc: "주소와 매입가를 기준으로 토지·건물, 실거래, 상권, 임대, 금융, 법규 데이터를 한 번에 연결합니다.",
    icon: MapPin,
    chips: ["주소 검색", "건축물대장", "실거래"],
  },
  {
    no: "02",
    title: "매매·리모델링·증축·신축 시나리오를 비교합니다",
    desc: "주거·비주거 방향, 추천 용도, 공사 방식, 공사비, 기간, NOI 개선폭을 묶어 후보별 실행성을 계산합니다.",
    icon: Calculator,
    chips: ["리모델링", "증축", "신축"],
  },
  {
    no: "03",
    title: "여러 매물을 저장하고 수익성 순서로 비교합니다",
    desc: "ROE, 필요 자기자본, 최대 매입가, 임대수익, 개발 리스크를 같은 기준으로 비교해 우선순위를 잡습니다.",
    icon: BarChart3,
    chips: ["후보 저장", "ROE 랭킹", "가격협상"],
  },
  {
    no: "04",
    title: "투자자와 시행 의사결정에 쓸 리포트로 바꿉니다",
    desc: "중개사가 투자자에게 보내고, 개발사가 내부 검토에 쓰고, 전문가에게 넘길 수 있는 리포트 구조로 정리합니다.",
    icon: FileText,
    chips: ["공유 링크", "PDF", "전문가 검토"],
  },
]

const riskCards: Array<{ title: string; desc: string; icon: Icon }> = [
  {
    title: "중개사",
    desc: "투자자에게 보낼 수 있는 매물 분석 카드와 리포트로 상담 속도와 신뢰도를 높입니다.",
    icon: Search,
  },
  {
    title: "꼬마빌딩 투자자",
    desc: "여러 후보 중 어떤 매물이 돈이 되는지, 얼마까지 사도 되는지, 어떤 리스크가 큰지 비교합니다.",
    icon: WalletCards,
  },
  {
    title: "소형 개발·시행사",
    desc: "용도 변경, 리모델링, 증축, 신축 가능성을 수익성과 인허가 리스크까지 묶어 검토합니다.",
    icon: Scale,
  },
]

const process = [
  ["01", "매물 입력", "주소, 매입가, 주거·비주거 방향만 넣으면 기본 토지·건물 정보를 자동으로 채웁니다."],
  ["02", "데이터 가공", "실거래, 임대, 상권, 유동인구, 금리, 법규, 뉴스·정책 자료를 DB와 Wiki 구조로 정리합니다."],
  ["03", "시나리오 계산", "리모델링·증축·신축, 추천 용도, 공사비, NOI, ROE, 최대 매입가, 금융 리스크를 계산합니다."],
  ["04", "비교와 리포트", "후보를 저장하고 순위를 비교한 뒤 투자자용·개발 검토용·전문가 검토용 리포트로 전환합니다."],
]

const dataSources = [
  ["국토부 실거래", "매입가 비교"],
  ["상권 데이터", "임대수익 맥락"],
  ["금융 조건", "금리와 상환"],
  ["법규 체크", "인허가 리스크"],
  ["뉴스·정책", "시장 신호"],
  ["LLM Wiki", "판단 근거"],
  ["PostgreSQL", "데이터 코어"],
  ["pgvector", "유사 사례 검색"],
]

const reportItems = [
  ["매입 판단", "최대 매입 가능가", "평당가·실거래 비교", "가격협상 포인트"],
  ["개발 시나리오", "추천 용도 Top 3", "공사비·기간 추정", "NOI 개선폭"],
  ["실행 리스크", "인허가 체크리스트", "금융·금리 민감도", "전문가 검토 포인트"],
]

const pricingPlans = [
  ["Quick Simulation", "반복 매물 스크리닝", "무료/저가", ["주소 기반 빠른 판단", "추천 용도·공사 방향", "핵심 리스크 요약"]],
  ["Comparison Board", "후보 저장과 비교", "월 구독", ["여러 매물 ROE 랭킹", "최대 매입가 비교", "투자자 피드백 관리", "공유 카드"]],
  ["Report & Expert", "유료 리포트와 전문가 연결", "건별/프리미엄", ["심층 투자자 리포트", "3~5개 후보 비교 보고서", "개발 타당성 표", "인허가·공사비 검토 연결"]],
]

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
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

function HeroVisual() {
  return (
    <div className="relative min-h-[500px] overflow-hidden border border-stone-200 bg-white p-4 shadow-[0_30px_80px_rgba(28,25,23,0.08)] sm:p-5">
      <div className="absolute left-5 right-5 top-5 flex items-center justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
          <span className="size-2 rounded-full bg-emerald-500" />
          매매·개발 시뮬레이션
        </div>
        <span className="text-xs text-stone-400">성수동 후보 매물</span>
      </div>

      <div className="mt-16 grid gap-4">
        <div className="border border-stone-200 bg-[#f7f7f2] p-5">
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

        <div className="grid grid-cols-2 gap-3">
          {[
            ["추천 방향", "리모델링", WalletCards],
            ["예상 ROE", "18.4%", LineChart],
            ["최대 매입가", "42.5억", BarChart3],
            ["리스크", "중간", Radar],
          ].map(([label, value, Icon]) => {
            const TileIcon = Icon as Icon
            return (
              <div key={String(label)} className="border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-stone-500">{label}</p>
                  <TileIcon className="size-4 text-stone-500" />
                </div>
                <p className="mt-3 text-xl font-semibold text-stone-950">{value}</p>
              </div>
            )
          })}
        </div>

        <div className="border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 size-4 shrink-0 text-emerald-700" />
            <p className="text-sm leading-6 text-emerald-950">
              1층 F&B·상층 근린생활 리모델링이 후보 중 ROE가 가장 높습니다. 주차·용도 적합성은 전문가 확인이 필요합니다.
            </p>
          </div>
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
            className="flex h-16 w-48 shrink-0 items-center justify-between border border-stone-200 bg-[#f7f7f2] px-4"
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
            <a href="#capabilities" className="hover:text-stone-950">
              핵심 가치
            </a>
            <a href="#process" className="hover:text-stone-950">
              데이터 흐름
            </a>
            <a href="#report" className="hover:text-stone-950">
              리포트/BM
            </a>
            <a href="#pricing" className="hover:text-stone-950">
              BM 구조
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
              <a href="#capabilities" onClick={() => setOpen(false)}>
                핵심 가치
              </a>
              <a href="#process" onClick={() => setOpen(false)}>
                데이터 흐름
              </a>
              <a href="#report" onClick={() => setOpen(false)}>
                리포트/BM
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
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_460px] lg:py-24">
          <AnimatedSection className="flex flex-col justify-center">
            <p className="mb-6 inline-flex w-fit items-center gap-2 border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-normal text-emerald-700">
              <Sparkles className="size-3.5" />
              AI Real Estate Deal Solution
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-normal text-stone-950 sm:text-6xl lg:text-7xl">
              여러 매물 중,
              <br />
              돈 되는 매물을 <br className="sm:hidden" />
              고릅니다.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-600">
              BuildMore는 상업용 부동산과 꼬마빌딩 매매·개발 후보를 주소 기반으로 분석해 추천 용도,
              공사 시나리오, ROE, 최대 매입가, 리스크, 투자자용 리포트까지 연결하는 AI 솔루션입니다.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/analysis"
                className="inline-flex h-12 items-center justify-center gap-2 bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-stone-800"
              >
                매물 분석 시작하기
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#report"
                className="inline-flex h-12 items-center justify-center gap-2 border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-950 hover:bg-stone-100"
              >
                비교 리포트 보기
                <ChevronRight className="size-4" />
              </a>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={160}>
            <HeroVisual />
          </AnimatedSection>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-stone-200 sm:px-0 lg:grid-cols-4 lg:divide-y-0">
          {metrics.map((item, index) => (
            <AnimatedSection key={item.label} delay={index * 80} className="min-h-32 px-5 py-6">
              <p className="text-3xl font-semibold leading-none tracking-normal text-stone-950 sm:text-4xl">
                {item.value}
              </p>
              <p className="mt-2 text-sm font-semibold text-stone-700">{item.label}</p>
              <p className="mt-5 text-xs font-medium text-stone-400">{item.note}</p>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <section id="capabilities" className="border-b border-stone-200 bg-white py-18 sm:py-24">
        <SectionHeading
          eyebrow="핵심 가치"
          title={
            <>
              매물 정보는 많습니다.
              <br />
              중요한 건 실행 가능한 전략입니다.
            </>
          }
          desc="BuildMore는 매입 후보를 수익성, 개발 가능성, 금융 구조, 리스크, 리포트 활용성까지 한 흐름으로 판단하도록 설계되었습니다."
        />
        <div className="mx-auto grid max-w-7xl border-l border-t border-stone-200 px-4 sm:px-6 md:grid-cols-2">
          {capabilities.map((item, index) => {
            const Icon = item.icon
            return (
              <AnimatedSection
                key={item.no}
                delay={index * 90}
                className="min-h-72 border-b border-r border-stone-200 bg-white p-5 sm:p-6"
              >
                <div className="flex items-center justify-start">
                  <Icon className="size-10 text-emerald-700 sm:size-11" />
                </div>
                <h3 className="mt-16 text-3xl font-semibold tracking-normal text-stone-950">{item.title}</h3>
                <p className="mt-4 max-w-md leading-7 text-stone-600">{item.desc}</p>
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

      <section className="border-b border-stone-200 py-18 sm:py-24">
        <SectionHeading
          center
          eyebrow="타겟 사용자"
          title={
            <>
              중개사, 투자자, 개발사가
              <br />
              같은 숫자로 의사결정합니다.
            </>
          }
          desc="빌드모어의 1차 타겟은 반복적으로 매물을 검토하고, 투자자에게 설명하고, 개발·공사·금융 실행까지 연결해야 하는 실무자입니다."
        />
        <div className="mx-auto grid max-w-7xl items-stretch gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:gap-8">
          {riskCards.map((card, index) => {
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

      <section id="process" className="border-b border-stone-200 bg-white py-18 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[390px_1fr]">
          <AnimatedSection>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">데이터 가공 흐름</p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-normal text-stone-950 sm:text-4xl lg:text-5xl">
              주소 입력부터 후보 비교 리포트까지.
            </h2>
            <p className="mt-5 leading-7 text-stone-600">
              현재 DB 구조는 공공데이터, 콘텐츠, Wiki, Delta Engine, 분석 결과, 사용자 후보 데이터를 연결해 반복 가능한 의사결정 흐름을 만듭니다.
            </p>
          </AnimatedSection>

          <div className="grid gap-3">
            {process.map(([no, title, desc], index) => (
              <AnimatedSection key={no} delay={index * 90} className="group border border-stone-200 bg-[#f7f7f2] p-5">
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

      <section className="border-b border-stone-200 py-18 sm:py-24">
        <SectionHeading
          eyebrow="데이터 코어"
          title={
            <>
              데이터는 수집하고,
              <br />
              판단 근거로 가공됩니다.
            </>
          }
          desc="FastAPI와 PostgreSQL, pgvector 기반으로 실거래·임대·상권·금리·법규·뉴스·정책 자료를 모으고, Queue와 LLM Wiki, Delta Engine을 거쳐 분석 카드와 리포트에 반영합니다."
        />
        <DataMarquee />
        <DataMarquee reverse />
      </section>

      <section id="report" className="border-b border-stone-200 bg-white py-18 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <AnimatedSection>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">주력 서비스</p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-normal text-stone-950 sm:text-4xl lg:text-5xl">
              빠른 시뮬레이션에서 유료 리포트와 전문가 검토까지.
            </h2>
            <p className="mt-5 leading-7 text-stone-600">
              무료·저가의 반복 분석으로 후보를 모으고, 비교 보드와 심층 리포트, 개발 타당성 검토, 전문가 연결로 BM을 확장합니다.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={160} className="border border-stone-200 bg-[#f7f7f2] p-4 sm:p-5">
            <div className="border border-stone-200 bg-white p-5">
              <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase text-stone-500">BuildMore Deal Report</p>
                  <h3 className="mt-2 text-2xl font-semibold text-stone-950">리모델링 후 임대수익형 보유 추천</h3>
                </div>
                <span className="w-fit bg-emerald-700 px-3 py-1 text-sm font-semibold text-white">후보 1순위</span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {reportItems.map(([title, ...items]) => (
                  <div key={title} className="border border-stone-200 bg-[#f7f7f2] p-4">
                    <h4 className="font-semibold text-stone-950">{title}</h4>
                    <ul className="mt-4 space-y-3">
                      {items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm leading-5 text-stone-600">
                          <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section id="pricing" className="border-b border-stone-200 py-18 sm:py-24">
        <SectionHeading
          eyebrow="BM 구조"
          title="자주 쓰는 분석은 가볍게, 중요한 결정은 깊게."
          desc="빌드모어는 반복 시뮬레이션과 후보 저장을 진입점으로 만들고, 비교 리포트·개발 타당성 보고서·전문가 검토에서 수익화합니다."
        />
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3">
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
              <span
                key={index}
                className="border border-white/10"
              />
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
              매물 검토를 반복할수록 더 좋은 딜이 보입니다.
            </h2>
            <p className="mx-auto mt-6 max-w-xl leading-8 text-stone-300">
              주소를 넣고 빠르게 시뮬레이션하세요. 후보를 저장하고 비교한 뒤, 투자자에게 보낼 수 있는 리포트로 전환하세요.
            </p>
            <div className="mt-9 flex justify-center">
              <Link
                href="/analysis"
                className="inline-flex h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-stone-950 hover:bg-stone-200"
              >
                첫 매물 분석 시작하기
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
              상업용 부동산·꼬마빌딩 매매·개발 AI Deal Solution
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
              <a href="#capabilities" className="mt-3 block hover:text-white">
                기능
              </a>
              <a href="#report" className="mt-2 block hover:text-white">
                리포트
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
