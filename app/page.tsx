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
  Landmark,
  LineChart,
  MapPin,
  Menu,
  Radar,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
  Zap,
} from "lucide-react"
import { ComponentType, ReactNode, useEffect, useMemo, useRef, useState } from "react"

type Icon = ComponentType<{ className?: string }>

const metrics = [
  { value: "72", label: "Bankability Score", note: "조건부 검토 가능" },
  { value: "52~58%", label: "예상 LTV", note: "은행 담보 관점" },
  { value: "1.21x", label: "DSCR", note: "스트레스 케이스" },
  { value: "2.1억", label: "연 NOI", note: "공실률 반영" },
]

const capabilities: Array<{ no: string; title: string; desc: string; icon: Icon; chips: string[] }> = [
  {
    no: "01",
    title: "주소만 넣으면 딜 구조가 보입니다",
    desc: "주소, 매입가, 임대 조건을 기준으로 실거래, 상권, 임대수익, 금융 조건을 한 화면에서 연결합니다.",
    icon: MapPin,
    chips: ["주소 검색", "실거래 비교", "상권 맥락"],
  },
  {
    no: "02",
    title: "은행이 보는 숫자로 먼저 검토합니다",
    desc: "LTV, NOI, DSCR, 자기자본, 월 이자 부담을 계산해 대출 실행 가능성을 사전에 판단합니다.",
    icon: Landmark,
    chips: ["LTV", "NOI", "DSCR"],
  },
  {
    no: "03",
    title: "법규와 숨은 리스크를 카드로 정리합니다",
    desc: "도로, 일조, 주차, 용도지역, 위반건축물 여부처럼 가격표에 보이지 않는 리스크를 체크합니다.",
    icon: Scale,
    chips: ["접도", "주차", "용도지역"],
  },
  {
    no: "04",
    title: "은행 상담 전 제출 가능한 리포트로 만듭니다",
    desc: "투자위원회 메모, 금융기관 협의 포인트, 보완 조건을 카드형 리포트와 PDF 구조로 정리합니다.",
    icon: FileText,
    chips: ["리포트", "보완 포인트", "PDF"],
  },
]

const riskCards: Array<{ title: string; desc: string; icon: Icon }> = [
  {
    title: "실거래가와 적정 매입가는 다릅니다",
    desc: "주변 거래 사례만으로는 은행 담보평가 기준과 적정 LTV를 판단하기 어렵습니다.",
    icon: Search,
  },
  {
    title: "수익률과 대출 가능성은 다릅니다",
    desc: "NOI와 DSCR이 맞지 않으면 좋은 입지도 금융 실행으로 이어지지 않습니다.",
    icon: Calculator,
  },
  {
    title: "법규 리스크는 나중에 발견하면 늦습니다",
    desc: "도로 폭, 일조사선, 주차, 용도지역 조건 하나가 개발 가능성을 크게 바꿉니다.",
    icon: ShieldCheck,
  },
]

const process = [
  ["01", "딜 조건 입력", "주소, 매입가, 예상 보증금과 월세, 자기자본을 입력합니다."],
  ["02", "데이터 조회", "실거래, 임대, 상권, 금리, 법규 데이터를 자동으로 모읍니다."],
  ["03", "금융 실행성 분석", "LTV, NOI, DSCR, 법규 리스크, 유사 사례를 은행 관점으로 계산합니다."],
  ["04", "리포트 생성", "Bankability Score와 보완 포인트를 투자 검토용 리포트로 제공합니다."],
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
  ["금융 분석", "예상 LTV 52~58%", "자기자본 18.5억", "월 이자 1,850만"],
  ["사업성", "예상 보증금 3.5억", "예상 월세 2,800만", "NOI 연 2.1억"],
  ["리스크", "도로 접도 조건 확인", "주차대수 부족 가능성", "임대 근거 보완 필요"],
]

const pricingPlans = [
  ["Free Check", "간단한 딜 판단", "무료", ["Bankability Score", "LTV·DSCR 핵심 지표", "주요 리스크 요약"]],
  ["Deep Report", "심층 분석 리포트", "39,000원부터", ["상권·임대·실거래 분석", "금융 시나리오 분석", "법규 리스크 체크", "PDF 리포트"]],
  ["Bank Package", "은행 제출용 패키지", "별도 문의", ["사업계획서 구조", "전문가 검토 및 보정", "금융기관 협의 자료", "투자위원회 메모"]],
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
}: {
  eyebrow: string
  title: ReactNode
  desc?: string
}) {
  return (
    <AnimatedSection className="mx-auto mb-10 grid max-w-7xl gap-5 px-4 sm:px-6 lg:mb-14 lg:grid-cols-[0.75fr_1.25fr]">
      <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">{eyebrow}</p>
      <div>
        <h2 className="text-3xl font-semibold leading-tight tracking-normal text-stone-950 sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {desc ? <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">{desc}</p> : null}
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
          실시간 사전 심사
        </div>
        <span className="text-xs text-stone-400">성수동 꼬마빌딩</span>
      </div>

      <div className="mt-16 grid gap-4">
        <div className="animate-[floatCard_6s_ease-in-out_infinite] border border-stone-200 bg-[#f7f7f2] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-stone-500">Bankability Score</p>
            <BadgeCheck className="size-5 text-emerald-700" />
          </div>
          <div className="mt-5 flex items-end gap-3">
            <span className="text-7xl font-semibold leading-none text-stone-950">72</span>
            <span className="pb-2 text-stone-500">/ 100</span>
          </div>
          <div className="mt-5 h-2 overflow-hidden bg-stone-200">
            <div className="h-full w-[72%] animate-[scoreFill_2.4s_ease-out_both] bg-emerald-600" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            ["예상 LTV", "52~58%", WalletCards],
            ["DSCR", "1.21x", LineChart],
            ["연 NOI", "2.1억", BarChart3],
            ["리스크", "보완 필요", Radar],
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

        <div className="animate-[floatCard_7s_ease-in-out_1s_infinite] border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 size-4 shrink-0 text-emerald-700" />
            <p className="text-sm leading-6 text-emerald-950">
              선임대 근거 확보 및 자기자본 40% 이상 확보 시 금융기관 사전 협의 가능
            </p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-16 left-8 right-8 h-28 animate-[scanLine_5s_linear_infinite] border-t border-emerald-500/40" />
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
        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes scoreFill {
          from { width: 0; }
          to { width: 72%; }
        }
        @keyframes scanLine {
          from { transform: translateY(-420px); opacity: 0; }
          12%, 78% { opacity: 1; }
          to { transform: translateY(0); opacity: 0; }
        }
        @keyframes pulseGrid {
          0%, 100% { opacity: 0.35; transform: translateY(0); }
          50% { opacity: 0.85; transform: translateY(-8px); }
        }
        @keyframes ctaDrift {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(14px, -10px, 0); }
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
              핵심 기능
            </a>
            <a href="#process" className="hover:text-stone-950">
              분석 과정
            </a>
            <a href="#report" className="hover:text-stone-950">
              리포트
            </a>
            <a href="#pricing" className="hover:text-stone-950">
              가격
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
              무료 분석 시작
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
                핵심 기능
              </a>
              <a href="#process" onClick={() => setOpen(false)}>
                분석 과정
              </a>
              <a href="#report" onClick={() => setOpen(false)}>
                리포트
              </a>
              <Link
                href="/analysis"
                className="mt-1 inline-flex h-11 items-center justify-center bg-stone-950 px-4 text-white"
              >
                무료 분석 시작
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
              AI Pre-Underwriting Platform
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-normal text-stone-950 sm:text-6xl lg:text-7xl">
              이 딜, 은행이 대출해줄 수 있을까?
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-600">
              BuildMore는 상업용 부동산과 꼬마빌딩 매입 전, LTV·NOI·DSCR·법규 리스크를 은행 관점으로
              계산해 투자 검토와 대출 상담에 필요한 판단 근거를 제공합니다.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/analysis"
                className="inline-flex h-12 items-center justify-center gap-2 bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-stone-800"
              >
                딜 분석 시작하기
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#report"
                className="inline-flex h-12 items-center justify-center gap-2 border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-950 hover:bg-stone-100"
              >
                샘플 리포트 보기
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
          eyebrow="핵심 기능"
          title={
            <>
              데이터는 많습니다.
              <br />
              중요한 건 금융 실행 판단입니다.
            </>
          }
          desc="BuildMore는 부동산 데이터를 모으는 데서 멈추지 않고, 투자위원회와 은행이 실제로 묻는 질문에 답하도록 설계되었습니다."
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
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-stone-400">{item.no}</span>
                  <Icon className="size-5 text-emerald-700" />
                </div>
                <h3 className="mt-16 text-2xl font-semibold tracking-normal text-stone-950">{item.title}</h3>
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
          eyebrow="왜 필요한가"
          title={
            <>
              시장은 커지고,
              <br />
              리스크는 더 빨라집니다.
            </>
          }
          desc="아파트는 비교 가능한 시세가 많지만, 상가와 꼬마빌딩은 1m 차이, 도로 조건, 임차 안정성 하나가 수익과 대출 가능성을 바꿉니다."
        />
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3">
          {riskCards.map((card, index) => {
            const Icon = card.icon
            return (
              <AnimatedSection key={card.title} delay={index * 110} className="border border-stone-200 bg-white p-6">
                <Icon className="size-6 text-emerald-700" />
                <h3 className="mt-14 text-xl font-semibold text-stone-950">{card.title}</h3>
                <p className="mt-4 leading-7 text-stone-600">{card.desc}</p>
              </AnimatedSection>
            )
          })}
        </div>
      </section>

      <section id="process" className="border-b border-stone-200 bg-white py-18 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[390px_1fr]">
          <AnimatedSection>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">분석 과정</p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-normal text-stone-950 sm:text-4xl lg:text-5xl">
              주소 입력부터 은행 제출 리포트까지.
            </h2>
            <p className="mt-5 leading-7 text-stone-600">
              입력은 가볍게, 결과는 깊게. 매입 전 판단에 필요한 숫자와 리스크만 순서대로 압축합니다.
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
              공공데이터, 뉴스, 정책 자료를
              <br />
              분석 엔진의 근거로 축적합니다.
            </>
          }
          desc="FastAPI, PostgreSQL, SQLAlchemy, Alembic, pgvector 기반 데이터 코어 위에서 실거래와 LLM Wiki 신호를 함께 확장합니다."
        />
        <DataMarquee />
        <DataMarquee reverse />
      </section>

      <section id="report" className="border-b border-stone-200 bg-white py-18 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <AnimatedSection>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">리포트</p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-normal text-stone-950 sm:text-4xl lg:text-5xl">
              투자위원회가 바로 검토할 수 있는 카드형 결과.
            </h2>
            <p className="mt-5 leading-7 text-stone-600">
              결론, 수치, 보완 조건을 분리해 은행 상담 전에 무엇을 준비해야 하는지 명확히 보여줍니다.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={160} className="border border-stone-200 bg-[#f7f7f2] p-4 sm:p-5">
            <div className="border border-stone-200 bg-white p-5">
              <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase text-stone-500">Investment Committee Memo</p>
                  <h3 className="mt-2 text-2xl font-semibold text-stone-950">조건부 검토 가능</h3>
                </div>
                <span className="w-fit bg-emerald-700 px-3 py-1 text-sm font-semibold text-white">결론 B+</span>
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
          eyebrow="가격"
          title="분석은 가볍게, 실행은 깊게."
          desc="필요한 깊이에 맞춰 무료 체크부터 은행 제출용 패키지까지 선택할 수 있습니다."
        />
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3">
          {pricingPlans.map(([name, sub, price, features], index) => (
            <AnimatedSection
              key={String(name)}
              delay={index * 100}
              className={`border p-6 ${
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
              <ul className="mt-8 space-y-3">
                {(features as string[]).map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-stone-600">
                    <Check className="size-4 shrink-0 text-emerald-700" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/analysis"
                className="mt-8 inline-flex h-11 w-full items-center justify-center bg-stone-950 text-sm font-semibold text-white hover:bg-stone-800"
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
                className="border border-white/10 animate-[pulseGrid_4s_ease-in-out_infinite]"
                style={{ animationDelay: `${(index % 12) * 120}ms` }}
              />
            ))}
          </div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <AnimatedSection className="mx-auto max-w-3xl text-center">
            <p className="mx-auto mb-5 inline-flex items-center gap-2 border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              <Zap className="size-3.5" />
              Pre-underwriting starts here
            </p>
            <h2 className="text-4xl font-semibold leading-tight tracking-normal sm:text-6xl">
              매입 전에, 먼저 금융 실행 가능성을 확인하세요.
            </h2>
            <p className="mx-auto mt-6 max-w-xl leading-8 text-stone-300">
              LTV, NOI, DSCR, 법규 리스크를 사전에 분석하고 은행 제출용 리포트의 초안을 준비하세요.
            </p>
            <div className="mt-9 flex justify-center">
              <Link
                href="/analysis"
                className="inline-flex h-12 animate-[ctaDrift_5s_ease-in-out_infinite] items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-stone-950 hover:bg-stone-200"
              >
                무료로 딜 분석 시작하기
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
            <p className="mt-3 max-w-md leading-7 text-stone-400">
              상업용 부동산·꼬마빌딩 투자 검토를 위한 AI 기반 Pre-Underwriting 서비스
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
