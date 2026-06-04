'use client'

import { useEffect, useMemo, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import type {
  AdminCardNewsCandidateSummary,
  AdminSignalTickerItem,
  AdminWikiNoteDetail,
  AdminWikiNoteSummary,
  FrontendProcessingQueue,
  FrontendProcessingTask,
  FrontendWikiStats,
  FrontendWikiUpdate,
} from '@/lib/api/admin'
import {
  fetchCardNewsCandidates,
  fetchWikiNoteDetail,
  fetchWikiNotes,
  fetchWikiTickerItems,
  reviewWikiNotesBulk,
  reviewWikiNote,
} from '@/lib/api/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  FileClock,
  FileText,
  Lightbulb,
  Loader2,
  RefreshCw,
  Scale,
  XCircle,
} from 'lucide-react'

interface WikiSectionProps {
  wikiStats: FrontendWikiStats
  processingQueue: FrontendProcessingQueue
  wikiUpdates: FrontendWikiUpdate[]
}

function formatCount(value: number): string {
  return value.toLocaleString()
}

function compactCount(value: number): string {
  if (value >= 1000) return value.toLocaleString()
  return String(value)
}

function formatDate(timestamp: string | null | undefined): string {
  if (!timestamp) return '-'

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

function noteStatusLabel(note: AdminWikiNoteSummary): string {
  if (note.freshness_status === 'watch') return '관찰'
  if (note.freshness_status === 'stale') return '갱신 필요'
  if (note.freshness_status === 'compiling') return '컴파일 중'
  return '최신'
}

function reviewStatusLabel(status: AdminWikiNoteSummary['review_status']): string {
  if (status === 'keep') return '유지'
  if (status === 'delete') return '삭제'
  if (status === 'hold') return '보류'
  return '미검수'
}

function taskStatusLabel(task: FrontendProcessingTask): string {
  const parts = [
    task.queued > 0 ? `대기 ${formatCount(task.queued)}` : '',
    task.failed > 0 ? `실패 ${formatCount(task.failed)}` : '',
    task.processing > 0 ? `처리중 ${formatCount(task.processing)}` : '',
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' · ') : `완료 ${formatCount(task.done)}`
}

export function WikiSection({
  wikiStats,
  processingQueue,
  wikiUpdates,
}: WikiSectionProps) {
  const [notes, setNotes] = useState<AdminWikiNoteSummary[]>([])
  const [tickerItems, setTickerItems] = useState<AdminSignalTickerItem[]>([])
  const [cardCandidates, setCardCandidates] = useState<AdminCardNewsCandidateSummary[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null)
  const [selectedNote, setSelectedNote] = useState<AdminWikiNoteDetail | null>(null)
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<number>>(() => new Set())
  const [lastSelectedNoteIndex, setLastSelectedNoteIndex] = useState<number | null>(null)
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null)
  const [isNotesLoading, setIsNotesLoading] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [reviewingStatus, setReviewingStatus] = useState<AdminWikiNoteSummary['review_status'] | null>(null)
  const [bulkReviewingStatus, setBulkReviewingStatus] = useState<AdminWikiNoteSummary['review_status'] | null>(null)
  const [notesError, setNotesError] = useState<string | null>(null)

  const progressPercent = processingQueue.total > 0
    ? Math.round((processingQueue.done / processingQueue.total) * 100)
    : 0
  const visibleTasks = processingQueue.taskBreakdown.slice(0, 8)
  const hasQueueRisk = processingQueue.failed > 0 || processingQueue.queued > 0

  const compileWikiCount = useMemo(
    () => notes.filter((note) => note.version_count > 0 || note.last_compiled_at).length,
    [notes],
  )

  const reviewCounts = useMemo(() => ({
    pending: notes.filter((note) => note.review_status === 'pending').length,
    keep: notes.filter((note) => note.review_status === 'keep').length,
    delete: notes.filter((note) => note.review_status === 'delete').length,
    hold: notes.filter((note) => note.review_status === 'hold').length,
  }), [notes])

  const selectedSource = useMemo(
    () => selectedNote?.sources?.find((source) => source.id === selectedSourceId) ?? selectedNote?.sources?.[0] ?? null,
    [selectedNote, selectedSourceId],
  )

  const loadNotes = async () => {
    setIsNotesLoading(true)
    setNotesError(null)
    try {
      const nextNotes = await fetchWikiNotes(500)
      setNotes(nextNotes)
      setSelectedNoteIds(new Set())
      setLastSelectedNoteIndex(null)
      const [nextTickerItems, nextCardCandidates] = await Promise.all([
        fetchWikiTickerItems(20),
        fetchCardNewsCandidates(20),
      ])
      setTickerItems(nextTickerItems)
      setCardCandidates(nextCardCandidates)
      if (!selectedNoteId && nextNotes[0]) {
        setSelectedNoteId(nextNotes[0].id)
      }
    } catch (error) {
      setNotesError(error instanceof Error ? error.message : 'Wiki 문서 목록을 불러오지 못했습니다.')
    } finally {
      setIsNotesLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadNotes()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedNoteId) return

    let cancelled = false
    queueMicrotask(() => {
      setIsDetailLoading(true)
      fetchWikiNoteDetail(selectedNoteId)
        .then((note) => {
          if (!cancelled) setSelectedNote(note)
        })
        .catch((error) => {
          if (!cancelled) {
            setNotesError(error instanceof Error ? error.message : 'Wiki 문서를 불러오지 못했습니다.')
          }
        })
        .finally(() => {
          if (!cancelled) setIsDetailLoading(false)
        })
    })

    return () => {
      cancelled = true
    }
  }, [selectedNoteId])

  const handleReview = async (reviewStatus: AdminWikiNoteSummary['review_status']) => {
    if (!selectedNote) return

    setReviewingStatus(reviewStatus)
    setNotesError(null)
    try {
      const nextNote = await reviewWikiNote(selectedNote.id, reviewStatus)
      if (!nextNote) throw new Error('Wiki note review update failed')
      setSelectedNote(nextNote)
      setNotes((current) => current.map((note) => (
        note.id === nextNote.id
          ? {
              ...note,
              status: nextNote.status,
              freshness_status: nextNote.freshness_status,
              review_status: nextNote.review_status,
              review_note: nextNote.review_note,
              reviewed_at: nextNote.reviewed_at,
              updated_at: nextNote.updated_at,
            }
          : note
      )))
    } catch (error) {
      setNotesError(error instanceof Error ? error.message : 'Wiki 검수 상태를 저장하지 못했습니다.')
    } finally {
      setReviewingStatus(null)
    }
  }

  const handleNoteCardKeyDown = (noteId: number, event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    setSelectedNoteId(noteId)
  }

  const handleNoteCheckboxClick = (
    noteId: number,
    noteIndex: number,
    event: MouseEvent<HTMLInputElement>,
  ) => {
    event.stopPropagation()
    const shouldSelect = !selectedNoteIds.has(noteId)
    setSelectedNoteIds((current) => {
      const next = new Set(current)
      if (event.shiftKey && lastSelectedNoteIndex !== null) {
        const start = Math.min(lastSelectedNoteIndex, noteIndex)
        const end = Math.max(lastSelectedNoteIndex, noteIndex)
        notes.slice(start, end + 1).forEach((note) => {
          if (shouldSelect) {
            next.add(note.id)
          } else {
            next.delete(note.id)
          }
        })
      } else if (shouldSelect) {
        next.add(noteId)
      } else {
        next.delete(noteId)
      }
      return next
    })
    setLastSelectedNoteIndex(noteIndex)
  }

  const handleBulkReview = async (reviewStatus: AdminWikiNoteSummary['review_status']) => {
    const noteIds = Array.from(selectedNoteIds)
    if (noteIds.length === 0) return

    setBulkReviewingStatus(reviewStatus)
    setNotesError(null)
    try {
      const result = await reviewWikiNotesBulk(noteIds, reviewStatus)
      if (!result) throw new Error('Wiki bulk review update failed')
      const updatedNotes = new Map(result.notes.map((note) => [note.id, note]))
      setNotes((current) => current.map((note) => updatedNotes.get(note.id) ?? note))
      setSelectedNote((current) => {
        if (!current) return current
        const updated = updatedNotes.get(current.id)
        return updated ? { ...current, ...updated } : current
      })
      setSelectedNoteIds(new Set())
      setLastSelectedNoteIndex(null)
    } catch (error) {
      setNotesError(error instanceof Error ? error.message : 'Wiki 문서 일괄 검수 상태를 저장하지 못했습니다.')
    } finally {
      setBulkReviewingStatus(null)
    }
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-sidebar-foreground">
            LLM Wiki 학습 현황
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            마지막 Fact 추출: {wikiStats.lastFactExtractedAt}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {hasQueueRisk ? (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
          <span>
            대기 {formatCount(processingQueue.queued)}건 · 실패 {formatCount(processingQueue.failed)}건
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col items-center text-center">
            <Database className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold text-sidebar-foreground">
              {formatCount(wikiStats.metricSnapshots)}
            </div>
            <div className="text-xs text-muted-foreground">Metric Snapshots</div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col items-center text-center">
            <FileText className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold text-sidebar-foreground">
                {formatCount(wikiStats.facts)}
              </span>
              {wikiStats.facts < 100 && (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Facts {wikiStats.facts < 100 && <span className="text-amber-500">부족</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col items-center text-center">
            <Lightbulb className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold text-sidebar-foreground">
              {formatCount(wikiStats.signals)}
            </div>
            <div className="text-xs text-muted-foreground">Signals</div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col items-center text-center">
            <Scale className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold text-sidebar-foreground">
              {formatCount(wikiStats.rules)}
            </div>
            <div className="text-xs text-muted-foreground">Rules</div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardContent className="flex flex-col items-center text-center">
            <BookOpen className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold text-sidebar-foreground">
              {formatCount(notes.length)}
            </div>
            <div className="text-xs text-muted-foreground">
              Wiki 문서 {compileWikiCount > 0 && <span>· 갱신 {compileWikiCount}</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-sidebar-foreground">
              Delta Ticker News
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Daily signal feed for the Analysis page ticker
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-3">
              <div className="space-y-2">
                {tickerItems.map((item) => (
                  <div key={item.id} className="rounded border border-sidebar-border bg-sidebar px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="line-clamp-2 text-sm font-medium text-sidebar-foreground">
                          {item.headline}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{item.district_name}</span>
                          <span>{item.report_date}</span>
                          <span>score {item.rank_score}</span>
                          <span>click {item.click_count}</span>
                        </div>
                      </div>
                      <Badge variant={item.signal === 'favorable' ? 'secondary' : 'outline'} className="shrink-0">
                        {item.signal ?? 'watch'}
                      </Badge>
                    </div>
                    {item.summary && (
                      <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {item.summary}
                      </div>
                    )}
                    {item.source_metric_keys.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.source_metric_keys.slice(0, 4).map((metricKey) => (
                          <Badge key={metricKey} variant="outline" className="font-mono text-[10px]">
                            {metricKey}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!isNotesLoading && tickerItems.length === 0 && (
                  <div className="rounded bg-sidebar px-3 py-8 text-center text-sm text-muted-foreground">
                    No Delta ticker items yet.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-sidebar-foreground">
              Card News Candidates
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Promoted ticker signals stored as structured SNS drafts
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-3">
              <div className="space-y-2">
                {cardCandidates.map((candidate) => (
                  <div key={candidate.id} className="rounded border border-sidebar-border bg-sidebar px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="line-clamp-2 text-sm font-medium text-sidebar-foreground">
                          {candidate.headline}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{candidate.region ?? 'global'}</span>
                          <span>trend {candidate.trend_score}</span>
                          <span>visual {candidate.visual_score}</span>
                          <span>{formatDate(candidate.created_at)}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {candidate.review_status}
                      </Badge>
                    </div>
                    {candidate.investment_takeaway && (
                      <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {candidate.investment_takeaway}
                      </div>
                    )}
                    {candidate.why_promoted && (
                      <div className="mt-2 rounded bg-sidebar-accent px-2 py-1.5 text-xs text-muted-foreground">
                        {candidate.why_promoted}
                      </div>
                    )}
                  </div>
                ))}
                {!isNotesLoading && cardCandidates.length === 0 && (
                  <div className="rounded bg-sidebar px-3 py-8 text-center text-sm text-muted-foreground">
                    No card-news candidates yet.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 border-sidebar-border bg-sidebar-accent py-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between gap-3 text-sm font-medium text-sidebar-foreground">
            <span>Processing Queue</span>
            <span className="text-xs text-muted-foreground">{progressPercent}% 처리됨</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                전체 {formatCount(processingQueue.total)}건
              </span>
              <span className="text-sidebar-foreground">
                완료 {formatCount(processingQueue.done)}건
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-sidebar">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                대기 {formatCount(processingQueue.queued)}건
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5" />
                처리중 {formatCount(processingQueue.processing)}건
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <XCircle className="h-3.5 w-3.5" />
                실패 {formatCount(processingQueue.failed)}건
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
                스킵 {formatCount(processingQueue.skipped)}건
              </div>
            </div>
          </div>

          <div className="rounded bg-sidebar px-3 py-2">
            <div className="text-xs text-muted-foreground">주요 작업 대기</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <span className="text-sidebar-foreground">본문 {compactCount(processingQueue.breakdown.fetchBody)}</span>
              <span className="text-sidebar-foreground">요약 {compactCount(processingQueue.breakdown.summarize)}</span>
              <span className="text-sidebar-foreground">태깅 {compactCount(processingQueue.breakdown.tag)}</span>
              <span className="text-sidebar-foreground">임베딩 {compactCount(processingQueue.breakdown.embed)}</span>
              <span className="text-sidebar-foreground">Facts {compactCount(processingQueue.breakdown.extractFacts)}</span>
              <span className="text-sidebar-foreground">지표 {compactCount(processingQueue.breakdown.extractMetrics)}</span>
              <span className="text-sidebar-foreground">Wiki 문서 {compactCount(processingQueue.breakdown.compileWiki)}</span>
            </div>
          </div>

          {visibleTasks.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">task_type별 상태</div>
              <div className="grid gap-2 md:grid-cols-2">
                {visibleTasks.map((task) => (
                  <div
                    key={task.taskType}
                    className="flex min-w-0 items-center justify-between gap-3 rounded bg-sidebar px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-sidebar-foreground">{task.label}</div>
                      <div className="truncate text-muted-foreground">{task.taskType}</div>
                    </div>
                    <div className="shrink-0 text-right text-muted-foreground">
                      <div>{formatCount(task.total)}건</div>
                      <div className={task.failed > 0 ? 'text-red-400' : undefined}>
                        {taskStatusLabel(task)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.2fr)]">
        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-sidebar-foreground">
                LLM Wiki 문서 목록
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                전체 {formatCount(notes.length)}건 · 미검수 {formatCount(reviewCounts.pending)}건 · 삭제 {formatCount(reviewCounts.delete)}건
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  선택 {formatCount(selectedNoteIds.size)}건
                </span>
                {(['keep', 'delete', 'hold'] as const).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={selectedNoteIds.size === 0 || bulkReviewingStatus !== null}
                    onClick={() => handleBulkReview(status)}
                  >
                    {bulkReviewingStatus === status && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                    {reviewStatusLabel(status)}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={loadNotes}
              disabled={isNotesLoading}
              aria-label="Wiki 문서 새로고침"
            >
              <RefreshCw className={isNotesLoading ? 'animate-spin' : ''} />
            </Button>
          </CardHeader>
          <CardContent>
            {notesError && (
              <div className="mb-3 rounded bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {notesError}
              </div>
            )}
            <ScrollArea className="h-[520px] pr-3">
              <div className="space-y-2">
                {notes.map((note, noteIndex) => (
                  <div
                    key={note.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedNoteId(note.id)}
                    onKeyDown={(event) => handleNoteCardKeyDown(note.id, event)}
                    className={`w-full rounded border px-3 py-3 text-left transition-colors ${
                      selectedNoteId === note.id
                        ? 'border-emerald-500/70 bg-emerald-500/10'
                        : 'border-sidebar-border bg-sidebar hover:bg-sidebar/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <input
                        type="checkbox"
                        checked={selectedNoteIds.has(note.id)}
                        onChange={() => undefined}
                        onClick={(event) => handleNoteCheckboxClick(note.id, noteIndex, event)}
                        aria-label={`${note.title} 선택`}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-sidebar-border bg-sidebar text-emerald-500 accent-emerald-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-sidebar-foreground">
                          {note.title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>생성 {formatDate(note.created_at)}</span>
                          <span>버전 {note.version_count}</span>
                          <span>출처 {note.source_count}</span>
                        </div>
                      </div>
                      <Badge
                        variant={note.review_status === 'delete' ? 'destructive' : note.review_status === 'pending' ? 'outline' : 'secondary'}
                        className="shrink-0"
                      >
                        {reviewStatusLabel(note.review_status)}
                      </Badge>
                    </div>
                    {note.latest_change_summary && (
                      <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {note.latest_change_summary}
                      </div>
                    )}
                  </div>
                ))}
                {!isNotesLoading && notes.length === 0 && (
                  <div className="rounded bg-sidebar px-3 py-8 text-center text-sm text-muted-foreground">
                    표시할 Wiki 문서가 없습니다.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar-accent py-4">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="truncate text-sm font-medium text-sidebar-foreground">
                  {selectedNote?.title ?? 'Wiki 문서 상세'}
                </CardTitle>
                {selectedNote && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{selectedNote.status}</Badge>
                    <Badge variant="outline">{noteStatusLabel(selectedNote)}</Badge>
                    <Badge variant={selectedNote.review_status === 'delete' ? 'destructive' : 'secondary'}>
                      {reviewStatusLabel(selectedNote.review_status)}
                    </Badge>
                    <span>last_compiled {formatDate(selectedNote.last_compiled_at)}</span>
                    <span>created {formatDate(selectedNote.created_at)}</span>
                  </div>
                )}
              </div>
              {isDetailLoading && (
                <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[520px] pr-4">
              {selectedNote ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2 rounded border border-sidebar-border bg-sidebar px-3 py-3">
                    <span className="mr-auto text-xs text-muted-foreground">
                      검수 결정: 유지하면 분석 Wiki에 남기고, 삭제는 archived로 전환합니다.
                    </span>
                    {(['keep', 'delete', 'hold'] as const).map((status) => (
                      <Button
                        key={status}
                        type="button"
                        size="sm"
                        variant={selectedNote.review_status === status ? 'default' : 'outline'}
                        disabled={reviewingStatus !== null}
                        onClick={() => handleReview(status)}
                      >
                        {reviewingStatus === status && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                        {reviewStatusLabel(status)}
                      </Button>
                    ))}
                  </div>

                  <article className="prose prose-invert max-w-none text-sm leading-7 text-sidebar-foreground prose-headings:text-sidebar-foreground prose-strong:text-sidebar-foreground prose-li:marker:text-muted-foreground">
                    <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                  </article>

                  <div className="border-t border-sidebar-border pt-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-sidebar-foreground">
                      <FileText className="h-4 w-4" />
                      참조 원문
                    </div>
                    {(selectedNote.sources ?? []).length > 0 ? (
                      <div className="grid gap-3 xl:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)]">
                        <div className="space-y-2">
                          {(selectedNote.sources ?? []).map((source) => (
                            <button
                              key={source.id}
                              type="button"
                              onClick={() => setSelectedSourceId(source.id)}
                              className={`w-full rounded border px-3 py-2 text-left text-xs transition-colors ${
                                selectedSource?.id === source.id
                                  ? 'border-emerald-500/70 bg-emerald-500/10'
                                  : 'border-sidebar-border bg-sidebar hover:bg-sidebar/80'
                              }`}
                            >
                              <div className="line-clamp-2 font-medium text-sidebar-foreground">
                                {source.title}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1.5 text-muted-foreground">
                                {source.source_name && <span>{source.source_name}</span>}
                                {source.source_type && <span>{source.source_type}</span>}
                                {source.relevance != null && <span>관련도 {source.relevance}</span>}
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="rounded border border-sidebar-border bg-sidebar px-3 py-3">
                          {selectedSource ? (
                            <div className="space-y-3">
                              <div>
                                <div className="text-sm font-medium text-sidebar-foreground">
                                  {selectedSource.title}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  {selectedSource.published_at && <span>발행 {formatDate(selectedSource.published_at)}</span>}
                                  {selectedSource.created_at && <span>수집 {formatDate(selectedSource.created_at)}</span>}
                                  {selectedSource.doc_type && <span>{selectedSource.doc_type}</span>}
                                </div>
                              </div>
                              {(selectedSource.url || selectedSource.original_url) && (
                                <a
                                  href={selectedSource.original_url ?? selectedSource.url ?? undefined}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-emerald-500 hover:underline"
                                >
                                  원문 URL 열기
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                              <div className="max-h-[280px] overflow-auto whitespace-pre-wrap rounded bg-sidebar-accent px-3 py-3 text-xs leading-6 text-sidebar-foreground">
                                {selectedSource.body || selectedSource.summary || '저장된 원문 본문이 없습니다.'}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded bg-sidebar-accent px-3 py-8 text-center text-xs text-muted-foreground">
                              왼쪽 목록에서 원문을 선택하세요.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded bg-sidebar px-3 py-3 text-xs text-muted-foreground">
                        연결된 참조 원문이 없습니다.
                      </div>
                    )}
                  </div>

                  <div className="border-t border-sidebar-border pt-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-sidebar-foreground">
                      <FileClock className="h-4 w-4" />
                      업데이트 로그
                    </div>
                    <div className="space-y-2">
                      {selectedNote.versions.map((version) => (
                        <div
                          key={version.version_no}
                          className="rounded bg-sidebar px-3 py-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-sidebar-foreground">
                              v{version.version_no}
                            </span>
                            <span className="text-muted-foreground">
                              {formatDate(version.created_at)}
                            </span>
                          </div>
                          <div className="mt-1 text-muted-foreground">
                            {version.change_summary ?? '변경 요약 없음'}
                          </div>
                        </div>
                      ))}
                      {selectedNote.versions.length === 0 && (
                        <div className="rounded bg-sidebar px-3 py-3 text-xs text-muted-foreground">
                          저장된 버전 로그가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded bg-sidebar px-3 py-8 text-center text-sm text-muted-foreground">
                  왼쪽 목록에서 문서를 선택하세요.
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 border-sidebar-border bg-sidebar-accent py-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-sidebar-foreground">
            최근 Wiki 업데이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {wikiUpdates.length === 0 && (
              <div className="rounded bg-sidebar px-3 py-2 text-xs text-muted-foreground">
                최근 작업 기록이 없습니다.
              </div>
            )}
            {wikiUpdates.map((update) => (
              <div
                key={update.id}
                className="flex items-center gap-3 rounded bg-sidebar px-3 py-2 text-sm"
              >
                <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="w-16 shrink-0 text-xs text-muted-foreground">
                  {update.time}
                </span>
                <span className="min-w-0 truncate font-mono text-xs text-sidebar-foreground">
                  {update.jobName}
                </span>
                <span className="ml-auto max-w-[55%] truncate font-mono text-xs text-muted-foreground">
                  {update.result}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
