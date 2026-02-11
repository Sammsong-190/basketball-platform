import { Request, Response, NextFunction } from 'express'
import { verifyToken, getTokenFromRequest, TokenPayload } from './auth'
import { prisma } from './prisma'

export interface AuthRequest extends Request {
  userId?: string
  username?: string
  role?: string
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req)
  
  if (!token) {
    return res.status(401).json({ error: '未授权，请先登录' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: 'Token无效或已过期' })
  }

  req.userId = payload.userId
  req.username = payload.username
  req.role = payload.role
  next()
}

export function requireRole(allowedRoles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = getTokenFromRequest(req)
    
    if (!token) {
      return res.status(401).json({ error: '未授权，请先登录' })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return res.status(401).json({ error: 'Token无效或已过期' })
    }

    if (!allowedRoles.includes(payload.role)) {
      return res.status(403).json({ error: '权限不足' })
    }

    req.userId = payload.userId
    req.username = payload.username
    req.role = payload.role
    next()
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  return requireRole(['ADMIN'])(req, res, next)
}

export async function requireSeller(req: AuthRequest, res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req)
  
  if (!token) {
    return res.status(401).json({ error: '未授权，请先登录' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: 'Token无效或已过期' })
  }

  // 管理员可以直接发布商品
  if (payload.role === 'ADMIN') {
    req.userId = payload.userId
    req.username = payload.username
    req.role = payload.role
    return next()
  }

  // 检查用户是否为卖家（从数据库查询 isSeller 字段）
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isSeller: true, role: true }
    })

    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    // 管理员或卖家都可以发布商品
    if (user.role === 'ADMIN' || user.isSeller === true) {
      req.userId = payload.userId
      req.username = payload.username
      req.role = payload.role
      return next()
    }

    return res.status(403).json({ error: '权限不足，您不是卖家，无法发布商品' })
  } catch (error) {
    return res.status(500).json({ error: '验证权限失败' })
  }
}
