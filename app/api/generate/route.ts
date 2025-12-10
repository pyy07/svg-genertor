import { NextRequest, NextResponse } from 'next/server'
import { generateSVG, getDefaultProvider, getAIProvider } from '@/lib/ai/factory'
import { checkUserUsageLimit, incrementUserUsage } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { AIProvider } from '@/lib/ai/types'
import { isProviderAllowed, isModelAllowed } from '@/lib/ai/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, userId, provider, model, baseSVG, baseDescription, baseAssetId } = body

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: '描述不能为空' },
        { status: 400 }
      )
    }

    // 检查是否允许匿名访问（本地测试开关）
    // 方式1: 显式设置 ALLOW_ANONYMOUS=true
    // 方式2: 在开发环境（NODE_ENV=development）下默认允许
    const allowAnonymous = 
      process.env.ALLOW_ANONYMOUS === 'true' || 
      (process.env.NODE_ENV === 'development' && process.env.ALLOW_ANONYMOUS !== 'false')

    // 如果未登录且不允许匿名访问，返回错误
    if (!userId && !allowAnonymous) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    // 如果已登录，检查用户使用次数限制
    if (userId) {
      const usageCheck = await checkUserUsageLimit(userId)
      if (!usageCheck.allowed) {
        return NextResponse.json(
          {
            error: '使用次数已用完',
            remaining: usageCheck.remaining,
          },
          { status: 403 }
        )
      }
    }

    // 验证 provider 和 model 是否在允许列表中
    if (provider) {
      const providerName = provider as AIProvider
      if (!isProviderAllowed(providerName)) {
        return NextResponse.json(
          { error: `Provider ${providerName} 未在配置文件中启用` },
          { status: 400 }
        )
      }
      
      if (model && !isModelAllowed(providerName, model)) {
        return NextResponse.json(
          { error: `模型 ${model} 未在配置文件中启用` },
          { status: 400 }
        )
      }
    }

    // 如果提供了 baseAssetId，获取原 SVG 代码
    let baseSVGCode = baseSVG
    let baseDesc = baseDescription
    
    if (baseAssetId && !baseSVGCode) {
      const baseAsset = await prisma.asset.findUnique({
        where: { id: baseAssetId },
        select: { svgCode: true, description: true },
      })
      if (baseAsset) {
        baseSVGCode = baseAsset.svgCode
        baseDesc = baseAsset.description
      }
    }

    // 确定实际使用的 provider 和 model（用于记录）
    let actualProvider: AIProvider | null = null
    let actualModel: string | null = null
    
    if (provider) {
      actualProvider = provider as AIProvider
    } else {
      // 如果没有指定 provider，使用默认值
      actualProvider = getDefaultProvider()
    }
    
    if (model) {
      actualModel = model
    } else if (actualProvider) {
      // 如果没有指定 model，使用该 provider 的第一个可用模型
      const providerInstance = getAIProvider(actualProvider)
      const availableModels = providerInstance.getAvailableModels()
      if (availableModels.length > 0) {
        actualModel = availableModels[0]
      }
    }

    // 生成 SVG（支持指定 provider 和 model，以及基于原 SVG 修改）
    const svgCode = await generateSVG(description, {
      provider: actualProvider || undefined,
      model: actualModel || undefined,
      baseSVG: baseSVGCode,
      baseDescription: baseDesc,
    })

    // 保存素材（无论是否登录）
    const asset = await prisma.asset.create({
      data: {
        userId: userId || null, // 如果未登录，userId 为 null
        description,
        svgCode,
        provider: actualProvider,
        model: actualModel,
      },
    })

    // 如果已登录，增加使用次数
    if (userId) {
      await incrementUserUsage(userId)
      const updatedUsageCheck = await checkUserUsageLimit(userId)

      return NextResponse.json({
        success: true,
        svgCode,
        assetId: asset.id,
        remaining: updatedUsageCheck.remaining,
      })
    } else {
      // 匿名访问，不限制次数
      return NextResponse.json({
        success: true,
        svgCode,
        assetId: asset.id,
        remaining: -1, // 匿名访问显示无限制
      })
    }
  } catch (error: any) {
    console.error('生成 SVG 错误:', error)
    return NextResponse.json(
      { error: error.message || '生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}

