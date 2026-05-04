'use client'

import type { FrontendUsageStats, FrontendRecentAnalysis } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface UsageSectionProps {
  usageStats: FrontendUsageStats
  recentAnalyses: FrontendRecentAnalysis[]
}

function getGradeBadgeColor(grade: FrontendRecentAnalysis['grade']) {
  switch (grade) {
    case 'A':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'B+':
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
    case 'B':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'C':
      return 'bg-[#C9A24B]/20 text-[#C9A24B] border-[#C9A24B]/30'
    case 'D':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
  }
}

export function UsageSection({ usageStats, recentAnalyses }: UsageSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-sidebar-foreground">
        이용 현황
      </h2>

      {/* Stats Grid */}
      <Card className="border-sidebar-border bg-sidebar-accent py-4">
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="pb-3 text-left font-medium"></th>
                  <th className="pb-3 text-right font-medium">오늘</th>
                  <th className="pb-3 text-right font-medium">이번 주</th>
                  <th className="pb-3 text-right font-medium">이번 달</th>
                </tr>
              </thead>
              <tbody className="text-sidebar-foreground">
                <tr>
                  <td className="py-2 text-muted-foreground">분석 요청</td>
                  <td className="py-2 text-right font-medium">
                    {usageStats.analysisRequests.today}
                  </td>
                  <td className="py-2 text-right font-medium">
                    {usageStats.analysisRequests.thisWeek}
                  </td>
                  <td className="py-2 text-right font-medium">
                    {usageStats.analysisRequests.thisMonth}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground">대화 세션</td>
                  <td className="py-2 text-right font-medium">
                    {usageStats.chatSessions.today}
                  </td>
                  <td className="py-2 text-right font-medium">
                    {usageStats.chatSessions.thisWeek}
                  </td>
                  <td className="py-2 text-right font-medium">
                    {usageStats.chatSessions.thisMonth}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground">유니크 IP</td>
                  <td className="py-2 text-right font-medium">
                    {usageStats.uniqueIps.today}
                  </td>
                  <td className="py-2 text-right font-medium">
                    {usageStats.uniqueIps.thisWeek}
                  </td>
                  <td className="py-2 text-right font-medium">
                    {usageStats.uniqueIps.thisMonth}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Analyses Table */}
      <Card className="mt-4 border-sidebar-border bg-sidebar-accent py-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-sidebar-foreground">
            최근 분석 10건
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-sidebar-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">시각</TableHead>
                <TableHead className="text-muted-foreground">입력 유형</TableHead>
                <TableHead className="text-center text-muted-foreground">
                  등급
                </TableHead>
                <TableHead className="text-right text-muted-foreground">
                  점수
                </TableHead>
                <TableHead className="text-right text-muted-foreground">
                  응답시간
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAnalyses.map((analysis) => (
                <TableRow
                  key={analysis.id}
                  className="border-sidebar-border hover:bg-sidebar/50"
                >
                  <TableCell className="text-muted-foreground">
                    {analysis.time}
                  </TableCell>
                  <TableCell className="text-sidebar-foreground">
                    {analysis.inputType}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`${getGradeBadgeColor(analysis.grade)}`}
                    >
                      {analysis.grade}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sidebar-foreground">
                    {analysis.score}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {analysis.responseTime != null ? `${(analysis.responseTime / 1000).toFixed(1)}s` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
