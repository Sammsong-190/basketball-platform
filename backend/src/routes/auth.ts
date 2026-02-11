import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { hashPassword, comparePassword, generateToken } from '../lib/auth'

const router = Router()

// 登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    })

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isSeller: user.isSeller
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ error: '登录失败' })
  }
})

// 注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, isSeller } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ error: '必填项不能为空' })
    }

    // 检查用户名和邮箱是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      }
    })

    if (existingUser) {
      return res.status(400).json({ error: '用户名或邮箱已存在' })
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        isSeller: isSeller === true
      }
    })

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    })

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isSeller: user.isSeller
      }
    })
  } catch (error) {
    console.error('注册失败:', error)
    res.status(500).json({ error: '注册失败' })
  }
})

export default router
