'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatMessage } from '@/hooks/useAnalysisChat'

interface AnalysisChatProps {
  messages: ChatMessage[]
  suggestedQuestions: string[]
  isLoading: boolean
  onSendMessage: (message: string) => void
  hasAnalysis: boolean
}

export function AnalysisChat({
  messages,
  suggestedQuestions,
  isLoading,
  onSendMessage,
  hasAnalysis
}: AnalysisChatProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // 새 메시지가 추가되면 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !hasAnalysis) return
    
    onSendMessage(input.trim())
    setInput('')
  }
  
  const handleSuggestedQuestion = (question: string) => {
    if (isLoading || !hasAnalysis) return
    onSendMessage(question)
  }
  
  // 마크다운 간단 렌더링 (테이블, 볼드, 제목)
  const renderMarkdown = (content: string) => {
    // 테이블 처리
    if (content.includes('|')) {
      const lines = content.split('\n')
      const result: JSX.Element[] = []
      let tableLines: string[] = []
      let inTable = false
      
      lines.forEach((line, idx) => {
        if (line.trim().startsWith('|')) {
          inTable = true
          tableLines.push(line)
        } else {
          if (inTable && tableLines.length > 0) {
            result.push(renderTable(tableLines, `table-${idx}`))
            tableLines = []
            inTable = false
          }
          result.push(<span key={idx}>{renderLine(line)}<br/></span>)
        }
      })
      
      if (tableLines.length > 0) {
        result.push(renderTable(tableLines, 'table-end'))
      }
      
      return <>{result}</>
    }
    
    return content.split('\n').map((line, i) => (
      <span key={i}>{renderLine(line)}<br/></span>
    ))
  }
  
  const renderLine = (line: string) => {
    // 제목 처리
    if (line.startsWith('## ')) {
      return <strong className="text-sm font-semibold block mt-2 mb-1">{line.slice(3)}</strong>
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return <strong className="font-semibold">{line.slice(2, -2)}</strong>
    }
    // 인라인 볼드 처리
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      }
      return part
    })
  }
  
  const renderTable = (lines: string[], key: string) => {
    const rows = lines.filter(l => !l.includes('---')).map(l => 
      l.split('|').filter(cell => cell.trim()).map(cell => cell.trim())
    )
    
    if (rows.length < 1) return null
    
    const [header, ...body] = rows
    
    return (
      <div key={key} className="my-2 overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted">
              {header.map((cell, i) => (
                <th key={i} className="border border-border px-2 py-1 text-left font-semibold">{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                {row.map((cell, j) => (
                  <td key={j} className="border border-border px-2 py-1">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full bg-[#fafafa] rounded-lg border border-border">
      {/* 메시지 영역 */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {messages.length === 0 && !hasAnalysis && (
          <div className="text-center text-muted-foreground text-xs py-8">
            분석을 실행하면 여기에 결과가 표시됩니다
          </div>
        )}
        
        {messages.length === 0 && hasAnalysis && (
          <div className="text-center text-muted-foreground text-xs py-4">
            분석 결과에 대해 질문해 보세요
          </div>
        )}
        
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-foreground text-background'
                    : msg.role === 'system'
                      ? 'bg-amber-50 border border-amber-200 text-amber-900'
                      : 'bg-white border border-border text-foreground'
                }`}
              >
                {msg.role === 'system' ? (
                  <div className="whitespace-pre-wrap">{renderMarkdown(msg.content)}</div>
                ) : msg.role === 'assistant' ? (
                  <div className="whitespace-pre-wrap">{renderMarkdown(msg.content)}</div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-border rounded-lg px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* 추천 질문 */}
      {suggestedQuestions.length > 0 && hasAnalysis && messages.length <= 2 && (
        <div className="px-3 py-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground mb-1.5">추천 질문</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSuggestedQuestion(q)}
                disabled={isLoading}
                className="px-2 py-1 text-[10px] bg-white border border-border rounded-full hover:bg-muted transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* 입력 영역 */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-border">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasAnalysis ? "질문을 입력하세요..." : "먼저 분석을 실행하세요"}
            disabled={isLoading || !hasAnalysis}
            className="flex-1 h-8 text-xs bg-white"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !input.trim() || !hasAnalysis}
            className="h-8 w-8 p-0"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
