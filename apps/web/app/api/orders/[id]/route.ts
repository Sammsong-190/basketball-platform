import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, requireSeller } from '@/lib/middleware'

// 获取订单详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const role = (authResult as any).role

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, username: true, email: true } },
        items: {
          include: {
            product: {
              include: {
                seller: { select: { id: true, username: true } }
              }
            }
          }
        },
        payments: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    // 检查权限：用户只能查看自己的订单，卖家可以查看自己商品的订单，管理员可以查看所有
    if (role !== 'ADMIN' && order.userId !== userId) {
      // 检查是否是卖家
      const isSeller = order.items.some(item => item.product.sellerId === userId)
      if (!isSeller) {
        return NextResponse.json({ error: '无权限查看此订单' }, { status: 403 })
      }
    }

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: '获取订单详情失败' }, { status: 500 })
  }
}

// 更新订单状态
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const role = (authResult as any).role

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: { include: { product: true } } }
    })

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    const body = await request.json()
    const { status } = body

    // 用户只能取消自己的订单
    if (status === 'CANCELLED' && order.userId === userId) {
      const updated = await prisma.order.update({
        where: { id: params.id },
        data: { status: 'CANCELLED' }
      })
      return NextResponse.json(updated)
    }

    // 卖家可以更新发货状态
    if (status === 'SHIPPED') {
      const isSeller = order.items.some(item => item.product.sellerId === userId)
      if (!isSeller && role !== 'ADMIN') {
        return NextResponse.json({ error: '无权限更新订单状态' }, { status: 403 })
      }

      const updated = await prisma.order.update({
        where: { id: params.id },
        data: { status: 'SHIPPED', shippedAt: new Date() }
      })
      return NextResponse.json(updated)
    }

    // 用户确认收货
    if (status === 'COMPLETED' && order.userId === userId) {
      const updated = await prisma.order.update({
        where: { id: params.id },
        data: { status: 'COMPLETED', completedAt: new Date() }
      })

      // 创建卖家收入记录
      for (const item of order.items) {
        await prisma.income.create({
          data: {
            sellerId: item.product.sellerId,
            orderId: order.id,
            amount: item.price * item.quantity,
            description: `订单 ${order.orderNumber} 收入`
          }
        })

        await prisma.expense.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            amount: item.price * item.quantity,
            description: `购买 ${item.product.name}`
          }
        })
      }

      return NextResponse.json(updated)
    }

    // 管理员可以更新任何状态
    if (role === 'ADMIN') {
      const updateData: any = { status }
      if (status === 'SHIPPED') updateData.shippedAt = new Date()
      if (status === 'COMPLETED') updateData.completedAt = new Date()

      const updated = await prisma.order.update({
        where: { id: params.id },
        data: updateData
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: '无权限更新订单状态' }, { status: 403 })
  } catch (error) {
    return NextResponse.json({ error: '更新订单状态失败' }, { status: 500 })
  }
}
