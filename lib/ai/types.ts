// AI Provider 类型定义

export type AIProvider = 'gemini' | 'openai'

export interface AIConfig {
  provider: AIProvider
  model?: string
  apiKey: string
}

export interface AIGenerateOptions {
  description: string
  provider?: AIProvider
  model?: string
}

export interface AIProviderInterface {
  /**
   * Provider 名称
   */
  readonly name: AIProvider

  /**
   * 生成 SVG 代码
   */
  generateSVG(description: string, model?: string): Promise<string>

  /**
   * 检查配置是否有效
   */
  isConfigured(): boolean

  /**
   * 获取可用的模型列表
   */
  getAvailableModels(): string[]
}

