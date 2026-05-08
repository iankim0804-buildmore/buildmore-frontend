export const AnalysisCTA = () => {
  return (
    <div className="border-t border-[#e4e4e7] bg-white">
      {/* 상단 헤드라인 바 */}
      <div className="bg-[#09090b] px-5 py-2 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#f59e0b] flex-shrink-0" />
        <p className="text-[13px] text-[#f5f5f5] font-medium break-keep">이 매물, 협상 여지 있음 — 지금 딜 브리핑을 받으면 근거 있는 가격을 제시할 수 있습니다</p>
      </div>

      {/* CTA 3개 컬럼 */}
      <div className="grid grid-cols-3 gap-4 px-5 py-5">
        {/* 컬럼 1: 무료 - PDF 저장 */}
        <div className="border border-[#e4e4e7] rounded-[12px] p-4 flex flex-col">
          <div className="inline-flex w-fit mb-3">
            <span className="text-xs font-medium text-[#666] border border-[#d4d4d8] rounded-full px-2 py-1 bg-transparent">무료</span>
          </div>
          <h4 className="text-[14px] font-semibold text-[#09090b] mb-2">이 분석 저장하기</h4>
          <p className="text-xs text-[#a1a1a6] leading-relaxed flex-1 mb-4 break-keep">협상 전에 들고 가세요. 지금 분석 결과를 PDF로 저장합니다.</p>
          <button className="w-full h-9 border border-[#d4d4d8] bg-transparent rounded-[6px] text-xs font-semibold text-[#09090b] hover:bg-[#fafafa] transition-colors">
            PDF 저장
          </button>
        </div>

        {/* 컬럼 2: 유료 - 딜 브리핑 */}
        <div className="border border-[#e4e4e7] rounded-[12px] p-4 flex flex-col">
          <div className="inline-flex w-fit mb-3">
            <span className="text-xs font-medium text-[#666] border border-[#d4d4d8] rounded-full px-2 py-1 bg-transparent">유료</span>
          </div>
          <h4 className="text-[14px] font-semibold text-[#09090b] mb-2">딜 브리핑 받기</h4>
          <p className="text-xs text-[#a1a1a6] leading-relaxed flex-1 mb-4 break-keep">금융·리스크·밸류 애드 안전 분석, 48시간 내 전달.</p>
          <button className="w-full h-9 bg-[#09090b] text-white rounded-[6px] text-xs font-semibold hover:bg-[#1a1a1e] transition-colors">
            브리핑 신청 →
          </button>
        </div>

        {/* 컬럼 3: 가장 많이 선택 - 딜 클로징 패키지 */}
        <div className="border-2 border-[#f59e0b] rounded-[12px] p-4 flex flex-col bg-[#fffbeb]">
          <div className="inline-flex w-fit mb-3">
            <span className="text-xs font-medium text-[#b45309] bg-[#fed7aa] rounded-full px-2 py-1">★ 가장 많이 선택</span>
          </div>
          <h4 className="text-[14px] font-semibold text-[#09090b] mb-2">딜 클로징 패키지</h4>
          <p className="text-xs text-[#a1a1a6] leading-relaxed flex-1 mb-4 break-keep">협상 전략부터 금융 구조까지, 당신의 딜 메이커.</p>
          <button className="w-full h-9 bg-[#f59e0b] text-white rounded-[6px] text-xs font-semibold hover:bg-[#d97706] transition-colors">
            패키지 보기 →
          </button>
        </div>
      </div>

      {/* 하단 전문가형 문구 */}
      <div className="px-5 py-4 border-t border-[#e4e4e7] flex gap-4">
        <div className="w-1 bg-[#f59e0b] rounded-full flex-shrink-0" />
        <p className="text-xs text-[#5a5a5a] leading-relaxed break-keep">
          <span className="font-semibold">BUILDMORE는 단순 수익률 계산이 아니라,</span> 매입가·대출구조·NOI·DSCR·LTV·리스크를 하나의 딜 판단 근거로 연결합니다. 분석 리포트는 협상 테이블에서 가격을 낮추고, 금융기관과 투자자에게 의사결정 근거를 제시하는 실무용 자료입니다.
        </p>
      </div>
    </div>
  )
}
