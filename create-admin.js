/**
 * 创建管理员账户脚本
 * 使用方法：node create-admin.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('🔧 正在创建管理员账户...\n')

    // 默认管理员信息（可以修改）
    const adminInfo = {
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123456', // 默认密码，建议创建后修改
      phone: null
    }

    // 检查是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: adminInfo.username },
          { email: adminInfo.email }
        ]
      }
    })

    if (existingUser) {
      // 如果用户已存在，更新为管理员
      if (existingUser.role !== 'ADMIN') {
        const hashedPassword = await bcrypt.hash(adminInfo.password, 10)
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'ADMIN',
            password: hashedPassword
          }
        })
        console.log('✅ 用户已存在，已更新为管理员！')
        console.log(`   用户名: ${adminInfo.username}`)
        console.log(`   邮箱: ${adminInfo.email}`)
        console.log(`   密码: ${adminInfo.password}`)
        console.log(`   角色: ADMIN\n`)
      } else {
        console.log('⚠️  该用户已经是管理员了！')
        console.log(`   用户名: ${adminInfo.username}`)
        console.log(`   邮箱: ${adminInfo.email}\n`)
      }
    } else {
      // 创建新管理员
      const hashedPassword = await bcrypt.hash(adminInfo.password, 10)
      const admin = await prisma.user.create({
        data: {
          username: adminInfo.username,
          email: adminInfo.email,
          password: hashedPassword,
          phone: adminInfo.phone,
          role: 'ADMIN',
          profile: { create: {} }
        }
      })

      console.log('✅ 管理员账户创建成功！')
      console.log(`   用户名: ${adminInfo.username}`)
      console.log(`   邮箱: ${adminInfo.email}`)
      console.log(`   密码: ${adminInfo.password}`)
      console.log(`   角色: ADMIN\n`)
      console.log('⚠️  请登录后立即修改密码！\n')
    }

    console.log('📝 登录信息：')
    console.log(`   用户名: ${adminInfo.username}`)
    console.log(`   密码: ${adminInfo.password}\n`)

  } catch (error) {
    console.error('❌ 创建管理员失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
