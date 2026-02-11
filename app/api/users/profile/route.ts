import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    })
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }
    const { password, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const body = await request.json()
    const { phone, avatar, profile } = body
    const updateData: any = {}
    if (phone !== undefined) updateData.phone = phone
    if (avatar !== undefined) updateData.avatar = avatar

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        profile: profile ? { upsert: { create: profile, update: profile } } : undefined
      },
      include: { profile: true }
    })
    const { password, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    return NextResponse.json({ error: '更新用户信息失败' }, { status: 500 })
  }
}
