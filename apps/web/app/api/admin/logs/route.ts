import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'
import { fetchLegacyAuditEntries } from '@/lib/audit-history'

type UnifiedLog = {
  id: string
  action: string
  module: string
  description: string | null
  level: string
  createdAt: Date
  user: { id: string; username: string } | null
  isLegacy?: boolean
}

// 获取系统日志 + 从业务表推断的历史时间线（`?legacy=0` 可仅查 SystemLog）
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level')
  const module = searchParams.get('module')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const includeLegacy = searchParams.get('legacy') !== '0'

  try {
    if (module) {
      const where: { level?: string; module: string } = { module }
      if (level) where.level = level

      const [logs, total] = await Promise.all([
        prisma.systemLog.findMany({
          where,
          include: {
            user: { select: { id: true, username: true } },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.systemLog.count({ where }),
      ])

      const unified: UnifiedLog[] = logs.map((row) => ({
          id: row.id,
          action: row.action,
          module: row.module,
          description: row.description,
          level: row.level,
          createdAt: row.createdAt,
          user: row.user
            ? { id: row.user.id, username: row.user.username }
            : null,
          isLegacy: false,
        }))

      return NextResponse.json({
        logs: unified,
        total,
        page,
        limit,
        includesLegacy: false,
      })
    }

    const sysWhere: { level?: string } = {}
    if (level) sysWhere.level = level

    const [sysLogs, legacyRows] = await Promise.all([
      prisma.systemLog.findMany({
        where: sysWhere,
        include: {
          user: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 1200,
      }),
      includeLegacy && (!level || level === 'INFO')
        ? fetchLegacyAuditEntries()
        : Promise.resolve([]),
    ])

    let unified: UnifiedLog[] = sysLogs.map((row) => ({
        id: row.id,
        action: row.action,
        module: row.module,
        description: row.description,
        level: row.level,
        createdAt: row.createdAt,
        user: row.user
          ? { id: row.user.id, username: row.user.username }
          : null,
        isLegacy: false,
      }))

    unified = unified.concat(
      legacyRows.map((row) => ({
        id: row.id,
        action: row.action,
        module: row.module,
        description: row.description,
        level: row.level,
        createdAt: row.createdAt,
        user: row.user,
        isLegacy: true as const,
      }))
    )

    unified.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    const total = unified.length
    const start = (page - 1) * limit
    const pageItems = unified.slice(start, start + limit)

    return NextResponse.json({
      logs: pageItems,
      total,
      page,
      limit,
      includesLegacy: includeLegacy && legacyRows.length > 0,
    })
  } catch (error) {
    console.error('[admin/logs]', error)
    return NextResponse.json({ error: '获取日志失败' }, { status: 500 })
  }
}
