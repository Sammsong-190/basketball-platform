import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, requireSeller } from '@/lib/middleware'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id

    if (!productId) {
      return NextResponse.json({ error: '商品 ID 为必填项' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: { id: true, username: true, avatar: true },
        },
        category: {
          select: { id: true, name: true },
        },
        _count: {
          select: { reviews: true, orderItems: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    if (product.status === 'DELETED') {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    const [aggregate, reviews] = await Promise.all([
      prisma.productReview.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.productReview.findMany({
        where: { productId },
        include: {
          user: { select: { username: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    const reviewCount = aggregate._count._all
    const avgRating = aggregate._avg.rating ?? 0

    return NextResponse.json({
      ...product,
      reviews,
      rating: avgRating,
      reviewCount,
    })
  } catch (error: any) {
    console.error('获取商品失败:', error?.message || error)
    return NextResponse.json(
      {
        error: '获取商品失败',
        details: error?.message || '未知错误',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireSeller(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const userRole = (authResult as any).role

  try {
    const productId = params.id

    if (!productId) {
      return NextResponse.json({ error: '商品 ID 为必填项' }, { status: 400 })
    }

    // 检查商品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    // 严格检查权限：只有商品所有者或管理员可以编辑
    // 商品所有者：existingProduct.sellerId === userId
    // 管理员：userRole === 'ADMIN'
    if (userRole !== 'ADMIN' && existingProduct.sellerId !== userId) {
      console.warn(`Unauthorized edit attempt: User ${userId} tried to edit product ${productId} owned by ${existingProduct.sellerId}`)
      return NextResponse.json({ 
        error: '无权编辑该商品',
        details: '仅可编辑您本人发布的商品'
      }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, price, stock, categoryId, images } = body

    // 验证必需字段
    if (!name || !description || !price || !categoryId) {
      return NextResponse.json({ 
        error: '必填项不能为空',
        details: `缺少：${!name ? '名称、' : ''}${!description ? '描述、' : ''}${!price ? '价格、' : ''}${!categoryId ? '分类 ID' : ''}`
      }, { status: 400 })
    }

    // 验证价格
    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: '价格无效' }, { status: 400 })
    }

    // 验证库存
    const parsedStock = parseInt(stock || '0')
    if (isNaN(parsedStock) || parsedStock < 0) {
      return NextResponse.json({ error: '库存无效' }, { status: 400 })
    }

    // 验证分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })
    if (!category) {
      return NextResponse.json({ error: '分类不存在' }, { status: 400 })
    }

    // 限制图片数量和大小
    let processedImages = images || []
    if (Array.isArray(processedImages)) {
      processedImages = processedImages.slice(0, 10)
      processedImages = processedImages.map((img: string) => {
        if (img.startsWith('data:image') && img.length > 500000) {
          console.warn('图片过大，已截断 base64 数据')
          return img.substring(0, 500000)
        }
        return img
      })
    }

    // 更新商品
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        stock: parsedStock,
        categoryId,
        images: JSON.stringify(processedImages),
        // 管理员可以修改状态，普通卖家不能
        ...(userRole === 'ADMIN' && body.status ? { status: body.status } : {})
      }
    })

    return NextResponse.json(updatedProduct)
  } catch (error: any) {
    console.error('更新商品失败:', error)
    console.error('错误详情:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta
    })
    
    let errorMessage = '更新商品失败'
    if (error?.code === 'P2002') {
      errorMessage = '已存在同名商品'
    } else if (error?.code === 'P2003') {
      errorMessage = '分类或卖家 ID 无效'
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error?.message || '未知错误',
      code: error?.code
    }, { status: 500 })
  }
}

/** 卖家/管理员仅修改上架状态（不改变其它字段） */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireSeller(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const userRole = (authResult as any).role

  try {
    const productId = params.id
    if (!productId) {
      return NextResponse.json({ error: '商品 ID 为必填项' }, { status: 400 })
    }

    const existing = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!existing) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    if (userRole !== 'ADMIN' && existing.sellerId !== userId) {
      return NextResponse.json({ error: '无权操作该商品' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    const sellerAllowed = ['ACTIVE', 'INACTIVE'] as const
    const adminAllowed = ['ACTIVE', 'INACTIVE', 'DELETED'] as const
    const allowed =
      userRole === 'ADMIN' ? adminAllowed : sellerAllowed

    if (!status || !allowed.includes(status)) {
      return NextResponse.json(
        {
          error:
            userRole === 'ADMIN'
              ? '状态无效，仅可为 ACTIVE、INACTIVE 或 DELETED'
              : '状态无效，卖家仅可上架（ACTIVE）或下架（INACTIVE）',
        },
        { status: 400 }
      )
    }

    if (existing.status === 'DELETED') {
      return NextResponse.json(
        { error: '该商品已删除，无法修改状态' },
        { status: 400 }
      )
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    console.error('更新商品状态失败:', error)
    return NextResponse.json({ error: '更新状态失败' }, { status: 500 })
  }
}

/** 卖家：仅当商品已被管理员标记为 DELETED 时可物理删除；管理员可删除任意 DELETED 商品 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireSeller(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const userRole = (authResult as any).role

  try {
    const productId = params.id
    if (!productId) {
      return NextResponse.json({ error: '商品 ID 为必填项' }, { status: 400 })
    }

    const existing = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!existing) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    if (existing.status !== 'DELETED') {
      return NextResponse.json(
        {
          error:
            '仅当被管理员删除后的商品，才能从「我的商品」中彻底移除',
        },
        { status: 400 }
      )
    }

    const isAdmin = userRole === 'ADMIN'
    const isOwner = existing.sellerId === userId
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: '无权删除该商品' }, { status: 403 })
    }

    await prisma.product.delete({ where: { id: productId } })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error('删除商品失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
