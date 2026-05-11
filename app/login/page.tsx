'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setIsLoading(true)
    // TODO: 실제 로그인 API 연동
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    toast.info('로그인 기능은 준비 중입니다.')
  }

  const handleKakaoLogin = () => {
    // TODO: 카카오 로그인 연동
    toast.info('카카오 로그인은 준비 중입니다.')
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
          <Link href="/login" className="text-sm font-medium text-foreground">
            로그인
          </Link>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Back link */}
          <Link href="/analysis" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            분석 페이지로 돌아가기
          </Link>

          {/* Login Card */}
          <div className="bg-white border border-border rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">로그인</h1>
            <p className="text-sm text-muted-foreground mb-8">계정에 로그인하여 분석 기록을 저장하세요.</p>

            {/* Kakao Login */}
            <button
              type="button"
              onClick={handleKakaoLogin}
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
                <span className="bg-white px-3 text-xs text-muted-foreground">또는</span>
              </div>
            </div>

            {/* Email/Password Login */}
            <form onSubmit={handleLogin} className="space-y-4">
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
                    placeholder="비밀번호를 입력하세요"
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

              <div className="flex items-center justify-end">
                <button type="button" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  비밀번호 찾기
                </button>
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? '로그인 중...' : '로그인'}
              </Button>
            </form>

            {/* Signup Link */}
            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                아직 계정이 없으신가요?{' '}
                <Link href="/signup" className="text-foreground font-medium hover:underline">
                  회원가입
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
