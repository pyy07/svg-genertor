import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

export async function generateSVG(description: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

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
    const result = await model.generateContent(prompt)
    const response = await result.response
    let svgCode = response.text()

    // 清理可能的 markdown 代码块标记
    svgCode = svgCode.replace(/```svg\n?/g, '').replace(/```\n?/g, '').trim()

    // 验证 SVG 代码
    if (!svgCode.includes('<svg')) {
      throw new Error('生成的代码不是有效的 SVG')
    }

    return svgCode
  } catch (error) {
    console.error('Gemini API 错误:', error)
    throw new Error('生成 SVG 失败，请稍后重试')
  }
}

