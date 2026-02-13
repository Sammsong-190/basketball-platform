import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

// 获取待审核评论列表
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'PENDING'

  try {
    const comments = await prisma.comment.findMany({
      where: { status },
      include: {
        author: { select: { id: true, username: true } },
        post: { select: { id: true, title: true } },
        product: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// 审核或删除评论
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Comment ID and status are required' }, { status: 400 })
    }

    if (status === 'DELETED') {
      await prisma.$transaction(async (tx) => {
        async function deleteCommentAndReplies(commentId: string) {
          const replies = await tx.comment.findMany({ where: { parentId: commentId } })
          for (const reply of replies) {
            await deleteCommentAndReplies(reply.id)
          }
          await tx.comment.delete({ where: { id: commentId } })
        }
        await deleteCommentAndReplies(id)
      })
      return NextResponse.json({ message: 'Deleted successfully' })
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(comment)
  } catch (error: any) {
    console.error('Failed to update/delete comment:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
}
