import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'
import { getRequestLogContext, writeSystemLog } from '@/lib/system-log'

// 获取待审核帖子列表
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'PENDING'

  try {
    // 列表不查 content/images（LongText），避免查询与序列化过慢
    const posts = await prisma.post.findMany({
      where: { status },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        author: { select: { username: true } },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(posts)
  } catch (error) {
    return NextResponse.json({ error: '获取帖子列表失败' }, { status: 500 })
  }
}

// 审核帖子
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: '帖子 ID 和状态为必填项' }, { status: 400 })
    }

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'DELETED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '状态无效' }, { status: 400 })
    }

    const post = await prisma.post.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true,
        title: true,
        updatedAt: true,
      },
    })

    const admin = authResult as { userId: string }
    const ctx = getRequestLogContext(request)
    void writeSystemLog({
      userId: admin.userId,
      action: `帖子状态设为 ${status}`,
      module: 'ADMIN_POST',
      description: `postId=${post.id}`,
      ...ctx,
    })

    return NextResponse.json(post)
  } catch (error) {
    return NextResponse.json({ error: '审核失败' }, { status: 500 })
  }
}
