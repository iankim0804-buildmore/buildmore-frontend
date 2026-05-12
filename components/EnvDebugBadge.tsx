'use client'

export function EnvDebugBadge() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  const isSet = !!apiUrl
  const displayText = isSet ? apiUrl.slice(0, 30) + (apiUrl.length > 30 ? '...' : '') : 'API URL 미설정'

  return (
    <div
      className={`fixed bottom-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium text-white z-50 ${
        isSet ? 'bg-green-500' : 'bg-red-500'
      }`}
      title={isSet ? apiUrl : 'NEXT_PUBLIC_API_BASE_URL not configured'}
    >
      {displayText}
    </div>
  )
}
