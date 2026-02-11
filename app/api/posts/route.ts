import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId')
  const isNews = searchParams.get('isNews')
  const isHot = searchParams.get('isHot')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  try {
    const where: any = { status: 'APPROVED' }
    if (categoryId) where.categoryId = categoryId
    if (isNews === 'true') where.isNews = true
    if (isHot === 'true') where.isHot = true

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, username: true, avatar: true } },
          category: true,
          _count: { select: { comments: true, likesList: true } }
        },
        orderBy: isHot ? { likes: 'desc' } : { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.post.count({ where })
    ])

    return NextResponse.json({ posts, total, page, limit })
  } catch (error) {
    return NextResponse.json({ error: '获取帖子列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const userRole = (authResult as any).role

  try {
    const body = await request.json()
    const { title, content, categoryId, images, contentType } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // 验证 contentType，默认为 TEXT
    const validContentTypes = ['TEXT', 'HTML', 'MARKDOWN']
    const finalContentType = contentType && validContentTypes.includes(contentType) 
      ? contentType 
      : 'TEXT'

    // 管理员发布的帖子自动通过审核
    const postStatus = userRole === 'ADMIN' ? 'APPROVED' : 'PENDING'

    const post = await prisma.post.create({
      data: {
        title,
        content,
        contentType: finalContentType,
        categoryId: categoryId || null,
        images: images ? JSON.stringify(images) : null,
        authorId: userId,
        status: postStatus
      },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        category: true
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Failed to create post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
