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
      return NextResponse.json({ error: '订单 ID、类型和原因为必填项' }, { status: 400 })
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
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    if (
      order.status !== 'COMPLETED' &&
      order.status !== 'SHIPPED' &&
      order.status !== 'PAID'
    ) {
      return NextResponse.json(
        { error: '当前订单状态不允许申请售后' },
        { status: 400 }
      )
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

      const freeTradeSellerIds = new Set<string>()
      for (const item of order.items) {
        const p = item.product
        if (!p) continue
        if (p.sourceType === 'PLATFORM_MANAGED') {
          hasPlatformManaged = true
        } else if (p.sellerId && p.sellerId !== userId) {
          sellerIdsToNotify.add(p.sellerId)
        }
        if (p.sellerId && p.sourceType !== 'PLATFORM_MANAGED') {
          freeTradeSellerIds.add(p.sellerId)
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

      // 多卖家自由交易：通知管理员协同（单一卖家仅通知该卖家）
      if (!hasPlatformManaged && freeTradeSellerIds.size > 1) {
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        })
        for (const a of admins) {
          toCreate.push({
            userId: a.id,
            title: '新的退款/售后申请（多卖家订单）',
            body: `订单号 ${order.orderNumber}：买家提交了「${typeLabel}」申请，金额 ¥${refundAmount.toFixed(
              2
            )}。原因：${reasonShort}\n本订单含多个卖家商品，请到管理后台「退款」或订单详情处理。`,
            type: 'REFUND_REQUEST',
            refundId: refund.id,
            orderId,
          })
        }
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
      console.error('退款通知发送失败:', notifyErr)
    }

    return NextResponse.json(refund, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '提交售后申请失败' }, { status: 500 })
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
    return NextResponse.json({ error: '获取售后列表失败' }, { status: 500 })
  }
}
