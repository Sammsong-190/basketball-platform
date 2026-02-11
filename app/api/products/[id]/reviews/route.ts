import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

// 获取商品评价列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  try {
    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where: { productId: params.id },
        include: {
          user: { select: { id: true, username: true, avatar: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.productReview.count({ where: { productId: params.id } })
    ])

    return NextResponse.json({ reviews, total, page, limit })
  } catch (error) {
    return NextResponse.json({ error: '获取评价列表失败' }, { status: 500 })
  }
}

// 创建商品评价
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const body = await request.json()
    const { rating, content, orderId, images } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: '评分必须在1-5之间' }, { status: 400 })
    }

    // 检查是否已评价
    const existing = await prisma.productReview.findUnique({
      where: {
        productId_userId_orderId: {
          productId: params.id,
          userId,
          orderId: orderId || null
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: '您已评价过此商品' }, { status: 400 })
    }

    const review = await prisma.productReview.create({
      data: {
        productId: params.id,
        userId,
        orderId: orderId || null,
        rating: parseInt(rating),
        content: content || null,
        images: images ? JSON.stringify(images) : null
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } }
      }
    })

    // 更新商品评分
    const allReviews = await prisma.productReview.findMany({
      where: { productId: params.id },
      select: { rating: true }
    })

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

    await prisma.product.update({
      where: { id: params.id },
      data: {
        rating: avgRating,
        reviewCount: allReviews.length
      }
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: '您已评价过此商品' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建评价失败' }, { status: 500 })
  }
}
