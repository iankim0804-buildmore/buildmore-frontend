"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnalysisCTAProps {
  isOpen: boolean
  onToggle: () => void
  pulseKey: number
}

export const AnalysisCTA = ({ isOpen, onToggle, pulseKey }: AnalysisCTAProps) => {
  return (
    <div className="bg-white">
      <button
        key={pulseKey}
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={cn(
          "w-full bg-[#09090b] px-5 py-2.5 flex items-center justify-between gap-3 text-left",
          pulseKey > 0 && "cta-bar-wave"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#f59e0b]" />
          <div className="min-w-0">
            <p
              className="truncate text-[13px] font-semibold text-[#f5f5f5]"
            >
              분석 이후 다음 액션
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[#a1a1aa]">
              {isOpen ? "클릭하면 아래로 접힙니다" : "클릭하면 리포트 저장, 딜 브리핑, 패키지를 펼칩니다"}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#f5f5f5]" />
        ) : (
          <ChevronUp className="h-4 w-4 shrink-0 text-[#f5f5f5]" />
        )}
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-3 gap-3 px-5 py-4">
            <div className="border border-[#e4e4e7] rounded-[8px] p-3 flex flex-col">
              <div className="inline-flex w-fit mb-2">
                <span className="text-[12px] font-medium text-[#666] border border-[#d4d4d8] rounded-full px-2 py-0.5 bg-transparent">
                  무료
                </span>
              </div>
              <h4 className="text-[14px] font-semibold text-[#09090b] mb-1.5">분석 저장하기</h4>
              <p className="text-[12px] text-[#71717a] leading-snug flex-1 mb-3 break-keep">
                지금 분석 결과를 협상 전에 다시 볼 수 있도록 PDF로 저장합니다.
              </p>
              <button className="w-full h-8 border border-[#d4d4d8] bg-transparent rounded-[6px] text-[13px] font-semibold text-[#09090b] hover:bg-[#fafafa] transition-colors">
                PDF 저장
              </button>
            </div>

            <div className="border border-[#e4e4e7] rounded-[8px] p-3 flex flex-col">
              <div className="inline-flex w-fit mb-2">
                <span className="text-[12px] font-medium text-[#666] border border-[#d4d4d8] rounded-full px-2 py-0.5 bg-transparent">
                  유료
                </span>
              </div>
              <h4 className="text-[14px] font-semibold text-[#09090b] mb-1.5">딜 브리핑 받기</h4>
              <p className="text-[12px] text-[#71717a] leading-snug flex-1 mb-3 break-keep">
                금융, 리스크, 가격 협상 포인트를 정리한 실전 브리핑을 요청합니다.
              </p>
              <button className="w-full h-8 bg-[#09090b] text-white rounded-[6px] text-[13px] font-semibold hover:bg-[#1a1a1e] transition-colors">
                브리핑 요청
              </button>
            </div>

            <div className="border-2 border-[#f59e0b] rounded-[8px] p-3 flex flex-col bg-[#fffbeb]">
              <div className="inline-flex w-fit mb-2">
                <span className="text-[12px] font-medium text-[#b45309] bg-[#fed7aa] rounded-full px-2 py-0.5">
                  많이 선택
                </span>
              </div>
              <h4 className="text-[14px] font-semibold text-[#09090b] mb-1.5">딜 클로징 패키지</h4>
              <p className="text-[12px] text-[#71717a] leading-snug flex-1 mb-3 break-keep">
                협상 전략부터 금융 구조까지, 다음 미팅에서 바로 쓸 자료를 준비합니다.
              </p>
              <button className="w-full h-8 bg-[#f59e0b] text-white rounded-[6px] text-[13px] font-semibold hover:bg-[#d97706] transition-colors">
                패키지 보기
              </button>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-[#e4e4e7] flex gap-3">
            <div className="w-0.5 bg-[#f59e0b] rounded-full shrink-0" />
            <p className="text-[12px] text-[#52525b] leading-snug break-keep">
              <span className="font-semibold">BUILDMORE는 수익률 계산에서 멈추지 않습니다.</span>{" "}
              매입가, 대출 구조, NOI, DSCR, LTV, 리스크를 하나의 의사결정 근거로 묶어 협상과 금융기관 설명에 쓸 수 있는 자료로 정리합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
