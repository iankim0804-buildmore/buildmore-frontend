"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Loader2 } from "lucide-react"

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

export interface BuildingInputs {
  rent_arrear_level: 'none' | 'sometimes' | 'often' | null
  eviction_difficulty: 'easy' | 'medium' | 'hard' | null
  rent_increase_room: 'yes' | 'medium' | 'no' | null
  has_elevator: 'yes' | 'planned' | 'no' | null
  exterior_remodel_plan: 'planned' | 'uncertain' | 'no' | null
  facility_condition: 'good' | 'medium' | 'old' | null
  is_distressed_sale: 'yes' | 'normal' | null
  has_competing_buyers: 'yes' | 'no' | null
  aware_of_road_widening: 'yes' | 'no' | null
}

export interface InputDrawerProps {
  isOpen: boolean
  onClose: () => void
  dealAmount: number
  equity: number
  interestRate: number
  loanPeriod: number
  onDealAmountChange: (value: number) => void
  onEquityChange: (value: number) => void
  onInterestRateChange: (value: number) => void
  onLoanPeriodChange: (value: number) => void
  buildingInputs: BuildingInputs
  onBuildingInputChange: (key: keyof BuildingInputs, value: string | null) => void
  previewDelta: number
  isSubmitting: boolean
  onSubmit: () => void
  onReset: () => void
}

// Toggle button with color coding
function ToggleButton({
  label,
  isSelected,
  sentiment,
  onClick,
}: {
  label: string
  isSelected: boolean
  sentiment: 'positive' | 'negative' | 'neutral'
  onClick: () => void
}) {
  let bgClass = "bg-muted text-muted-foreground border-border"
  if (isSelected) {
    if (sentiment === 'positive') bgClass = "bg-emerald-500 text-white border-emerald-600"
    else if (sentiment === 'negative') bgClass = "bg-red-500 text-white border-red-600"
    else bgClass = "bg-primary text-primary-foreground border-primary"
  }

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded border text-sm font-medium transition-colors ${bgClass} hover:opacity-90`}
    >
      {label}
      {isSelected && <span className="ml-1">✓</span>}
    </button>
  )
}

export function InputDrawer({
  isOpen,
  onClose,
  dealAmount,
  equity,
  interestRate,
  loanPeriod,
  onDealAmountChange,
  onEquityChange,
  onInterestRateChange,
  onLoanPeriodChange,
  buildingInputs,
  onBuildingInputChange,
  previewDelta,
  isSubmitting,
  onSubmit,
  onReset,
}: InputDrawerProps) {
  const [dealAmountStr, setDealAmountStr] = useState(formatToKorean(dealAmount))
  const [equityStr, setEquityStr] = useState(formatToKorean(equity))
  const [rateStr, setRateStr] = useState((interestRate * 100).toFixed(1))
  const [periodStr, setPeriodStr] = useState(loanPeriod.toString())

  // Update local state when props change
  useEffect(() => {
    if (isOpen) {
      setDealAmountStr(formatToKorean(dealAmount))
      setEquityStr(formatToKorean(equity))
      setRateStr((interestRate * 100).toFixed(1))
      setPeriodStr(loanPeriod.toString())
    }
  }, [isOpen, dealAmount, equity, interestRate, loanPeriod])

  const handleDealAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d.]/g, '')
    setDealAmountStr(val)
    if (val) {
      const num = parseFloat(val) * 100000000
      onDealAmountChange(num)
    }
  }

  const handleEquityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d.]/g, '')
    setEquityStr(val)
    if (val) {
      const num = parseFloat(val) * 100000000
      onEquityChange(num)
    }
  }

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d.]/g, '')
    setRateStr(val)
    if (val) {
      onInterestRateChange(parseFloat(val) / 100)
    }
  }

  const handlePeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    setPeriodStr(val)
    if (val) {
      onLoanPeriodChange(parseInt(val))
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 top-14"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed left-0 right-0 top-14 bg-white border-b border-border shadow-2xl z-50 animate-in slide-in-from-top duration-300"
        style={{
          height: "calc(100vh - 56px)",
          maxHeight: "calc(100vh - 56px)",
          overflowY: "auto",
        }}
      >
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">딜 조건 및 건물 정보 입력</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2-Column Layout */}
          <div className="grid grid-cols-[40%_60%] gap-8">
            {/* Left Column: Deal Conditions (40%) */}
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">매입가 (억)</label>
                <Input
                  type="number"
                  placeholder="42"
                  value={dealAmountStr}
                  onChange={handleDealAmountChange}
                  step="0.1"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">자기자본 (억)</label>
                <Input
                  type="number"
                  placeholder="15"
                  value={equityStr}
                  onChange={handleEquityChange}
                  step="0.1"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">희망금리 (%)</label>
                <Input
                  type="number"
                  placeholder="4.5"
                  value={rateStr}
                  onChange={handleRateChange}
                  step="0.1"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">대출기간 (년)</label>
                <Input
                  type="number"
                  placeholder="20"
                  value={periodStr}
                  onChange={handlePeriodChange}
                />
              </div>
            </div>

            {/* Right Column: Building Inputs (60%) */}
            <div className="space-y-8">
              {/* Card 1: 임차 현황 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">[임차 현황]</h3>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">월세연체</label>
                  <div className="flex gap-2">
                    <ToggleButton
                      label="없음"
                      isSelected={buildingInputs.rent_arrear_level === 'none'}
                      sentiment="positive"
                      onClick={() => onBuildingInputChange('rent_arrear_level', 'none')}
                    />
                    <ToggleButton
                      label="가끔"
                      isSelected={buildingInputs.rent_arrear_level === 'sometimes'}
                      sentiment="neutral"
                      onClick={() => onBuildingInputChange('rent_arrear_level', 'sometimes')}
                    />
                    <ToggleButton
                      label="자주"
                      isSelected={buildingInputs.rent_arrear_level === 'often'}
                      sentiment="negative"
                      onClick={() => onBuildingInputChange('rent_arrear_level', 'often')}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">명도난이도</label>
                  <div className="flex gap-2">
                    <ToggleButton
                      label="쉬움"
                      isSelected={buildingInputs.eviction_difficulty === 'easy'}
                      sentiment="positive"
                      onClick={() => onBuildingInputChange('eviction_difficulty', 'easy')}
                    />
                    <ToggleButton
                      label="보통"
                      isSelected={buildingInputs.eviction_difficulty === 'medium'}
                      sentiment="neutral"
                      onClick={() => onBuildingInputChange('eviction_difficulty', 'medium')}
                    />
                    <ToggleButton
                      label="어려움"
                      isSelected={buildingInputs.eviction_difficulty === 'hard'}
                      sentiment="negative"
                      onClick={() => onBuildingInputChange('eviction_difficulty', 'hard')}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">임대인상 가능성</label>
                  <div className="flex gap-2">
                    <ToggleButton
                      label="있음"
                      isSelected={buildingInputs.rent_increase_room === 'yes'}
                      sentiment="positive"
                      onClick={() => onBuildingInputChange('rent_increase_room', 'yes')}
                    />
                    <ToggleButton
                      label="보통"
                      isSelected={buildingInputs.rent_increase_room === 'medium'}
                      sentiment="neutral"
                      onClick={() => onBuildingInputChange('rent_increase_room', 'medium')}
                    />
                    <ToggleButton
                      label="없음"
                      isSelected={buildingInputs.rent_increase_room === 'no'}
                      sentiment="negative"
                      onClick={() => onBuildingInputChange('rent_increase_room', 'no')}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: 건물 상태 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">[건물 상태]</h3>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">엘리베이터</label>
                  <div className="flex gap-2">
                    <ToggleButton
                      label="있음"
                      isSelected={buildingInputs.has_elevator === 'yes'}
                      sentiment="positive"
                      onClick={() => onBuildingInputChange('has_elevator', 'yes')}
                    />
                    <ToggleButton
                      label="설치예정"
                      isSelected={buildingInputs.has_elevator === 'planned'}
                      sentiment="neutral"
                      onClick={() => onBuildingInputChange('has_elevator', 'planned')}
                    />
                    <ToggleButton
                      label="없음"
                      isSelected={buildingInputs.has_elevator === 'no'}
                      sentiment="negative"
                      onClick={() => onBuildingInputChange('has_elevator', 'no')}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">외벽/리모델링</label>
                  <div className="flex gap-2">
                    <ToggleButton
                      label="예정"
                      isSelected={buildingInputs.exterior_remodel_plan === 'planned'}
                      sentiment="positive"
                      onClick={() => onBuildingInputChange('exterior_remodel_plan', 'planned')}
                    />
                    <ToggleButton
                      label="미정"
                      isSelected={buildingInputs.exterior_remodel_plan === 'uncertain'}
                      sentiment="neutral"
                      onClick={() => onBuildingInputChange('exterior_remodel_plan', 'uncertain')}
                    />
                    <ToggleButton
                      label="없음"
                      isSelected={buildingInputs.exterior_remodel_plan === 'no'}
                      sentiment="negative"
                      onClick={() => onBuildingInputChange('exterior_remodel_plan', 'no')}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">설비상태</label>
                  <div className="flex gap-2">
                    <ToggleButton
                      label="양호"
                      isSelected={buildingInputs.facility_condition === 'good'}
                      sentiment="positive"
                      onClick={() => onBuildingInputChange('facility_condition', 'good')}
                    />
                    <ToggleButton
                      label="보통"
                      isSelected={buildingInputs.facility_condition === 'medium'}
                      sentiment="neutral"
                      onClick={() => onBuildingInputChange('facility_condition', 'medium')}
                    />
                    <ToggleButton
                      label="노후"
                      isSelected={buildingInputs.facility_condition === 'old'}
                      sentiment="negative"
                      onClick={() => onBuildingInputChange('facility_condition', 'old')}
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: 매입 조건 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">[매입 조건]</h3>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">급매여부</label>
                  <div className="flex gap-2">
                    <ToggleButton
                      label="급매"
                      isSelected={buildingInputs.is_distressed_sale === 'yes'}
                      sentiment="positive"
                      onClick={() => onBuildingInputChange('is_distressed_sale', 'yes')}
                    />
                    <ToggleButton
                      label="일반"
                      isSelected={buildingInputs.is_distressed_sale === 'normal'}
                      sentiment="neutral"
                      onClick={() => onBuildingInputChange('is_distressed_sale', 'normal')}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">경쟁입찰</label>
                  <div className="flex gap-2">
                    <ToggleButton
                      label="없음"
                      isSelected={buildingInputs.has_competing_buyers === 'no'}
                      sentiment="positive"
                      onClick={() => onBuildingInputChange('has_competing_buyers', 'no')}
                    />
                    <ToggleButton
                      label="있음"
                      isSelected={buildingInputs.has_competing_buyers === 'yes'}
                      sentiment="negative"
                      onClick={() => onBuildingInputChange('has_competing_buyers', 'yes')}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">도로확폭</label>
                  <div className="flex gap-2">
                    <ToggleButton
                      label="없음"
                      isSelected={buildingInputs.aware_of_road_widening === 'no'}
                      sentiment="positive"
                      onClick={() => onBuildingInputChange('aware_of_road_widening', 'no')}
                    />
                    <ToggleButton
                      label="있음"
                      isSelected={buildingInputs.aware_of_road_widening === 'yes'}
                      sentiment="negative"
                      onClick={() => onBuildingInputChange('aware_of_road_widening', 'yes')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border mt-8 pt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onReset}
              disabled={isSubmitting}
            >
              초기화
            </Button>

            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Bankability 변화: </span>
                <span className="font-semibold text-primary">
                  {previewDelta >= 0 ? '+' : ''}{previewDelta}점 예상
                </span>
              </div>

              <Button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                적용하기 → 분석에 반영
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
