"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, MapPin, Building2, Ruler, Calendar, Layers, Banknote, Map } from "lucide-react"

export interface PropertyInfo {
  pnu?: string
  lat?: number
  lng?: number
  land_area_m2?: number
  building_area_m2?: number
  total_floor_area_m2?: number
  floors_above?: number
  floors_below?: number
  built_year?: number
  structure?: string
  main_use?: string
  violation?: boolean
  land_price_per_m2?: number
  zoning?: string
  bcrat?: number
  vlrat?: number
  current_base_rate?: number
  estimated_loan_rate_min?: number
  estimated_loan_rate_max?: number
  errors?: string[]
}

interface PropertyInfoCardProps {
  address: string
  propertyInfo: PropertyInfo | null
  isLoading: boolean
  error: string | null
  compact?: boolean
}

// Format number with comma
function formatNumber(value: number | undefined, suffix?: string): string {
  if (value === undefined || value === null) return '미확인'
  return value.toLocaleString() + (suffix || '')
}

// Format area
function formatArea(value: number | undefined): string {
  if (value === undefined || value === null) return '미확인'
  return `${value.toLocaleString()}㎡`
}

// Format floors
function formatFloors(above: number | undefined, below: number | undefined): string {
  if (above === undefined && below === undefined) return '미확인'
  const parts = []
  if (above) parts.push(`지상${above}층`)
  if (below) parts.push(`지하${below}층`)
  return parts.join('/')
}

// Format rate
function formatRate(value: number | undefined): string {
  if (value === undefined || value === null) return '미확인'
  return `${(value * 100).toFixed(1)}%`
}

// Check if a field has data
function hasData(value: unknown): boolean {
  return value !== undefined && value !== null && value !== ''
}

export function PropertyInfoCard({ 
  address, 
  propertyInfo, 
  isLoading, 
  error,
  compact = false 
}: PropertyInfoCardProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card className="border-border bg-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">물건정보 조회 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state - but don't block other UI
  if (error && !propertyInfo) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <MapPin className="w-4 h-4" />
            <span>{address}</span>
            <span className="text-xs text-amber-600 ml-auto">(조회 실패 - 기존 흐름 유지)</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // No data yet
  if (!propertyInfo) {
    return null
  }

  // Compact display for deal conditions card
  if (compact) {
    return (
      <div className="space-y-2 text-sm border-t border-border pt-3 mt-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium">{address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={hasData(propertyInfo.main_use) ? '' : 'text-muted-foreground'}>
            {propertyInfo.main_use || '용도 미확인'}
          </span>
          {hasData(propertyInfo.floors_above) && (
            <>
              <span className="text-muted-foreground">|</span>
              <span>{formatFloors(propertyInfo.floors_above, propertyInfo.floors_below)}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={hasData(propertyInfo.land_area_m2) ? '' : 'text-muted-foreground'}>
            대지 {formatArea(propertyInfo.land_area_m2)}
          </span>
          <span className="text-muted-foreground">|</span>
          <span className={hasData(propertyInfo.total_floor_area_m2) ? '' : 'text-muted-foreground'}>
            연면적 {formatArea(propertyInfo.total_floor_area_m2)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={hasData(propertyInfo.built_year) ? '' : 'text-muted-foreground'}>
            준공 {propertyInfo.built_year || '미확인'}년
          </span>
          {hasData(propertyInfo.structure) && (
            <>
              <span className="text-muted-foreground">|</span>
              <span>{propertyInfo.structure}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Banknote className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={hasData(propertyInfo.land_price_per_m2) ? '' : 'text-muted-foreground'}>
            공시지가 {hasData(propertyInfo.land_price_per_m2) ? `${formatNumber(propertyInfo.land_price_per_m2)}원/㎡` : '미확인 (배포 후)'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Map className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={hasData(propertyInfo.zoning) ? '' : 'text-muted-foreground'}>
            용도지역 {propertyInfo.zoning || '미확인 (배포 후)'}
          </span>
        </div>
      </div>
    )
  }

  // Full display for analysis results panel
  return (
    <Card className="border-border bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            물건 기본정보
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">자동수집</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">대지면적</p>
            <p className={`font-medium ${hasData(propertyInfo.land_area_m2) ? 'text-foreground' : 'text-muted-foreground'}`}>
              {formatArea(propertyInfo.land_area_m2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">연면적</p>
            <p className={`font-medium ${hasData(propertyInfo.total_floor_area_m2) ? 'text-foreground' : 'text-muted-foreground'}`}>
              {formatArea(propertyInfo.total_floor_area_m2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">층수</p>
            <p className={`font-medium ${hasData(propertyInfo.floors_above) ? 'text-foreground' : 'text-muted-foreground'}`}>
              {formatFloors(propertyInfo.floors_above, propertyInfo.floors_below)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">준공연도</p>
            <p className={`font-medium ${hasData(propertyInfo.built_year) ? 'text-foreground' : 'text-muted-foreground'}`}>
              {propertyInfo.built_year ? `${propertyInfo.built_year}년` : '미확인'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">구조</p>
            <p className={`font-medium ${hasData(propertyInfo.structure) ? 'text-foreground' : 'text-muted-foreground'}`}>
              {propertyInfo.structure || '미확인'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">주용도</p>
            <p className={`font-medium ${hasData(propertyInfo.main_use) ? 'text-foreground' : 'text-muted-foreground'}`}>
              {propertyInfo.main_use || '미확인'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">기준금리</p>
            <p className={`font-medium ${hasData(propertyInfo.current_base_rate) ? 'text-foreground' : 'text-muted-foreground'}`}>
              {hasData(propertyInfo.current_base_rate) ? formatRate(propertyInfo.current_base_rate) : '미확인'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">추정대출금리</p>
            <p className={`font-medium ${hasData(propertyInfo.estimated_loan_rate_min) ? 'text-foreground' : 'text-muted-foreground'}`}>
              {hasData(propertyInfo.estimated_loan_rate_min) && hasData(propertyInfo.estimated_loan_rate_max)
                ? `${formatRate(propertyInfo.estimated_loan_rate_min)}~${formatRate(propertyInfo.estimated_loan_rate_max)}`
                : '미확인'}
            </p>
          </div>
        </div>
        
        {/* Data source attribution */}
        <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
          {hasData(propertyInfo.zoning) && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              V-WORLD 데이터 기반
            </Badge>
          )}
          {hasData(propertyInfo.current_base_rate) && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              ECOS 기준금리 기반
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
