"use client"

import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Check,
  Database,
  FileText,
  Landmark,
  LockKeyhole,
  MapPin,
  Menu,
  Network,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Zap,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

const metrics = [
  { value: "72", label: "Bankability Score", company: "BUILD MORE" },
  { value: "58%", label: "Max LTV range", company: "LENDER" },
  { value: "1.21x", label: "DSCR stress case", company: "NOI" },
  { value: "15", label: "Wiki signals today", company: "LLM WIKI" },
]

const capabilities = [
  {
    no: "01",
    title: "Address to underwriting",
    desc: "주소와 매입 조건을 입력하면 실거래, 임대수익, 담보가치, 규제 조건을 한 번에 정리합니다.",
    icon: MapPin,
  },
  {
    no: "02",
    title: "Bankability model",
    desc: "LTV, NOI, DSCR, 자기자본 부담, 금리 민감도를 은행 심사 관점으로 계산합니다.",
    icon: Landmark,
  },
  {
    no: "03",
    title: "LLM Wiki memory",
    desc: "뉴스, 정책, 상권 신호를 검수 후 Wiki Note로 승격해 분석 엔진의 판단 근거로 축적합니다.",
    icon: Network,
  },
  {
    no: "04",
    title: "Decision-ready report",
    desc: "투자위원회와 대출 상담에 바로 쓸 수 있는 카드형 리포트와 체크리스트를 만듭니다.",
    icon: FileText,
  },
]

const process = [
  ["I", "Connect deal data", "주소, 매입가, 보증금, 임대료, 자기자본 조건을 입력합니다."],
  ["II", "Run the model", "공공데이터, 금융 조건, LLM Wiki를 결합해 리스크와 대출성을 산출합니다."],
  ["III", "Ship the memo", "검토 등급, 보완 조건, 은행 상담 포인트를 리포트로 정리합니다."],
]

const integrations = [
  ["Notion", "Wiki review"],
  ["Slack", "Approval"],
  ["OpenAI", "Reasoning"],
  ["PostgreSQL", "Data core"],
  ["Public Data", "Source"],
  ["VWorld", "Map"],
  ["RTMS", "Transactions"],
  ["Seoul API", "Commerce"],
  ["Next.js", "Frontend"],
  ["FastAPI", "Backend"],
  ["pgvector", "Retrieval"],
  ["Cron", "Scheduler"],
]

const securityItems = [
  ["Internal approval", "뉴스 후보는 Slack 확인 후에만 Wiki Note로 승격됩니다."],
  ["Source audit trail", "후보, 승인, 승격 이벤트를 DB에 남겨 추적 가능성을 유지합니다."],
  ["Duplicate filter", "당일 기사와 기존 후보의 유사도를 비교해 중복 신호를 줄입니다."],
  ["Private operations", "관리자 API와 서버 env는 내부 키 기반으로 분리되어 있습니다."],
]

const operatorCards = [
  [Database, "Data Core", "실거래, 상권, 금융, 정책, 뉴스 데이터를 하나의 분석 코어로 연결합니다."],
  [BarChart3, "Risk Cards", "규제, 임대수요, 담보가치, 자기자본 부담을 카드 단위로 분해합니다."],
  [LockKeyhole, "Approval Layer", "검수된 신호만 Wiki에 올려 리포트 판단 근거를 깨끗하게 유지합니다."],
] as const

const pricingPlans = [
  ["01", "Free Check", "Quick signal", "0원", ["Bankability preview", "LTV / DSCR snapshot", "Risk summary"]],
  ["02", "Deep Report", "Deal memo", "39,000원", ["Full card report", "Wiki-backed risk notes", "PDF export", "Bank checklist"]],
  ["03", "Bank Package", "Submission ready", "Custom", ["Expert review", "Lender memo", "Scenario pack", "Data appendix"]],
] as const

function LiveClock() {
  const [time, setTime] = useState("")

  useEffect(() => {
    const tick = () =>
      setTime(
        new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date()),
      )
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  return <span>{time || "00:00:00"}</span>
}

function MarqueeRow({ reverse = false }: { reverse?: boolean }) {
  const items = useMemo(() => [...integrations, ...integrations], [])

  return (
    <div className="overflow-hidden border-y border-neutral-200 bg-white">
      <div
        className={`flex w-max gap-3 py-3 ${
          reverse ? "animate-[marqueeReverse_34s_linear_infinite]" : "animate-[marquee_34s_linear_infinite]"
        }`}
      >
        {items.map(([name, type], index) => (
          <div
            key={`${name}-${index}`}
            className="flex h-16 w-48 shrink-0 items-center justify-between border border-neutral-200 bg-neutral-50 px-4"
          >
            <div>
              <p className="text-sm font-semibold text-neutral-950">{name}</p>
              <p className="mt-1 text-xs text-neutral-500">{type}</p>
            </div>
            <div className="grid size-8 place-items-center border border-neutral-300 bg-white text-xs font-semibold">
              {name.slice(0, 1)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricStrip() {
  return (
    <div className="border-y border-neutral-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-neutral-200 lg:grid-cols-4 lg:divide-y-0">
        {metrics.map((item) => (
          <div key={item.label} className="min-h-32 px-5 py-6">
            <p className="text-3xl font-semibold leading-none tracking-normal text-neutral-950 sm:text-4xl">
              {item.value}
            </p>
            <p className="mt-2 text-sm font-medium text-neutral-700">{item.label}</p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-normal text-neutral-400">{item.company}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function DataConsole() {
  return (
    <div className="border border-neutral-200 bg-neutral-950 text-neutral-50">
      <div className="flex h-11 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <TerminalSquare className="size-4" />
          underwriting.ts
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-300">
          <span className="size-2 rounded-full bg-emerald-300" />
          Ready
        </div>
      </div>
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
          <pre className="overflow-hidden text-xs leading-6 text-neutral-300 sm:text-sm">
            {`import { buildmore } from '@buildmore/core'

const memo = buildmore.analyze({
  address: '서울 성동구 성수동',
  purchasePrice: 8700000000,
  rentRoll: true,
  wikiSignals: 'approved-only'
})

return memo.bankability`}
          </pre>
        </div>
        <div className="p-5">
          {[
            ["Bankability", "72 / 100"],
            ["Max LTV", "52 - 58%"],
            ["NOI", "2.1억"],
            ["DSCR", "1.21x"],
            ["Action", "조건부 검토"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between border-b border-white/10 py-3 text-sm last:border-b-0">
              <span className="text-neutral-400">{label}</span>
              <span className="font-semibold text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [open, setOpen] = useState(false)

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-neutral-950">
      <style jsx global>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes marqueeReverse {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-[#f7f7f4]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid size-7 place-items-center border border-neutral-950 bg-neutral-950 text-white">B</span>
            BuildMore TM
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-600 md:flex">
            <a href="#capabilities" className="hover:text-neutral-950">
              Capabilities
            </a>
            <a href="#process" className="hover:text-neutral-950">
              How it works
            </a>
            <a href="#data" className="hover:text-neutral-950">
              Data core
            </a>
            <a href="#pricing" className="hover:text-neutral-950">
              Pricing
            </a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="text-sm font-medium text-neutral-600 hover:text-neutral-950">
              Sign in
            </Link>
            <Link
              href="/analysis"
              className="border border-neutral-950 bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Start analysis
            </Link>
          </div>
          <button
            className="grid size-9 place-items-center border border-neutral-300 md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
        </div>
        {open ? (
          <div className="border-t border-neutral-200 bg-[#f7f7f4] px-4 py-4 md:hidden">
            <div className="grid gap-3 text-sm font-medium text-neutral-700">
              <a href="#capabilities">Capabilities</a>
              <a href="#process">How it works</a>
              <a href="#data">Data core</a>
              <Link href="/analysis" className="mt-2 border border-neutral-950 bg-neutral-950 px-4 py-2 text-center text-white">
                Start analysis
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <section className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_440px] lg:py-28">
          <div>
            <p className="mb-7 inline-flex border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold uppercase text-neutral-500">
              The platform for building investment memos
            </p>
            <h1 className="max-w-4xl text-6xl font-semibold leading-[0.92] tracking-normal text-neutral-950 sm:text-7xl lg:text-8xl">
              The platform to underwrite
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-neutral-600">
              BuildMore turns address, rent roll, public data, market news, and lender logic into a decision-ready
              pre-underwriting report for commercial real estate.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/analysis"
                className="inline-flex h-12 items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Start free analysis
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex h-12 items-center justify-center gap-2 border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-950 hover:bg-neutral-100"
              >
                Watch demo
              </Link>
            </div>
          </div>
          <div className="lg:pt-10">
            <div className="border border-neutral-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-4">
                <span className="text-xs font-semibold uppercase text-neutral-500">Live memo</span>
                <span className="text-xs text-neutral-500">Seongsu-dong</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 border border-neutral-200 bg-[#f7f7f4] p-5">
                  <p className="text-xs font-semibold uppercase text-neutral-500">Bankability Score</p>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-6xl font-semibold leading-none">72</span>
                    <span className="pb-2 text-neutral-500">/100</span>
                  </div>
                </div>
                {[
                  ["LTV", "52-58%"],
                  ["DSCR", "1.21x"],
                  ["NOI", "2.1억"],
                  ["Risk", "Medium"],
                ].map(([label, value]) => (
                  <div key={label} className="border border-neutral-200 p-4">
                    <p className="text-xs text-neutral-500">{label}</p>
                    <p className="mt-2 text-xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 border border-neutral-200 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 size-4 text-neutral-950" />
                  <p className="text-sm leading-6 text-neutral-600">
                    Wiki signal: 금리와 임대시장 규제 리스크를 대출 심사 보완 조건으로 반영하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MetricStrip />

      <section id="capabilities" className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="mb-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <p className="text-sm font-semibold uppercase text-neutral-500">Capabilities</p>
            <h2 className="text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
              Everything you need. Nothing you do not.
            </h2>
          </div>
          <div className="grid border-l border-t border-neutral-200 md:grid-cols-2">
            {capabilities.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.no} className="min-h-72 border-b border-r border-neutral-200 p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-400">{item.no}</span>
                    <Icon className="size-5 text-neutral-500" />
                  </div>
                  <h3 className="mt-20 text-2xl font-semibold tracking-normal">{item.title}</h3>
                  <p className="mt-4 max-w-md leading-7 text-neutral-600">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="process" className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[420px_1fr] lg:py-28">
          <div>
            <p className="text-sm font-semibold uppercase text-neutral-500">Process</p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
              Three steps. One investment memo.
            </h2>
            <div className="mt-10 space-y-6">
              {process.map(([no, title, desc]) => (
                <div key={no} className="flex gap-5">
                  <span className="grid size-10 shrink-0 place-items-center border border-neutral-300 bg-white text-sm font-semibold">
                    {no}
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 leading-7 text-neutral-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DataConsole />
        </div>
      </section>

      <section id="data" className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase text-neutral-500">Live data</p>
              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
                Signals you can measure.
              </h2>
            </div>
            <div className="grid border-l border-t border-neutral-200 sm:grid-cols-2">
              {[
                ["Live", <LiveClock key="clock" />, "Scheduler time"],
                ["15", "Candidates", "News review queue"],
                ["0.84", "Similarity threshold", "Duplicate control"],
                ["500", "Lookback window", "Recent candidates"],
              ].map(([value, title, label]) => (
                <div key={String(title)} className="min-h-36 border-b border-r border-neutral-200 p-5">
                  <p className="text-3xl font-semibold">{value}</p>
                  <p className="mt-3 font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-neutral-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <MarqueeRow />
        <MarqueeRow reverse />
      </section>

      <section className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1fr] lg:py-28">
          <div>
            <p className="text-sm font-semibold uppercase text-neutral-500">Security</p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
              Trust is non-negotiable.
            </h2>
            <p className="mt-6 max-w-lg leading-8 text-neutral-600">
              BuildMore keeps raw data, candidate review, Wiki promotion, and admin operations separated so the analysis
              layer stays clean.
            </p>
          </div>
          <div className="grid gap-3">
            {securityItems.map(([title, desc]) => (
              <div key={title} className="border border-neutral-200 bg-white p-5">
                <div className="flex items-start gap-4">
                  <ShieldCheck className="mt-1 size-5 shrink-0 text-neutral-950" />
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 leading-7 text-neutral-600">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="mb-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <p className="text-sm font-semibold uppercase text-neutral-500">For operators</p>
            <h2 className="text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
              Built for people who need the number before the meeting.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {operatorCards.map(([Icon, title, desc]) => (
              <div key={title} className="border border-neutral-200 p-6">
                <Icon className="size-5 text-neutral-500" />
                <h3 className="mt-16 text-2xl font-semibold">{title}</h3>
                <p className="mt-4 leading-7 text-neutral-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase text-neutral-500">Pricing</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-normal sm:text-5xl">Simple, staged analysis.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {pricingPlans.map(([no, name, sub, price, features]) => (
              <div key={name} className="border border-neutral-200 bg-white p-6">
                <p className="text-sm font-semibold text-neutral-400">{no}</p>
                <h3 className="mt-8 text-2xl font-semibold">{name}</h3>
                <p className="mt-1 text-neutral-500">{sub}</p>
                <p className="mt-8 text-3xl font-semibold">{price}</p>
                <ul className="mt-8 space-y-3">
                  {features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm text-neutral-600">
                      <Check className="size-4 shrink-0 text-neutral-950" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/analysis"
                  className="mt-8 inline-flex h-11 w-full items-center justify-center border border-neutral-950 bg-neutral-950 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                  Start
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:py-28">
          <h2 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight tracking-normal sm:text-6xl">
            Ready to know if the deal can borrow?
          </h2>
          <p className="mx-auto mt-6 max-w-xl leading-8 text-neutral-400">
            Start with a quick pre-underwriting run. Bring the numbers to the lender before the lender asks.
          </p>
          <div className="mt-9 flex justify-center">
            <Link
              href="/analysis"
              className="inline-flex h-12 items-center justify-center gap-2 border border-white bg-white px-5 text-sm font-semibold text-neutral-950 hover:bg-neutral-200"
            >
              Start building the memo
              <Zap className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-neutral-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 border-t border-white/10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-sm font-semibold">BuildMore TM</p>
            <p className="mt-3 max-w-md leading-7 text-neutral-400">
              AI pre-underwriting for commercial real estate investors, operators, and lender conversations.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-sm text-neutral-400">
            <div>
              <p className="font-semibold text-white">Product</p>
              <Link href="/analysis" className="mt-3 block hover:text-white">
                Analysis
              </Link>
              <Link href="/demo" className="mt-2 block hover:text-white">
                Demo
              </Link>
            </div>
            <div>
              <p className="font-semibold text-white">System</p>
              <a href="#data" className="mt-3 block hover:text-white">
                Data
              </a>
              <a href="#process" className="mt-2 block hover:text-white">
                Process
              </a>
            </div>
            <div>
              <p className="font-semibold text-white">Company</p>
              <Link href="/about" className="mt-3 block hover:text-white">
                About
              </Link>
              <Link href="/login" className="mt-2 block hover:text-white">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
