"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

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

// Parse Korean format to number
function parseKoreanInput(value: string, unit: '억' | '만'): number {
  const num = parseFloat(value.replace(/,/g, ''))
  if (isNaN(num)) return 0
  if (unit === '억') return num * 100000000
  if (unit === '만') return num * 10000
  return num
}

// Numeric field configuration
interface NumericField {
  key: string
  label: string
  unit: '억' | '만' | '%' | '년'
  defaultValue: number
  step?: number
}

// Dropdown field configuration
interface DropdownField {
  key: string
  label: string
  options: { value: string; label: string; sentiment: 'positive' | 'negative' | 'neutral' }[]
  defaultValue: string
}

const numericFields: NumericField[] = [
  { key: 'deal_amount', label: '매입가', unit: '억', defaultValue: 42 },
  { key: 'deposit', label: '보증금', unit: '억', defaultValue: 3.5 },
  { key: 'monthly_rent', label: '월세', unit: '만', defaultValue: 2800 },
  { key: 'equity', label: '자기자본', unit: '억', defaultValue: 18.5 },
  { key: 'interest_rate', label: '금리', unit: '%', defaultValue: 5.0, step: 0.1 },
  { key: 'loan_period', label: '기간', unit: '년', defaultValue: 20, step: 1 },
]

const dropdownFields: DropdownField[] = [
  {
    key: 'rent_arrear_level',
    label: '월세 연체',
    options: [
      { value: 'none', label: '없음', sentiment: 'positive' },
      { value: 'partial', label: '일부', sentiment: 'negative' },
      { value: 'full', label: '전체', sentiment: 'negative' },
    ],
    defaultValue: 'none',
  },
  {
    key: 'eviction_difficulty',
    label: '명도 난이도',
    options: [
      { value: 'easy', label: '쉬움', sentiment: 'positive' },
      { value: 'normal', label: '보통', sentiment: 'neutral' },
      { value: 'hard', label: '어려움', sentiment: 'negative' },
    ],
    defaultValue: 'normal',
  },
  {
    key: 'rent_increase_room',
    label: '임대료 인상 여지',
    options: [
      { value: 'high', label: '높음', sentiment: 'positive' },
      { value: 'medium', label: '보통', sentiment: 'neutral' },
      { value: 'low', label: '낮음', sentiment: 'negative' },
    ],
    defaultValue: 'medium',
  },
  {
    key: 'has_elevator',
    label: '엘리베이터',
    options: [
      { value: 'yes', label: '있음', sentiment: 'positive' },
      { value: 'installable', label: '설치가능', sentiment: 'neutral' },
      { value: 'no', label: '없음', sentiment: 'negative' },
    ],
    defaultValue: 'yes',
  },
  {
    key: 'exterior_remodel',
    label: '외관 리모델링',
    options: [
      { value: 'unnecessary', label: '불필요', sentiment: 'positive' },
      { value: 'partial', label: '일부', sentiment: 'neutral' },
      { value: 'full', label: '전체', sentiment: 'negative' },
    ],
    defaultValue: 'unnecessary',
  },
  {
    key: 'facility_condition',
    label: '설비 상태',
    options: [
      { value: 'good', label: '양호', sentiment: 'positive' },
      { value: 'normal', label: '보통', sentiment: 'neutral' },
      { value: 'poor', label: '노후', sentiment: 'negative' },
    ],
    defaultValue: 'normal',
  },
  {
    key: 'lease_status',
    label: '임차 현황',
    options: [
      { value: 'full', label: '만실', sentiment: 'positive' },
      { value: 'partial', label: '일부공실', sentiment: 'neutral' },
      { value: 'empty', label: '공실', sentiment: 'negative' },
    ],
    defaultValue: 'full',
  },
  {
    key: 'parking_status',
    label: '주차 여건',
    options: [
      { value: 'sufficient', label: '충분', sentiment: 'positive' },
      { value: 'normal', label: '보통', sentiment: 'neutral' },
      { value: 'insufficient', label: '부족', sentiment: 'negative' },
    ],
    defaultValue: 'normal',
  },
  {
    key: 'road_condition',
    label: '도로 조건',
    options: [
      { value: 'corner', label: '코너', sentiment: 'positive' },
      { value: 'wide', label: '광대로', sentiment: 'positive' },
      { value: 'normal', label: '이면', sentiment: 'neutral' },
      { value: 'narrow', label: '골목', sentiment: 'negative' },
    ],
    defaultValue: 'normal',
  },
]

export interface NumericValues {
  deal_amount: number
  deposit: number
  monthly_rent: number
  equity: number
  interest_rate: number
  loan_period: number
}

export interface DropdownValues {
  rent_arrear_level: string
  eviction_difficulty: string
  rent_increase_room: string
  has_elevator: string
  exterior_remodel: string
  facility_condition: string
  lease_status: string
  parking_status: string
  road_condition: string
}

interface InputControlBarProps {
  onNumericChange: (values: NumericValues) => void
  onDropdownChange: (values: DropdownValues) => void
  isLoading?: boolean
  initialNumericValues?: Partial<NumericValues>
  initialDropdownValues?: Partial<DropdownValues>
}

export function InputControlBar({
  onNumericChange,
  onDropdownChange,
  isLoading = false,
  initialNumericValues,
  initialDropdownValues,
}: InputControlBarProps) {
  // Initialize numeric values
  const [numericValues, setNumericValues] = useState<NumericValues>(() => ({
    deal_amount: initialNumericValues?.deal_amount ?? 4200000000,
    deposit: initialNumericValues?.deposit ?? 350000000,
    monthly_rent: initialNumericValues?.monthly_rent ?? 28000000,
    equity: initialNumericValues?.equity ?? 1850000000,
    interest_rate: initialNumericValues?.interest_rate ?? 5.0,
    loan_period: initialNumericValues?.loan_period ?? 20,
  }))

  // Initialize dropdown values
  const [dropdownValues, setDropdownValues] = useState<DropdownValues>(() => ({
    rent_arrear_level: initialDropdownValues?.rent_arrear_level ?? 'none',
    eviction_difficulty: initialDropdownValues?.eviction_difficulty ?? 'normal',
    rent_increase_room: initialDropdownValues?.rent_increase_room ?? 'medium',
    has_elevator: initialDropdownValues?.has_elevator ?? 'yes',
    exterior_remodel: initialDropdownValues?.exterior_remodel ?? 'unnecessary',
    facility_condition: initialDropdownValues?.facility_condition ?? 'normal',
    lease_status: initialDropdownValues?.lease_status ?? 'full',
    parking_status: initialDropdownValues?.parking_status ?? 'normal',
    road_condition: initialDropdownValues?.road_condition ?? 'normal',
  }))

  // Debounce timer for numeric changes
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Display values for inputs (formatted)
  const [displayValues, setDisplayValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    numericFields.forEach(field => {
      if (field.unit === '억') {
        initial[field.key] = String(numericValues[field.key as keyof NumericValues] / 100000000)
      } else if (field.unit === '만') {
        initial[field.key] = String(numericValues[field.key as keyof NumericValues] / 10000)
      } else {
        initial[field.key] = String(numericValues[field.key as keyof NumericValues])
      }
    })
    return initial
  })

  // Handle numeric input change
  const handleNumericChange = useCallback((key: string, value: string, unit: '억' | '만' | '%' | '년') => {
    setDisplayValues(prev => ({ ...prev, [key]: value }))

    // Convert to actual value
    let actualValue: number
    if (unit === '억') {
      actualValue = parseFloat(value) * 100000000 || 0
    } else if (unit === '만') {
      actualValue = parseFloat(value) * 10000 || 0
    } else {
      actualValue = parseFloat(value) || 0
    }

    const newValues = { ...numericValues, [key]: actualValue }
    setNumericValues(newValues)

    // Debounce the callback (1 second)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      onNumericChange(newValues)
    }, 1000)
  }, [numericValues, onNumericChange])

  // Handle dropdown change (immediate)
  const handleDropdownChange = useCallback((key: string, value: string) => {
    const newValues = { ...dropdownValues, [key]: value }
    setDropdownValues(newValues)
    onDropdownChange(newValues)
  }, [dropdownValues, onDropdownChange])

  // Get sentiment color for select trigger
  const getSentimentColor = (fieldKey: string, value: string): string => {
    const field = dropdownFields.find(f => f.key === fieldKey)
    const option = field?.options.find(o => o.value === value)
    if (!option) return ''
    switch (option.sentiment) {
      case 'positive': return 'border-green-400 bg-green-50'
      case 'negative': return 'border-red-400 bg-red-50'
      default: return ''
    }
  }

  return (
    <div className="bg-card border-b border-border px-4 py-2 flex items-center gap-3 h-[52px] overflow-x-auto">
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-1.5 shrink-0">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">분석 중...</span>
        </div>
      )}

      {/* Numeric inputs */}
      {numericFields.map(field => (
        <div key={field.key} className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap">{field.label}</span>
          <div className="relative">
            <Input
              type="number"
              step={field.step || 0.1}
              value={displayValues[field.key] || ''}
              onChange={(e) => handleNumericChange(field.key, e.target.value, field.unit)}
              className="w-16 h-7 text-xs px-2 pr-6"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              {field.unit}
            </span>
          </div>
        </div>
      ))}

      {/* Divider */}
      <div className="h-6 w-px bg-border shrink-0" />

      {/* Dropdown selects */}
      {dropdownFields.map(field => (
        <div key={field.key} className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap">{field.label}</span>
          <Select
            value={dropdownValues[field.key as keyof DropdownValues]}
            onValueChange={(value) => handleDropdownChange(field.key, value)}
          >
            <SelectTrigger 
              className={`w-[70px] h-7 text-xs ${getSentimentColor(field.key, dropdownValues[field.key as keyof DropdownValues])}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options.map(option => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className={`text-xs ${
                    option.sentiment === 'positive' ? 'text-green-700' :
                    option.sentiment === 'negative' ? 'text-red-700' : ''
                  }`}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  )
}
