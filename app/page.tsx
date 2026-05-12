"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  FileText,
  TrendingUp,
  Shield,
  ChevronRight,
  ArrowRight,
  Menu,
  X,
  Scale,
  Landmark,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  FileBarChart,
  Globe,
  Banknote,
} from "lucide-react"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Landmark className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground tracking-tight">BuildMore</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">분석 기능</a>
              <a href="#process" className="text-sm text-muted-foreground hover:text-foreground transition-colors">프로세스</a>
              <a href="#reports" className="text-sm text-muted-foreground hover:text-foreground transition-colors">리포트</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">가격</a>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                로그인
              </Button>
              <Link href="/demo">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  무료 분석 시작
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-sm text-muted-foreground">분석 기능</a>
              <a href="#process" className="block text-sm text-muted-foreground">프로세스</a>
              <a href="#reports" className="block text-sm text-muted-foreground">리포트</a>
              <a href="#pricing" className="block text-sm text-muted-foreground">가격</a>
              <div className="pt-3 border-t border-border space-y-2">
                <Button variant="outline" size="sm" className="w-full">로그인</Button>
                <Link href="/analysis" className="block">
                  <Button size="sm" className="w-full bg-primary text-primary-foreground">무료 분석 시작</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <Badge variant="secondary" className="mb-6 text-xs font-medium px-3 py-1">
                Pre-Underwriting Platform
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight text-balance mb-6">
                이 딜, 은행이<br className="hidden sm:block" /> 대출해줄 수 있을까?
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                LTV, NOI, DSCR, 자기자본 비율, 월 이자 부담을 분석해 부동산 딜의 금융 실행 가능성을 사전에 판단합니다. 은행 제출 전 투자위원회 메모를 준비하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link href="/analysis">
                  <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                    딜 분석 시작하기
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                  <FileText className="w-4 h-4" />
                  샘플 리포트 보기
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-2" />
                  <span>국토부 실거래 연동</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-2" />
                  <span>PDF 리포트 생성</span>
                </div>
              </div>
            </div>

            {/* Right: Product Mockup */}
            <div className="lg:pl-8">
              <Card className="bg-white border border-border shadow-lg overflow-hidden">
                {/* Header Bar */}
                <div className="bg-primary px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-chart-2" />
                    <span className="text-xs text-primary-foreground/80 font-medium">분석 완료</span>
                  </div>
                  <span className="text-xs text-primary-foreground/60">마포구 신수동 27-2</span>
                </div>
                
                <CardContent className="p-0">
                  {/* Score Section */}
                  <div className="p-6 border-b border-border bg-secondary/30">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bankability Score</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-foreground">72</span>
                          <span className="text-lg text-muted-foreground">/ 100</span>
                        </div>
                      </div>
                      <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20">
                        조건부 검토 가능
                      </Badge>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div className="bg-chart-3 h-2 rounded-full" style={{ width: '72%' }} />
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 divide-x divide-y divide-border">
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">예상 LTV</p>
                      <p className="text-lg font-semibold text-foreground">52~58%</p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">예상 금리</p>
                      <p className="text-lg font-semibold text-foreground">4.3~5.1%</p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">NOI (연)</p>
                      <p className="text-lg font-semibold text-foreground">2.1억</p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">DSCR</p>
                      <p className="text-lg font-semibold text-foreground">1.21x</p>
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div className="p-4 bg-secondary/20">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-chart-3/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-chart-3" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">심화 검토 필요</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          선임대 근거 확보 및 자기자본 40% 이상 확보 시 금융기관 사전 협의 가능
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Why Now - 자본 이동 */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">
              Market Context
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
              자본은 이미 상업용으로 이동했습니다
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              2025년 10·15 대책 이후, 자산가 자금이 비주택으로 움직이고 있습니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {/* Card 1: LTV 강화 */}
            <Card className="border-border bg-white text-center">
              <CardContent className="p-8">
                <p className="text-3xl sm:text-4xl font-bold text-chart-3 mb-3">
                  70% → 40%
                </p>
                <p className="text-base font-medium text-foreground mb-2">
                  아파트 LTV 강화
                </p>
                <p className="text-xs text-muted-foreground">
                  2025.10.15 주담대 규제 / 금융위
                </p>
              </CardContent>
            </Card>

            {/* Card 2: 꼬마빌딩 거래 회복 */}
            <Card className="border-border bg-white text-center">
              <CardContent className="p-8">
                <p className="text-3xl sm:text-4xl font-bold text-chart-3 mb-3">
                  +45%
                </p>
                <p className="text-base font-medium text-foreground mb-2">
                  서울 꼬마빌딩 거래 회복
                </p>
                <p className="text-xs text-muted-foreground">
                  2024년 거래액 12.4조 / 부동산플래닛
                </p>
              </CardContent>
            </Card>

            {/* Card 3: 50~100억대 거래 증가 */}
            <Card className="border-border bg-white text-center">
              <CardContent className="p-8">
                <p className="text-3xl sm:text-4xl font-bold text-chart-3 mb-3">
                  +46.2%
                </p>
                <p className="text-base font-medium text-foreground mb-2">
                  50~100억대 거래 증가
                </p>
                <p className="text-xs text-muted-foreground">
                  2025년 2분기 전분기 대비 / 서울경제
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-muted-foreground text-sm">
            자산가의 돈은 이제 빌딩으로 갑니다. 시장은 분명히 커지고 있습니다.
          </p>
        </div>
      </section>

      {/* Section 2: 위험의 비대칭 */}
      <section className="py-16 lg:py-24 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">
              Why It Matters
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
              시장은 커지고 있습니다.<br className="sm:hidden" /> 위험은 더 빠르게 커지고 있습니다.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              아파트는 평균으로 움직이지만, 상가·꼬마빌딩은 입지 하나가 손익을 결정합니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* 아파트 카드 */}
            <Card className="border-border bg-white">
              <CardContent className="p-0">
                <div className="px-6 py-4 border-b border-border bg-secondary/30">
                  <h3 className="text-base font-semibold text-foreground">아파트</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">표준화된 시세</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">동일 단지 내 비교 매물 수십 건</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">국민 평형 = 환금성 높음</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">잘 떨어지지 않는 가격</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 꼬마빌딩·상가 카드 */}
            <Card className="border-border bg-white">
              <CardContent className="p-0">
                <div className="px-6 py-4 border-b border-border bg-chart-3/10">
                  <h3 className="text-base font-semibold text-chart-3">꼬마빌딩 · 상가</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">1m 차이로 임���료 30% 격차</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">일조사선·도로 폭·위반건축물 변수</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">DSR·RTI·1·2금융 적합도 차이</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-chart-3 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">잘못 사면 1년 새 33% 하락 사례</span>
                  </div>
                  {/* 인용 박스 */}
                  <div className="mt-2 ml-8 p-3 bg-secondary/50 rounded border-l-2 border-chart-3">
                    <p className="text-xs text-muted-foreground">
                      서대문구 80억 → 50억 (1년 새 30억 하락)
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      출처: 한국경제 2025.1
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 결론 영역 */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 mb-6">
              <ChevronRight className="w-5 h-5 text-muted-foreground rotate-90" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
              그래서 빌드모어가 답합니다
            </h3>
            <p className="text-muted-foreground mb-6">
              이 딜이 금융적으로 성립하는가?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a href="#features">
                <Badge variant="outline" className="cursor-pointer hover:bg-secondary transition-colors px-4 py-2 text-sm">
                  LTV
                </Badge>
              </a>
              <a href="#features">
                <Badge variant="outline" className="cursor-pointer hover:bg-secondary transition-colors px-4 py-2 text-sm">
                  DSCR
                </Badge>
              </a>
              <a href="#features">
                <Badge variant="outline" className="cursor-pointer hover:bg-secondary transition-colors px-4 py-2 text-sm">
                  은행 보완포인트
                </Badge>
              </a>
              <a href="#features">
                <Badge variant="outline" className="cursor-pointer hover:bg-secondary transition-colors px-4 py-2 text-sm">
                  1·2금융 적합도
                </Badge>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 lg:py-20 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
              부동산 데이터는 많지만,<br className="sm:hidden" /> 금융 실행 판단은 어렵습니다
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              투자위원회와 은행이 보는 관점으로 딜을 평가해야 합니다
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-border bg-white">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded bg-chart-4/10 flex items-center justify-center mb-4">
                  <Scale className="w-5 h-5 text-chart-4" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  실거래가 ≠ 적정 매입가
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  주변 거래 사례만으로는 은행 담보평가 기준과 적정 LTV를 판단하기 어렵습니다.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-white">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded bg-chart-1/10 flex items-center justify-center mb-4">
                  <Calculator className="w-5 h-5 text-chart-1" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  수익률 ≠ 대출 실행 가능성
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  NOI, LTV, DSCR이 맞지 않으면 좋은 입지도 금융 실행으로 이어지지 않습니다.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-white">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  숨은 법규 리스크
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  도로 폭, 일조사선, 주차, 용도지역 조건 하나가 개발 가능성을 크게 바꿉니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Value Section */}
      <section id="features" className="py-16 lg:py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">
              Core Analysis
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
              은행이 보는 관점으로<br className="sm:hidden" /> 딜을 분석합니다
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded bg-chart-1/10 flex items-center justify-center mb-4">
                  <Banknote className="w-6 h-6 text-chart-1" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  금융 실행 가능성
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  LTV, 금리, 자기자본, 월 이자, DSCR 기반 은행 관점 분석
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDot className="w-3 h-3" />
                    <span>예상 LTV 산정</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDot className="w-3 h-3" />
                    <span>월 이자 부담 계산</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDot className="w-3 h-3" />
                    <span>자기자본 요구액</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded bg-chart-2/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-chart-2" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  NOI / DSCR 분석
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  보증금, 월세, 공실률, 관리비 반영 실�� 현금흐름 산정
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDot className="w-3 h-3" />
                    <span>순운영소득 추정</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDot className="w-3 h-3" />
                    <span>원리금 상환 비율</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDot className="w-3 h-3" />
                    <span>실거래 비교 분석</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded bg-chart-3/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-chart-3" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  법규 리스크 체크
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  도로, 일조, 주차, 인허가 리스크 사전 확인
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDot className="w-3 h-3" />
                    <span>용도지역 확인</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDot className="w-3 h-3" />
                    <span>접도 조건 검토</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDot className="w-3 h-3" />
                    <span>위반건축물 여부</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded bg-chart-5/10 flex items-center justify-center mb-4">
                  <FileBarChart className="w-6 h-6 text-chart-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  은행 제출용 리포트
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  투자 검토 결과를 PDF 리포트와 사업계획서 구조로 정리
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDot className="w-3 h-3" />
                    <span>투자위원회 메모</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDot className="w-3 h-3" />
                    <span>사업계획서 양식</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDot className="w-3 h-3" />
                    <span>금융기관 협의 자료</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-16 lg:py-20 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">
              Due Diligence Process
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
              주소 입력부터<br className="sm:hidden" /> 은행 제출 리포트까지
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "딜 조건 입력", desc: "주소, 매입가, 예상 임대료, 자기자본" },
              { step: "02", title: "데이터 조회", desc: "실거래, 임대, 금리, 법규 데이터 수집" },
              { step: "03", title: "리스크 분석", desc: "LTV, DSCR, 법규, 유사 사례 비교" },
              { step: "04", title: "리포트 생성", desc: "Bankability Score 및 은행 제출용 리포트" },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-secondary/50 rounded-lg p-6 h-full">
                  <div className="text-xs font-mono text-chart-1 mb-3">{item.step}</div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ChevronRight className="w-5 h-5 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Analysis Cards Section */}
      <section id="reports" className="py-16 lg:py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">
              Investment Committee Memo
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
              투자위원회가 바로 검토할 수 있는<br className="sm:hidden" /> 분석 결과
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Conclusion Card */}
            <Card className="border-border bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">결론</span>
                  <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20 text-xs">B+</Badge>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">조건부 검토 가능</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  임대 근거 보강 후 금융기관 사전 협의 권장
                </p>
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-chart-1">
                    <ChevronRight className="w-3 h-3" />
                    <span>다음 단계 확인</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Card */}
            <Card className="border-border bg-white">
              <CardContent className="p-5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">금융 분석</span>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">예상 LTV</span>
                    <span className="text-base font-semibold text-foreground">52~58%</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">자기자본</span>
                    <span className="text-base font-semibold text-foreground">18.5억</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">월 이자</span>
                    <span className="text-base font-semibold text-foreground">1,850만</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">예상 금리</span>
                    <span className="text-base font-semibold text-foreground">4.3~5.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NOI Card */}
            <Card className="border-border bg-white">
              <CardContent className="p-5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">사업성</span>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">예상 보증금</span>
                    <span className="text-base font-semibold text-foreground">3.5억</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">예상 월세</span>
                    <span className="text-base font-semibold text-foreground">2,800만</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">NOI (연)</span>
                    <span className="text-base font-semibold text-foreground">2.1억</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">DSCR</span>
                    <span className="text-base font-semibold text-foreground">1.21x</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Card */}
            <Card className="border-border bg-white">
              <CardContent className="p-5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">리스크</span>
                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-chart-3 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">도로 접도 조건 확인</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-chart-3 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">주차대수 부족 가능성</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">공사비 상승 리스크</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-chart-1 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">임대 근거 보완 필요</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Global Investor Section */}
      <section className="py-16 lg:py-20 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">
                Coming Soon
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
                Korea Deal Readiness<br />
                <span className="text-muted-foreground">외국인 투자자용</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                외국인 투자자의 경우 매입 가능성, 외국환 신고, 자금 반입·회수, 대출 가능성, 세무·법무 체크까지 함께 분석합니다.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Globe className="w-5 h-5 text-chart-1" />
                  <span className="text-sm text-foreground">Buyability Check</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Banknote className="w-5 h-5 text-chart-2" />
                  <span className="text-sm text-foreground">Capital In/Out</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Landmark className="w-5 h-5 text-chart-3" />
                  <span className="text-sm text-foreground">Financing Check</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Building2 className="w-5 h-5 text-chart-5" />
                  <span className="text-sm text-foreground">Local Partner</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <Card className="border-border bg-secondary/20 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Global Access Module</p>
                    <p className="text-sm text-muted-foreground">외국인 투자자 전용 분석</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-white rounded border border-border">
                    <CheckCircle2 className="w-4 h-4 text-chart-2" />
                    <span className="text-muted-foreground">Foreign Exchange Compliance</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded border border-border">
                    <CheckCircle2 className="w-4 h-4 text-chart-2" />
                    <span className="text-muted-foreground">Tax & Legal Structure</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded border border-border">
                    <CheckCircle2 className="w-4 h-4 text-chart-2" />
                    <span className="text-muted-foreground">Repatriation Analysis</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 lg:py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
              분석은 가볍게, 실행은 깊게
            </h2>
            <p className="text-muted-foreground">
              필요한 깊이에 맞는 분석을 선택하세요
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-border bg-white">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Free Check</h3>
                  <p className="text-sm text-muted-foreground">간단한 딜 판단</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-foreground">무료</span>
                </div>
                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-chart-2" />
                    <span>Bankability Score</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-chart-2" />
                    <span>핵심 지표 (LTV, DSCR)</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-chart-2" />
                    <span>주요 리스크 요약</span>
                  </li>
                </ul>
                <Link href="/analysis" className="block">
                  <Button variant="outline" className="w-full">
                    무료 분석
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-primary bg-white relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">추천</Badge>
              </div>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Deep Report</h3>
                  <p className="text-sm text-muted-foreground">심층 분석 리포트</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-foreground">39,000원</span>
                  <span className="text-sm text-muted-foreground">부터</span>
                </div>
                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-chart-2" />
                    <span>상권/임대/실거래 분석</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-chart-2" />
                    <span>금융 시나리오 분석</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-chart-2" />
                    <span>법규 리스크 체크</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-chart-2" />
                    <span>PDF 리포트 다운로드</span>
                  </li>
                </ul>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  리포트 생성
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-white">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Bank Package</h3>
                  <p className="text-sm text-muted-foreground">은행 제출용 패키지</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-foreground">별도 문의</span>
                </div>
                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-chart-2" />
                    <span>은행 제출용 사업계획서</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-chart-2" />
                    <span>전문가 검토 및 보정</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-chart-2" />
                    <span>금융기관 협의 자료</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-chart-2" />
                    <span>투자위원회 메모</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  상담 요청
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-24 bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground tracking-tight mb-4">
            매입 전에, 먼저<br className="sm:hidden" /> 금융 실행 가능성을 확인하세요
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
            LTV, NOI, DSCR, 법규 리스크를 사전에 분석하고 은행 제출용 리포트를 준비하세요.
          </p>
          <Link href="/analysis">
            <Button size="lg" variant="secondary" className="gap-2">
              무료로 딜 분석 시작하기
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Landmark className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">BuildMore</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">이용약관</a>
              <a href="#" className="hover:text-foreground transition-colors">개인정보처리방침</a>
              <a href="#" className="hover:text-foreground transition-colors">문의하기</a>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2024 BuildMore. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
