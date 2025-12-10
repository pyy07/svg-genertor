'use client'

import { useState, useEffect } from 'react'

interface SVGGeneratorProps {
  userId?: string
  remaining: number
  isLoggedIn: boolean
  allowAnonymous?: boolean
  onLoginRequest: () => void
  svgCode?: string | null // 外部传入的 SVG 代码
  onSVGGenerated?: (svgCode: string) => void // SVG 生成后的回调
  onLoadingChange?: (loading: boolean) => void // 加载状态变化回调
}

interface Provider {
  name: string
  configured: boolean
  models: string[]
}

export default function SVGGenerator({
  userId,
  remaining,
  isLoggedIn,
  allowAnonymous = false,
  onLoginRequest,
  svgCode: externalSVGCode,
  onSVGGenerated,
  onLoadingChange,
}: SVGGeneratorProps) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [svgCode, setSvgCode] = useState<string | null>(externalSVGCode || null)
  const [error, setError] = useState<string | null>(null)
  const [currentRemaining, setCurrentRemaining] = useState(remaining)
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [baseSVG, setBaseSVG] = useState<string | null>(null)
  const [baseDescription, setBaseDescription] = useState<string>('')

  // 同步外部传入的 SVG 代码
  useEffect(() => {
    if (externalSVGCode !== undefined) {
      setSvgCode(externalSVGCode)
    }
  }, [externalSVGCode])

  useEffect(() => {
    // 获取可用的 providers
    fetch('/api/providers')
      .then((res) => res.json())
      .then((data) => {
        if (data.providers && data.providers.length > 0) {
          setProviders(data.providers)
          
          // 使用后端返回的默认 Provider（考虑环境变量配置）
          const defaultProvider = data.defaultProvider || data.providers[0].name
          setSelectedProvider(defaultProvider)
          
          // 设置对应 Provider 的默认模型
          const provider = data.providers.find((p: Provider) => p.name === defaultProvider) || data.providers[0]
          if (provider.models.length > 0) {
            setSelectedModel(provider.models[0])
          }
        }
      })
      .catch((error) => {
        console.error('获取 Provider 列表失败:', error)
      })
  }, [])

  // 当选择的 provider 改变时，更新 model
  useEffect(() => {
    const provider = providers.find((p) => p.name === selectedProvider)
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0])
    }
  }, [selectedProvider, providers])

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
    if (onLoadingChange) {
      onLoadingChange(true)
    }

    try {
      // 如果已有 SVG，说明是修改模式
      const isModifying = !!svgCode

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          userId: userId || undefined, // 匿名访问时不传 userId
          provider: selectedProvider || undefined,
          model: selectedModel || undefined,
          // 修改模式：传递当前 SVG 和当前描述作为基础
          baseSVG: isModifying && svgCode ? svgCode : undefined,
          baseDescription: isModifying && description ? description : undefined,
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
      // 通知父组件 SVG 已生成
      if (onSVGGenerated) {
        onSVGGenerated(data.svgCode)
      }
      
      // 如果返回了剩余次数，更新它
      if (data.remaining !== undefined) {
        setCurrentRemaining(data.remaining)
      }
      
      // 如果当前已有 SVG，说明是修改模式
      if (svgCode) {
        // 修改模式：将新生成的 SVG 设为新的基础 SVG，清空描述以便下次修改
        setBaseSVG(data.svgCode)
        setBaseDescription(description)
        setDescription('')
      } else {
        // 新建模式：清空描述
        setDescription('')
      }
    } catch (err: any) {
      setError(err.message || '生成失败，请稍后重试')
    } finally {
      setLoading(false)
      if (onLoadingChange) {
        onLoadingChange(false)
      }
    }
  }

  return (
    <div className="w-full">

      {/* 动画描述 */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          动画描述
        </label>
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述你想创建的动画，越详细越好。例如：'模拟一个二叉树的遍历过程，节点在被访问时变色，背景使用深色网格。'"
            className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 resize-none text-sm sm:text-base"
            rows={5}
            maxLength={500}
            disabled={
              loading ||
              (!allowAnonymous && !isLoggedIn && !description.trim()) ||
              (isLoggedIn && currentRemaining === 0 && remaining !== -1)
            }
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {description.length}/500
          </div>
        </div>
      </div>

      {/* Provider 和 Model 选择 */}
      {providers.length > 0 && (
        <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI 模型提供商
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full p-2.5 sm:p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm sm:text-base"
              disabled={loading}
            >
              {providers.map((provider) => (
                <option key={provider.name} value={provider.name}>
                  {provider.name === 'gemini' ? 'Google Gemini' : 'OpenAI'} 
                  {provider.configured ? '' : ' (未配置)'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              模型
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2.5 sm:p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm sm:text-base"
              disabled={loading || !selectedProvider}
            >
              {providers
                .find((p) => p.name === selectedProvider)
                ?.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* 用户信息提示 */}
      {!allowAnonymous && !isLoggedIn && (
        <div className="mb-4 sm:mb-6 p-2.5 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs sm:text-sm text-yellow-800">
            生成 SVG 需要登录，每个用户默认可以使用 3 次
          </p>
        </div>
      )}
      {isLoggedIn && (
        <div className="mb-4 sm:mb-6 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-800">
            剩余使用次数:{' '}
            <span className="font-semibold">
              {currentRemaining === -1 ? '无限制' : currentRemaining}
            </span>
          </p>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="space-y-3 sm:space-y-4">
        {svgCode && (
          <button
            onClick={() => {
              setSvgCode(null)
              setBaseSVG(null)
              setBaseDescription('')
              setDescription('')
              // 通知父组件清除 SVG
              if (onSVGGenerated) {
                onSVGGenerated('')
              }
            }}
            disabled={loading}
            className="w-full px-4 py-2.5 sm:py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
            title="清除当前 SVG，重新生成全新的 SVG"
          >
            重新生成
          </button>
        )}
        <button
          onClick={handleGenerate}
          disabled={
            loading ||
            !description.trim() ||
            (isLoggedIn && currentRemaining === 0 && remaining !== -1) ||
            (!allowAnonymous && !isLoggedIn)
          }
          className="w-full px-6 py-3.5 sm:py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base touch-manipulation"
        >
          {loading ? (
            <>
              <span className="animate-spin">⚡</span>
              <span>生成中...</span>
            </>
          ) : svgCode ? (
            <>
              <span>⚡</span>
              <span>修改此 SVG</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>开始生成动画</span>
            </>
          )}
        </button>
        {!isLoggedIn && !allowAnonymous && (
          <p className="text-xs text-center text-gray-500">
            提示：生成 SVG 需要先登录
          </p>
        )}
      </div>

      {error && (
        <div className="mt-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm">
          {error}
        </div>
      )}

      {svgCode && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 mb-2">
            💡 <strong>提示</strong>：输入新的描述可以修改当前 SVG，或点击&quot;重新生成&quot;创建全新的 SVG
          </p>
          {baseDescription && (
            <p className="text-xs text-blue-600 mb-1">
              当前 SVG 描述：{baseDescription}
            </p>
          )}
        </div>
      )}

      {/* 底部链接 */}
      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
        <a
          href="#"
          className="text-xs text-gray-500 hover:text-gray-700 text-center block py-2"
        >
          遇到问题？联系我
        </a>
      </div>
    </div>
  )
}

