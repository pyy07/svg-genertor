import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const searchParams = request.nextUrl.searchParams
    const userOnly = searchParams.get('userOnly') === 'true'

    const where = userOnly && userId ? { userId } : {}

    const assets = await prisma.asset.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      take: 100,
    })

    return NextResponse.json({ assets })
  } catch (error) {
    console.error('获取素材列表错误:', error)
    return NextResponse.json(
      { error: '获取素材列表失败' },
      { status: 500 }
    )
  }
}

