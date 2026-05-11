'use client'

interface KpiGroupProps {
  noi: number
  dscr: number
  ltv: number
  cap: number
}

export const KpiGroup = ({ noi, dscr, ltv, cap }: KpiGroupProps) => {
  return (
    <div className="grid grid-cols-4 gap-6 justify-self-end flex-shrink-0">
      <div className="text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">NOI</p>
        <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{noi.toLocaleString('ko-KR')}만</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">은행식 DSCR</p>
        <p className={`mt-0.5 text-sm font-semibold tabular-nums ${dscr < 1 ? 'text-red-600' : 'text-foreground'}`}>
          {dscr.toFixed(2)}x
        </p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">LTV</p>
        <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{ltv.toFixed(1)}%</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">CAP</p>
        <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{cap.toFixed(1)}%</p>
      </div>
    </div>
  )
}
