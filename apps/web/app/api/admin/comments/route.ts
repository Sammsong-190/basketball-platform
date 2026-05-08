import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'
import { getRequestLogContext, writeSystemLog } from '@/lib/system-log'

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
    console.error('获取评论失败:', error)
    return NextResponse.json({ error: '获取评论失败' }, { status: 500 })
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
      return NextResponse.json({ error: '评论 ID 和状态为必填项' }, { status: 400 })
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
      const admin = authResult as { userId: string }
      const ctx = getRequestLogContext(request)
      void writeSystemLog({
        userId: admin.userId,
        action: '删除评论（含回复）',
        module: 'ADMIN_COMMENT',
        description: `commentId=${id}`,
        ...ctx,
      })
      return NextResponse.json({ message: '删除成功' })
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { status }
    })

    const admin = authResult as { userId: string }
    const ctx = getRequestLogContext(request)
    void writeSystemLog({
      userId: admin.userId,
      action: `评论审核：${status}`,
      module: 'ADMIN_COMMENT',
      description: `commentId=${id}`,
      ...ctx,
    })

    return NextResponse.json(comment)
  } catch (error: any) {
    console.error('更新或删除评论失败:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
