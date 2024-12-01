'use client'

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-gray-800 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-3 h-3 bg-gray-800 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
        <div className="w-3 h-3 bg-gray-800 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  )
}
