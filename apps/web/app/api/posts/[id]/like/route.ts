import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId: params.id, userId } }
    })

    if (existing) {
      await prisma.postLike.delete({
        where: { postId_userId: { postId: params.id, userId } }
      })
      await prisma.post.update({
        where: { id: params.id },
        data: { likes: { decrement: 1 } }
      })
      return NextResponse.json({ liked: false })
    } else {
      await prisma.postLike.create({
        data: { postId: params.id, userId }
      })
      await prisma.post.update({
        where: { id: params.id },
        data: { likes: { increment: 1 } }
      })
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    return NextResponse.json({ error: '点赞失败' }, { status: 500 })
  }
}
