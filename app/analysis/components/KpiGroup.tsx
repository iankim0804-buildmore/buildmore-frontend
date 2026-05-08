'use client'

interface KpiGroupProps {
  noi: number
  dscr: number
  ltv: number
  cap: number
}

export const KpiGroup = ({ noi, dscr, ltv, cap }: KpiGroupProps) => {
  return (
    <div className="grid grid-cols-4 gap-4 justify-self-end flex-shrink-0">
      <div className="text-center">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">NOI</p>
        <p className="text-[17px] font-semibold tabular-nums">{noi.toLocaleString('ko-KR')}만</p>
      </div>
      <div className="text-center">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">DSCR</p>
        <p className={`text-[17px] font-semibold tabular-nums ${dscr < 1 ? 'text-red-600' : ''}`}>
          {dscr.toFixed(2)}x
        </p>
      </div>
      <div className="text-center">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">LTV</p>
        <p className="text-[17px] font-semibold tabular-nums">{ltv.toFixed(1)}%</p>
      </div>
      <div className="text-center">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">CAP</p>
        <p className="text-[17px] font-semibold tabular-nums">{cap.toFixed(1)}%</p>
      </div>
    </div>
  )
}
