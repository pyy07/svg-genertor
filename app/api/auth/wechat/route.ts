import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByWechatOpenId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 微信登录回调处理
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const dev = searchParams.get('dev') === 'true'

    // 开发模式：直接创建测试用户
    if (dev || !code) {
      // 如果没有配置微信 AppID 或处于开发模式，使用模拟登录
      const mockOpenId = `dev_${Date.now()}_${Math.random().toString(36).substring(7)}`
      let user = await getUserByWechatOpenId(mockOpenId)

      if (!user) {
        user = await createUser(mockOpenId, `测试用户_${Date.now().toString().slice(-6)}`)
      }

      if (!user) {
        return NextResponse.json(
          { error: '创建用户失败' },
          { status: 500 }
        )
      }

      const token = Buffer.from(
        JSON.stringify({ userId: user.id })
      ).toString('base64')

      // 重定向到首页并设置 token
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('token', token)
      return NextResponse.redirect(redirectUrl)
    }

    // 使用 code 换取 access_token 和 openid
    const appId = process.env.WECHAT_APP_ID
    const appSecret = process.env.WECHAT_APP_SECRET

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: '微信配置未完成' },
        { status: 500 }
      )
    }

    // 1. 使用 code 换取 access_token
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`
    
    const tokenResponse = await fetch(tokenUrl)
    const tokenData = await tokenResponse.json()

    if (tokenData.errcode) {
      console.error('微信获取 access_token 失败:', tokenData)
      return NextResponse.json(
        { error: '微信授权失败，请重试' },
        { status: 400 }
      )
    }

    const { access_token, openid } = tokenData

    // 2. 使用 access_token 获取用户信息
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`
    
    const userInfoResponse = await fetch(userInfoUrl)
    const userInfoData = await userInfoResponse.json()

    // 3. 创建或获取用户
    let user = await getUserByWechatOpenId(openid)
    
    if (!user) {
      // 创建新用户
      user = await createUser(
        openid,
        userInfoData.errcode ? '微信用户' : userInfoData.nickname || '微信用户'
      )
      // 如果有头像信息，更新头像
      if (!userInfoData.errcode && userInfoData.headimgurl && user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatar: userInfoData.headimgurl },
        })
        user = await getUserByWechatOpenId(openid)
      }
    } else {
      // 更新现有用户信息
      if (!userInfoData.errcode) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            nickname: userInfoData.nickname || user.nickname,
            avatar: userInfoData.headimgurl || user.avatar,
          },
        })
        user = await getUserByWechatOpenId(openid)
      }
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

    // 重定向到首页并设置 token
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('token', token)
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('微信登录错误:', error)
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    )
  }
}

