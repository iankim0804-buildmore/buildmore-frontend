export type InsightSeverity = "positive" | "neutral" | "warning" | "danger"

export type DealInsight = {
  id: string
  title: string
  verdict: string
  summary: string
  reasons: string[]
  actions: string[]
  evidenceLabel: string
  ctaText: string
  severity: InsightSeverity
}

interface InsightPanelProps {
  insight: DealInsight
}

export const InsightPanel = ({ insight }: InsightPanelProps) => {
  const severityColors: Record<InsightSeverity, string> = {
    positive: "bg-green-50 border-green-200",
    neutral: "bg-blue-50 border-blue-200",
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200",
  }

  const verdictColors: Record<InsightSeverity, string> = {
    positive: "text-green-700",
    neutral: "text-blue-700",
    warning: "text-amber-700",
    danger: "text-red-700",
  }

  return (
    <div className="space-y-4">
      {/* 상단 요약 카드 */}
      <div className="rounded-2xl border bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          BUILDMORE INSIGHT
        </p>

        <h3 className={`mt-2 text-xl font-semibold break-keep ${verdictColors[insight.severity]}`}>
          {insight.verdict}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-gray-600 break-keep">
          {insight.summary}
        </p>
      </div>

      {/* 중간: 근거와 액션 */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <h4 className="text-sm font-semibold text-gray-950">
            왜 이렇게 판단했나요?
          </h4>
          <ul className="mt-3 space-y-2">
            {insight.reasons.map((reason, i) => (
              <li key={i} className="text-sm leading-relaxed text-gray-600 break-keep">
                • {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h4 className="text-sm font-semibold text-gray-950">
            다음 액션
          </h4>
          <ul className="mt-3 space-y-2">
            {insight.actions.map((action, i) => (
              <li key={i} className="text-sm leading-relaxed text-gray-600 break-keep">
                ✓ {action}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 하단: 근거와 CTA */}
      <div className={`rounded-2xl border p-4 ${severityColors[insight.severity]}`}>
        <p className="text-xs text-gray-600 break-keep">
          {insight.evidenceLabel}
        </p>
        <p className="mt-2 text-sm font-medium text-gray-900 break-keep">
          {insight.ctaText}
        </p>
      </div>
    </div>
  )
}
