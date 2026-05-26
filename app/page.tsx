import Link from "next/link"
import type { ReactNode } from "react"

const coreValues = [
  {
    title: "Decision Coverage",
    subtitle: "매입·개발·금융·리스크를 하나의 기준으로 검토합니다",
    desc: "토지·건물·실거래·임대·상권·금융·법규 정보를 주소 기준으로 결합해 매입 판단에 필요한 흐름을 정리합니다.",
    chips: ["매입 판단", "금융 구조", "실행 리포트"],
  },
  {
    title: "Scenario Intelligence",
    subtitle: "개발 방향별 수익성을 같은 기준으로 비교합니다",
    desc: "리모델링·증축·신축을 공사비, 공사 기간, NOI, ROE, 인허가 리스크 기준으로 비교합니다.",
    chips: ["리모델링", "증축", "신축"],
  },
  {
    title: "Data Core",
    subtitle: "데이터가 판단 가능한 근거로 축적됩니다",
    desc: "공공데이터·실거래·상권·정책 자료를 누적하고 재구성해 반복 검토의 정확도를 높입니다.",
    chips: ["LLM Wiki", "Delta Engine", "유사 사례"],
  },
  {
    title: "Execution Output",
    subtitle: "검토 결과를 실행 가능한 리포트로 전환합니다",
    desc: "투자자 공유 카드, 후보 비교 보드, 심층 PDF 리포트, 전문가 검토 연결까지 실무 산출물로 제공합니다.",
    chips: ["공유 카드", "PDF", "전문가 검토"],
  },
]

const workflow = [
  ["01", "매물 입력", "주소와 기본 조건을 입력하면 토지·건물 기본 정보가 자동으로 정리됩니다."],
  ["02", "데이터 결합", "실거래·임대·상권·금리·법규·뉴스·정책 자료를 해당 주소 기준으로 연결합니다."],
  ["03", "시나리오 산출", "리모델링·증축·신축별 수익성, 최대 매입가, 금융·인허가 리스크를 계산합니다."],
  ["04", "비교와 리포트", "후보 매물을 비교하고 투자자용·내부 검토용 리포트로 전환합니다."],
]

const scenarioRows = [
  ["추천 용도", "F&B + 근생", "근생 + 오피스", "근생 + 주거"],
  ["공사비", "8억", "18억", "42억"],
  ["공사 기간", "4개월", "10개월", "22개월"],
  ["안정 NOI", "2.8억", "4.1억", "6.5억"],
  ["자기자본 ROE", "18.4%", "14.2%", "11.8%"],
  ["인허가 난이도", "낮음", "중간", "높음"],
]

const targetUsers = [
  {
    title: "중개사",
    desc: "투자자에게 보낼 수 있는 매물 분석 카드와 비교 리포트로 상담 속도와 신뢰도를 높입니다.",
  },
  {
    title: "꼬마빌딩 투자자·자산가",
    desc: "여러 후보 중 어떤 매물이 합리적인지, 얼마까지 매입 가능한지, 어떤 리스크가 큰지 비교합니다.",
  },
  {
    title: "소형 개발사·시행사",
    desc: "용도 변경, 리모델링, 증축, 신축 가능성을 수익성·공사비·인허가 리스크 기준으로 검토합니다.",
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
    "주소 기반 빠른 매물 스크리닝",
    "무료/저가",
    ["추천 용도·공사 방향", "매입 상한가·ROE 요약", "핵심 리스크 요약"],
  ],
  [
    "Comparison Board",
    "여러 후보를 모아 우선순위 결정",
    "월 구독",
    ["후보 매물 ROE 랭킹", "최대 매입가 비교", "투자자 공유 카드", "후보 메모·피드백 관리"],
  ],
  [
    "Report & Expert",
    "실행 단계에서 그대로 쓰는 리포트",
    "건별/프리미엄",
    ["심층 투자자 리포트", "3~5개 후보 비교 보고서", "개발 타당성·인허가 검토", "전문가 자문 연결"],
  ],
]

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
    <div className={center ? "mx-auto mb-12 max-w-4xl text-center" : "mb-12 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]"}>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>
      <div>
        <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-stone-950 sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {desc ? <p className={`mt-5 text-base leading-7 text-stone-600 sm:text-lg ${center ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>{desc}</p> : null}
      </div>
    </div>
  )
}

function DemoCard() {
  return (
    <div className="border border-stone-200 bg-white p-5 shadow-[0_30px_80px_rgba(28,25,23,0.08)]">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Deal Review</p>
        <p className="text-xs text-stone-400">성수동 후보 매물</p>
      </div>
      <div className="mt-5 border border-stone-200 bg-[#f7f7f2] p-5">
        <p className="text-sm font-semibold text-stone-500">Deal Fit Score</p>
        <div className="mt-5 flex items-end gap-3">
          <span className="text-7xl font-semibold leading-none text-stone-950">84</span>
          <span className="pb-2 text-stone-500">/ 100</span>
        </div>
        <div className="mt-5 h-2 overflow-hidden bg-stone-200">
          <div className="h-full w-[84%] bg-emerald-600" />
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Scenario", "리모델링·증축·신축", "개발안별 수익성 비교"],
          ["Max Bid", "42.5억", "수익·금융 기준 매입 상한가"],
          ["Risk Map", "중간", "인허가·공사·금융 리스크 분해"],
        ].map(([title, value, desc]) => (
          <div key={title} className="border border-stone-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-stone-500">{title}</p>
            <p className="mt-3 text-lg font-semibold text-stone-950">{value}</p>
            <p className="mt-2 text-xs leading-5 text-stone-500">{desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm leading-6 text-emerald-950">
          1층 F&B·상층 근생 리모델링의 ROE가 가장 높습니다. 매입 상한가 대비 현 호가는 협상 여지가 있으며,
          주차 대수·용도지역 적합성은 인허가 사전 검토가 필요합니다.
        </p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f7f2] text-stone-950">
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-[#f7f7f2]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold" aria-label="BuildMore 홈">
            <span className="grid size-8 place-items-center bg-stone-950 text-sm text-white">B</span>
            BuildMore
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-stone-600 md:flex">
            <a href="#core-value" className="hover:text-stone-950">핵심 가치</a>
            <a href="#workflow" className="hover:text-stone-950">Workflow</a>
            <a href="#scenario" className="hover:text-stone-950">Scenario</a>
            <a href="#pricing" className="hover:text-stone-950">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-stone-600 hover:text-stone-950 md:inline">로그인</Link>
            <Link href="/analysis" className="inline-flex h-10 items-center justify-center bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800">
              매물 분석 시작
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-stone-200">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="mb-6 inline-flex w-fit border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              AI Real Estate Deal Solution
            </p>
            <h1 className="max-w-4xl text-[2.65rem] font-semibold leading-[1.02] tracking-[-0.05em] text-stone-950 sm:text-6xl lg:text-7xl">
              주소 하나로,
              <br />
              매입가·수익성·리스크를 검토합니다
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-600">
              BuildMore는 상업용 부동산·꼬마빌딩의 매매 후보를 데이터 기반으로 분석하고, 리모델링·증축·신축
              시나리오를 비교해 최대 매입가·ROE·리스크·리포트까지 하나의 검토 흐름으로 제공합니다.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/analysis" className="inline-flex h-12 items-center justify-center bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-stone-800">
                매물 분석 시작하기
              </Link>
              <a href="#scenario" className="inline-flex h-12 items-center justify-center border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-950 hover:bg-stone-100">
                시나리오 예시 보기
              </a>
            </div>
          </div>
          <DemoCard />
        </div>
      </section>

      <section id="core-value" className="border-b border-stone-200 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Core Value"
            title={<>흩어진 매물 정보를<br />하나의 의사결정 구조로 정리합니다</>}
            desc="BuildMore는 매입 판단·개발 시나리오·금융 구조·리스크·실행 리포트까지 하나의 워크플로우로 연결합니다."
          />
          <div className="grid border-l border-t border-stone-200 md:grid-cols-2">
            {coreValues.map((item) => (
              <div key={item.title} className="min-h-72 border-b border-r border-stone-200 bg-white p-6">
                <p className="text-sm font-semibold uppercase text-emerald-700">{item.title}</p>
                <h3 className="mt-10 text-2xl font-semibold tracking-[-0.03em] text-stone-950 sm:text-3xl">{item.subtitle}</h3>
                <p className="mt-4 max-w-xl leading-7 text-stone-600">{item.desc}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {item.chips.map((chip) => (
                    <span key={chip} className="border border-stone-200 bg-[#f7f7f2] px-3 py-1 text-xs text-stone-600">{chip}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="border-b border-stone-200 bg-[#f7f7f2] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[390px_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Workflow</p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.03em] text-stone-950 sm:text-4xl lg:text-5xl">
              주소 입력부터 실행 리포트까지 하나의 검토 흐름으로
            </h2>
            <p className="mt-5 leading-7 text-stone-600">입력은 간단하게 시작하고, 결과는 매입·개발·비교·보고까지 이어집니다.</p>
          </div>
          <div className="grid gap-3">
            {workflow.map(([no, title, desc]) => (
              <div key={no} className="border border-stone-200 bg-white p-5">
                <div className="grid gap-4 sm:grid-cols-[80px_1fr] sm:items-center">
                  <span className="text-3xl font-semibold text-stone-300">{no}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-stone-950">{title}</h3>
                    <p className="mt-2 leading-7 text-stone-600">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="scenario" className="border-b border-stone-200 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            center
            eyebrow="Scenario"
            title={<>같은 매물, 다른 개발안.<br />수익성으로 비교합니다</>}
            desc="리모델링·증축·신축 시나리오를 같은 기준으로 산출해 어떤 방향이 가장 합리적인지 판단합니다."
          />
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
        </div>
      </section>

      <section className="border-b border-stone-200 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            center
            eyebrow="For"
            title={<>중개사·투자자·시행사가<br />같은 기준으로 판단합니다</>}
            desc="반복적으로 매물을 검토하고, 투자자에게 설명하고, 인허가·공사·금융 실행까지 책임지는 실무자를 위해 설계되었습니다."
          />
          <div className="grid items-stretch gap-6 lg:grid-cols-3 lg:gap-8">
            {targetUsers.map((card) => (
              <div key={card.title} className="border border-stone-200 bg-white p-6">
                <h3 className="text-2xl font-semibold text-stone-950">{card.title}</h3>
                <p className="mt-4 leading-7 text-stone-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Data Core"
            title={<>수집된 데이터는<br />검토 가능한 판단 근거가 됩니다</>}
            desc="실거래·임대·상권·금리·법규·뉴스·정책 자료를 모으고, 분석 카드와 리포트에 반영 가능한 구조로 재구성합니다."
          />
          <div className="grid border-l border-t border-stone-200 sm:grid-cols-2 lg:grid-cols-4">
            {dataSources.map(([name, type]) => (
              <div key={name} className="border-b border-r border-stone-200 bg-[#f7f7f2] p-4">
                <p className="text-sm font-semibold text-stone-950">{name}</p>
                <p className="mt-1 text-xs text-stone-500">{type}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-b border-stone-200 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Pricing"
            title="초기 스크리닝은 가볍게, 실행 검토는 정밀하게"
            desc="빠른 시뮬레이션과 후보 저장을 진입점으로, 비교 리포트·심층 리포트·전문가 검토까지 단계별로 확장합니다."
          />
          <div className="grid items-stretch gap-6 lg:grid-cols-3 lg:gap-8">
            {pricingPlans.map(([name, sub, price, features], index) => (
              <div key={String(name)} className={`flex h-full flex-col border p-6 ${index === 1 ? "border-emerald-700 bg-white shadow-[0_24px_70px_rgba(4,120,87,0.14)]" : "border-stone-200 bg-white"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-400">0{index + 1}</p>
                  {index === 1 ? <span className="bg-emerald-700 px-2 py-1 text-xs font-semibold text-white">추천</span> : null}
                </div>
                <h3 className="mt-8 text-2xl font-semibold text-stone-950">{name}</h3>
                <p className="mt-1 text-stone-500">{sub}</p>
                <p className="mt-8 text-3xl font-semibold text-stone-950">{price}</p>
                <ul className="mb-8 mt-8 flex-1 space-y-3">
                  {(features as string[]).map((feature) => (
                    <li key={feature} className="text-sm text-stone-600">✓ {feature}</li>
                  ))}
                </ul>
                <Link href="/analysis" className="mt-auto inline-flex h-11 w-full items-center justify-center bg-stone-950 text-sm font-semibold text-white hover:bg-stone-800">
                  시작하기
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-stone-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:py-28">
          <p className="mx-auto mb-5 inline-flex border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200">Build, compare, execute</p>
          <h2 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">
            더 많은 매물보다, 더 정확한 판단이 먼저입니다
          </h2>
          <p className="mx-auto mt-6 max-w-2xl leading-8 text-stone-300">
            주소를 입력해 첫 시뮬레이션을 확인하세요. 후보를 저장하고 비교한 뒤, 투자자·내부 검토에 바로 활용할 수 있는 리포트로 전환할 수 있습니다.
          </p>
          <div className="mt-9 flex justify-center">
            <Link href="/analysis" className="inline-flex h-12 items-center justify-center bg-white px-5 text-sm font-semibold text-stone-950 hover:bg-stone-200">
              첫 매물 분석 시작하기
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-stone-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 border-t border-white/10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-sm font-semibold">BuildMore</p>
            <p className="mt-3 max-w-none leading-7 text-stone-400 md:whitespace-nowrap">
              주소 하나로 매입가·수익성·리스크를 검토하는 AI 부동산 딜 분석 솔루션
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-sm text-stone-400">
            <div>
              <p className="font-semibold text-white">서비스</p>
              <Link href="/analysis" className="mt-3 block hover:text-white">분석</Link>
              <Link href="/demo" className="mt-2 block hover:text-white">데모</Link>
            </div>
            <div>
              <p className="font-semibold text-white">제품</p>
              <a href="#core-value" className="mt-3 block hover:text-white">기능</a>
              <a href="#scenario" className="mt-2 block hover:text-white">시나리오</a>
            </div>
            <div>
              <p className="font-semibold text-white">회사</p>
              <Link href="/about" className="mt-3 block hover:text-white">소개</Link>
              <Link href="/login" className="mt-2 block hover:text-white">로그인</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
