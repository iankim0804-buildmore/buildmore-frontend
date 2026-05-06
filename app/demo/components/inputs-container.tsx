"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { SummaryBar, type SummaryBarProps } from "./summary-bar"
import { InputDrawer, type BuildingInputs } from "./input-drawer"
import { PotentialNOICard, type PotentialNOIResult } from "./potential-noi-card"

interface SubmitResponse {
  score_adjustment: {
    score_delta: number
    details: Array<{ item: string; delta: number; reason: string }>
    risk_flags: string[]
  }
  potential_noi: PotentialNOIResult
  updated_bankability_score: number
}

export interface InputsContainerProps {
  baseScore: number
  dealAmount: number
  equity: number
  interestRate: number
  loanPeriod: number
  onScoreUpdate: (newScore: number) => void
  onBankingabilityUpdate?: (bankability: number) => void
  pnu?: string
  address?: string
}

export function InputsContainer({
  baseScore,
  dealAmount: initialDealAmount,
  equity: initialEquity,
  interestRate: initialRate,
  loanPeriod: initialPeriod,
  onScoreUpdate,
  onBankingabilityUpdate,
  pnu,
  address,
}: InputsContainerProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Deal inputs
  const [dealAmount, setDealAmount] = useState(initialDealAmount)
  const [equity, setEquity] = useState(initialEquity)
  const [interestRate, setInterestRate] = useState(initialRate)
  const [loanPeriod, setLoanPeriod] = useState(initialPeriod)

  // Building inputs
  const [buildingInputs, setBuildingInputs] = useState<BuildingInputs>({
    rent_arrear_level: null,
    eviction_difficulty: null,
    rent_increase_room: null,
    has_elevator: null,
    exterior_remodel_plan: null,
    facility_condition: null,
    is_distressed_sale: null,
    has_competing_buyers: null,
    aware_of_road_widening: null,
  })

  // API states
  const [previewDelta, setPreviewDelta] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null)
  const [riskFlags, setRiskFlags] = useState<string[]>([])
  const [currentScore, setCurrentScore] = useState(baseScore)

  // Session ID for tracking
  const [sessionId, setSessionId] = useState<string>("")
  useEffect(() => {
    if (!sessionId) {
      const stored = localStorage.getItem("buildmore_session_id")
      if (stored) {
        setSessionId(stored)
      } else {
        const newId = crypto.randomUUID()
        localStorage.setItem("buildmore_session_id", newId)
        setSessionId(newId)
      }
    }
  }, [sessionId])

  // Handle building input change with real-time preview
  const handleBuildingInputChange = useCallback(
    async (key: keyof BuildingInputs, value: string | null) => {
      setBuildingInputs((prev) => ({
        ...prev,
        [key]: value,
      }))

      // Call preview API
      if (sessionId) {
        try {
          const response = await fetch("/api/user-inputs/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              field: key,
              value,
              session_id: sessionId,
              total_monthly_rent: 28000000, // From demo context
            }),
          })

          if (response.ok) {
            const data = await response.json()
            setPreviewDelta((prev) => prev + data.score_delta)
          }
        } catch (error) {
          console.log("[v0] Preview API error:", error)
        }
      }
    },
    [sessionId]
  )

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!sessionId || !pnu) {
      toast.error("세션 정보가 없습니다")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/user-inputs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pnu,
          session_id: sessionId,
          ...buildingInputs,
          purchase_price: dealAmount,
          equity_amount: equity,
          loan_period_years: loanPeriod,
          total_monthly_rent: 28000000,
        }),
      })

      if (!response.ok) {
        throw new Error("Submit failed")
      }

      const data = (await response.json()) as SubmitResponse

      // Update state
      setSubmitResult(data)
      setRiskFlags(data.score_adjustment.risk_flags)
      setCurrentScore(data.updated_bankability_score)
      onScoreUpdate(data.updated_bankability_score)
      onBankingabilityUpdate?.(data.updated_bankability_score)

      // Close drawer
      setIsDrawerOpen(false)

      toast.success("분석이 완료되었습니다!")
    } catch (error) {
      console.log("[v0] Submit error:", error)
      toast.error("제출에 실패했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }, [sessionId, pnu, buildingInputs, dealAmount, equity, loanPeriod, onScoreUpdate, onBankingabilityUpdate])

  // Handle reset
  const handleReset = useCallback(() => {
    setBuildingInputs({
      rent_arrear_level: null,
      eviction_difficulty: null,
      rent_increase_room: null,
      has_elevator: null,
      exterior_remodel_plan: null,
      facility_condition: null,
      is_distressed_sale: null,
      has_competing_buyers: null,
      aware_of_road_widening: null,
    })
    setPreviewDelta(0)
    setSubmitResult(null)
    setRiskFlags([])
  }, [])

  const buildingInfoDisplay = {
    rentArreaLevel: buildingInputs.rent_arrear_level
      ? { none: "없음", sometimes: "가끔", often: "자주" }[buildingInputs.rent_arrear_level]
      : undefined,
    evictionDifficulty: buildingInputs.eviction_difficulty
      ? { easy: "쉬움", medium: "보통", hard: "어려움" }[buildingInputs.eviction_difficulty]
      : undefined,
    rentIncreaseRoom: buildingInputs.rent_increase_room
      ? { yes: "있음", medium: "보통", no: "없음" }[buildingInputs.rent_increase_room]
      : undefined,
    hasElevator: buildingInputs.has_elevator
      ? { yes: "있음", planned: "설치예정", no: "없음" }[buildingInputs.has_elevator]
      : undefined,
    exteriorRemodel: buildingInputs.exterior_remodel_plan
      ? { planned: "예정", uncertain: "미정", no: "없음" }[buildingInputs.exterior_remodel_plan]
      : undefined,
    facilityCondition: buildingInputs.facility_condition
      ? { good: "양호", medium: "보통", old: "노후" }[buildingInputs.facility_condition]
      : undefined,
  }

  return (
    <>
      {/* Summary Bar - Always visible */}
      <SummaryBar
        dealAmount={dealAmount}
        equity={equity}
        interestRate={interestRate}
        loanPeriod={loanPeriod}
        buildingInfo={buildingInfoDisplay}
        bankabilityScore={currentScore}
        onEditClick={() => setIsDrawerOpen(true)}
        riskFlags={riskFlags}
      />

      {/* Input Drawer */}
      <InputDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        dealAmount={dealAmount}
        equity={equity}
        interestRate={interestRate}
        loanPeriod={loanPeriod}
        onDealAmountChange={setDealAmount}
        onEquityChange={setEquity}
        onInterestRateChange={setInterestRate}
        onLoanPeriodChange={setLoanPeriod}
        buildingInputs={buildingInputs}
        onBuildingInputChange={handleBuildingInputChange}
        previewDelta={previewDelta}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />

      {/* Potential NOI Card - Shows after submission */}
      {submitResult && (
        <PotentialNOICard
          result={submitResult.potential_noi}
          riskFlags={submitResult.score_adjustment.risk_flags}
        />
      )}
    </>
  )
}
