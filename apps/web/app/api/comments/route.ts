import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const userRole = (authResult as any).role

  try {
    const body = await request.json()
    const { content, postId, productId, parentId } = body

    if (!content) {
      return NextResponse.json({ error: '评论内容为必填项' }, { status: 400 })
    }

    if (!postId && !productId) {
      return NextResponse.json({ error: '需要提供帖子 ID 或商品 ID' }, { status: 400 })
    }

    // 管理员发布的评论自动通过审核
    const commentStatus = userRole === 'ADMIN' ? 'APPROVED' : 'PENDING'

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: userId,
        postId: postId || null,
        productId: productId || null,
        parentId: parentId || null,
        status: commentStatus
      },
      include: {
        author: { select: { id: true, username: true, avatar: true } }
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('创建评论失败:', error)
    return NextResponse.json({ error: '发表评论失败' }, { status: 500 })
  }
}
