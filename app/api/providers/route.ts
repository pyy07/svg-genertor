import { NextResponse } from 'next/server'
import { getConfiguredProviders, getAIProvider, getDefaultProvider } from '@/lib/ai/factory'
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

    // 获取默认 Provider（考虑环境变量 AI_PROVIDER）
    const defaultProvider = getDefaultProvider()
    
    // 确保默认 Provider 在已配置的列表中，否则使用第一个
    const validDefaultProvider = configuredProviders.includes(defaultProvider)
      ? defaultProvider
      : configuredProviders[0] || null

    return NextResponse.json({
      providers,
      defaultProvider: validDefaultProvider,
    })
  } catch (error) {
    console.error('获取 Provider 列表错误:', error)
    return NextResponse.json(
      { error: '获取 Provider 列表失败' },
      { status: 500 }
    )
  }
}

