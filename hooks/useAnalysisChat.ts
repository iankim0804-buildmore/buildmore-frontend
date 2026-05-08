'use client'

import { useState, useCallback } from 'react'
import type { AnalysisResult } from '@/lib/analysis/dealAnalysisEngine'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
}

interface UseAnalysisChatReturn extends ChatState {
  sendMessage: (message: string, analysisResult: AnalysisResult) => Promise<void>
  addSystemMessage: (content: string) => void
  clearChat: () => void
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function useAnalysisChat(): UseAnalysisChatReturn {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null
  })
  
  const addSystemMessage = useCallback((content: string) => {
    const message: ChatMessage = {
      id: generateId(),
      role: 'system',
      content,
      timestamp: new Date().toISOString()
    }
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }))
  }, [])
  
  const sendMessage = useCallback(async (message: string, analysisResult: AnalysisResult) => {
    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null
    }))
    
    try {
      const response = await fetch('/api/analysis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          analysisResult,
          history: state.messages.map(m => ({ role: m.role, content: m.content }))
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '응답 생성 중 오류가 발생했습니다.')
      }
      
      // 어시스턴트 응답 추가
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp
      }
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '응답 생성 중 오류가 발생했습니다.'
      }))
    }
  }, [state.messages])
  
  const clearChat = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      error: null
    })
  }, [])
  
  return {
    ...state,
    sendMessage,
    addSystemMessage,
    clearChat
  }
}
