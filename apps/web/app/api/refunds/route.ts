import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, requireAdmin } from '@/lib/middleware'

// 用户申请退换货
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const body = await request.json()
    const { orderId, type, reason, amount } = body

    if (!orderId || !type || !reason) {
      return NextResponse.json({ error: 'Order ID, type and reason are required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId, userId }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'COMPLETED' && order.status !== 'SHIPPED') {
      return NextResponse.json({ error: 'Order status does not allow refund' }, { status: 400 })
    }

    const refund = await prisma.refund.create({
      data: {
        orderId,
        userId,
        type,
        reason,
        amount: amount || order.totalAmount
      },
      include: {
        order: true
      }
    })

    // 更新订单状态
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'REFUNDING' }
    })

    return NextResponse.json(refund, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit refund request' }, { status: 500 })
  }
}

// 获取退换货列表
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const { searchParams } = new URL(request.url)
  const role = (authResult as any).role

  try {
    const where: any = role === 'ADMIN' ? {} : { userId }
    if (searchParams.get('status')) {
      where.status = searchParams.get('status')
    }

    const refunds = await prisma.refund.findMany({
      where,
      include: {
        order: {
          include: {
            items: { include: { product: true } }
          }
        },
        user: { select: { id: true, username: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(refunds)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch refund list' }, { status: 500 })
  }
}
