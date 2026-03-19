import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      include: {
        category: true,
        _count: { select: { comments: true, likesList: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(posts)
  } catch (error) {
    return NextResponse.json({ error: '获取发帖记录失败' }, { status: 500 })
  }
}
