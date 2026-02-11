import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    // 验证用户是否为卖家
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSeller: true }
    })

    if (!user || !user.isSeller) {
      return NextResponse.json({ error: '您不是卖家' }, { status: 403 })
    }

    const products = await prisma.product.findMany({
      where: { sellerId: userId },
      include: {
        category: true,
        _count: { select: { reviews: true, orderItems: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 计算销量
    const productsWithSales = await Promise.all(
      products.map(async (product) => {
        const orderItems = await prisma.orderItem.findMany({
          where: { productId: product.id },
          select: { quantity: true }
        })
        const salesCount = orderItems.reduce((sum, item) => sum + item.quantity, 0)
        return {
          ...product,
          salesCount
        }
      })
    )

    return NextResponse.json(productsWithSales)
  } catch (error) {
    console.error('获取商品列表失败:', error)
    return NextResponse.json({ error: '获取商品列表失败' }, { status: 500 })
  }
}
