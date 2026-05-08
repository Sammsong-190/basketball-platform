import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

// 分享帖子
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const post = await prisma.post.findUnique({ where: { id: params.id } })
    if (!post) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
    }

    // 创建分享记录
    const share = await prisma.postShare.create({
      data: {
        postId: params.id,
        userId
      }
    })

    // 更新帖子分享数
    await prisma.post.update({
      where: { id: params.id },
      data: { shares: { increment: 1 } }
    })

    return NextResponse.json(share, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '分享失败' }, { status: 500 })
  }
}
