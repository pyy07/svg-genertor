'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hasWechatConfig, setHasWechatConfig] = useState<boolean | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    // 通过 API 检查是否配置了微信
    fetch('/api/auth/wechat/check')
      .then((res) => res.json())
      .then(async (data) => {
        setHasWechatConfig(data.configured)
        // 如果已配置，获取授权 URL
        if (data.configured) {
          try {
            const authRes = await fetch('/api/auth/wechat/authorize', {
              headers: {
                'Accept': 'application/json',
              },
            })
            const authData = await authRes.json()
            if (authData.authUrl) {
              setQrUrl(authData.authUrl)
            }
          } catch (error) {
            console.error('获取授权 URL 失败:', error)
          }
        }
      })
      .catch(() => {
        setHasWechatConfig(false)
      })
  }, [])

  const handleWechatLogin = async () => {
    setLoading(true)
    try {
      // 获取授权 URL
      const response = await fetch('/api/auth/wechat/authorize', {
        headers: {
          'Accept': 'application/json',
        },
      })
      const data = await response.json()
      
      if (data.authUrl) {
        // 检查是否是测试号（需要在微信中打开）
        if (data.isTestAccount || data.authUrl.includes('oauth2/authorize')) {
          // 测试号：跳转到二维码页面
          window.location.href = `/login/qr?authUrl=${encodeURIComponent(data.authUrl)}`
        } else {
          // 网站应用：直接跳转到微信扫码页面
          window.location.href = data.authUrl
        }
      } else {
        // 如果没有返回 URL，直接跳转
        window.location.href = '/api/auth/wechat/authorize'
      }
    } catch (error) {
      console.error('获取授权 URL 失败:', error)
      // 失败时直接跳转
      window.location.href = '/api/auth/wechat/authorize'
    }
  }

  const handleDevLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/wechat?dev=true')
      if (response.redirected) {
        window.location.href = response.url
      }
    } catch (error) {
      console.error('登录失败:', error)
      setLoading(false)
    }
  }

  // 检查是否已经登录
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      router.push('/')
    }

    // 检查 URL 中的错误信息
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')
    
    if (error) {
      let errorMessage = errorDescription || error
      
      // 针对特定错误提供更友好的提示
      if (error === 'missing_code') {
        errorMessage = '缺少授权码，可能的原因：\n1. 测试号需要在微信客户端内打开链接\n2. 网页授权域名未正确配置\n3. 用户取消了授权\n\n请重新尝试登录'
      } else if (error === 'access_denied') {
        errorMessage = '用户取消了授权，请重新尝试登录'
      }
      
      alert(`登录错误: ${errorMessage}\n\n提示：如果使用测试号，请确保在微信客户端内打开链接进行授权。`)
      // 清除 URL 中的错误参数
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center p-8 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">SVG 动画生成器</h1>
          <p className="text-gray-600">请使用微信扫码登录</p>
        </div>

        {hasWechatConfig === null ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">检查配置中...</p>
          </div>
        ) : hasWechatConfig ? (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-gray-100 rounded-lg">
                <div className="w-64 h-64 flex items-center justify-center bg-white rounded">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📱</div>
                    <p className="text-sm text-gray-600">
                      点击下方按钮<br />
                      跳转到微信扫码页面
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                使用微信登录
              </p>
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 提示：如果使用测试号，请在微信客户端内打开链接进行授权
                </p>
              </div>
            </div>

            <button
              onClick={handleWechatLogin}
              disabled={loading}
              className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>跳转中...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
                  </svg>
                  <span>微信扫码登录</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ 未配置微信 AppID，使用开发模式登录
              </p>
            </div>

            <button
              onClick={handleDevLogin}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '开发模式登录'}
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            返回首页
          </a>
        </div>
      </div>
    </main>
  )
}

