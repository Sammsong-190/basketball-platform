import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromRequest, TokenPayload } from './auth'
import { prisma } from './prisma'

export async function authenticate(request: NextRequest): Promise<NextResponse | TokenPayload> {
  const token = getTokenFromRequest(request as unknown as Request)
  
  if (!token) {
    return NextResponse.json(
      { error: '未授权，请先登录' },
      { status: 401 }
    )
  }

  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json(
      { error: 'Token无效或已过期' },
      { status: 401 }
    )
  }

  return payload
}

export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const authResult = await authenticate(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const payload = authResult as TokenPayload
    if (!allowedRoles.includes(payload.role)) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    return payload
  }
}

export async function requireAdmin(request: NextRequest): Promise<NextResponse | TokenPayload> {
  return requireRole(['ADMIN'])(request)
}

export async function requireSeller(request: NextRequest): Promise<NextResponse | TokenPayload> {
  const authResult = await authenticate(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const payload = authResult as TokenPayload
  
  // 管理员可以直接发布商品
  if (payload.role === 'ADMIN') {
    return payload
  }

  // 检查用户是否为卖家（从数据库查询 isSeller 字段）
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isSeller: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 管理员或卖家都可以发布商品
    if (user.role === 'ADMIN' || user.isSeller === true) {
      return payload
    }

    return NextResponse.json(
      { error: '权限不足，您不是卖家，无法发布商品' },
      { status: 403 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: '验证权限失败' },
      { status: 500 }
    )
  }
}
