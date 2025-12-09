import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByWechatOpenId } from '@/lib/auth'

// 微信登录回调处理
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      return NextResponse.json(
        { error: '缺少授权码' },
        { status: 400 }
      )
    }

    // 使用 code 换取 access_token 和 openid
    // 这里需要实现微信 OAuth 2.0 的完整流程
    // 由于需要微信开放平台配置，这里先提供一个框架

    // TODO: 实现微信 OAuth 2.0 流程
    // 1. 使用 code 换取 access_token
    // 2. 使用 access_token 获取用户信息（openid）
    // 3. 创建或获取用户
    // 4. 返回用户信息和 token

    // 临时实现（需要替换为真实的微信 API 调用）
    const mockOpenId = `mock_${Date.now()}`
    let user = await getUserByWechatOpenId(mockOpenId)

    if (!user) {
      user = await createUser(mockOpenId, '微信用户')
    }

    // 确保 user 不为 null
    if (!user) {
      return NextResponse.json(
        { error: '创建用户失败' },
        { status: 500 }
      )
    }

    // 生成 session token（实际应该使用 JWT 或 NextAuth）
    const token = Buffer.from(
      JSON.stringify({ userId: user.id })
    ).toString('base64')

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        usageCount: user.usageCount,
        maxUsage: user.maxUsage,
        isPermanent: user.isPermanent,
      },
      token,
    })
  } catch (error) {
    console.error('微信登录错误:', error)
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    )
  }
}

