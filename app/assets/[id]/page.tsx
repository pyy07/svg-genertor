'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

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

export default function AssetDetailPage() {
  const params = useParams()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)

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
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <Link
            href="/assets"
            className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
          >
            ← 返回素材列表
          </Link>
          <h1 className="text-3xl font-bold mb-2">素材详情</h1>
          <p className="text-gray-600">{asset.description}</p>
        </header>

        <div className="bg-white border border-gray-300 rounded-lg p-8 mb-6">
          <div dangerouslySetInnerHTML={{ __html: asset.svgCode }} />
        </div>

        <details className="mb-6">
          <summary className="cursor-pointer text-blue-500 hover:text-blue-700 mb-2">
            查看 SVG 代码
          </summary>
          <pre className="p-4 bg-gray-100 rounded-lg overflow-auto">
            <code>{asset.svgCode}</code>
          </pre>
        </details>

        <div className="text-sm text-gray-600">
          <p>创建时间: {new Date(asset.createdAt).toLocaleString('zh-CN')}</p>
          {asset.user && (
            <p className="mt-2">创建者: {asset.user.nickname || '匿名用户'}</p>
          )}
        </div>
      </div>
    </main>
  )
}

