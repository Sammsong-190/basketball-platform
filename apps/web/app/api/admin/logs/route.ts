import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

// 获取系统日志
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level')
  const module = searchParams.get('module')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    const where: any = {}
    if (level) where.level = level
    if (module) where.module = module

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        include: {
          user: { select: { id: true, username: true } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.systemLog.count({ where })
    ])

    return NextResponse.json({ logs, total, page, limit })
  } catch (error) {
    return NextResponse.json({ error: '获取日志失败' }, { status: 500 })
  }
}
