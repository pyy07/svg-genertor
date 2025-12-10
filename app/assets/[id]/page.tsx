'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Asset {
  id: string
  description: string
  svgCode: string
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
    <main className="min-h-screen p-3 sm:p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-4 sm:mb-8">
          <Link
            href="/assets"
            className="text-sm sm:text-base text-blue-500 hover:text-blue-700 mb-2 sm:mb-4 inline-block touch-manipulation"
          >
            ← 返回素材列表
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">素材详情</h1>
          <p className="text-sm sm:text-base text-gray-600">{asset.description}</p>
        </header>

        <div className="bg-white border border-gray-300 rounded-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 overflow-hidden">
          <div className="w-full flex items-center justify-center overflow-auto max-h-[600px]">
            <div 
              className="flex items-center justify-center w-full [&_svg]:max-w-full [&_svg]:max-h-[600px] [&_svg]:w-auto [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: asset.svgCode }} 
            />
          </div>
        </div>

        <details className="mb-4 sm:mb-6">
          <summary className="cursor-pointer text-sm sm:text-base text-blue-500 hover:text-blue-700 mb-2 py-2 touch-manipulation">
            查看 SVG 代码
          </summary>
          <pre className="p-3 sm:p-4 bg-gray-100 rounded-lg overflow-auto text-xs sm:text-sm">
            <code>{asset.svgCode}</code>
          </pre>
        </details>

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

