import type { AIProvider, AIProviderInterface } from './types'
import { GeminiProvider } from './providers/gemini'
import { OpenAIProvider } from './providers/openai'

// Provider 实例缓存
const providerCache = new Map<AIProvider, AIProviderInterface>()

/**
 * 获取 AI Provider 实例
 */
export function getAIProvider(provider: AIProvider): AIProviderInterface {
  // 使用缓存避免重复创建
  if (providerCache.has(provider)) {
    return providerCache.get(provider)!
  }

  let providerInstance: AIProviderInterface

  switch (provider) {
    case 'gemini':
      providerInstance = new GeminiProvider()
      break
    case 'openai':
      providerInstance = new OpenAIProvider()
      break
    default:
      throw new Error(`不支持的 AI Provider: ${provider}`)
  }

  providerCache.set(provider, providerInstance)
  return providerInstance
}

/**
 * 获取默认的 AI Provider
 */
export function getDefaultProvider(): AIProvider {
  const configuredProvider = process.env.AI_PROVIDER as AIProvider | undefined
  
  if (configuredProvider && ['gemini', 'openai'].includes(configuredProvider)) {
    return configuredProvider
  }

  // 检查哪个 provider 已配置
  if (process.env.GOOGLE_AI_API_KEY) {
    return 'gemini'
  }
  
  if (process.env.OPENAI_API_KEY) {
    return 'openai'
  }

  // 默认使用 gemini
  return 'gemini'
}

/**
 * 获取所有已配置的 Provider
 */
export function getConfiguredProviders(): AIProvider[] {
  const providers: AIProvider[] = []
  
  if (process.env.GOOGLE_AI_API_KEY) {
    providers.push('gemini')
  }
  
  if (process.env.OPENAI_API_KEY) {
    providers.push('openai')
  }
  
  return providers
}

/**
 * 生成 SVG（使用指定的或默认的 provider）
 */
export async function generateSVG(
  description: string,
  options?: {
    provider?: AIProvider
    model?: string
  }
): Promise<string> {
  const provider = options?.provider || getDefaultProvider()
  const providerInstance = getAIProvider(provider)
  
  if (!providerInstance.isConfigured()) {
    throw new Error(`${provider} Provider 未配置，请检查环境变量`)
  }

  return providerInstance.generateSVG(description, options?.model)
}

