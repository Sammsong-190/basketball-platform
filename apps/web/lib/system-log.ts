import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export function getRequestLogContext(request: NextRequest) {
  const h = request.headers
  const xf = h.get('x-forwarded-for')
  const ip =
    xf?.split(',')[0]?.trim() || h.get('x-real-ip') || undefined
  const ua = h.get('user-agent') || undefined
  return {
    ipAddress: ip,
    userAgent: ua ? ua.slice(0, 500) : undefined,
  }
}

/** 写入系统日志；失败只打控制台，不抛错以免影响主流程 */
export async function writeSystemLog(params: {
  userId?: string | null
  action: string
  module: string
  description?: string | null
  level?: 'INFO' | 'WARN' | 'ERROR'
  ipAddress?: string | null
  userAgent?: string | null
}) {
  try {
    await prisma.systemLog.create({
      data: {
        userId: params.userId || undefined,
        action: params.action,
        module: params.module,
        description: params.description ?? undefined,
        level: params.level ?? 'INFO',
        ipAddress: params.ipAddress ?? undefined,
        userAgent: params.userAgent ?? undefined,
      },
    })
  } catch (e) {
    console.error('[writeSystemLog]', e)
  }
}
