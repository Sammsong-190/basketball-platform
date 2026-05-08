/**
 * 售后处理权限（与 API 一致）：
 * - 含平台自营：仅管理员处理
 * - 单一卖家的自由交易：仅该卖家处理（管理员也不能代处理）
 * - 多卖家等无法归属单一卖家：由管理员处理
 */

export type OrderItemLike = {
  product?: {
    sellerId?: string | null
    sourceType?: string | null
  } | null
}

export function analyzeOrderRefundEligibility(items: OrderItemLike[] | undefined) {
  if (!items?.length) {
    return { hasPlatformManaged: false, soleFreeTradeSellerId: null as string | null }
  }
  let hasPlatformManaged = false
  const sellerIds = new Set<string>()
  for (const it of items) {
    const p = it.product
    if (!p) continue
    if (p.sourceType === 'PLATFORM_MANAGED') {
      hasPlatformManaged = true
    } else if (p.sellerId) {
      sellerIds.add(p.sellerId)
    }
  }
  if (hasPlatformManaged) {
    return { hasPlatformManaged: true, soleFreeTradeSellerId: null as string | null }
  }
  if (sellerIds.size !== 1) {
    return { hasPlatformManaged: false, soleFreeTradeSellerId: null as string | null }
  }
  return {
    hasPlatformManaged: false,
    soleFreeTradeSellerId: Array.from(sellerIds)[0] as string,
  }
}

export function adminCanProcessOrderRefund(order: { items?: OrderItemLike[] }): boolean {
  if (!order.items?.length) return false
  const { hasPlatformManaged, soleFreeTradeSellerId } = analyzeOrderRefundEligibility(
    order.items
  )
  if (hasPlatformManaged) return true
  return soleFreeTradeSellerId === null
}

export function sellerCanProcessOrderRefund(
  userId: string,
  order: { items?: OrderItemLike[] }
): boolean {
  const { hasPlatformManaged, soleFreeTradeSellerId } = analyzeOrderRefundEligibility(
    order.items
  )
  if (hasPlatformManaged) return false
  return soleFreeTradeSellerId !== null && soleFreeTradeSellerId === userId
}
