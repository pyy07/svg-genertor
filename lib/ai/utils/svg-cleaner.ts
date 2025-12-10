/**
 * 清理和规范化 SVG 代码
 * - 提取完整的 SVG 标签及其内容
 * - 确保只保留一个完整的 SVG 结构
 * - 通过结构匹配而非文本匹配，避免误删内容
 */
export function cleanSVGCode(rawCode: string): string {
  if (!rawCode || typeof rawCode !== 'string') {
    throw new Error('SVG 代码不能为空')
  }

  let cleaned = rawCode.trim()

  // 1. 移除 markdown 代码块标记（这些是明确的标记，可以安全移除）
  cleaned = cleaned.replace(/```svg\n?/gi, '').replace(/```xml\n?/gi, '').replace(/```\n?/g, '')

  // 2. 提取完整的 SVG 标签结构
  // 使用正则表达式匹配 <svg> 到 </svg> 的完整内容（包括嵌套）
  // 这样可以自动跳过前面的任何文本（如 "xml" 文本、XML 声明等）
  const svgMatch = cleaned.match(/<svg[\s\S]*?<\/svg>/i)
  
  if (svgMatch) {
    // 找到完整的 SVG 标签，直接使用
    cleaned = svgMatch[0]
  } else {
    // 如果没有找到闭合标签，尝试找到开始标签后的所有内容
    const svgStartMatch = cleaned.match(/<svg[\s\S]*/i)
    if (svgStartMatch) {
      cleaned = svgStartMatch[0]
      // 尝试手动闭合（如果缺少闭合标签）
      if (!cleaned.includes('</svg>')) {
        cleaned += '</svg>'
      }
    } else {
      // 如果连开始标签都找不到，抛出错误
      throw new Error('生成的代码不包含有效的 SVG 标签')
    }
  }

  // 3. 验证提取的 SVG 结构是否完整
  if (!cleaned.includes('<svg')) {
    throw new Error('生成的代码不包含有效的 SVG 标签')
  }

  // 4. 最终清理：移除前后空白
  cleaned = cleaned.trim()

  return cleaned
}

