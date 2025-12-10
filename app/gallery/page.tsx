'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

interface Asset {
  id: string
  description: string
  svgCode: string
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">案例展示</h1>
          <p className="text-gray-600">
            浏览所有用户生成的精美 SVG 动画作品
          </p>
        </div>

        {loading && assets.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-gray-600 text-lg">暂无案例</p>
            <Link
              href="/"
              className="mt-4 inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              去生成第一个 SVG
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {assets.map((asset) => (
                <Link
                  key={asset.id}
                  href={`/assets/${asset.id}`}
                  className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200"
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 overflow-hidden">
                    <div
                      className="w-full h-full flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: asset.svgCode }}
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                      {asset.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
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
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

