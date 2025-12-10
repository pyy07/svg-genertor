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
  baseSVG?: string // 基于此 SVG 进行修改
  baseDescription?: string // 原 SVG 的描述
}

export interface AIProviderInterface {
  /**
   * Provider 名称
   */
  readonly name: AIProvider

  /**
   * 生成 SVG 代码
   * @param description 用户描述
   * @param model 模型名称（可选）
   * @param baseSVG 基于此 SVG 进行修改（可选）
   * @param baseDescription 原 SVG 的描述（可选）
   */
  generateSVG(
    description: string,
    model?: string,
    baseSVG?: string,
    baseDescription?: string
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

