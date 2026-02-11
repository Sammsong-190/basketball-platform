/**
 * 将现有用户升级为管理员
 * 使用方法：node update-user-to-admin.js <用户名>
 * 例如：node update-user-to-admin.js admin
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateUserToAdmin() {
  try {
    // 从命令行参数获取用户名
    const username = process.argv[2]

    if (!username) {
      console.log('❌ 请提供用户名！')
      console.log('📝 使用方法：node update-user-to-admin.js <用户名>')
      console.log('   例如：node update-user-to-admin.js admin')
      process.exit(1)
    }

    console.log(`🔧 正在将用户 "${username}" 升级为管理员...\n`)

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      console.log(`❌ 用户 "${username}" 不存在！`)
      process.exit(1)
    }

    if (user.role === 'ADMIN') {
      console.log(`⚠️  用户 "${username}" 已经是管理员了！`)
      process.exit(0)
    }

    // 更新为管理员
    await prisma.user.update({
      where: { username },
      data: { role: 'ADMIN' }
    })

    console.log(`✅ 用户 "${username}" 已成功升级为管理员！`)
    console.log(`   用户名: ${user.username}`)
    console.log(`   邮箱: ${user.email}`)
    console.log(`   角色: ADMIN\n`)
    console.log('🔄 请退出登录后重新登录以刷新权限！\n')

  } catch (error) {
    console.error('❌ 升级失败:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updateUserToAdmin()
