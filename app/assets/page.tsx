'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

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

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [userOnly, setUserOnly] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      localStorage.removeItem('auth_token')
      window.location.href = '/'
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    setIsLoggedIn(!!token)
    fetchAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userOnly])

  const fetchAssets = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const userId = token ? JSON.parse(atob(token)).userId : null

      // 如果未登录但选择了"仅显示我的"，则重置为 false
      const shouldFilterUserOnly = userOnly && userId

      const url = `/api/assets${shouldFilterUserOnly ? '?userOnly=true' : ''}`
      const response = await fetch(url, {
        headers: userId ? { 'x-user-id': userId } : {},
      })

      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets || [])
      }
    } catch (error) {
      console.error('获取素材列表失败:', error)
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">我的素材</h1>
              <p className="text-sm sm:text-base text-gray-600">管理您生成的所有 SVG 动画</p>
            </div>
            <div className="flex gap-2 sm:gap-3 items-center">
              {isLoggedIn && (
                <>
                  <label className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors touch-manipulation">
                    <input
                      type="checkbox"
                      checked={userOnly}
                      onChange={(e) => setUserOnly(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">仅显示我的</span>
                  </label>
                  <button
                    onClick={handleLogout}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation whitespace-nowrap"
                  >
                    退出登录
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {!isLoggedIn ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">🔒</div>
            <p className="text-gray-600 text-lg mb-2">请先登录</p>
            <p className="text-gray-500 text-sm mb-6">登录后才会为您保存生成的 SVG 动画</p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              立即登录
            </Link>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-600 text-lg mb-4">暂无素材</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              去生成第一个 SVG
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {assets.map((asset) => (
              <Link
                key={asset.id}
                href={`/assets/${asset.id}`}
                className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200"
              >
                <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 overflow-hidden relative">
                  {/* 类型标签 */}
                  <span className={`absolute top-2 right-2 px-2 py-0.5 text-xs rounded ${
                    asset.type === 'html' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {asset.type === 'html' ? 'H5' : 'SVG'}
                  </span>
                  {asset.type === 'html' ? (
                    // HTML 类型显示占位图标
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <span className="text-sm">H5 动画</span>
                    </div>
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: asset.svgCode }}
                    />
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
                        <p>{new Date(asset.createdAt).toLocaleString('zh-CN')}</p>
                      </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

