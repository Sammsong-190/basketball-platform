import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

const ALLOWED_TYPES = ['POST', 'COMMENT'] as const

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const { searchParams } = new URL(request.url)
  const typeFilter = searchParams.get('type')
  const check = searchParams.get('check')

  try {
    if (check === '1') {
      const type = searchParams.get('type')
      const targetId = searchParams.get('targetId')
      if (!type || !targetId) {
        return NextResponse.json({ error: '缺少 type 或 targetId' }, { status: 400 })
      }
      const row = await prisma.favorite.findFirst({
        where: { userId, type, targetId },
        select: { id: true },
      })
      return NextResponse.json({ favorited: !!row, favoriteId: row?.id ?? null })
    }

    const where: Record<string, unknown> = { userId }
    if (typeFilter) where.type = typeFilter
    const favorites = await prisma.favorite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const postIds = [...new Set(favorites.filter((f) => f.type === 'POST').map((f) => f.targetId))] as string[]
    const commentIds = [...new Set(favorites.filter((f) => f.type === 'COMMENT').map((f) => f.targetId))] as string[]

    const [posts, comments] = await Promise.all([
      postIds.length
        ? prisma.post.findMany({
            where: { id: { in: postIds } },
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
              author: { select: { username: true } },
            },
          })
        : [],
      commentIds.length
        ? prisma.comment.findMany({
            where: { id: { in: commentIds } },
            select: {
              id: true,
              content: true,
              status: true,
              createdAt: true,
              author: { select: { username: true } },
              post: { select: { id: true, title: true } },
              product: { select: { id: true, name: true } },
            },
          })
        : [],
    ])

    const postMap = Object.fromEntries(posts.map((p) => [p.id, p]))
    const commentMap = Object.fromEntries(comments.map((c) => [c.id, c]))

    const enriched = favorites.map((f) => ({
      ...f,
      post: f.type === 'POST' ? postMap[f.targetId] ?? null : null,
      comment: f.type === 'COMMENT' ? commentMap[f.targetId] ?? null : null,
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '获取收藏列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const body = await request.json()
    const { type, targetId } = body
    if (!type || !targetId) {
      return NextResponse.json({ error: '类型和目标 ID 为必填项' }, { status: 400 })
    }
    if (!(ALLOWED_TYPES as readonly string[]).includes(type)) {
      return NextResponse.json({ error: '仅支持收藏帖子（POST）或评论（COMMENT）' }, { status: 400 })
    }
    if (type === 'POST') {
      const post = await prisma.post.findUnique({ where: { id: targetId }, select: { id: true } })
      if (!post) {
        return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
      }
    } else if (type === 'COMMENT') {
      const comment = await prisma.comment.findUnique({ where: { id: targetId }, select: { id: true } })
      if (!comment) {
        return NextResponse.json({ error: '评论不存在' }, { status: 404 })
      }
    }

    const favorite = await prisma.favorite.create({
      data: { userId, type, targetId },
    })
    return NextResponse.json(favorite, { status: 201 })
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err.code === 'P2002') {
      return NextResponse.json({ error: '已在收藏中' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: '添加收藏失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const type = searchParams.get('type')
  const targetId = searchParams.get('targetId')

  try {
    if (type && targetId) {
      await prisma.favorite.deleteMany({ where: { userId, type, targetId } })
      return NextResponse.json({ message: '已取消收藏' })
    }

    if (!id) {
      return NextResponse.json({ error: '请提供收藏 id，或 type + targetId' }, { status: 400 })
    }

    await prisma.favorite.delete({ where: { id, userId } })
    return NextResponse.json({ message: '已取消收藏' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '取消收藏失败' }, { status: 500 })
  }
}
