'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [userOnly, setUserOnly] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    setIsLoggedIn(!!token)
    fetchAssets()
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
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold">素材库</h1>
          <div className="flex gap-4">
            {isLoggedIn && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={userOnly}
                  onChange={(e) => setUserOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">仅显示我的</span>
              </label>
            )}
            <Link
              href="/"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              返回首页
            </Link>
          </div>
        </header>

        {assets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">暂无素材</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <Link
                key={asset.id}
                href={`/assets/${asset.id}`}
                className="border border-gray-300 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div
                  className="mb-4 bg-white rounded overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: asset.svgCode }}
                />
                <p className="text-sm text-gray-600 truncate">
                  {asset.description}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(asset.createdAt).toLocaleString('zh-CN')}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

