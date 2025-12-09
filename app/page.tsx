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
  const [allowAnonymous, setAllowAnonymous] = useState(false)

  useEffect(() => {
    // 检查是否允许匿名访问
    fetch('/api/auth/check')
      .then((res) => res.json())
      .then((data) => {
        setAllowAnonymous(data.allowAnonymous || false)
      })
      .catch(() => {
        setAllowAnonymous(false)
      })

    // 检查 URL 中是否有 token（登录回调）
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    
    if (token) {
      // 保存 token 到 localStorage
      localStorage.setItem('auth_token', token)
      // 清除 URL 中的 token
      window.history.replaceState({}, '', window.location.pathname)
      // 获取用户信息
      try {
        const payload = JSON.parse(atob(token))
        fetchUserInfo(payload.userId)
      } catch (error) {
        setLoading(false)
      }
    } else {
      // 从 localStorage 获取 token
      const savedToken = localStorage.getItem('auth_token')
      if (savedToken) {
        try {
          const payload = JSON.parse(atob(savedToken))
          fetchUserInfo(payload.userId)
        } catch (error) {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
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
    // 跳转到登录页面
    window.location.href = '/login'
  }

  const handleLogout = async () => {
    try {
      // 调用退出登录 API（可选，主要用于服务端清理）
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      // 清除本地存储的 token
      localStorage.removeItem('auth_token')
      // 刷新页面
      window.location.href = '/'
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
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-4">
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
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    退出登录
                  </button>
                </div>
                {user.nickname && (
                  <p className="text-xs text-gray-500">
                    {user.nickname}
                  </p>
                )}
              </div>
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
          allowAnonymous={allowAnonymous}
          onLoginRequest={handleWechatLogin}
        />
      </div>
    </main>
  )
}
