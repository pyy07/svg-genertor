'use client'

import { useEffect, useState } from 'react'
import SVGGenerator from '@/components/SVGGenerator'

interface User {
  id: string
  nickname?: string
  avatar?: string
  usageCount: number
  maxUsage: number
  isPermanent: boolean
  remaining: number
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 从 localStorage 获取 token（实际应该使用更安全的方式）
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        // 浏览器环境使用 atob 解码 base64
        const payload = JSON.parse(atob(token))
        fetchUserInfo(payload.userId)
      } catch (error) {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserInfo = async (userId: string) => {
    try {
      const response = await fetch('/api/user', {
        headers: {
          'x-user-id': userId,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWechatLogin = () => {
    // 微信登录 URL（需要配置实际的微信 OAuth URL）
    const wechatAuthUrl = `/api/auth/wechat`
    window.location.href = wechatAuthUrl
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
          <div>
            <h1 className="text-3xl font-bold">SVG 动画生成器</h1>
            <p className="text-gray-600 mt-2">
              {user
                ? `欢迎，${user.nickname || '用户'}！`
                : '根据您的描述生成精美的 SVG 动画'}
            </p>
          </div>
          <div className="text-right">
            {user ? (
              <>
                <p className="text-sm text-gray-600">
                  剩余次数:{' '}
                  {user.remaining === -1 ? '无限制' : user.remaining}
                </p>
                <a
                  href="/assets"
                  className="text-blue-500 hover:text-blue-700 text-sm"
                >
                  我的素材
                </a>
              </>
            ) : (
              <button
                onClick={handleWechatLogin}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
              >
                微信登录
              </button>
            )}
          </div>
        </header>

        <SVGGenerator
          userId={user?.id}
          remaining={user?.remaining ?? 0}
          isLoggedIn={!!user}
          onLoginRequest={handleWechatLogin}
        />
      </div>
    </main>
  )
}
