const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔌 正在连接数据库...')
    await prisma.$connect()
    console.log('✅ 数据库连接成功！')
    
    // 测试查询
    const userCount = await prisma.user.count()
    console.log(`📊 当前用户数量: ${userCount}`)
    
    await prisma.$disconnect()
    console.log('✅ 连接已关闭')
    process.exit(0)
  } catch (error) {
    console.error('❌ 数据库连接失败:')
    console.error('错误信息:', error.message)
    console.error('\n💡 请检查:')
    console.error('1. MySQL 服务是否运行')
    console.error('2. .env 文件中的 DATABASE_URL 是否正确')
    console.error('3. 数据库是否已创建')
    process.exit(1)
  }
}

testConnection()
