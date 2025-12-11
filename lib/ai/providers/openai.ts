import OpenAI from 'openai'
import type { AIProviderInterface, ContentType } from '../types'
import { cleanSVGCode, cleanHTMLCode } from '../utils/svg-cleaner'

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
    // 从环境变量读取配置的模型列表
    const modelsEnv = process.env.OPENAI_MODELS
    
    if (!modelsEnv) {
      // 如果没有配置，返回空数组（不允许使用）
      return []
    }

    return modelsEnv.split(',').map((m) => m.trim()).filter(Boolean)
  }

  async generateContent(
    description: string,
    options?: {
      model?: string
      contentType?: ContentType
      baseCode?: string
      baseDescription?: string
    }
  ): Promise<string> {
    if (!this.client || !this.apiKey) {
      throw new Error('OpenAI API Key 未配置，请在 .env 文件中设置 OPENAI_API_KEY')
    }

    const modelName = options?.model || process.env.OPENAI_MODEL || 'gpt-4o'
    const contentType = options?.contentType || 'svg'

    let prompt: string

    if (contentType === 'html') {
      prompt = this.buildHTMLPrompt(description, options?.baseCode, options?.baseDescription)
    } else {
      prompt = this.buildSVGPrompt(description, options?.baseCode, options?.baseDescription)
    }

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

      let code = response.choices[0]?.message?.content || ''

      if (!code) {
        throw new Error('OpenAI 返回了空内容')
      }

      // 清理和规范化代码
      if (contentType === 'html') {
        code = cleanHTMLCode(code)
      } else {
        code = cleanSVGCode(code)
      }

      return code
    } catch (error: any) {
      console.error('OpenAI API 错误:', error)
      console.error('错误对象详情:', JSON.stringify({
        status: error.status,
        message: error.message,
        code: error.code,
        type: error.type,
        param: error.param,
        error: error.error,
        headers: error.headers,
        response: error.response ? '存在但无法序列化' : undefined,
      }, null, 2))
      
      // 尝试从错误对象中提取详细信息
      let errorDetails = error.message || '未知错误'
      const status = error.status
      
      // OpenAI SDK 的错误对象可能包含 response 属性
      // 尝试读取响应体获取详细错误信息
      if (error.response) {
        try {
          // 尝试从 response.data 读取（最常见的情况）
          if (error.response.data) {
            const data = error.response.data
            if (data.error?.message) {
              errorDetails = data.error.message
            } else if (data.message) {
              errorDetails = data.message
            } else if (typeof data === 'string') {
              errorDetails = data
            } else if (data.error) {
              errorDetails = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
            } else {
              // 如果 data 是对象，尝试序列化
              errorDetails = JSON.stringify(data)
            }
          }
          
          // 如果响应体是流，尝试读取（较少见）
          if ((!errorDetails || errorDetails.includes('no body')) && error.response.body) {
            try {
              const reader = error.response.body.getReader()
              const decoder = new TextDecoder()
              let bodyText = ''
              let done = false
              
              while (!done) {
                const { value, done: streamDone } = await reader.read()
                done = streamDone
                if (value) {
                  bodyText += decoder.decode(value, { stream: true })
                }
              }
              
              if (bodyText) {
                try {
                  const errorData = JSON.parse(bodyText)
                  if (errorData.error?.message) {
                    errorDetails = errorData.error.message
                  } else if (errorData.message) {
                    errorDetails = errorData.message
                  } else if (errorData.error) {
                    errorDetails = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error)
                  } else {
                    errorDetails = bodyText
                  }
                } catch (e) {
                  // 如果不是 JSON，直接使用文本
                  errorDetails = bodyText
                }
              }
            } catch (e) {
              console.error('读取响应流失败:', e)
            }
          }
        } catch (e) {
          console.error('读取错误响应体失败:', e)
        }
      }
      
      // 如果错误对象有 error 属性，尝试从中提取
      if (error.error && (!errorDetails || errorDetails.includes('no body'))) {
        if (typeof error.error === 'string') {
          errorDetails = error.error
        } else if (error.error.message) {
          errorDetails = error.error.message
        } else if (typeof error.error === 'object') {
          errorDetails = JSON.stringify(error.error)
        }
      }
      
      // 处理 HTTP 错误状态码（返回用户友好的错误信息，详细错误记录在日志中）
      if (status === 400) {
        // 400 错误：只返回简洁的用户友好提示，详细错误已记录在日志中
        throw new Error('请求参数错误，请检查模型配置或稍后重试')
      } else if (status === 401 || errorDetails?.includes('Invalid API Key') || errorDetails?.includes('Unauthorized') || errorDetails?.includes('401')) {
        throw new Error('API Key 无效，请联系管理员检查配置')
      } else if (status === 403 || errorDetails?.includes('Forbidden') || errorDetails?.includes('403')) {
        throw new Error('API 访问被拒绝，请联系管理员')
      } else if (status === 404 || errorDetails?.includes('Not Found') || errorDetails?.includes('404')) {
        throw new Error('API 端点不存在，请联系管理员检查配置')
      } else if (status === 429 || errorDetails?.includes('rate limit') || errorDetails?.includes('429') || errorDetails?.includes('Too Many Requests')) {
        throw new Error('API 调用次数超限，请稍后再试')
      } else if (errorDetails?.includes('network') || errorDetails?.includes('fetch') || errorDetails?.includes('ECONNREFUSED') || errorDetails?.includes('ENOTFOUND')) {
        throw new Error('网络连接失败，请检查网络连接或稍后重试')
      } else if (status) {
        throw new Error('API 请求失败，请稍后重试')
      } else {
        throw new Error(`生成${contentType === 'html' ? 'H5动画' : 'SVG'}失败，请稍后重试`)
      }
    }
  }

  private buildSVGPrompt(description: string, baseCode?: string, baseDescription?: string): string {
    if (baseCode) {
      // 修改模式：基于原 SVG 进行修改
      return `你是一个世界级的 SVG 设计和编码专家。用户想要修改一个已有的 SVG 动画。

原始 SVG 代码：
\`\`\`xml
${baseCode}
\`\`\`

${baseDescription ? `原始描述：${baseDescription}\n\n` : ''}用户的新要求：${description}

请根据用户的新要求，修改上述 SVG 代码。要求：

1. **输出格式**：只返回原始 SVG 代码，不要包含 markdown 代码块标记（如 \`\`\`xml），不要添加任何解释文字。

2. **保留风格**：保留原 SVG 的整体风格、结构和视觉质量。

3. **修改要求**：根据用户的新要求进行修改（如改变颜色、大小、动画效果、添加元素等）。

4. **技术规范**：
   - 生成的 SVG 必须是完整的、有效的 XML 代码
   - 必须包含 viewBox 属性
   - 确保 SVG 是自包含的（没有外部引用）
   - 优先使用内联样式以保证可移植性
   - 必须包含动画效果（使用 <animate>、<animateTransform> 或 CSS 动画）
   - 动画应该流畅、美观

5. **视觉质量**：
   - 使用渐变、正确的路径和不同的颜色来创造深度和视觉吸引力
   - 避免简单的描边线条（除非用户明确要求）
   - 保持"扁平化艺术"或"材料设计"风格（除非用户另有要求）

6. **布局**：SVG 应该居中显示，适合在网页中展示

请返回修改后的 SVG 代码：`
    } else {
      // 新建模式：生成新的 SVG
      return `你是一个世界级的 SVG 设计和编码专家。

你的任务是根据用户的描述，生成一个高质量、视觉精美、详细的 SVG 动画。

**输出格式**：只返回原始 SVG 代码。不要用 markdown 代码块包裹（例如不要用 \`\`\`xml）。不要在前后添加任何对话性文字。

**质量要求**：
- 使用渐变、正确的路径和不同的颜色来创造深度和视觉吸引力
- 避免简单的描边线条（除非用户明确要求）
- 风格应该是"扁平化艺术"或"材料设计"（除非用户另有说明）

**技术规范**：
- 必须包含 viewBox 属性
- 确保 SVG 是自包含的（没有外部引用）
- 可以使用语义化的 ID 或类名，但优先使用内联样式以保证可移植性
- 默认尺寸应该是正方形（例如 1024x768），除非宽高比另有建议
- 必须包含动画效果（使用 <animate>、<animateTransform> 或 CSS 动画）
- 动画应该流畅、美观

**布局**：SVG 应该居中显示，适合在网页中展示

用户描述：${description}

请生成 SVG 代码：`
    }
  }

  private buildHTMLPrompt(description: string, baseCode?: string, baseDescription?: string): string {
    if (baseCode) {
      // 修改模式：基于原 HTML 进行修改
      return `你是一个专业的 H5 动画设计师，擅长创建精美的 CSS/JavaScript 动画效果。用户想要修改一个已有的 H5 动画。

原始 HTML 代码：
\`\`\`html
${baseCode}
\`\`\`

${baseDescription ? `原始描述：${baseDescription}\n\n` : ''}用户的新要求：${description}

请根据用户的新要求，修改上述 HTML 代码。要求：
1. 保留原动画的整体风格和结构
2. 根据用户的新要求进行修改（如改变颜色、大小、动画效果、添加元素等）
3. 生成完整的 HTML 代码，包含必要的 CSS 和 JavaScript
4. 使用现代 CSS 动画（如 @keyframes、transition、transform）或 JavaScript 动画
5. 动画应该流畅、美观，有良好的视觉效果
6. 只返回 HTML 代码，不要包含任何解释文字或 markdown 代码块标记
7. 代码应该可以直接在 iframe 中运行
8. 使用 flexbox 或 grid 实现居中布局

请返回修改后的 HTML 代码：`
    } else {
      // 新建模式：生成新的 HTML 动画
      return `你是一个专业的 H5 动画设计师，擅长创建精美的 CSS/JavaScript 动画效果。根据用户的描述，生成一个完整的、可运行的 H5 动画页面。

要求：
1. 生成完整的 HTML 代码，包含必要的 CSS 和 JavaScript
2. 使用现代 CSS 动画（如 @keyframes、transition、transform）或 JavaScript 动画
3. 动画应该流畅、美观，有良好的视觉效果
4. 可以使用 Canvas、CSS 动画、SVG 内嵌动画等技术
5. 只返回 HTML 代码，不要包含任何解释文字或 markdown 代码块标记
6. 代码应该可以直接在 iframe 中运行
7. 使用 flexbox 或 grid 实现居中布局
8. 页面背景可以根据动画主题设计，不必是白色

用户描述：${description}

请生成 HTML 代码：`
    }
  }
}

