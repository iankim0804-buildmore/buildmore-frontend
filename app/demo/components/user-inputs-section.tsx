"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Loader2,
  FileText,
  Sparkles,
  Building,
  Users,
  ShoppingCart,
  Lightbulb,
  Info,
} from "lucide-react"

// Types
interface PreviewResponse {
  score_delta: number
  reason: string
  item: string
}

interface SubmitResult {
  score_adjustment: {
    score_delta: number
    details: Array<{ item: string; delta: number; reason: string }>
    risk_flags: string[]
  }
  potential_noi: {
    current_monthly_noi: number
    addable_floor_area_m2: number
    additional_monthly_noi: number
    elevator_monthly_increase: number
    elevator_roi_months: number
    exterior_monthly_increase: number
    total_potential_monthly_noi: number
    noi_increase_rate: number
  }
  updated_bankability_score: number
}

interface UserInputsState {
  // Card 1: 임차 현황
  rent_arrear_level: 'none' | 'sometimes' | 'often' | null
  eviction_difficulty: 'easy' | 'normal' | 'hard' | null
  rent_increase_potential: 'yes' | 'normal' | 'no' | null
  // Card 2: 건물 상태
  elevator: 'exists' | 'plan' | 'none' | null
  exterior_remodel: 'yes' | 'no' | null
  equipment_condition: 'good' | 'normal' | 'old' | null
  // Card 3: 매입 조건
  urgent_sale: 'yes' | 'no' | null
  competition: 'none' | 'exists' | null
  road_expansion: 'none' | 'exists' | null
}

interface ScoreDelta {
  field: string
  delta: number
  reason: string
  item: string
}

interface UserInputsSectionProps {
  baseScore: number
  pnu?: string
  totalMonthlyRent: number
  onScoreUpdate?: (newScore: number) => void
}

// Format currency
function formatCurrency(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toLocaleString()}만원`
  }
  return `${value.toLocaleString()}원`
}

// Radio option component
function RadioOption({
  name,
  value,
  label,
  delta,
  selected,
  onChange,
  disabled,
}: {
  name: string
  value: string
  label: string
  delta?: number
  selected: boolean
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <label 
      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all border ${
        selected 
          ? 'bg-primary/10 border-primary/30' 
          : 'bg-secondary/30 border-transparent hover:bg-secondary/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={() => !disabled && onChange(value)}
        className="sr-only"
        disabled={disabled}
      />
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
        selected ? 'border-primary' : 'border-muted-foreground/30'
      }`}>
        {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
      </div>
      <span className="text-sm flex-1">{label}</span>
      {delta !== undefined && delta !== 0 && (
        <span className={`text-xs font-medium ${delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {delta > 0 ? '+' : ''}{delta}점
        </span>
      )}
    </label>
  )
}

// Score Gauge component
function ScoreGauge({ 
  baseScore, 
  currentScore, 
  deltaAnimation,
  isAnimating,
}: { 
  baseScore: number
  currentScore: number
  deltaAnimation: number | null
  isAnimating: boolean
}) {
  const percentage = Math.min(100, Math.max(0, currentScore))
  const delta = currentScore - baseScore
  
  return (
    <div className="p-4 bg-secondary/30 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Bankability Score</span>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold transition-all duration-300 ${isAnimating ? 'scale-110' : ''}`}>
            {currentScore}점
          </span>
          {delta !== 0 && (
            <span className={`text-sm font-semibold ${delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              ({delta > 0 ? '+' : ''}{delta})
            </span>
          )}
          {deltaAnimation !== null && (
            <span 
              className={`text-sm font-bold animate-bounce ${
                deltaAnimation > 0 ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {deltaAnimation > 0 ? '+' : ''}{deltaAnimation}
            </span>
          )}
        </div>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            currentScore >= 70 ? 'bg-emerald-500' :
            currentScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  )
}

// Main component
export function UserInputsSection({
  baseScore,
  pnu,
  totalMonthlyRent,
  onScoreUpdate,
}: UserInputsSectionProps) {
  const [inputs, setInputs] = useState<UserInputsState>({
    rent_arrear_level: null,
    eviction_difficulty: null,
    rent_increase_potential: null,
    elevator: null,
    exterior_remodel: null,
    equipment_condition: null,
    urgent_sale: null,
    competition: null,
    road_expansion: null,
  })
  
  const [scoreDeltas, setScoreDeltas] = useState<Record<string, ScoreDelta>>({})
  const [currentScore, setCurrentScore] = useState(baseScore)
  const [deltaAnimation, setDeltaAnimation] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)
  const [elevatorHint, setElevatorHint] = useState<{ increase: number; roi: number } | null>(null)
  const [roadExpansionWarning, setRoadExpansionWarning] = useState(false)

  // Update current score when deltas change
  useEffect(() => {
    const totalDelta = Object.values(scoreDeltas).reduce((sum, d) => sum + d.delta, 0)
    const newScore = baseScore + totalDelta
    setCurrentScore(newScore)
    onScoreUpdate?.(newScore)
  }, [scoreDeltas, baseScore, onScoreUpdate])

  // Preview API call
  const previewInput = useCallback(async (field: string, value: string) => {
    setIsLoading(field)
    
    try {
      const response = await fetch('/api/user-inputs/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field,
          value,
          pnu: pnu || '',
          total_monthly_rent: totalMonthlyRent,
        }),
      })

      if (response.ok) {
        const data: PreviewResponse = await response.json()
        
        // Update score delta for this field
        setScoreDeltas(prev => ({
          ...prev,
          [field]: {
            field,
            delta: data.score_delta,
            reason: data.reason,
            item: data.item,
          },
        }))

        // Show animation
        if (data.score_delta !== 0) {
          setDeltaAnimation(data.score_delta)
          setIsAnimating(true)
          setTimeout(() => {
            setDeltaAnimation(null)
            setIsAnimating(false)
          }, 1000)
        }

        // Special hints
        if (field === 'elevator' && value === 'plan') {
          setElevatorHint({
            increase: Math.round(totalMonthlyRent * 0.12),
            roi: 133,
          })
        } else if (field === 'elevator') {
          setElevatorHint(null)
        }

        if (field === 'road_expansion' && value === 'exists') {
          setRoadExpansionWarning(true)
        } else if (field === 'road_expansion') {
          setRoadExpansionWarning(false)
        }
      }
    } catch (error) {
      console.error('Preview error:', error)
    }
    
    setIsLoading(null)
  }, [pnu, totalMonthlyRent])

  // Handle input change
  const handleInputChange = useCallback((field: keyof UserInputsState, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }))
    previewInput(field, value)
  }, [previewInput])

  // Submit all inputs
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/user-inputs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pnu: pnu || '',
          total_monthly_rent: totalMonthlyRent,
          inputs,
        }),
      })

      if (response.ok) {
        const data: SubmitResult = await response.json()
        setSubmitResult(data)
        setCurrentScore(data.updated_bankability_score)
        onScoreUpdate?.(data.updated_bankability_score)
      }
    } catch (error) {
      console.error('Submit error:', error)
    }
    
    setIsSubmitting(false)
  }, [inputs, pnu, totalMonthlyRent, onScoreUpdate])

  // Check if any inputs are filled
  const hasInputs = Object.values(inputs).some(v => v !== null)
  const allFilled = Object.values(inputs).every(v => v !== null)

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <Card className="border-chart-1/20 bg-chart-1/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded bg-chart-1/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-chart-1" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">현장 정보 입력</h3>
              <p className="text-xs text-muted-foreground">
                현장 정보를 입력하면 분석 정확도가 높아집니다.
                <br />
                어떤 데이터도 대체할 수 없는 핵심 정보입니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Gauge */}
      <ScoreGauge
        baseScore={baseScore}
        currentScore={currentScore}
        deltaAnimation={deltaAnimation}
        isAnimating={isAnimating}
      />

      {/* Max potential score hint */}
      {!submitResult && (
        <p className="text-xs text-muted-foreground text-center">
          현재 점수 {baseScore}점 → 입력 시 최대 {baseScore + 25}점 가능
        </p>
      )}

      {/* Input Cards */}
      {!submitResult && (
        <div className="space-y-4">
          {/* Card 1: 임차 현황 */}
          <Card className={`border-border transition-all ${hasInputs && !submitResult ? 'border-dashed' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-chart-2" />
                임차 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 월세 연체 여부 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">월세 연체 여부</p>
                <div className="grid grid-cols-3 gap-2">
                  <RadioOption
                    name="rent_arrear"
                    value="none"
                    label="없음"
                    delta={8}
                    selected={inputs.rent_arrear_level === 'none'}
                    onChange={() => handleInputChange('rent_arrear_level', 'none')}
                    disabled={isLoading === 'rent_arrear_level'}
                  />
                  <RadioOption
                    name="rent_arrear"
                    value="sometimes"
                    label="가끔"
                    delta={-5}
                    selected={inputs.rent_arrear_level === 'sometimes'}
                    onChange={() => handleInputChange('rent_arrear_level', 'sometimes')}
                    disabled={isLoading === 'rent_arrear_level'}
                  />
                  <RadioOption
                    name="rent_arrear"
                    value="often"
                    label="자주"
                    delta={-15}
                    selected={inputs.rent_arrear_level === 'often'}
                    onChange={() => handleInputChange('rent_arrear_level', 'often')}
                    disabled={isLoading === 'rent_arrear_level'}
                  />
                </div>
              </div>

              {/* 명도 난이도 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">명도 난이도</p>
                <div className="grid grid-cols-3 gap-2">
                  <RadioOption
                    name="eviction"
                    value="easy"
                    label="쉬움"
                    delta={5}
                    selected={inputs.eviction_difficulty === 'easy'}
                    onChange={() => handleInputChange('eviction_difficulty', 'easy')}
                    disabled={isLoading === 'eviction_difficulty'}
                  />
                  <RadioOption
                    name="eviction"
                    value="normal"
                    label="보통"
                    delta={0}
                    selected={inputs.eviction_difficulty === 'normal'}
                    onChange={() => handleInputChange('eviction_difficulty', 'normal')}
                    disabled={isLoading === 'eviction_difficulty'}
                  />
                  <RadioOption
                    name="eviction"
                    value="hard"
                    label="어려움"
                    delta={-8}
                    selected={inputs.eviction_difficulty === 'hard'}
                    onChange={() => handleInputChange('eviction_difficulty', 'hard')}
                    disabled={isLoading === 'eviction_difficulty'}
                  />
                </div>
              </div>

              {/* 임대료 인상 여력 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">임대료 인상 여력</p>
                <div className="grid grid-cols-3 gap-2">
                  <RadioOption
                    name="rent_increase"
                    value="yes"
                    label="있음"
                    delta={5}
                    selected={inputs.rent_increase_potential === 'yes'}
                    onChange={() => handleInputChange('rent_increase_potential', 'yes')}
                    disabled={isLoading === 'rent_increase_potential'}
                  />
                  <RadioOption
                    name="rent_increase"
                    value="normal"
                    label="보통"
                    delta={0}
                    selected={inputs.rent_increase_potential === 'normal'}
                    onChange={() => handleInputChange('rent_increase_potential', 'normal')}
                    disabled={isLoading === 'rent_increase_potential'}
                  />
                  <RadioOption
                    name="rent_increase"
                    value="no"
                    label="없음"
                    delta={-3}
                    selected={inputs.rent_increase_potential === 'no'}
                    onChange={() => handleInputChange('rent_increase_potential', 'no')}
                    disabled={isLoading === 'rent_increase_potential'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: 건물 상태 */}
          <Card className={`border-border transition-all ${hasInputs && !submitResult ? 'border-dashed' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building className="w-4 h-4 text-chart-3" />
                건물 상태
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 엘리베이터 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">엘리베이터</p>
                <div className="space-y-2">
                  <RadioOption
                    name="elevator"
                    value="exists"
                    label="있음"
                    delta={3}
                    selected={inputs.elevator === 'exists'}
                    onChange={() => handleInputChange('elevator', 'exists')}
                    disabled={isLoading === 'elevator'}
                  />
                  <RadioOption
                    name="elevator"
                    value="plan"
                    label="없음 — 설치 계획 있음"
                    delta={5}
                    selected={inputs.elevator === 'plan'}
                    onChange={() => handleInputChange('elevator', 'plan')}
                    disabled={isLoading === 'elevator'}
                  />
                  <RadioOption
                    name="elevator"
                    value="none"
                    label="없음 — 설치 계획 없음"
                    delta={0}
                    selected={inputs.elevator === 'none'}
                    onChange={() => handleInputChange('elevator', 'none')}
                    disabled={isLoading === 'elevator'}
                  />
                </div>
                {elevatorHint && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        엘리베이터 설치 시 월 +{formatCurrency(elevatorHint.increase)} NOI 상승 예상
                        <br />
                        투자 회수 기간: 약 {elevatorHint.roi}개월
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 외관 리모델링 계획 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">외관 리모델링 계획</p>
                <div className="grid grid-cols-2 gap-2">
                  <RadioOption
                    name="exterior"
                    value="yes"
                    label="있음"
                    delta={3}
                    selected={inputs.exterior_remodel === 'yes'}
                    onChange={() => handleInputChange('exterior_remodel', 'yes')}
                    disabled={isLoading === 'exterior_remodel'}
                  />
                  <RadioOption
                    name="exterior"
                    value="no"
                    label="없음"
                    delta={0}
                    selected={inputs.exterior_remodel === 'no'}
                    onChange={() => handleInputChange('exterior_remodel', 'no')}
                    disabled={isLoading === 'exterior_remodel'}
                  />
                </div>
              </div>

              {/* 주요 설비 상태 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">주요 설비 상태</p>
                <div className="grid grid-cols-3 gap-2">
                  <RadioOption
                    name="equipment"
                    value="good"
                    label="양호"
                    delta={2}
                    selected={inputs.equipment_condition === 'good'}
                    onChange={() => handleInputChange('equipment_condition', 'good')}
                    disabled={isLoading === 'equipment_condition'}
                  />
                  <RadioOption
                    name="equipment"
                    value="normal"
                    label="보통"
                    delta={0}
                    selected={inputs.equipment_condition === 'normal'}
                    onChange={() => handleInputChange('equipment_condition', 'normal')}
                    disabled={isLoading === 'equipment_condition'}
                  />
                  <RadioOption
                    name="equipment"
                    value="old"
                    label="노후"
                    delta={-5}
                    selected={inputs.equipment_condition === 'old'}
                    onChange={() => handleInputChange('equipment_condition', 'old')}
                    disabled={isLoading === 'equipment_condition'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: 매입 조건 */}
          <Card className={`border-border transition-all ${hasInputs && !submitResult ? 'border-dashed' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-chart-4" />
                매입 조건
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 급매 여부 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">급매 여부</p>
                <div className="grid grid-cols-2 gap-2">
                  <RadioOption
                    name="urgent"
                    value="yes"
                    label="급매"
                    selected={inputs.urgent_sale === 'yes'}
                    onChange={() => handleInputChange('urgent_sale', 'yes')}
                    disabled={isLoading === 'urgent_sale'}
                  />
                  <RadioOption
                    name="urgent"
                    value="no"
                    label="일반 매물"
                    selected={inputs.urgent_sale === 'no'}
                    onChange={() => handleInputChange('urgent_sale', 'no')}
                    disabled={isLoading === 'urgent_sale'}
                  />
                </div>
              </div>

              {/* 경쟁 입찰 여부 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">경쟁 입찰 여부</p>
                <div className="grid grid-cols-2 gap-2">
                  <RadioOption
                    name="competition"
                    value="none"
                    label="없음"
                    delta={0}
                    selected={inputs.competition === 'none'}
                    onChange={() => handleInputChange('competition', 'none')}
                    disabled={isLoading === 'competition'}
                  />
                  <RadioOption
                    name="competition"
                    value="exists"
                    label="있음"
                    delta={-3}
                    selected={inputs.competition === 'exists'}
                    onChange={() => handleInputChange('competition', 'exists')}
                    disabled={isLoading === 'competition'}
                  />
                </div>
              </div>

              {/* 도로 확폭 계획 인지 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">도로 확폭 계획 인지</p>
                <div className="grid grid-cols-2 gap-2">
                  <RadioOption
                    name="road"
                    value="none"
                    label="없음"
                    delta={0}
                    selected={inputs.road_expansion === 'none'}
                    onChange={() => handleInputChange('road_expansion', 'none')}
                    disabled={isLoading === 'road_expansion'}
                  />
                  <RadioOption
                    name="road"
                    value="exists"
                    label="있음"
                    delta={-7}
                    selected={inputs.road_expansion === 'exists'}
                    onChange={() => handleInputChange('road_expansion', 'exists')}
                    disabled={isLoading === 'road_expansion'}
                  />
                </div>
                {roadExpansionWarning && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        도로 확폭 계획으로 실제 대지면적이 줄어들 수 있습니다.
                        <br />
                        심층 리포트에서 정확한 면적 감소를 확인하세요.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button 
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={!hasInputs || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                분석 결과 반영
              </>
            )}
          </Button>
        </div>
      )}

      {/* Result Card */}
      {submitResult && (
        <div className="space-y-4">
          <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                현장 정보 반영 분석 결과
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Score change */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-background rounded-lg border border-border">
                <span className="text-sm font-medium">Bankability Score</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{baseScore}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-lg font-bold">{submitResult.updated_bankability_score}점</span>
                  <Badge className={submitResult.score_adjustment.score_delta >= 0 ? 'bg-emerald-500' : 'bg-red-500'}>
                    {submitResult.score_adjustment.score_delta >= 0 ? '+' : ''}{submitResult.score_adjustment.score_delta}점
                  </Badge>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                {submitResult.score_adjustment.details.map((detail, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {detail.delta >= 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span className="flex-1">{detail.item}</span>
                    <span className={`font-medium ${detail.delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {detail.delta >= 0 ? '+' : ''}{detail.delta}점
                    </span>
                  </div>
                ))}
              </div>

              {/* Potential NOI */}
              <div className="p-3 bg-chart-2/5 rounded-lg border border-chart-2/10">
                <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  잠재 NOI 분석
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">현재 월 NOI</span>
                    <span className="font-medium">{formatCurrency(submitResult.potential_noi.current_monthly_noi)}</span>
                  </div>
                  {submitResult.potential_noi.additional_monthly_noi > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>+ 추가 연면적</span>
                      <span>+{formatCurrency(submitResult.potential_noi.additional_monthly_noi)} ({submitResult.potential_noi.addable_floor_area_m2.toFixed(1)}㎡)</span>
                    </div>
                  )}
                  {submitResult.potential_noi.elevator_monthly_increase > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>+ 엘리베이터</span>
                      <span>+{formatCurrency(submitResult.potential_noi.elevator_monthly_increase)}</span>
                    </div>
                  )}
                  {submitResult.potential_noi.exterior_monthly_increase > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>+ 외관 리모델링</span>
                      <span>+{formatCurrency(submitResult.potential_noi.exterior_monthly_increase)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2 flex justify-between font-semibold">
                    <span>잠재 월 NOI</span>
                    <span>
                      {formatCurrency(submitResult.potential_noi.total_potential_monthly_noi)}
                      <span className="text-emerald-600 ml-1">(+{submitResult.potential_noi.noi_increase_rate.toFixed(0)}%)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Flags */}
              {submitResult.score_adjustment.risk_flags.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    리스크 플래그
                  </p>
                  <ul className="space-y-1">
                    {submitResult.score_adjustment.risk_flags.map((flag, i) => (
                      <li key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1">
                        <span className="shrink-0">·</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report CTA */}
          <div className="grid grid-cols-2 gap-3">
            {/* Basic Report */}
            <Card className="border-border bg-white">
              <CardContent className="p-4 space-y-3">
                <h4 className="text-sm font-semibold">기본 리포트</h4>
                <p className="text-xs text-muted-foreground">은행 제출용 PDF</p>
                <p className="text-xs text-muted-foreground">10~15페이지</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>· 담보가치 분석</li>
                  <li>· 잠재 NOI 분석</li>
                  <li>· DSCR/LTV</li>
                  <li>· 금융/세금</li>
                </ul>
                <Button size="sm" variant="outline" className="w-full gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  PDF 생성
                </Button>
              </CardContent>
            </Card>

            {/* Deep Report */}
            <Card className="border-primary/30 bg-primary/5 relative">
              <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px]">
                <Sparkles className="w-3 h-3 mr-1" />
                전문 투자자의 선택
              </Badge>
              <CardContent className="p-4 space-y-3">
                <h4 className="text-sm font-semibold">심층 리포트</h4>
                <p className="text-xs text-muted-foreground">투자자용 PDF</p>
                <p className="text-xs text-muted-foreground">25~35페이지</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>+ 건축 리스크 분석</li>
                  <li>+ 민감도 분석</li>
                  <li>+ EXIT CAP RATE</li>
                  <li>+ Waterfall 설계</li>
                </ul>
                <div className="text-sm font-bold text-foreground mb-1">30,000원</div>
                <Button size="sm" className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                  <FileText className="w-3.5 h-3.5" />
                  심층 리포트 생성
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
