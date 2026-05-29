'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'

type TaskGroup = {
  id: string
  title: string
  color: string
  textColor: string
}

type Task = {
  uid: string
  id: string
  groupId: string
  label: string
  start: number
  duration: number
  desc: string
}

type WeekAgenda = {
  id: string
  label: string
}

type DragState = {
  mode: 'resize'
  taskUid: string
  edge: 'start' | 'end'
  originX: number
  originStart: number
  originDuration: number
  cellWidth: number
} | {
  mode: 'move'
  taskUid: string
  originX: number
  originY: number
  originStart: number
  originDuration: number
  originRowCenter: number
  cellWidth: number
}

type ScheduleState = {
  groups: TaskGroup[]
  tasks: Task[]
  weekAgendas: WeekAgenda[]
}

type TaskRow = {
  taskUid: string
  groupId: string
  top: number
  center: number
}

const STORAGE_KEY = 'buildmore_schedule_editor_v1'
const TOTAL_DAYS = 21
const DAY_WIDTH = 84
const MIN_DURATION = 1
const TIMELINE_WIDTH = TOTAL_DAYS * DAY_WIDTH
const HEADER_HEIGHT = 112
const GROUP_ROW_HEIGHT = 36
const TASK_ROW_HEIGHT = 40

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

const DEFAULT_WEEK_AGENDAS: WeekAgenda[] = [
  { id: 'w1', label: 'Week 1 — 기획·구축' },
  { id: 'w2', label: 'Week 2 — 엔진·자동화' },
  { id: 'w3', label: 'Week 3 — BM·마케팅' },
]

const DEFAULT_GROUPS: TaskGroup[] = [
  { id: 'P', title: '기획·데이터 (D1~D4)', color: '#7F77DD', textColor: '#fff' },
  { id: 'B', title: '프론트·백엔드 구축 (D4~D10)', color: '#1D9E75', textColor: '#fff' },
  { id: 'E', title: '핵심 엔진 (D8~D17)', color: '#378ADD', textColor: '#fff' },
  { id: 'D', title: 'BM·디자인 (D15~D19)', color: '#EF9F27', textColor: '#fff' },
  { id: 'M', title: '마케팅·GTM (D18~D21)', color: '#E24B4A', textColor: '#fff' },
]

const DEFAULT_TASKS: Task[] = [
  { uid: 'P1', id: 'P1', groupId: 'P', label: '서비스 구조 확정', start: 0, duration: 2, desc: '타겟별 핵심 니즈 정의, 입력→출력 플로우 최종 확정, 분석 카드 스키마 고정.' },
  { uid: 'P2', id: 'P2', groupId: 'P', label: '데이터 소스 매핑', start: 1, duration: 2, desc: '건축HUB API 연결 테스트, 공공데이터포털 상권정보 구조 파악, 임대료·거래사례 데이터 소스 확정.' },
  { uid: 'P3', id: 'P3', groupId: 'P', label: '공사비 preset 설계', start: 2, duration: 2, desc: '리모델링·증축·신축 × 비용 등급 × 용도 매트릭스 작성.' },
  { uid: 'P4', id: 'P4', groupId: 'P', label: 'DB 스키마 최종화', start: 3, duration: 1, desc: 'analysis_service 카드 스키마, peer_group_stats, 사용자 입력 저장 구조 점검.' },
  { uid: 'B1', id: 'B1', groupId: 'B', label: 'Quick Simulation API', start: 3, duration: 3, desc: '주소 입력에서 금융/사업성 핵심 결과까지 빠르게 반환하는 API 구현.' },
  { uid: 'B2', id: 'B2', groupId: 'B', label: '후보 저장 & 비교보드 API', start: 5, duration: 3, desc: '매물 후보 저장, 분석값 캐싱, 자기자본수익률 기준 정렬.' },
  { uid: 'B3', id: 'B3', groupId: 'B', label: '프론트 Quick Sim UI', start: 4, duration: 4, desc: '주소 입력창, 지도 기반 UI, 결과 카드 컴포넌트 구현.' },
  { uid: 'B4', id: 'B4', groupId: 'B', label: '비교보드 프론트 UI', start: 6, duration: 2, desc: '후보 목록 테이블, 수익률 순위 시각화, 후보 관리 UI.' },
  { uid: 'E1', id: 'E1', groupId: 'E', label: '자동분석 매트릭스 엔진', start: 7, duration: 3, desc: '용도별, 공사유형별, 퀄리티별 전 조합 수익률 계산.' },
  { uid: 'E2', id: 'E2', groupId: 'E', label: '상권분석 → 용도 추천', start: 8, duration: 3, desc: '역 접근성, 배후세대, 유동인구, 임대료, 공실률 기반 용도 추천.' },
  { uid: 'E3', id: 'E3', groupId: 'E', label: '민감도 분석', start: 9, duration: 2, desc: '공사비, 매각가, 공사기간 변동 시 수익률 변화 계산.' },
  { uid: 'E4', id: 'E4', groupId: 'E', label: '인허가·공사 리스크 엔진', start: 10, duration: 2, desc: '용도지역, 건폐율, 용적률, 인허가 기간 리스크 등급화.' },
  { uid: 'E5', id: 'E5', groupId: 'E', label: 'NOI·임대차 전략 엔진', start: 11, duration: 2, desc: '용도별 임대료 계수와 공실 반영 NOI 산출.' },
  { uid: 'E6', id: 'E6', groupId: 'E', label: '공사비 절감 포인트·매각전략', start: 12, duration: 2, desc: '손익분기 매도가, 최대매입가, Cap Rate 기반 매각 전략.' },
  { uid: 'E7', id: 'E7', groupId: 'E', label: '지도 매물 핀 연동', start: 12, duration: 3, desc: '지도 API 기반 수익률별 매물 핀과 결과 팝업 연동.' },
  { uid: 'D1', id: 'D1', groupId: 'D', label: '결과 카드 디자인 고도화', start: 14, duration: 2, desc: '결론, 금융가능성, 사업성, 상권, 법규 카드 디자인 고도화.' },
  { uid: 'D2', id: 'D2', groupId: 'D', label: '심층 리포트 템플릿', start: 15, duration: 2, desc: 'Investor Report, Feasibility Report, 비교 리포트 템플릿 구성.' },
  { uid: 'D3', id: 'D3', groupId: 'D', label: 'CTA 설계 & BM 연결', start: 15, duration: 3, desc: 'Free→Starter→Pro 전환 CTA와 전문가 연결 요청 버튼 설계.' },
  { uid: 'D4', id: 'D4', groupId: 'D', label: '개인투자자 통합 솔루션 보고서', start: 16, duration: 2, desc: '밸류애드 포인트, 인허가 체크, 월별자금, 임대차 전략 통합.' },
  { uid: 'M1', id: 'M1', groupId: 'M', label: '강남권 중개사 20명 파일럿', start: 17, duration: 3, desc: '매수측 중개사 20명 컨택, 실매물 분석 제공, 피드백 수집.' },
  { uid: 'M2', id: 'M2', groupId: 'M', label: '콘텐츠·리드마그넷 제작', start: 18, duration: 2, desc: '무료 보고서 샘플, 계산 엑셀, 비교표 템플릿 제작.' },
  { uid: 'M3', id: 'M3', groupId: 'M', label: '시연 영상 기획·촬영', start: 19, duration: 2, desc: '시연 영상 스크립트, 촬영 준비, 배포 채널 확정.' },
]

const DEFAULT_SCHEDULE_STATE: ScheduleState = {
  groups: DEFAULT_GROUPS,
  tasks: DEFAULT_TASKS,
  weekAgendas: DEFAULT_WEEK_AGENDAS,
}

let initialScheduleCache: ScheduleState | null | undefined

function getInitialScheduleState(): ScheduleState {
  if (initialScheduleCache !== undefined) {
    return initialScheduleCache ?? DEFAULT_SCHEDULE_STATE
  }

  if (typeof window === 'undefined') {
    initialScheduleCache = null
    return DEFAULT_SCHEDULE_STATE
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      initialScheduleCache = null
      return DEFAULT_SCHEDULE_STATE
    }

    const parsed = JSON.parse(raw)
    initialScheduleCache = {
      groups: Array.isArray(parsed.groups) ? parsed.groups : DEFAULT_GROUPS,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : DEFAULT_TASKS,
      weekAgendas: Array.isArray(parsed.weekAgendas) ? parsed.weekAgendas : DEFAULT_WEEK_AGENDAS,
    }
    return initialScheduleCache
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    initialScheduleCache = null
    return DEFAULT_SCHEDULE_STATE
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function nearestTaskRow(rows: TaskRow[], center: number) {
  return rows.reduce<TaskRow | null>((nearest, row) => {
    if (!nearest) return row
    return Math.abs(row.center - center) < Math.abs(nearest.center - center) ? row : nearest
  }, null)
}

function normalizeGroupTaskIds(tasks: Task[], groupIds: Set<string>) {
  const counters = new Map<string, number>()
  return tasks.map((task) => {
    if (!groupIds.has(task.groupId)) return task
    const nextNumber = (counters.get(task.groupId) ?? 0) + 1
    counters.set(task.groupId, nextNumber)
    return { ...task, id: `${task.groupId}${nextNumber}` }
  })
}

function moveTaskToNearestRow(
  tasks: Task[],
  taskUid: string,
  targetUid: string,
  start: number,
) {
  const moving = tasks.find((task) => task.uid === taskUid)
  const target = tasks.find((task) => task.uid === targetUid)
  if (!moving || !target) return tasks

  if (moving.uid === target.uid) {
    return tasks.map((task) => (task.uid === taskUid ? { ...task, start } : task))
  }

  const withoutMoving = tasks.filter((task) => task.uid !== taskUid)
  const targetIndex = withoutMoving.findIndex((task) => task.uid === target.uid)
  if (targetIndex < 0) return tasks

  const nextTask = { ...moving, groupId: target.groupId, start }
  const nextTasks = [
    ...withoutMoving.slice(0, targetIndex),
    nextTask,
    ...withoutMoving.slice(targetIndex),
  ]

  return normalizeGroupTaskIds(nextTasks, new Set([moving.groupId, target.groupId]))
}

function EditableText({
  value,
  onChange,
  className,
  inputClassName,
  multiline = false,
  style,
}: {
  value: string
  onChange: (next: string) => void
  className?: string
  inputClassName?: string
  multiline?: boolean
  style?: CSSProperties
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = () => {
    const next = draft.trim()
    if (next) onChange(next)
    setEditing(false)
  }

  const beginEdit = () => {
    setDraft(value)
    setEditing(true)
  }

  if (editing) {
    if (multiline) {
      return (
        <textarea
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              commit()
            }
          }}
          className={inputClassName}
        />
      )
    }

    return (
      <input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape') setEditing(false)
        }}
        className={inputClassName}
      />
    )
  }

  return (
    <button type="button" onClick={beginEdit} className={className} style={style}>
      {value}
    </button>
  )
}

export default function SchedulePage() {
  const [groups, setGroups] = useState<TaskGroup[]>(() => getInitialScheduleState().groups)
  const [tasks, setTasks] = useState<Task[]>(() => getInitialScheduleState().tasks)
  const [weekAgendas, setWeekAgendas] = useState<WeekAgenda[]>(() => getInitialScheduleState().weekAgendas)
  const [hoverInsert, setHoverInsert] = useState<string | null>(null)
  const [selectedTaskUid, setSelectedTaskUid] = useState<string | null>(null)
  const dragRef = useRef<DragState | null>(null)

  const groupMap = useMemo(() => new Map(groups.map((group) => [group.id, group])), [groups])
  const taskRows = useMemo(() => {
    let top = 0
    const rows: TaskRow[] = []

    groups.forEach((group) => {
      top += GROUP_ROW_HEIGHT
      tasks
        .filter((task) => task.groupId === group.id)
        .forEach((task) => {
          rows.push({
            taskUid: task.uid,
            groupId: task.groupId,
            top,
            center: top + TASK_ROW_HEIGHT / 2,
          })
          top += TASK_ROW_HEIGHT
        })
    })

    return rows
  }, [groups, tasks])
  const taskRowsByUid = useMemo(
    () => new Map(taskRows.map((row) => [row.taskUid, row])),
    [taskRows],
  )
  const taskRowsRef = useRef(taskRows)

  useEffect(() => {
    taskRowsRef.current = taskRows
  }, [taskRows])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ groups, tasks, weekAgendas }))
  }, [groups, tasks, weekAgendas])

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const dayDelta = Math.round((event.clientX - drag.originX) / drag.cellWidth)

      if (drag.mode === 'move') {
        const targetCenter = drag.originRowCenter + event.clientY - drag.originY
        const targetRow = nearestTaskRow(taskRowsRef.current, targetCenter)
        if (!targetRow) return

        setTasks((prev) => {
          const moving = prev.find((task) => task.uid === drag.taskUid)
          if (!moving) return prev
          const nextStart = clamp(drag.originStart + dayDelta, 0, TOTAL_DAYS - moving.duration)
          return moveTaskToNearestRow(prev, drag.taskUid, targetRow.taskUid, nextStart)
        })
        return
      }

      setTasks((prev) =>
        prev.map((task) => {
          if (task.uid !== drag.taskUid) return task
          if (drag.edge === 'start') {
            const maxStart = drag.originStart + drag.originDuration - MIN_DURATION
            const nextStart = clamp(drag.originStart + dayDelta, 0, maxStart)
            const nextEnd = drag.originStart + drag.originDuration
            return { ...task, start: nextStart, duration: nextEnd - nextStart }
          }
          const originEnd = drag.originStart + drag.originDuration
          const nextEnd = clamp(originEnd + dayDelta, drag.originStart + MIN_DURATION, TOTAL_DAYS)
          return { ...task, duration: nextEnd - drag.originStart }
        }),
      )
    }

    const onUp = () => {
      dragRef.current = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' || !selectedTaskUid) return
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }

      event.preventDefault()
      setTasks((prev) => {
        const selected = prev.find((task) => task.uid === selectedTaskUid)
        if (!selected) return prev
        return normalizeGroupTaskIds(
          prev.filter((task) => task.uid !== selectedTaskUid),
          new Set([selected.groupId]),
        )
      })
      setSelectedTaskUid(null)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedTaskUid])

  const updateTask = (uid: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((task) => (task.uid === uid ? { ...task, ...patch } : task)))
  }

  const updateGroup = (id: string, patch: Partial<TaskGroup>) => {
    setGroups((prev) => prev.map((group) => (group.id === id ? { ...group, ...patch } : group)))
  }

  const addTaskAfter = (uid: string) => {
    setTasks((prev) => {
      const index = prev.findIndex((task) => task.uid === uid)
      if (index < 0) return prev
      const base = prev[index]
      const groupTasks = prev.filter((task) => task.groupId === base.groupId)
      const nextNumber =
        Math.max(
          ...groupTasks.map((task) => Number(task.id.replace(/^\D+/, '')) || 0),
          0,
        ) + 1
      const nextTask: Task = {
        ...base,
        uid: `${base.groupId}${Date.now()}`,
        id: `${base.groupId}${nextNumber}`,
        label: `${base.label} 추가`,
      }
      return [...prev.slice(0, index + 1), nextTask, ...prev.slice(index + 1)]
    })
  }

  const startResize = (event: React.PointerEvent, task: Task, edge: 'start' | 'end') => {
    event.preventDefault()
    event.stopPropagation()
    setSelectedTaskUid(task.uid)
    dragRef.current = {
      mode: 'resize',
      taskUid: task.uid,
      edge,
      originX: event.clientX,
      originStart: task.start,
      originDuration: task.duration,
      cellWidth: DAY_WIDTH,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const startMove = (event: React.PointerEvent, task: Task) => {
    const row = taskRowsByUid.get(task.uid)
    if (!row) return

    event.preventDefault()
    setSelectedTaskUid(task.uid)
    dragRef.current = {
      mode: 'move',
      taskUid: task.uid,
      originX: event.clientX,
      originY: event.clientY,
      originStart: task.start,
      originDuration: task.duration,
      originRowCenter: row.center,
      cellWidth: DAY_WIDTH,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  return (
    <main className="min-h-screen bg-white font-sans text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-400">BuildMore</p>
            <h1 className="mt-0.5 text-xl font-bold text-zinc-900">3주 MVP 로드맵 간트차트</h1>
            <p className="mt-1 text-sm text-zinc-400">
              일정 {tasks.length}개 · 그룹 {groups.length}개 · 요일 단위 편집
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:border-emerald-500/70 hover:text-zinc-950"
          >
            Admin
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-600"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: group.color }} />
              {group.title}
            </button>
          ))}
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-132px)]">
        <aside className="w-[280px] flex-shrink-0 border-r border-zinc-200 bg-white px-4 pb-20">
          <section className="flex flex-col justify-center border-b border-zinc-100" style={{ height: HEADER_HEIGHT }}>
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-widest text-zinc-400">Schedule Index</p>
            <p className="text-[13px] leading-6 text-zinc-600">
              항목과 주차 아젠다는 클릭해 수정할 수 있습니다. 행 사이에 마우스를 올리면 새 일정을 추가합니다.
            </p>
          </section>

          <div>
            {groups.map((group) => {
              const groupTasks = tasks.filter((task) => task.groupId === group.id)
              return (
                <section key={group.id}>
                  <EditableText
                    value={group.title}
                    onChange={(title) => updateGroup(group.id, { title })}
                    className="flex w-full items-center rounded-md px-1 text-left text-[13px] font-semibold text-zinc-800 hover:bg-zinc-50"
                    inputClassName="h-8 w-full rounded-md border border-emerald-300 px-2 text-[13px] font-semibold outline-none"
                    style={{ height: GROUP_ROW_HEIGHT }}
                  />
                  <div>
                    {groupTasks.map((task) => (
                      <div
                        key={task.uid}
                        className="relative"
                        style={{ height: TASK_ROW_HEIGHT }}
                        onMouseEnter={() => setHoverInsert(task.uid)}
                        onMouseLeave={() => setHoverInsert((current) => (current === task.uid ? null : current))}
                      >
                        <div className="flex h-full items-center gap-2 rounded-md px-1 hover:bg-zinc-50">
                          <span
                            className="min-w-8 rounded px-1.5 py-0.5 text-center text-[11px] font-semibold"
                            style={{ background: `${group.color}22`, color: group.color }}
                          >
                            {task.id}
                          </span>
                          <EditableText
                            value={task.label}
                            onChange={(label) => updateTask(task.uid, { label })}
                            className="min-w-0 flex-1 truncate rounded px-1 py-0.5 text-left text-[13px] text-zinc-700 hover:bg-white"
                            inputClassName="h-7 min-w-0 flex-1 rounded border border-emerald-300 px-2 text-[13px] outline-none"
                          />
                        </div>
                        {hoverInsert === task.uid && (
                          <button
                            type="button"
                            aria-label="행 추가"
                            onClick={() => addTaskAfter(task.uid)}
                            className="absolute -bottom-3 left-1/2 z-20 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-emerald-300 bg-white text-emerald-600 shadow-sm hover:bg-emerald-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </aside>

        <section className="min-w-0 flex-1 overflow-auto">
          <div className="px-6 pb-24" style={{ width: TIMELINE_WIDTH + 48 }}>
            <div
              className="grid items-end border-b border-zinc-100 pt-6"
              style={{ gridTemplateColumns: `repeat(${TOTAL_DAYS}, ${DAY_WIDTH}px)`, height: HEADER_HEIGHT }}
            >
              {weekAgendas.map((week) => (
                <div
                  key={week.id}
                  className="border-b border-zinc-200 pb-2 text-center text-[12px] font-medium text-zinc-600"
                  style={{ gridColumn: `span 7` }}
                >
                  <EditableText
                    value={week.label}
                    onChange={(label) =>
                      setWeekAgendas((prev) => prev.map((item) => (item.id === week.id ? { ...item, label } : item)))
                    }
                    className="rounded px-2 py-1 hover:bg-zinc-50"
                    inputClassName="h-7 w-44 rounded border border-emerald-300 px-2 text-center text-[12px] outline-none"
                  />
                </div>
              ))}

              {Array.from({ length: TOTAL_DAYS }, (_, index) => (
                <div
                  key={index}
                  className={[
                    'py-3 text-center text-[11px] text-zinc-400',
                    index % 7 >= 5 ? 'opacity-45' : '',
                  ].join(' ')}
                >
                  {DAY_LABELS[index % 7]}
                </div>
              ))}
            </div>

            <div className="relative">
              <div
                className="pointer-events-none absolute left-0 top-0 h-full"
                style={{ width: TIMELINE_WIDTH }}
              >
                {Array.from({ length: TOTAL_DAYS + 1 }, (_, index) => (
                  <div
                    key={index}
                    className={index % 7 === 0 ? 'absolute top-0 h-full border-l border-zinc-200' : 'absolute top-0 h-full border-l border-zinc-100'}
                    style={{ left: index * DAY_WIDTH }}
                  />
                ))}
              </div>

              {groups.map((group) => {
                const groupTasks = tasks.filter((task) => task.groupId === group.id)
                return (
                  <section key={group.id}>
                    <div style={{ height: GROUP_ROW_HEIGHT }} />
                    {groupTasks.map((task) => {
                      const taskGroup = groupMap.get(task.groupId) ?? group
                      return (
                        <div key={task.uid} className="relative" style={{ height: TASK_ROW_HEIGHT }}>
                          <div
                            role="button"
                            tabIndex={0}
                            data-task-uid={task.uid}
                            aria-pressed={selectedTaskUid === task.uid}
                            onPointerDown={(event) => startMove(event, task)}
                            onClick={() => setSelectedTaskUid(task.uid)}
                            className={[
                              'group absolute top-2 flex h-6 cursor-grab items-center rounded px-2 text-[11px] font-semibold shadow-sm transition hover:brightness-105 hover:ring-2 hover:ring-zinc-900/20 active:cursor-grabbing',
                              selectedTaskUid === task.uid ? 'ring-2 ring-zinc-900/40 ring-offset-2' : '',
                            ].join(' ')}
                            style={{
                              left: task.start * DAY_WIDTH + 2,
                              width: task.duration * DAY_WIDTH - 4,
                              background: taskGroup.color,
                              color: taskGroup.textColor,
                            }}
                          >
                            <button
                              type="button"
                              aria-label="시작일 조정"
                              onPointerDown={(event) => startResize(event, task, 'start')}
                              className="absolute -left-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 cursor-ew-resize rounded-full border border-white bg-zinc-900 shadow group-hover:block"
                            />
                            <span className="truncate">{task.id}</span>
                            <button
                              type="button"
                              aria-label="종료일 조정"
                              onPointerDown={(event) => startResize(event, task, 'end')}
                              className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 cursor-ew-resize rounded-full border border-white bg-zinc-900 shadow group-hover:block"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </section>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
