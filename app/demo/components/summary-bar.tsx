"use client"

import { Edit3, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

// Format number to Korean style (억/만)
function formatToKorean(value: number): string {
  if (value >= 100000000) {
    const billions = value / 100000000
    return `${billions % 1 === 0 ? billions : billions.toFixed(1)}억`
  } else if (value >= 10000) {
    const millions = value / 10000
    return `${millions.toLocaleString()}만`
  }
  return value.toLocaleString()
}

export interface SummaryBarProps {
  dealAmount: number
  equity: number
  interestRate: number
  loanPeriod: number
  buildingInfo: {
    rentArreaLevel?: string
    evictionDifficulty?: string
    rentIncreaseRoom?: string
    hasElevator?: string
    exteriorRemodel?: string
    facilityCondition?: string
  }
  bankabilityScore: number
  onEditClick: () => void
  riskFlags?: string[]
}

export function SummaryBar({
  dealAmount,
  equity,
  interestRate,
  loanPeriod,
  buildingInfo,
  bankabilityScore,
  onEditClick,
  riskFlags = [],
}: SummaryBarProps) {
  return (
    <div className="sticky top-14 z-40 bg-card border-b border-border px-4 py-2.5 flex items-center gap-6 h-16">
      {/* Left: Deal Conditions Summary */}
      <div className="flex items-center gap-4 text-sm flex-shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">💼 매입가</span>
          <span className="font-medium">{formatToKorean(dealAmount)}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">자기자본</span>
          <span className="font-medium">{formatToKorean(equity)}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">금리</span>
          <span className="font-medium">{(interestRate * 100).toFixed(1)}%</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">기간</span>
          <span className="font-medium">{loanPeriod}년</span>
        </div>
      </div>

      {/* Center: Building Info Summary */}
      <div className="flex items-center gap-2 text-xs flex-shrink-0">
        <span className="text-muted-foreground">🏢</span>
        {Object.entries(buildingInfo).length === 0 || Object.values(buildingInfo).every((v) => !v) ? (
          <span className="text-muted-foreground">미입력</span>
        ) : (
          <div className="flex gap-1.5">
            {buildingInfo.rentArreaLevel && (
              <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                월세연체: {buildingInfo.rentArreaLevel}
              </span>
            )}
            {buildingInfo.evictionDifficulty && (
              <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                명도: {buildingInfo.evictionDifficulty}
              </span>
            )}
            {buildingInfo.hasElevator && (
              <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                엘베: {buildingInfo.hasElevator}
              </span>
            )}
            {buildingInfo.facilityCondition && (
              <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                설비: {buildingInfo.facilityCondition}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Bankability Score + Risks + Edit Button */}
      <div className="ml-auto flex items-center gap-4 flex-shrink-0">
        {riskFlags.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            <span>{riskFlags.length}개 리스크</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Bankability Score:</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">{bankabilityScore}점</span>
            <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(bankabilityScore / 100) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 flex-shrink-0"
          onClick={onEditClick}
        >
          <Edit3 className="w-3.5 h-3.5" />
          입력 수정
        </Button>
      </div>
    </div>
  )
}
