// AI Provider 类型定义

export type AIProvider = 'gemini' | 'openai'

// 内容类型：SVG 或 HTML (H5动画)
export type ContentType = 'svg' | 'html'

export interface AIConfig {
  provider: AIProvider
  model?: string
  apiKey: string
}

export interface AIGenerateOptions {
  description: string
  provider?: AIProvider
  model?: string
  contentType?: ContentType // 生成内容类型，默认为 svg
  baseCode?: string // 基于此代码进行修改
  baseDescription?: string // 原代码的描述
}

export interface AIProviderInterface {
  /**
   * Provider 名称
   */
  readonly name: AIProvider

  /**
   * 生成内容代码（SVG 或 HTML）
   * @param description 用户描述
   * @param options 生成选项
   */
  generateContent(
    description: string,
    options?: {
      model?: string
      contentType?: ContentType
      baseCode?: string
      baseDescription?: string
    }
  ): Promise<string>

  /**
   * 检查配置是否有效
   */
  isConfigured(): boolean

  /**
   * 获取可用的模型列表
   */
  getAvailableModels(): string[]
}

