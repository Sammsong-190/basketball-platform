import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

// 获取待审核帖子列表
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'PENDING'

  try {
    const posts = await prisma.post.findMany({
      where: { status },
      include: {
        author: { select: { id: true, username: true } },
        category: true
      },
      orderBy: { createdAt: 'desc' }
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
      return NextResponse.json({ error: '帖子ID和状态为必填项' }, { status: 400 })
    }

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'DELETED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const post = await prisma.post.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(post)
  } catch (error) {
    return NextResponse.json({ error: '审核失败' }, { status: 500 })
  }
}
