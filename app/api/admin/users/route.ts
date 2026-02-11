import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

// 获取用户列表
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  try {
    const where: any = {}
    if (role) where.role = role

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isSeller: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              posts: true,
              products: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({ users, total, page, limit })
  } catch (error) {
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 })
  }
}

// 更新用户权限
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { id, role, isSeller } = body

    if (!id) {
      return NextResponse.json({ error: '用户ID为必填项' }, { status: 400 })
    }

    const updateData: any = {}
    if (role) updateData.role = role
    if (isSeller !== undefined) updateData.isSeller = isSeller

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isSeller: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: '更新用户权限失败' }, { status: 500 })
  }
}
