'use client'

import { Loader2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RunAnalysisButtonProps {
  onClick: () => void
  isLoading: boolean
  disabled?: boolean
  hasRun?: boolean
}

export function RunAnalysisButton({ 
  onClick, 
  isLoading, 
  disabled = false,
  hasRun = false 
}: RunAnalysisButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`w-full h-10 text-sm font-semibold transition-all ${
        hasRun 
          ? 'bg-muted hover:bg-muted/80 text-foreground border border-border' 
          : 'bg-foreground hover:bg-foreground/90 text-background'
      }`}
      variant={hasRun ? 'outline' : 'default'}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          분석 중...
        </>
      ) : hasRun ? (
        <>
          <Play className="w-4 h-4 mr-2" />
          다시 분석하기
        </>
      ) : (
        <>
          <Play className="w-4 h-4 mr-2" />
          분석 실행
        </>
      )}
    </Button>
  )
}
