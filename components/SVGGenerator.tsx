'use client'

import { useState } from 'react'

interface SVGGeneratorProps {
  userId?: string
  remaining: number
  isLoggedIn: boolean
  allowAnonymous?: boolean
  onLoginRequest: () => void
}

export default function SVGGenerator({
  userId,
  remaining,
  isLoggedIn,
  allowAnonymous = false,
  onLoginRequest,
}: SVGGeneratorProps) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [svgCode, setSvgCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentRemaining, setCurrentRemaining] = useState(remaining)

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('请输入描述')
      return
    }

    // 如果允许匿名访问，跳过登录检查
    if (!allowAnonymous) {
      if (!isLoggedIn || !userId) {
        setError('请先登录后再生成 SVG')
        onLoginRequest()
        return
      }

      if (currentRemaining === 0 && remaining !== -1) {
        setError('使用次数已用完')
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          userId: userId || undefined, // 匿名访问时不传 userId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setError('请先登录后再生成 SVG')
          onLoginRequest()
          return
        }
        throw new Error(data.error || '生成失败')
      }

      setSvgCode(data.svgCode)
      // 如果返回了剩余次数，更新它
      if (data.remaining !== undefined) {
        setCurrentRemaining(data.remaining)
      }
      setDescription('')
    } catch (err: any) {
      setError(err.message || '生成失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">生成 SVG 动画</h2>
        {allowAnonymous ? (
          <p className="text-gray-600">
            {isLoggedIn ? (
              <>
                剩余使用次数:{' '}
                {currentRemaining === -1 ? '无限制' : currentRemaining}
                {' '}（本地测试模式：未登录用户也可使用）
              </>
            ) : (
              '本地测试模式：无需登录即可生成 SVG'
            )}
          </p>
        ) : isLoggedIn ? (
          <p className="text-gray-600">
            剩余使用次数:{' '}
            {currentRemaining === -1 ? '无限制' : currentRemaining}
          </p>
        ) : (
          <p className="text-gray-600">
            生成 SVG 需要登录，每个用户默认可以使用 3 次
          </p>
        )}
      </div>

      <div className="mb-6">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述您想要的 SVG 动画，例如：一个旋转的彩色圆圈"
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          disabled={
            loading ||
            (!allowAnonymous && !isLoggedIn && !description.trim()) ||
            (isLoggedIn && currentRemaining === 0 && remaining !== -1)
          }
        />
      </div>

      {!isLoggedIn && !allowAnonymous ? (
        <div className="space-y-4">
          <button
            onClick={handleGenerate}
            disabled={loading || !description.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '生成中...' : '生成 SVG'}
          </button>
          <p className="text-sm text-gray-500">
            提示：生成 SVG 需要先登录，点击生成按钮将跳转到登录页面
          </p>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={
            loading ||
            !description.trim() ||
            (isLoggedIn && currentRemaining === 0 && remaining !== -1)
          }
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? '生成中...' : '生成 SVG'}
        </button>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {svgCode && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">生成的 SVG 动画</h3>
          <div
            className="border border-gray-300 rounded-lg p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: svgCode }}
          />
          <details className="mt-4">
            <summary className="cursor-pointer text-blue-500 hover:text-blue-700">
              查看 SVG 代码
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded-lg overflow-auto">
              <code>{svgCode}</code>
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}

