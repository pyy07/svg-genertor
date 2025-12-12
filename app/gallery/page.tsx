'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import H5CardPreview from '@/components/H5CardPreview'

interface Asset {
  id: string
  description: string
  svgCode: string
  type?: 'svg' | 'html'
  provider?: string | null
  model?: string | null
  createdAt: string
  user?: {
    id: string
    nickname?: string
    avatar?: string
  }
}

export default function GalleryPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 12

  const sanitizeForPreview = (raw: string) => {
    if (!raw) return ''
    // 尽量只渲染 <svg>...</svg>，避免把非 SVG（例如 HTML）注入到 DOM
    const svgMatch = raw.match(/<svg[\s\S]*<\/svg>/i)
    let svg = svgMatch ? svgMatch[0] : raw

    // 移除 script，避免执行/污染
    svg = svg.replace(/<script[\s\S]*?<\/script>/gi, '')

    // 仅移除“可能污染全局”的 style（例如选择器命中 html/body/:root）
    svg = svg.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (styleBlock) => {
      return /(^|[^\w-])(html|body|:root)\b/i.test(styleBlock) ? '' : styleBlock
    })

    return svg
  }

  useEffect(() => {
    fetchAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/assets?page=${page}&limit=${pageSize}`)

      if (response.ok) {
        const data = await response.json()
        if (page === 1) {
          setAssets(data.assets || [])
        } else {
          setAssets((prev) => [...prev, ...(data.assets || [])])
        }
        setHasMore((data.assets || []).length === pageSize)
      }
    } catch (error) {
      console.error('获取案例列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1)
    }
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Navigation />
      <main className="flex-1 overflow-hidden p-2 sm:p-3 lg:p-6">
        {/* 内容面板：移动端内部滚动，导航保持固定可见 */}
        <div className="h-full max-w-screen-2xl mx-auto">
          <div className="h-full bg-gray-50 rounded-xl shadow-sm border border-white/50 px-3 sm:px-4 lg:px-6 py-4 sm:py-6 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0">
              {loading && assets.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-700">加载中...</p>
                  </div>
                </div>
              ) : assets.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center py-10">
                <div className="text-6xl mb-4">🎨</div>
                <p className="text-gray-600 text-lg">暂无案例</p>
                <Link
                  href="/"
                  className="mt-4 inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  去生成第一个 SVG
                </Link>
              </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {assets.map((asset) => (
                      <Link
                        key={asset.id}
                        href={`/assets/${asset.id}`}
                        className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200"
                      >
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-3 overflow-hidden relative">
                          {/* 类型角标（更醒目，不影响布局） */}
                          <span
                            className={`absolute left-0 top-0 z-10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white rounded-br-lg shadow-md ${
                              asset.type === 'html'
                                ? 'bg-purple-600'
                                : 'bg-blue-600'
                            }`}
                          >
                            {asset.type === 'html' ? 'H5' : 'SVG'}
                          </span>
                          {asset.type === 'html' ? (
                            // H5（HTML）用 iframe + Blob URL 隔离渲染，避免 style 污染全站
                            <H5CardPreview html={asset.svgCode} />
                          ) : (
                            <div className="w-full h-full rounded-md overflow-hidden bg-white/80 backdrop-blur-sm flex items-center justify-center">
                              <div
                                className="w-full h-full flex items-center justify-center p-2 overflow-hidden [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto"
                                dangerouslySetInnerHTML={{ __html: sanitizeForPreview(asset.svgCode) }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="p-3 sm:p-4">
                          <p className="text-xs sm:text-sm text-gray-700 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                            {asset.description}
                          </p>
                          <div className="text-xs text-gray-500 space-y-1">
                            {asset.provider && (
                              <p>
                                {asset.provider === 'gemini' ? 'Gemini' : asset.provider === 'openai' ? 'OpenAI' : asset.provider}
                                {asset.model && ` · ${asset.model}`}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <span>
                                {new Date(asset.createdAt).toLocaleDateString('zh-CN')}
                              </span>
                              {asset.user?.nickname && (
                                <span className="text-gray-400">
                                  @{asset.user.nickname}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {hasMore && (
                    <div className="mt-8 sm:mt-12 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loading}
                        className="px-6 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg text-sm sm:text-base text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm touch-manipulation"
                      >
                        {loading ? '加载中...' : '加载更多'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

