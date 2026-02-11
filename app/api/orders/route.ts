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
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
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
      return NextResponse.json({ error: 'Order items cannot be empty' }, { status: 400 })
    }

    // 计算总价
    let totalAmount = 0
    const orderItems = []
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product || product.stock < item.quantity) {
        return NextResponse.json({ error: `Product ${product?.name || ''} is out of stock` }, { status: 400 })
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
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
