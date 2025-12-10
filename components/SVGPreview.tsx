'use client'

import { useState } from 'react'

interface SVGPreviewProps {
  svgCode: string | null
  loading: boolean
}

export default function SVGPreview({ svgCode, loading }: SVGPreviewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!svgCode) return

    try {
      await navigator.clipboard.writeText(svgCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea')
      textArea.value = svgCode
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (e) {
        console.error('复制失败:', e)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="w-full flex-1 relative flex flex-col min-h-0">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">生成中...</p>
          </div>
        </div>
      ) : svgCode ? (
        <>
          <div className="flex justify-end mb-2 flex-shrink-0 relative z-10">
            <button
              onClick={handleCopy}
              className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 touch-manipulation"
              title="复制 SVG 代码"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>复制代码</span>
                </>
              )}
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-auto min-h-0">
            <div
              className="w-full flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: svgCode }}
            />
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-lg text-gray-700">动画预览面板</p>
            <p className="text-sm mt-2 text-gray-500">生成的 SVG 将在这里显示</p>
          </div>
        </div>
      )}
    </div>
  )
}

