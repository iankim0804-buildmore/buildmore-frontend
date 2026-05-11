'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error('모든 필드를 입력해주세요.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.')
      return
    }

    if (!agreeTerms) {
      toast.error('이용약관에 동의해주세요.')
      return
    }

    setIsLoading(true)
    // TODO: 실제 회원가입 API 연동
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    toast.info('회원가입 기능은 준비 중입니다.')
  }

  const handleKakaoSignup = () => {
    // TODO: 카카오 회원가입 연동
    toast.info('카카오 회원가입은 준비 중입니다.')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-[66px] bg-white border-b border-border px-5 flex items-center justify-between flex-shrink-0">
        <Link href="/" className="text-[22px] font-extrabold text-foreground tracking-tight hover:opacity-80 transition-opacity">
          BUILDMORE
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            로그인
          </Link>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Back link */}
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            로그인으로 돌아가기
          </Link>

          {/* Signup Card */}
          <div className="bg-white border border-border rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">회원가입</h1>
            <p className="text-sm text-muted-foreground mb-8">빌드모어와 함께 더 현명한 투자를 시작하세요.</p>

            {/* Kakao Signup */}
            <button
              type="button"
              onClick={handleKakaoSignup}
              className="w-full h-12 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-medium rounded-lg flex items-center justify-center gap-2 transition-colors mb-4"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M9 0C4.02944 0 0 3.13401 0 7C0 9.38636 1.55353 11.4957 3.93783 12.7179L2.93795 16.4463C2.85364 16.7568 3.21341 17.0062 3.48601 16.8353L7.84257 14.0006C8.22406 14.0325 8.61032 14.0533 9 14.0533C13.9706 14.0533 18 10.8906 18 7C18 3.13401 13.9706 0 9 0Z" fill="#191919"/>
              </svg>
              카카오로 시작하기
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-muted-foreground">또는 이메일로 가입</span>
              </div>
            </div>

            {/* Email Signup Form */}
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                  이름
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="h-11"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  이메일
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-11"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                  비밀번호
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8자 이상 입력하세요"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">
                  비밀번호 확인
                </label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="h-11"
                />
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAgreeTerms(!agreeTerms)}
                  className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    agreeTerms
                      ? 'bg-foreground border-foreground'
                      : 'border-border hover:border-foreground/50'
                  }`}
                >
                  {agreeTerms && <Check className="w-3 h-3 text-background" />}
                </button>
                <p className="text-sm text-muted-foreground leading-snug">
                  <button type="button" className="text-foreground hover:underline">이용약관</button> 및{' '}
                  <button type="button" className="text-foreground hover:underline">개인정보처리방침</button>에 동의합니다.
                </p>
              </div>

              <Button type="submit" className="w-full h-11 mt-2" disabled={isLoading}>
                {isLoading ? '가입 중...' : '가입하기'}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                이미 계정이 있으신가요?{' '}
                <Link href="/login" className="text-foreground font-medium hover:underline">
                  로그인
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
