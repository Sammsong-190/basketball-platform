import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

/** 每次调用读取，避免模块首次加载时 .env 尚未注入；并与 next.config 中合并的根目录 .env 一致 */
function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
}

/** 去掉首尾空白及误存的引号，避免 Bearer "eyJ..." 导致验签失败 */
export function normalizeClientToken(raw: string): string {
  let s = raw.trim()
  if (s.length >= 2) {
    const q = s[0]
    if ((q === '"' || q === "'") && s[s.length - 1] === q) {
      s = s.slice(1, -1).trim()
    }
  }
  return s
}

export interface TokenPayload {
  userId: string
  username: string
  role: string
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

export type VerifyFailureCode = 'malformed' | 'expired' | 'invalid'

export function verifyTokenDetailed(
  token: string
): { ok: true; payload: TokenPayload } | { ok: false; code: VerifyFailureCode } {
  const normalized = normalizeClientToken(token)
  if (!normalized || normalized.split('.').length !== 3) {
    return { ok: false, code: 'malformed' }
  }
  try {
    const payload = jwt.verify(normalized, getJwtSecret()) as TokenPayload
    return { ok: true, payload }
  } catch (e: unknown) {
    const name = e instanceof Error ? e.name : ''
    if (name === 'TokenExpiredError') {
      return { ok: false, code: 'expired' }
    }
    return { ok: false, code: 'invalid' }
  }
}

export function verifyToken(token: string): TokenPayload | null {
  const r = verifyTokenDetailed(token)
  return r.ok ? r.payload : null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const raw = authHeader.slice(7).trim()
    const normalized = normalizeClientToken(raw)
    return normalized.length > 0 ? normalized : null
  }
  return null
}
