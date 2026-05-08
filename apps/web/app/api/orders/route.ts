import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'
import { generateOrderNumber } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: '获取订单失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const body = await request.json()
    const { items, shippingAddress, shippingName, shippingPhone } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: '订单商品不能为空' }, { status: 400 })
    }

    // 计算总价
    let totalAmount = 0
    const orderItems = []
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product || product.stock < item.quantity) {
        return NextResponse.json({ error: `商品「${product?.name || ''}」库存不足` }, { status: 400 })
      }
      if (product.sellerId === userId) {
        return NextResponse.json({ error: '不能购买自己发布的商品' }, { status: 400 })
      }
      const itemPrice = product.price * item.quantity
      totalAmount += itemPrice
      orderItems.push({ productId: item.productId, quantity: item.quantity, price: product.price })
    }

    // 创建订单
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        totalAmount,
        shippingAddress,
        shippingName,
        shippingPhone,
        items: {
          create: orderItems
        }
      },
      include: {
        items: { include: { product: true } }
      }
    })

    // 更新库存
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      })
    }

    // 清空购物车
    await prisma.cartItem.deleteMany({ where: { userId } })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 })
  }
}
