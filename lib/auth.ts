import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'

export interface TokenPayload {
    userId: string
    username: string
    role: string
}

// 生成JWT Token
export function generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// 验证JWT Token
export function verifyToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload
    } catch (error) {
        return null
    }
}

// 密码加密
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
}

// 密码验证
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
}

// 从请求中获取Token
export function getTokenFromRequest(request: Request): string | null {
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7)
    }
    return null
}

