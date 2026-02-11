import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { isValidEmail, isValidPhone } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, phone, isSeller } = body

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: '用户名、邮箱和密码为必填项' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      )
    }

    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: '手机号格式不正确' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '用户名或邮箱已存在' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        phone: phone || null,
        isSeller: isSeller === true || isSeller === 'true',
        profile: { create: {} }
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isSeller: true,
        createdAt: true
      }
    })

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    })

    return NextResponse.json({ user, token }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('注册错误:', error)
    // 开发/预览环境返回详细错误，便于排查 Vercel 部署问题
    const isDev = process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview'
    return NextResponse.json(
      { error: isDev ? `注册失败: ${msg}` : '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}
