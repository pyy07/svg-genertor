'use client'

import { useState, useMemo } from 'react'

type ContentType = 'svg' | 'html'

interface SVGPreviewProps {
  code: string | null
  loading: boolean
  contentType?: ContentType
}

export default function SVGPreview({ code, loading, contentType = 'svg' }: SVGPreviewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!code) return

    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea')
      textArea.value = code
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

  // 为 HTML 类型创建 Blob URL
  const htmlBlobUrl = useMemo(() => {
    if (contentType === 'html' && code) {
      const blob = new Blob([code], { type: 'text/html' })
      return URL.createObjectURL(blob)
    }
    return null
  }, [code, contentType])

  // 清理 Blob URL
  // 注意：这里使用 useMemo 的依赖来控制何时创建新的 URL
  // 旧的 URL 会在组件重新渲染时被覆盖，浏览器会在页面关闭时清理

  return (
    <div className="w-full flex-1 relative flex flex-col min-h-0">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">生成中...</p>
          </div>
        </div>
      ) : code ? (
        <>
          <div className="flex justify-between items-center mb-2 flex-shrink-0 relative z-10">
            <span className={`px-2 py-0.5 text-xs rounded ${
              contentType === 'html' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {contentType === 'html' ? 'H5 动画' : 'SVG'}
            </span>
            <button
              onClick={handleCopy}
              className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 touch-manipulation"
              title={`复制${contentType === 'html' ? 'HTML' : 'SVG'}代码`}
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
            {contentType === 'html' && htmlBlobUrl ? (
              <iframe
                src={htmlBlobUrl}
                className="w-full h-full min-h-[400px] border-0 rounded-lg bg-white"
                sandbox="allow-scripts allow-same-origin"
                title="H5 动画预览"
              />
            ) : (
              <div
                className="w-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: code }}
              />
            )}
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-lg text-gray-700">动画预览面板</p>
            <p className="text-sm mt-2 text-gray-500">生成的动画将在这里显示</p>
          </div>
        </div>
      )}
    </div>
  )
}

