import { prisma } from '@/lib/prisma'

const CAP = 280

function trunc(s: string, max: number) {
  const t = (s || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

/** 从业务表推断的「历史操作」时间线，用于补全 SystemLog 表出现之前的记录 */
export type LegacyAuditEntry = {
  id: string
  action: string
  module: string
  description: string | null
  level: string
  createdAt: Date
  user: { id: string; username: string } | null
  isLegacy: true
}

export async function fetchLegacyAuditEntries(): Promise<LegacyAuditEntry[]> {
  const [
    users,
    posts,
    orders,
    products,
    comments,
    refunds,
    payments,
    complaints,
  ] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isSeller: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: CAP,
    }),
    prisma.post.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        author: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: CAP,
    }),
    prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: CAP,
    }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        seller: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: CAP,
    }),
    prisma.comment.findMany({
      select: {
        id: true,
        status: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, username: true } },
        post: { select: { title: true } },
        product: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: CAP,
    }),
    prisma.refund.findMany({
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        reason: true,
        createdAt: true,
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: CAP,
    }),
    prisma.payment.findMany({
      where: { status: 'SUCCESS' },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        orderId: true,
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: CAP,
    }),
    prisma.complaint.findMany({
      select: {
        id: true,
        type: true,
        title: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: CAP,
    }),
  ])

  const out: LegacyAuditEntry[] = []

  for (const u of users) {
    out.push({
      id: `hist-user-${u.id}`,
      action: '用户注册 / 账号创建（历史）',
      module: 'USER_HISTORY',
      description: `${u.username} · ${u.email} · role=${u.role} · 卖家=${u.isSeller}`,
      level: 'INFO',
      createdAt: u.createdAt,
      user: { id: u.id, username: u.username },
      isLegacy: true,
    })
  }

  for (const p of posts) {
    out.push({
      id: `hist-post-${p.id}`,
      action: '发布帖子（历史）',
      module: 'POST_HISTORY',
      description: `《${trunc(p.title, 80)}》状态=${p.status}`,
      level: 'INFO',
      createdAt: p.createdAt,
      user: p.author ? { id: p.author.id, username: p.author.username } : null,
      isLegacy: true,
    })
  }

  for (const o of orders) {
    out.push({
      id: `hist-order-${o.id}`,
      action: '创建订单（历史）',
      module: 'ORDER_HISTORY',
      description: `${o.orderNumber} · ¥${o.totalAmount.toFixed(2)} · ${o.status}`,
      level: 'INFO',
      createdAt: o.createdAt,
      user: o.user ? { id: o.user.id, username: o.user.username } : null,
      isLegacy: true,
    })
  }

  for (const p of products) {
    out.push({
      id: `hist-product-${p.id}`,
      action: '商品上架 / 创建（历史）',
      module: 'PRODUCT_HISTORY',
      description: `${trunc(p.name, 80)} · ${p.status}`,
      level: 'INFO',
      createdAt: p.createdAt,
      user: p.seller ? { id: p.seller.id, username: p.seller.username } : null,
      isLegacy: true,
    })
  }

  for (const c of comments) {
    const ctx = c.post?.title
      ? `帖子《${trunc(c.post.title, 40)}》`
      : c.product?.name
        ? `商品「${trunc(c.product.name, 40)}」`
        : '帖子/商品'
    out.push({
      id: `hist-comment-${c.id}`,
      action: '发表评论（历史）',
      module: 'COMMENT_HISTORY',
      description: `${ctx} · ${c.status} · ${trunc(c.content, 60)}`,
      level: 'INFO',
      createdAt: c.createdAt,
      user: c.author ? { id: c.author.id, username: c.author.username } : null,
      isLegacy: true,
    })
  }

  for (const r of refunds) {
    out.push({
      id: `hist-refund-${r.id}`,
      action: '发起退款（历史）',
      module: 'REFUND_HISTORY',
      description: `${r.type} · ¥${r.amount.toFixed(2)} · ${r.status} · ${trunc(r.reason, 40)}`,
      level: 'INFO',
      createdAt: r.createdAt,
      user: r.user ? { id: r.user.id, username: r.user.username } : null,
      isLegacy: true,
    })
  }

  for (const pay of payments) {
    out.push({
      id: `hist-payment-${pay.id}`,
      action: '支付成功（历史）',
      module: 'PAYMENT_HISTORY',
      description: `订单 ${pay.orderId.slice(0, 8)}… · ¥${pay.amount.toFixed(2)} · ${pay.status}`,
      level: 'INFO',
      createdAt: pay.createdAt,
      user: pay.user ? { id: pay.user.id, username: pay.user.username } : null,
      isLegacy: true,
    })
  }

  for (const c of complaints) {
    out.push({
      id: `hist-complaint-${c.id}`,
      action: '提交投诉 / 建议（历史）',
      module: 'COMPLAINT_HISTORY',
      description: `${c.type} · ${trunc(c.title, 60)} · ${c.status}`,
      level: 'INFO',
      createdAt: c.createdAt,
      user: c.user ? { id: c.user.id, username: c.user.username } : null,
      isLegacy: true,
    })
  }

  return out
}
