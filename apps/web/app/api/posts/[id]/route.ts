import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.post.findUnique({ where: { id: params.id }, select: { status: true } })
    if (!existing || existing.status === 'DELETED') {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    const post = await prisma.post.update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        category: true,
        comments: {
          where: { status: 'APPROVED', parentId: null },
          include: {
            author: { select: { id: true, username: true, avatar: true } },
            replies: {
              where: { status: 'APPROVED' },
              include: {
                author: { select: { id: true, username: true, avatar: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { comments: true } }
      }
    })

    return NextResponse.json(post)
  } catch (error) {
    return NextResponse.json({ error: '获取帖子详情失败' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const post = await prisma.post.findUnique({ where: { id: params.id } })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    
    const userRole = (authResult as any).role
    // 管理员可以修改任何帖子，普通用户只能修改自己的帖子
    if (userRole !== 'ADMIN' && post.authorId !== userId) {
      return NextResponse.json({ error: 'You do not have permission to modify this post' }, { status: 403 })
    }

    const body = await request.json()
    
    // 管理员更新的帖子自动通过审核，普通用户需要重新审核
    const postStatus = userRole === 'ADMIN' ? 'APPROVED' : 'PENDING'
    
    const updated = await prisma.post.update({
      where: { id: params.id },
      data: {
        title: body.title,
        content: body.content,
        categoryId: body.categoryId,
        images: body.images ? JSON.stringify(body.images) : null,
        status: postStatus
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const post = await prisma.post.findUnique({ where: { id: params.id } })
    if (!post || post.authorId !== userId) {
      return NextResponse.json({ error: '无权限删除此帖子' }, { status: 403 })
    }

    await prisma.post.update({
      where: { id: params.id },
      data: { status: 'DELETED' }
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除帖子失败' }, { status: 500 })
  }
}
