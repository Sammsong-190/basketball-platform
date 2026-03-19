import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id, userId }
    })

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    if (order.status !== 'PENDING_PAYMENT') {
      return NextResponse.json({ error: '订单状态不允许支付' }, { status: 400 })
    }

    const body = await request.json()
    const { paymentMethod, paymentNumber } = body

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        userId,
        amount: order.totalAmount,
        paymentMethod: paymentMethod || 'ONLINE',
        paymentNumber: paymentNumber || null,
        status: 'SUCCESS',
        paidAt: new Date()
      }
    })

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: 'PAID',
        paymentMethod: paymentMethod || 'ONLINE',
        paymentId: payment.id,
        paidAt: new Date()
      },
      include: {
        items: { include: { product: true } },
        payments: true
      }
    })

    return NextResponse.json({ order: updatedOrder, payment }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '支付失败' }, { status: 500 })
  }
}
