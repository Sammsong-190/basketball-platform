import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) {
    // 未登录用户返回未点赞
    return NextResponse.json({ liked: false })
  }
  const userId = (authResult as any).userId

  try {
    const like = await prisma.postLike.findUnique({
      where: { postId_userId: { postId: params.id, userId } }
    })

    return NextResponse.json({ liked: !!like })
  } catch (error) {
    return NextResponse.json({ liked: false })
  }
}
