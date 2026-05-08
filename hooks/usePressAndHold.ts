import { useCallback, useEffect, useRef } from "react"

interface UsePressAndHoldOptions {
  onPress: () => void
  initialDelayMs?: number
  repeatIntervalMs?: number
}

export const usePressAndHold = ({
  onPress,
  initialDelayMs = 300,
  repeatIntervalMs = 100,
}: UsePressAndHoldOptions) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    stop()
    
    // 즉시 한 번 실행
    onPress()

    // 300ms 후 반복 시작
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        onPress()
      }, repeatIntervalMs)
    }, initialDelayMs)
  }, [onPress, stop, initialDelayMs, repeatIntervalMs])

  // Cleanup on unmount
  useEffect(() => {
    return stop
  }, [stop])

  return { start, stop }
}
