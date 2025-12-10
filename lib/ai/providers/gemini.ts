import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIProviderInterface } from '../types'
import { cleanSVGCode } from '../utils/svg-cleaner'

export class GeminiProvider implements AIProviderInterface {
  readonly name = 'gemini' as const
  private genAI: GoogleGenerativeAI | null = null
  private apiKey: string | undefined

  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey)
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.genAI
  }

  getAvailableModels(): string[] {
    // 从环境变量读取配置的模型列表
    const modelsEnv = process.env.GEMINI_MODELS
    
    if (!modelsEnv) {
      // 如果没有配置，返回空数组（不允许使用）
      return []
    }

    return modelsEnv.split(',').map((m) => m.trim()).filter(Boolean)
  }

  async generateSVG(
    description: string,
    model?: string,
    baseSVG?: string,
    baseDescription?: string
  ): Promise<string> {
    if (!this.genAI || !this.apiKey) {
      throw new Error('Google AI API Key 未配置，请在 .env 文件中设置 GOOGLE_AI_API_KEY')
    }

    const modelName = model || process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
    const aiModel = this.genAI.getGenerativeModel({ model: modelName })

    let prompt: string

    if (baseSVG) {
      // 修改模式：基于原 SVG 进行修改
      prompt = `你是一个专业的 SVG 动画设计师。用户想要修改一个已有的 SVG 动画。

原始 SVG 代码：
\`\`\`xml
${baseSVG}
\`\`\`

${baseDescription ? `原始描述：${baseDescription}\n\n` : ''}用户的新要求：${description}

请根据用户的新要求，修改上述 SVG 代码。要求：
1. 保留原 SVG 的整体风格和结构
2. 根据用户的新要求进行修改（如改变颜色、大小、动画效果、添加元素等）
3. 生成的 SVG 必须是完整的、有效的 XML 代码
4. 必须包含动画效果（使用 <animate>、<animateTransform> 或 CSS 动画）
5. 只返回修改后的 SVG 代码，不要包含任何解释文字或 markdown 代码块标记
6. SVG 应该居中显示，适合在网页中展示

请返回修改后的 SVG 代码：`
    } else {
      // 新建模式：生成新的 SVG
      prompt = `你是一个专业的 SVG 动画设计师。根据用户的描述，生成一个完整的、可运行的 SVG 动画代码。

要求：
1. 生成的 SVG 必须是完整的、有效的 XML 代码
2. 必须包含动画效果（使用 <animate>、<animateTransform> 或 CSS 动画）
3. 动画应该流畅、美观
4. 只返回 SVG 代码，不要包含任何解释文字或 markdown 代码块标记
5. SVG 应该居中显示，适合在网页中展示

用户描述：${description}

请生成 SVG 代码：`
    }

    try {
      const result = await aiModel.generateContent(prompt)
      const response = await result.response
      let svgCode = response.text()

      // 清理和规范化 SVG 代码（移除 XML 声明、markdown 标记等）
      svgCode = cleanSVGCode(svgCode)

      return svgCode
    } catch (error: any) {
      console.error('Gemini API 错误:', error)
      
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('401')) {
        throw new Error('API Key 无效，请检查 GOOGLE_AI_API_KEY 是否正确')
      } else if (error.message?.includes('fetch failed') || error.message?.includes('network')) {
        throw new Error('网络连接失败，请检查网络连接或代理设置')
      } else if (error.message?.includes('quota') || error.message?.includes('429')) {
        throw new Error('API 调用次数超限，请稍后再试')
      } else {
        throw new Error(`生成 SVG 失败: ${error.message || '未知错误'}`)
      }
    }
  }
}

