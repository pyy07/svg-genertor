import { NextRequest, NextResponse } from 'next/server'
import { generateSVG } from '@/lib/gemini'
import { checkUserUsageLimit, incrementUserUsage } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, userId } = body

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: '描述不能为空' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    // 检查用户使用次数限制
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

    // 生成 SVG
    const svgCode = await generateSVG(description)

    // 保存素材
    const asset = await prisma.asset.create({
      data: {
        userId,
        description,
        svgCode,
      },
    })

    // 增加用户使用次数（如果不是永久用户）
    await incrementUserUsage(userId)

    return NextResponse.json({
      success: true,
      svgCode,
      assetId: asset.id,
      remaining: usageCheck.remaining - 1,
    })
  } catch (error: any) {
    console.error('生成 SVG 错误:', error)
    return NextResponse.json(
      { error: error.message || '生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}

