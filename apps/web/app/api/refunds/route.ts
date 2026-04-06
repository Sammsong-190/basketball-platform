import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

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

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sellerId: true,
                sourceType: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'COMPLETED' && order.status !== 'SHIPPED') {
      return NextResponse.json({ error: 'Order status does not allow refund' }, { status: 400 })
    }

    const refundAmount = typeof amount === 'number' ? amount : order.totalAmount

    const refund = await prisma.refund.create({
      data: {
        orderId,
        userId,
        type,
        reason,
        amount: refundAmount
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

    // 站内通知：自由交易 → 卖家；平台自营 → 管理员
    try {
      const typeLabel = type === 'REFUND' ? '仅退款' : '退货退款'
      const reasonShort =
        reason.length > 200 ? reason.slice(0, 200) + '…' : reason

      const sellerIdsToNotify = new Set<string>()
      let hasPlatformManaged = false

      for (const item of order.items) {
        const p = item.product
        if (!p) continue
        if (p.sourceType === 'PLATFORM_MANAGED') {
          hasPlatformManaged = true
        } else if (p.sellerId && p.sellerId !== userId) {
          sellerIdsToNotify.add(p.sellerId)
        }
      }

      const toCreate: Array<{
        userId: string
        title: string
        body: string
        type: string
        refundId: string
        orderId: string
      }> = []

      for (const sid of Array.from(sellerIdsToNotify)) {
        toCreate.push({
          userId: sid,
          title: '新的退款/售后申请（您的商品）',
          body: `订单号 ${order.orderNumber}：买家提交了「${typeLabel}」申请，金额 ¥${refundAmount.toFixed(
            2
          )}。原因：${reasonShort}\n请在个人中心「处理消息」或订单详情处理该退款。`,
          type: 'REFUND_REQUEST',
          refundId: refund.id,
          orderId,
        })
      }

      if (hasPlatformManaged) {
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        })
        for (const a of admins) {
          toCreate.push({
            userId: a.id,
            title: '新的退款/售后申请（平台自营商品）',
            body: `订单号 ${order.orderNumber}：订单含平台自营商品，买家提交了「${typeLabel}」申请，金额 ¥${refundAmount.toFixed(
              2
            )}。原因：${reasonShort}\n请到管理后台「退款」或订单详情处理。`,
            type: 'REFUND_REQUEST',
            refundId: refund.id,
            orderId,
          })
        }
      }

      if (toCreate.length > 0) {
        await prisma.userNotification.createMany({ data: toCreate })
      }
    } catch (notifyErr) {
      console.error('Refund notification failed:', notifyErr)
    }

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
