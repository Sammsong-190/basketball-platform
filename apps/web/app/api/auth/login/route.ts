import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码为必填项' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }]
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    })

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isSeller: user.isSeller
      },
      token
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('登录错误:', error)
    // 开发/预览环境返回详细错误，便于排查 Vercel 部署问题
    const isDev = process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview'
    return NextResponse.json(
      { error: isDev ? `登录失败: ${msg}` : '登录失败，请稍后重试' },
      { status: 500 }
    )
  }
}
