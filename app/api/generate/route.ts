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

    // 生成 SVG
    const svgCode = await generateSVG(description)

    // 如果已登录，保存素材并增加使用次数
    if (userId) {
      const asset = await prisma.asset.create({
        data: {
          userId,
          description,
          svgCode,
        },
      })

      // 增加用户使用次数（如果不是永久用户）
      await incrementUserUsage(userId)

      // 获取更新后的剩余次数
      const updatedUsageCheck = await checkUserUsageLimit(userId)

      return NextResponse.json({
        success: true,
        svgCode,
        assetId: asset.id,
        remaining: updatedUsageCheck.remaining,
      })
    } else {
      // 匿名访问，不保存素材，不限制次数
      return NextResponse.json({
        success: true,
        svgCode,
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

