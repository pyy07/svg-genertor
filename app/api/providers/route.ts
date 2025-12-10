import { NextResponse } from 'next/server'
import { getConfiguredProviders, getAIProvider } from '@/lib/ai/factory'
import type { AIProvider } from '@/lib/ai/types'

/**
 * 获取所有可用的 AI Provider 和模型列表
 */
export async function GET() {
  try {
    const configuredProviders = getConfiguredProviders()
    
    const providers = configuredProviders.map((providerName) => {
      const provider = getAIProvider(providerName)
      return {
        name: providerName,
        configured: provider.isConfigured(),
        models: provider.getAvailableModels(),
      }
    })

    return NextResponse.json({
      providers,
      defaultProvider: configuredProviders[0] || null,
    })
  } catch (error) {
    console.error('获取 Provider 列表错误:', error)
    return NextResponse.json(
      { error: '获取 Provider 列表失败' },
      { status: 500 }
    )
  }
}

