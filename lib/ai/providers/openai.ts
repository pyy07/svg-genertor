import OpenAI from 'openai'
import type { AIProviderInterface } from '../types'

export class OpenAIProvider implements AIProviderInterface {
  readonly name = 'openai' as const
  private client: OpenAI | null = null
  private apiKey: string | undefined
  private baseURL: string | undefined

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY
    this.baseURL = process.env.OPENAI_BASE_URL
    
    if (this.apiKey) {
      const config: {
        apiKey: string
        baseURL?: string
      } = {
        apiKey: this.apiKey,
      }
      
      // 如果配置了 BASE_URL，使用自定义端点（可用于代理或兼容 API）
      if (this.baseURL) {
        config.baseURL = this.baseURL
      }
      
      this.client = new OpenAI(config)
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.client
  }

  getAvailableModels(): string[] {
    return [
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
    ]
  }

  async generateSVG(description: string, model?: string): Promise<string> {
    if (!this.client || !this.apiKey) {
      throw new Error('OpenAI API Key 未配置，请在 .env 文件中设置 OPENAI_API_KEY')
    }

    const modelName = model || process.env.OPENAI_MODEL || 'gpt-4o'

    const prompt = `你是一个专业的 SVG 动画设计师。根据用户的描述，生成一个完整的、可运行的 SVG 动画代码。

要求：
1. 生成的 SVG 必须是完整的、有效的 XML 代码
2. 必须包含动画效果（使用 <animate>、<animateTransform> 或 CSS 动画）
3. 动画应该流畅、美观
4. 只返回 SVG 代码，不要包含任何解释文字或 markdown 代码块标记
5. SVG 应该居中显示，适合在网页中展示

用户描述：${description}

请生成 SVG 代码：`

    try {
      const response = await this.client.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      })

      let svgCode = response.choices[0]?.message?.content || ''

      if (!svgCode) {
        throw new Error('OpenAI 返回了空内容')
      }

      // 清理可能的 markdown 代码块标记
      svgCode = svgCode.replace(/```svg\n?/g, '').replace(/```\n?/g, '').trim()

      // 验证 SVG 代码
      if (!svgCode.includes('<svg')) {
        throw new Error('生成的代码不是有效的 SVG')
      }

      return svgCode
    } catch (error: any) {
      console.error('OpenAI API 错误:', error)
      
      if (error.status === 401 || error.message?.includes('Invalid API Key')) {
        throw new Error('API Key 无效，请检查 OPENAI_API_KEY 是否正确')
      } else if (error.status === 429 || error.message?.includes('rate limit')) {
        throw new Error('API 调用次数超限，请稍后再试')
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络连接')
      } else {
        throw new Error(`生成 SVG 失败: ${error.message || '未知错误'}`)
      }
    }
  }
}

