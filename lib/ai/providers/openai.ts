import OpenAI from 'openai'
import type { AIProviderInterface } from '../types'
import { cleanSVGCode } from '../utils/svg-cleaner'

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

  async generateSVG(
    description: string,
    model?: string,
    baseSVG?: string,
    baseDescription?: string
  ): Promise<string> {
    if (!this.client || !this.apiKey) {
      throw new Error('OpenAI API Key 未配置，请在 .env 文件中设置 OPENAI_API_KEY')
    }

    const modelName = model || process.env.OPENAI_MODEL || 'gpt-4o'

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

      // 清理和规范化 SVG 代码（移除 XML 声明、markdown 标记等）
      svgCode = cleanSVGCode(svgCode)

      return svgCode
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
      
      // 处理 HTTP 错误状态码
      if (status === 400) {
        // 400 错误通常是请求参数问题，提供详细的排查建议
        const suggestions = [
          `检查 API Key 是否正确（当前 BASE_URL: ${this.baseURL || '默认 OpenAI API'}）`,
          `检查模型名称 "${modelName}" 是否在 OPENAI_MODELS 配置中`,
          `检查模型名称 "${modelName}" 是否被 API 提供商支持`,
          '检查请求参数是否符合 API 要求（某些 API 可能不支持某些参数）',
          '查看服务器日志获取更详细的错误信息'
        ]
        const errorMsg = errorDetails.includes('no body') 
          ? '请求参数错误（响应体为空，可能是模型名称或参数不匹配）'
          : errorDetails
        throw new Error(`API 请求错误 (400): ${errorMsg}。\n请检查：\n${suggestions.map((s, i) => `${i + 1}) ${s}`).join('\n')}`)
      } else if (status === 401 || errorDetails?.includes('Invalid API Key') || errorDetails?.includes('Unauthorized') || errorDetails?.includes('401')) {
        throw new Error('API Key 无效，请检查 OPENAI_API_KEY 是否正确')
      } else if (status === 403 || errorDetails?.includes('Forbidden') || errorDetails?.includes('403')) {
        throw new Error('API 访问被拒绝，请检查 API Key 权限或 OPENAI_BASE_URL 配置')
      } else if (status === 404 || errorDetails?.includes('Not Found') || errorDetails?.includes('404')) {
        throw new Error(`API 端点不存在 (404)，请检查 OPENAI_BASE_URL 配置是否正确。当前配置: ${this.baseURL || '默认 OpenAI API'}`)
      } else if (status === 429 || errorDetails?.includes('rate limit') || errorDetails?.includes('429') || errorDetails?.includes('Too Many Requests')) {
        throw new Error('API 调用次数超限，请稍后再试')
      } else if (errorDetails?.includes('network') || errorDetails?.includes('fetch') || errorDetails?.includes('ECONNREFUSED') || errorDetails?.includes('ENOTFOUND')) {
        throw new Error(`网络连接失败，请检查网络连接或 OPENAI_BASE_URL 配置。当前配置: ${this.baseURL || '默认 OpenAI API'}`)
      } else if (status) {
        throw new Error(`API 请求失败 (${status}): ${errorDetails}。请检查 API 配置`)
      } else {
        throw new Error(`生成 SVG 失败: ${errorDetails}`)
      }
    }
  }
}

