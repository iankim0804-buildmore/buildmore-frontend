import Link from 'next/link'
import { ArrowLeft, Building2, TrendingUp, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'About | BUILDMORE',
  description: '빌드모어 - 상업용 부동산 투자 분석 플랫폼 소개',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-[66px] bg-white border-b border-border px-5 flex items-center justify-between">
        <Link href="/" className="text-[22px] font-extrabold text-foreground tracking-tight hover:opacity-80 transition-opacity">
          BUILDMORE
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/about" className="text-sm font-medium text-foreground">
            About
          </Link>
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            로그인
          </Link>
        </nav>
      </header>

      {/* Back link */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <Link href="/analysis" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          분석 페이지로 돌아가기
        </Link>
      </div>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-foreground mb-6 leading-tight">
          상업용 부동산 투자,<br />
          데이터로 더 현명하게
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          빌드모어는 복잡한 상업용 부동산 투자 의사결정을 단순화합니다. 
          실시간 시장 데이터와 AI 기반 분석으로 최적의 투자 타이밍과 조건을 찾아드립니다.
        </p>
      </section>

      {/* Image Placeholder */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border border-border">
          <div className="text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">서비스 소개 이미지</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-foreground mb-10">빌드모어가 제공하는 가치</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 bg-white border border-border rounded-xl">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">실시간 시장 분석</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              최신 거래 데이터와 시장 동향을 실시간으로 분석하여 투자 판단에 필요한 인사이트를 제공합니다.
            </p>
          </div>

          <div className="p-6 bg-white border border-border rounded-xl">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">리스크 평가</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              DSCR, LTV, Cap Rate 등 핵심 금융 지표를 자동으로 계산하여 투자 리스크를 명확히 보여줍니다.
            </p>
          </div>

          <div className="p-6 bg-white border border-border rounded-xl">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">입지 분석</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              역세권, 상권 특성, 유동인구 등 입지 요소를 종합 분석하여 임대 수익 안정성을 평가합니다.
            </p>
          </div>

          <div className="p-6 bg-white border border-border rounded-xl">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">AI 어시스턴트</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              복잡한 부동산 용어와 계산을 AI가 쉽게 설명해 드립니다. 궁금한 점을 자유롭게 질문하세요.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-foreground text-background rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold mb-4">지금 바로 시작하세요</h2>
          <p className="text-background/70 mb-6">무료로 첫 번째 딜을 분석해 보세요.</p>
          <Link href="/analysis">
            <Button variant="secondary" size="lg">
              무료 분석 시작하기
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>2024 BUILDMORE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
