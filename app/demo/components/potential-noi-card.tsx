"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, TrendingUp, Lightbulb } from "lucide-react"

export interface PotentialNOIResult {
  current_monthly_noi: number
  addable_floor_area_m2: number
  additional_monthly_noi: number
  elevator_monthly_increase: number
  elevator_roi_months: number
  exterior_monthly_increase: number
  total_potential_monthly_noi: number
  noi_increase_rate: number
}

export interface PotentialNOICardProps {
  result: PotentialNOIResult
  riskFlags: string[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value)
}

export function PotentialNOICard({ result, riskFlags }: PotentialNOICardProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          <CardTitle>잠재 NOI 분석</CardTitle>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary">
          +{(result.noi_increase_rate * 100).toFixed(0)}%
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current NOI */}
        <div className="flex items-baseline justify-between pb-3 border-b border-primary/10">
          <span className="text-sm text-muted-foreground">현재 월 NOI</span>
          <span className="text-lg font-semibold text-foreground">
            {formatCurrency(result.current_monthly_noi)}
          </span>
        </div>

        {/* Breakdown */}
        <div className="space-y-2 text-sm">
          {result.additional_monthly_noi > 0 && (
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground">+ 추가 연면적</span>
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-foreground">
                  +{formatCurrency(result.additional_monthly_noi)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({result.addable_floor_area_m2.toFixed(1)}㎡)
                </span>
              </div>
            </div>
          )}

          {result.elevator_monthly_increase > 0 && (
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground">+ 엘리베이터</span>
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-foreground">
                  +{formatCurrency(result.elevator_monthly_increase)}
                </span>
                <span className="text-xs text-muted-foreground">
                  (회수기간 {result.elevator_roi_months}개월)
                </span>
              </div>
            </div>
          )}

          {result.exterior_monthly_increase > 0 && (
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground">+ 외벽 리모델링</span>
              <span className="font-medium text-foreground">
                +{formatCurrency(result.exterior_monthly_increase)}
              </span>
            </div>
          )}
        </div>

        {/* Total Potential NOI */}
        <div className="flex items-baseline justify-between pt-3 border-t border-primary/10">
          <span className="text-sm font-medium text-foreground">잠재 월 NOI</span>
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-bold text-primary">
              {formatCurrency(result.total_potential_monthly_noi)}
            </span>
            <span className="text-sm font-semibold text-emerald-600">
              +{(result.noi_increase_rate * 100).toFixed(0)}% ↑
            </span>
          </div>
        </div>

        {/* Risk Flags */}
        {riskFlags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-amber-200 bg-amber-50 rounded p-3 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">리스크</span>
            </div>
            <ul className="space-y-1">
              {riskFlags.map((flag, i) => (
                <li key={i} className="text-sm text-amber-800">
                  · {flag}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
