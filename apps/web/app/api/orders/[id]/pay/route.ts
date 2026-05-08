import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

function roundMoney(n: number) {
  return Math.round(n * 100) / 100
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const order = await prisma.order.findFirst({
      where: { id: params.id, userId },
    })

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    if (order.status !== 'PENDING_PAYMENT') {
      return NextResponse.json({ error: '当前订单状态不允许支付' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const _paymentNumber = (body.paymentNumber as string) || null

    const total = roundMoney(order.totalAmount)

    const { payment, balance } = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { balance: true },
        })
        if (!user) {
          throw new Error('NO_USER')
        }
        const bal = roundMoney(user.balance)
        if (bal + 1e-9 < total) {
          throw new Error('INSUFFICIENT_BALANCE')
        }

        const newBalance = roundMoney(bal - total)

        await tx.user.update({
          where: { id: userId },
          data: { balance: newBalance },
        })

        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            userId,
            amount: total,
            paymentMethod: 'BALANCE',
            paymentNumber: _paymentNumber,
            status: 'SUCCESS',
            paidAt: new Date(),
          },
        })

        await tx.expense.create({
          data: {
            userId,
            orderId: order.id,
            amount: total,
            description: `订单 ${order.orderNumber} 支付（账户余额）`,
          },
        })

        await tx.walletLedger.create({
          data: {
            userId,
            amount: -total,
            type: 'PAYMENT',
            balanceAfter: newBalance,
            description: `订单 ${order.orderNumber} 消费 -¥${total}`,
          },
        })

        await tx.order.update({
          where: { id: params.id },
          data: {
            status: 'PAID',
            paymentMethod: 'BALANCE',
            paymentId: payment.id,
            paidAt: new Date(),
          },
        })

        return { payment, balance: newBalance }
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    )

    const updatedOrder = await prisma.order.findFirst({
      where: { id: params.id, userId },
      include: {
        items: { include: { product: true } },
        payments: true,
      },
    })

    if (!updatedOrder) {
      return NextResponse.json({ error: '支付后读取订单失败' }, { status: 500 })
    }

    return NextResponse.json({ order: updatedOrder, payment, balance }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json(
        { error: '账户余额不足，请先充值或调整余额后再支付' },
        { status: 400 }
      )
    }
    if (msg === 'NO_USER') {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }
    console.error(error)
    return NextResponse.json({ error: '支付失败' }, { status: 500 })
  }
}
