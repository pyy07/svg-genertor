'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

type ContentType = 'svg' | 'html'

interface Asset {
  id: string
  description: string
  svgCode: string
  type: ContentType
  provider?: string | null
  model?: string | null
  createdAt: string
  user?: {
    id: string
    nickname?: string
    avatar?: string
  }
}

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const handleBack = () => {
    // 直接使用浏览器历史记录返回上一页
    // 如果是从其他页面进入的，会返回到那个页面
    // 如果是直接访问的，会返回到浏览器历史记录的上一页
    router.back()
  }

  useEffect(() => {
    if (params.id) {
      fetchAsset(params.id as string)
    }
  }, [params.id])

  const fetchAsset = async (id: string) => {
    try {
      const response = await fetch(`/api/assets/${id}`)
      if (response.ok) {
        const data = await response.json()
        setAsset(data.asset)
      }
    } catch (error) {
      console.error('获取素材详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 为 HTML 类型创建 Blob URL
  const htmlBlobUrl = useMemo(() => {
    if (asset?.type === 'html' && asset?.svgCode) {
      const blob = new Blob([asset.svgCode], { type: 'text/html' })
      return URL.createObjectURL(blob)
    }
    return null
  }, [asset?.type, asset?.svgCode])

  const handleCopy = async () => {
    if (!asset?.svgCode) return

    try {
      await navigator.clipboard.writeText(asset.svgCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </main>
    )
  }

  if (!asset) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">素材不存在</h1>
          <Link href="/assets" className="text-blue-500 hover:text-blue-700">
            返回素材列表
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-3 sm:p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-4 sm:mb-8">
          <button
            onClick={handleBack}
            className="text-sm sm:text-base text-blue-500 hover:text-blue-700 mb-2 sm:mb-4 inline-block touch-manipulation"
          >
            ← 返回
          </button>
          <div className="flex items-center gap-3 mb-1 sm:mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold">素材详情</h1>
            <span className={`px-2 py-0.5 text-xs rounded ${
              asset.type === 'html' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {asset.type === 'html' ? 'H5 动画' : 'SVG'}
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-600">{asset.description}</p>
        </header>

        <div className="bg-white border border-gray-300 rounded-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 overflow-hidden">
          <div className="w-full flex items-center justify-center overflow-auto" style={{ minHeight: '400px', maxHeight: '600px' }}>
            {asset.type === 'html' && htmlBlobUrl ? (
              <iframe
                src={htmlBlobUrl}
                className="w-full h-full min-h-[400px] border-0 rounded-lg bg-white"
                style={{ height: '500px' }}
                sandbox="allow-scripts allow-same-origin"
                title="H5 动画预览"
              />
            ) : (
              <div 
                className="flex items-center justify-center w-full [&_svg]:max-w-full [&_svg]:max-h-[600px] [&_svg]:w-auto [&_svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: asset.svgCode }} 
              />
            )}
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  已复制
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  复制代码
                </>
              )}
            </button>
          </div>
          <details>
            <summary className="cursor-pointer text-sm sm:text-base text-blue-500 hover:text-blue-700 mb-2 py-2 touch-manipulation">
              查看{asset.type === 'html' ? 'HTML' : 'SVG'}代码
            </summary>
            <pre className="p-3 sm:p-4 bg-gray-100 rounded-lg overflow-auto text-xs sm:text-sm max-h-[400px]">
              <code>{asset.svgCode}</code>
            </pre>
          </details>
        </div>

        <div className="text-xs sm:text-sm text-gray-600 space-y-1.5 sm:space-y-2">
          <p>创建时间: {new Date(asset.createdAt).toLocaleString('zh-CN')}</p>
          {asset.provider && (
            <p>
              AI 模型: <span className="font-medium">{asset.provider === 'gemini' ? 'Google Gemini' : asset.provider === 'openai' ? 'OpenAI' : asset.provider}</span>
              {asset.model && <span className="ml-2 text-gray-500">({asset.model})</span>}
            </p>
          )}
          {asset.user && (
            <p>创建者: {asset.user.nickname || '匿名用户'}</p>
          )}
        </div>
      </div>
    </main>
  )
}

