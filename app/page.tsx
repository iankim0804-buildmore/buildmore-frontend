"use client"

import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  Database,
  FileCheck,
  GitBranch,
  LineChart,
  Map as MapIcon,
  Menu,
  Network,
  Radar,
  ShieldCheck,
  X,
} from "lucide-react"
import { ComponentType, ReactNode, useEffect, useRef, useState } from "react"

type Icon = ComponentType<{ className?: string }>

/* ---------------------------------- data ---------------------------------- */

const heroStats: Array<{ value: string; label: string; sub: string }> = [
  { value: "3개 시나리오", label: "리모델링 · 증축 · 신축 동시 비교", sub: "가장 수익성 높은 전략을 선택" },
  { value: "8가지 전략", label: "밸류애드 분석 프레임", sub: "정비사업부터 계약까지" },
  { value: "360° 점검", label: "건물 · 계약 · 인허가 리스크", sub: "실행 전 변수를 미리 제거" },
  { value: "매일 갱신", label: "공공 · 민간 원천데이터", sub: "쌓일수록 정교해지는 판단" },
]

const solutionDomains: Array<{
  no: string
  en: string
  ko: string
  desc: string
  items: string[]
  icon: Icon
}> = [
  {
    no: "01",
    en: "ACQUISITION",
    ko: "매입 판단",
    desc: "이 가격에 사도 되는지를 숫자로 답합니다.",
    items: ["주변 실거래 비교 검증", "수익 역산 최대 매입가", "협상 근거 자료"],
    icon: LineChart,
  },
  {
    no: "02",
    en: "DEVELOPMENT",
    ko: "개발 설계",
    desc: "같은 땅에서 가장 수익성 있는 전략을 찾습니다.",
    items: ["리모델링 · 증축 · 신축 비교", "추천 용도 · 공사비 · 공사 기간", "NOI · 자기자본 ROE 산출"],
    icon: Building2,
  },
  {
    no: "03",
    en: "RISK ANALYSIS",
    ko: "리스크 분석",
    desc: "건물 · 계약 · 인허가 변수를 미리 분석합니다.",
    items: ["용도지역 · 인허가 사전 점검", "취득 · 보유 · 양도 세금 체크", "계약 특약 · 권리관계 체크리스트"],
    icon: ShieldCheck,
  },
  {
    no: "04",
    en: "EXECUTION",
    ko: "실행 · 리포트",
    desc: "분석에서 끝나지 않고 실행으로 연결합니다.",
    items: ["투자자 공유용 분석 카드", "후보 매물 비교 보드", "심층 리포트 · 전문가 검토"],
    icon: FileCheck,
  },
]

const strategies: Array<{ no: string; title: string; desc: string }> = [
  {
    no: "01",
    title: "정비사업 분석",
    desc: "정비구역 · 재개발 · 재건축 데이터를 지도 위에서 직접 확인하고, 개발 흐름 속에서 매입 타이밍을 판단합니다.",
  },
  {
    no: "02",
    title: "상권 분석",
    desc: "유동인구와 업종별 매출 데이터로 임대 수요를 검증하고, 층별 추천 용도를 도출합니다.",
  },
  {
    no: "03",
    title: "호재 분석",
    desc: "대규모 복합시설 · 교통 인프라 등 주변 개발 신호를 추적해 미래 가치 변화를 먼저 읽습니다.",
  },
  {
    no: "04",
    title: "숨은 연면적 찾기",
    desc: "용적률 · 건폐율 여유분을 분석해 같은 토지에서 더 지을 수 있는 잠재 가치를 발굴합니다.",
  },
  {
    no: "05",
    title: "공사비 절감 · 공기 단축",
    desc: "시나리오별 공사비와 공사 기간을 같은 기준으로 검증해 수익률을 방어합니다.",
  },
  {
    no: "06",
    title: "인허가 리스크",
    desc: "용도지역 · 주차 기준 · 건축 법규를 사전 점검해 사업 지연과 좌초를 미리 차단합니다.",
  },
  {
    no: "07",
    title: "세금 설계",
    desc: "취득 · 보유 · 양도 단계별 세금 체크리스트로 세후 수익률 기준의 판단을 만듭니다.",
  },
  {
    no: "08",
    title: "계약 안전장치",
    desc: "특약 · 권리관계 · 명도 조건 체크리스트로 실행 직전 마지막 리스크를 제거합니다.",
  },
]

const engines: Array<{
  en: string
  ko: string
  desc: string
  icon: Icon
  href?: string
  linkLabel?: string
  wide?: boolean
}> = [
  {
    en: "ANALYSIS ENGINE",
    ko: "분석기",
    desc: "주소를 입력하면 토지 · 건물 정보를 자동으로 결합하고, 시나리오별 최대 매입가 · ROE · 리스크를 계산합니다.",
    icon: Radar,
    href: "/analysis",
    linkLabel: "분석기 열기",
    wide: true,
  },
  {
    en: "DATA MAP",
    ko: "데이터 맵",
    desc: "실거래 · 정비구역 · 지적 정보를 하나의 지도에 결합했습니다. 위치가 가려진 상업 실거래도 지번 역추적으로 복원해 보여줍니다.",
    icon: MapIcon,
    href: "/map",
    linkLabel: "지도 둘러보기",
    wide: true,
  },
  {
    en: "LLM WIKI",
    ko: "지식 그래프",
    desc: "정책 · 시장 지식을 LLM이 노트로 축적하고 그래프로 연결합니다. 분석할수록 판단 근거가 깊어집니다.",
    icon: Network,
  },
  {
    en: "DELTA ENGINE",
    ko: "변화 감지",
    desc: "시장 데이터의 변화량을 주기적으로 계산해 의미 있는 신호만 추려냅니다.",
    icon: GitBranch,
  },
  {
    en: "DATA PIPELINE",
    ko: "원천데이터 수집",
    desc: "국토부 실거래를 비롯한 공공 · 민간 데이터를 자동 수집 · 정제해 분석의 재료로 공급합니다.",
    icon: Database,
  },
]

const processSteps: Array<{ no: string; title: string; desc: string }> = [
  { no: "01", title: "주소 입력", desc: "주소와 예상 매입가, 개발 방향만 입력하면 토지 · 건물 정보가 자동으로 채워집니다." },
  { no: "02", title: "데이터 결합", desc: "실거래 · 상권 · 법규 · 금융 · 정비사업 데이터가 주소 기준으로 결합됩니다." },
  { no: "03", title: "시나리오 설계", desc: "리모델링 · 증축 · 신축의 공사비, NOI, ROE, 최대 매입가, 리스크를 산출합니다." },
  { no: "04", title: "실행 로드맵", desc: "세금 · 계약 체크리스트와 리포트로 매입 협상부터 실행까지 이어집니다." },
]

const scenarioRows: Array<[string, string, string, string]> = [
  ["추천 용도", "F&B + 근생", "근생 + 오피스", "근생 + 주거"],
  ["공사비", "8억", "18억", "42억"],
  ["공사 기간", "4개월", "10개월", "22개월"],
  ["안정 NOI", "2.8억", "4.1억", "6.5억"],
  ["자기자본 ROE", "18.4%", "14.2%", "11.8%"],
  ["인허가 난이도", "낮음", "중간", "높음"],
]

/* -------------------------------- utilities ------------------------------- */

function Reveal({
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
      { rootMargin: "-6% 0px -6% 0px", threshold: 0.12 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-7 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ no, en }: { no: string; en: string }) {
  return (
    <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-400">
      <span className="font-mono text-zinc-400">{no}</span>
      <span className="h-px w-8 bg-emerald-500/60" />
      {en}
    </p>
  )
}

function HeroVideo() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)")
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (wide.matches && !reduced.matches) setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <video
      className="absolute inset-0 size-full object-cover opacity-50"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
    >
      <source src="/videos/hero-city.mp4" type="video/mp4" />
    </video>
  )
}

/* ---------------------------------- page ---------------------------------- */

export default function LandingPage() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <main className="min-h-screen break-keep bg-[#0a0d12] text-zinc-100 antialiased">
      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* ------------------------------- header ------------------------------ */}
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
          scrolled || open
            ? "border-white/10 bg-[#0a0d12]/90 backdrop-blur-md"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-[72px] sm:px-8">
          <Link href="/" className="flex items-baseline gap-1 text-[15px] font-bold tracking-[0.18em]" aria-label="BuildMore 홈">
            BUILDMORE
            <span className="size-1.5 translate-y-px bg-emerald-400" />
          </Link>

          <nav className="hidden items-center gap-9 text-[13px] font-medium tracking-wide text-zinc-400 md:flex">
            <a href="#solution" className="transition-colors hover:text-white">Solution</a>
            <a href="#strategy" className="transition-colors hover:text-white">Strategy</a>
            <a href="#technology" className="transition-colors hover:text-white">Technology</a>
            <a href="#process" className="transition-colors hover:text-white">Process</a>
          </nav>

          <div className="hidden items-center gap-6 md:flex">
            <Link href="/login" className="text-[13px] font-medium text-zinc-400 transition-colors hover:text-white">
              로그인
            </Link>
            <Link
              href="/analysis"
              className="group inline-flex h-10 items-center gap-2 border border-emerald-400/80 bg-emerald-400/0 px-5 text-[13px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-400 hover:text-[#0a0d12]"
            >
              무료 분석 시작
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <button
            type="button"
            className="grid size-10 place-items-center border border-white/15 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-white/10 bg-[#0a0d12] px-5 py-6 md:hidden">
            <div className="grid gap-5 text-sm font-medium text-zinc-300">
              <a href="#solution" onClick={() => setOpen(false)}>Solution</a>
              <a href="#strategy" onClick={() => setOpen(false)}>Strategy</a>
              <a href="#technology" onClick={() => setOpen(false)}>Technology</a>
              <a href="#process" onClick={() => setOpen(false)}>Process</a>
              <Link href="/login" onClick={() => setOpen(false)} className="text-zinc-400">로그인</Link>
              <Link
                href="/analysis"
                className="mt-2 inline-flex h-12 items-center justify-center gap-2 bg-emerald-400 text-sm font-bold text-[#0a0d12]"
              >
                무료 분석 시작
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      {/* -------------------------------- hero ------------------------------- */}
      <section className="relative flex min-h-svh flex-col justify-end overflow-hidden">
        {/* background: video (desktop) / gradient skyline (mobile fallback) */}
        <div className="absolute inset-0 bg-[#0a0d12]">
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_70%_10%,#13202b_0%,#0a0d12_60%)]" />
          <HeroVideo />
          {/* skyline silhouette, visible while video absent */}
          <svg
            className="absolute bottom-0 left-0 w-full text-black/60 md:hidden"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              fill="currentColor"
              d="M0 320V210h60v-40h40v40h50V120h70v50h40v-80h90v80h50v-60h60v60h40V90h100v100h50v-50h70v50h40V60h110v130h60v-70h80v70h50V140h90v60h60v-90h70v90h50v-40h60v160z"
            />
          </svg>
          {/* dark overlays for legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d12]/70 via-[#0a0d12]/35 to-[#0a0d12]" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-5 pb-0 pt-36 sm:px-8 sm:pt-44">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-emerald-400 sm:text-xs">
              Commercial Real Estate Total Solution
            </p>
            <h1 className="mt-7 text-[2.6rem] font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-[4.6rem]">
              주소 하나가,
              <br />
              최적 수익률의 <span className="text-emerald-400">로드맵</span>이 됩니다.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
              빌드모어는 매물을 찾아주는 서비스가 아닙니다.{" "}
              <br className="hidden sm:block" />
              실거래 · 상권 · 법규 · 금융 데이터로 상업건물의 가치를 직접 설계하는
              <span className="font-semibold text-white"> 매매 · 개발 토탈솔루션</span>입니다.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/analysis"
                className="group inline-flex h-[52px] items-center justify-center gap-2.5 bg-emerald-400 px-7 text-[15px] font-bold text-[#0a0d12] transition-colors hover:bg-emerald-300"
              >
                무료 분석 시작하기
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/map"
                className="inline-flex h-[52px] items-center justify-center gap-2.5 border border-white/25 px-7 text-[15px] font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/5"
              >
                데이터 맵 둘러보기
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </Reveal>

          {/* stat strip */}
          <Reveal delay={180} className="mt-20 sm:mt-24">
            <div className="grid grid-cols-2 border-t border-white/15 lg:grid-cols-4">
              {heroStats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`border-white/15 py-6 pr-4 sm:py-8 ${i % 2 === 1 ? "pl-6 sm:pl-8" : ""} ${
                    i > 0 ? "lg:border-l lg:pl-8" : ""
                  } ${i % 2 === 1 ? "border-l lg:border-l" : ""} ${i > 1 ? "border-t lg:border-t-0" : ""}`}
                >
                  <p className="text-xl font-bold text-white sm:text-2xl">{stat.value}</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-200">{stat.label}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">{stat.sub}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <a
          href="#manifesto"
          className="absolute bottom-6 right-6 hidden items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400 transition-colors hover:text-zinc-300 md:flex"
        >
          Scroll
          <ChevronDown className="size-4 animate-bounce" />
        </a>
      </section>

      {/* ----------------------------- manifesto ----------------------------- */}
      <section id="manifesto" className="border-t border-white/10 bg-[#0d1117]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-36">
          <Reveal>
            <SectionLabel no="01" en="Why BuildMore" />
          </Reveal>
          <Reveal delay={100}>
            <h2 className="mt-10 max-w-4xl text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl">
              기다리는 투자가 아니라,
              <br />
              <span className="text-zinc-400">설계하는 투자.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-16">
              <p className="text-lg leading-9 text-zinc-300">
                재개발을 기다리는 투자는 시간이 수익을 결정합니다. 빌드모어는 다릅니다.
                정비사업 · 상권 · 호재 · 연면적 · 공사비 · 인허가 · 세금 · 계약 —
                <span className="font-semibold text-white"> 가치를 만드는 모든 변수를 데이터로 검증</span>하고,
                상업건물의 수익 구조를 직접 설계합니다.
              </p>
              <p className="text-lg leading-9 text-zinc-400">
                중개사의 감, 시행사의 경험, 세무사의 검토로 흩어져 있던 판단을
                하나의 분석 흐름으로 통합했습니다. 소규모 상업부동산의 매입부터 개발, 실행까지 —
                전 과정이 한 화면에서 끝납니다.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------ solution ----------------------------- */}
      <section id="solution" className="border-t border-white/10 bg-[#0a0d12]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionLabel no="02" en="Total Solution" />
              <h2 className="mt-8 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                매입에서 실행까지,
                <br />
                끊기지 않는 네 개의 축.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-zinc-400">
              부분 정보가 아니라 의사결정의 전 과정입니다. 네 개의 축이 하나의 흐름으로 연결됩니다.
            </p>
          </Reveal>

          <div className="mt-14 grid border-l border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {solutionDomains.map((domain, index) => {
              const DomainIcon = domain.icon
              return (
                <Reveal
                  key={domain.no}
                  delay={index * 90}
                  className="group relative border-b border-r border-white/10 p-7 transition-colors hover:bg-white/[0.03] sm:p-8"
                >
                  <div className="flex items-start justify-between">
                    <DomainIcon className="size-7 text-emerald-400" />
                    <span className="font-mono text-sm text-zinc-600">{domain.no}</span>
                  </div>
                  <p className="mt-16 text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-400">
                    {domain.en}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">{domain.ko}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{domain.desc}</p>
                  <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-5">
                    {domain.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[13px] leading-5 text-zinc-400">
                        <span className="mt-[7px] size-1 shrink-0 bg-emerald-400/70" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-emerald-400 transition-transform duration-300 group-hover:scale-x-100" />
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------ strategy ----------------------------- */}
      <section id="strategy" className="border-t border-white/10 bg-[#0d1117]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionLabel no="03" en="Value-Add Strategy" />
              <h2 className="mt-8 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                가치를 만드는
                <br />8가지 전략.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-zinc-400">
              하나하나가 독립된 분석이자, 합쳐지면 한 건물의 밸류애드 로드맵이 됩니다.
            </p>
          </Reveal>

          <div className="mt-14 grid border-t border-white/10 sm:grid-cols-2">
            {strategies.map((strategy, index) => (
              <Reveal
                key={strategy.no}
                delay={(index % 2) * 80}
                className={`group flex gap-6 border-b border-white/10 py-8 pr-4 sm:gap-8 sm:py-9 ${
                  index % 2 === 1 ? "sm:border-l sm:pl-10" : "sm:pr-10"
                }`}
              >
                <span className="font-mono text-sm font-medium text-zinc-600 transition-colors group-hover:text-emerald-400 sm:text-base">
                  {strategy.no}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white sm:text-xl">{strategy.title}</h3>
                  <p className="mt-2.5 max-w-md text-sm leading-7 text-zinc-400">{strategy.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- technology ---------------------------- */}
      <section id="technology" className="border-t border-white/10 bg-[#0a0d12]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionLabel no="04" en="Technology" />
              <h2 className="mt-8 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                판단 뒤에는,
                <br />
                엔진이 돌고 있습니다.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-zinc-400">
              직접 수집하고, 직접 계산합니다. 빌드모어가 자체 구축한 데이터 · 분석 인프라입니다.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-px border border-white/10 bg-white/10 lg:grid-cols-6">
            {engines.map((engine, index) => {
              const EngineIcon = engine.icon
              return (
                <Reveal
                  key={engine.en}
                  delay={index * 80}
                  className={`group bg-[#0a0d12] p-7 transition-colors hover:bg-[#0d141c] sm:p-9 ${
                    engine.wide ? "lg:col-span-3" : "lg:col-span-2"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <EngineIcon className="size-6 text-emerald-400" />
                    {engine.href ? (
                      <Link
                        href={engine.href}
                        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:text-emerald-300"
                      >
                        {engine.linkLabel}
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    ) : null}
                  </div>
                  <p className="mt-12 text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400/80">
                    {engine.en}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-white">{engine.ko}</h3>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-zinc-400">{engine.desc}</p>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------ process ------------------------------ */}
      <section id="process" className="border-t border-white/10 bg-[#0d1117]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <Reveal>
            <SectionLabel no="05" en="Process" />
            <h2 className="mt-8 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              입력은 1분,
              <br />
              판단은 끝까지.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-px border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <Reveal key={step.no} delay={index * 90} className="relative bg-[#0d1117] p-7 sm:p-8">
                <span className="font-mono text-4xl font-semibold text-zinc-700">{step.no}</span>
                <h3 className="mt-10 text-lg font-bold text-white sm:text-xl">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-400">{step.desc}</p>
                {index < processSteps.length - 1 ? (
                  <ArrowRight className="absolute right-6 top-8 hidden size-4 text-zinc-700 lg:block" />
                ) : null}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- output preview -------------------------- */}
      <section className="border-t border-white/10 bg-[#0a0d12]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionLabel no="06" en="Output Preview" />
              <h2 className="mt-8 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                한 주소에서 나오는
                <br />세 가지 답.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-zinc-400">
              용도지역 · 건폐율 · 용적률 · 주차 기준 · 임대 시세 · 공사비 · 금융 조건을 함께 반영한 산출 예시입니다.
            </p>
          </Reveal>

          <Reveal delay={120} className="mt-14">
            <div className="overflow-x-auto border border-white/10">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="bg-white/[0.04]">
                    <th className="border-b border-r border-white/10 p-5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                      비교 항목
                    </th>
                    <th className="border-b border-r border-white/10 p-5">
                      <span className="text-lg font-bold text-emerald-400">리모델링</span>
                      <span className="ml-3 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                        Best ROE
                      </span>
                    </th>
                    <th className="border-b border-r border-white/10 p-5 text-lg font-bold text-white">증축</th>
                    <th className="border-b border-white/10 p-5 text-lg font-bold text-white">신축</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioRows.map(([label, remodel, extend, rebuild]) => (
                    <tr key={label} className="transition-colors hover:bg-white/[0.02]">
                      <th className="border-r border-t border-white/10 p-5 text-sm font-medium text-zinc-400">{label}</th>
                      <td className="border-r border-t border-white/10 bg-emerald-400/[0.04] p-5 text-[15px] font-semibold text-white">
                        {remodel}
                      </td>
                      <td className="border-r border-t border-white/10 p-5 text-[15px] text-zinc-400">{extend}</td>
                      <td className="border-t border-white/10 p-5 text-[15px] text-zinc-400">{rebuild}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------ final CTA ----------------------------- */}
      <section className="relative overflow-hidden border-t border-white/10 bg-[#0d1117]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_100%,rgba(52,211,153,0.10)_0%,transparent_70%)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-28 text-center sm:px-8 sm:py-40">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-emerald-400">
              Start with an address
            </p>
            <h2 className="mx-auto mt-8 max-w-3xl text-4xl font-bold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
              지금 검토 중인
              <br />
              주소가 있나요?
            </h2>
            <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-zinc-400 sm:text-lg">
              주소를 입력하는 순간, 매입 판단부터 개발 시나리오, 리스크 점검까지
              하나의 로드맵으로 정리됩니다.
            </p>
            <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/analysis"
                className="group inline-flex h-[52px] w-full items-center justify-center gap-2.5 bg-emerald-400 px-8 text-[15px] font-bold text-[#0a0d12] transition-colors hover:bg-emerald-300 sm:w-auto"
              >
                무료 분석 시작하기
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="mailto:contact@buildmore.co.kr"
                className="inline-flex h-[52px] w-full items-center justify-center gap-2.5 border border-white/25 px-8 text-[15px] font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/5 sm:w-auto"
              >
                도입 · 제휴 문의
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------- footer ------------------------------ */}
      <footer className="border-t border-white/10 bg-[#0a0d12]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="flex items-baseline gap-1 text-[15px] font-bold tracking-[0.18em] text-white">
                BUILDMORE
                <span className="size-1.5 translate-y-px bg-emerald-400" />
              </p>
              <p className="mt-4 max-w-xs text-sm leading-7 text-zinc-400">
                주소 하나로 시작하는
                <br />
                상업부동산 매매 · 개발 토탈솔루션
              </p>
            </div>
            <div className="grid grid-cols-3 gap-10 text-sm">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-600">Product</p>
                <Link href="/analysis" className="block text-zinc-400 transition-colors hover:text-white">분석기</Link>
                <Link href="/map" className="block text-zinc-400 transition-colors hover:text-white">데이터 맵</Link>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-600">Company</p>
                <Link href="/about" className="block text-zinc-400 transition-colors hover:text-white">소개</Link>
                <Link href="/login" className="block text-zinc-400 transition-colors hover:text-white">로그인</Link>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-600">Contact</p>
                <a href="mailto:contact@buildmore.co.kr" className="block text-zinc-400 transition-colors hover:text-white">
                  이메일 문의
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} BuildMore. All rights reserved.</p>
            <p>본 페이지의 수치는 산출 예시이며, 실제 분석 결과는 매물별로 달라집니다.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
