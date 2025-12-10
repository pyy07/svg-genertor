'use client'

import { useEffect, useState } from 'react'
import SVGGenerator from '@/components/SVGGenerator'
import SVGPreview from '@/components/SVGPreview'
import Navigation from '@/components/Navigation'

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
  const [svgCode, setSvgCode] = useState<string | null>(null)
  const [svgLoading, setSvgLoading] = useState(false)

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
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user || undefined} onLogout={handleLogout} />
      <main className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
        {/* 预览区域 - 移动端在上，桌面端在左 */}
        <div className="flex-1 bg-white p-3 sm:p-6 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 order-1 min-h-0">
          <div className="mb-2 sm:mb-4 flex-shrink-0">
            <h2 className="text-gray-900 text-base sm:text-lg font-medium">动画预览</h2>
          </div>
          <div className="flex-1 bg-white rounded-lg border border-gray-300 overflow-hidden shadow-sm min-h-[300px] sm:min-h-[400px] lg:min-h-0 flex flex-col min-h-0">
            <SVGPreview svgCode={svgCode} loading={svgLoading} />
          </div>
        </div>

        {/* 控制面板 - 移动端在下，桌面端在右 */}
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto order-2 max-h-[60vh] lg:max-h-none">
          <div className="p-3 sm:p-6">
            <SVGGenerator
              userId={user?.id}
              remaining={user?.remaining ?? 0}
              isLoggedIn={!!user}
              allowAnonymous={allowAnonymous}
              onLoginRequest={handleWechatLogin}
              svgCode={svgCode}
              onSVGGenerated={(code) => {
                setSvgCode(code)
                setSvgLoading(false)
              }}
              onLoadingChange={(loading) => setSvgLoading(loading)}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
