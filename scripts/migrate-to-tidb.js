/**
 * 数据迁移脚本：从本地 MySQL 导出并导入到 TiDB Cloud
 * 步骤1: 导入 schema  步骤2: 导入数据
 */
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

// 加载 .env
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
} catch (_) {}

const TIDB_URL = process.env.DATABASE_URL
if (!TIDB_URL) {
  console.error('请设置 .env 中的 DATABASE_URL（TiDB Cloud 连接字符串）')
  process.exit(1)
}

// 解析 connection string
function parseUrl(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)
  if (!match) throw new Error('Invalid DATABASE_URL format')
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5],
    ssl: { rejectUnauthorized: true }
  }
}

async function main() {
  let dataPath = path.join(__dirname, '..', 'prisma', 'data_with_columns.sql')
  if (!fs.existsSync(dataPath)) {
    dataPath = path.join(__dirname, '..', 'prisma', 'data_only.sql')
  }
  if (!fs.existsSync(dataPath)) {
    console.error('请先运行: mysqldump --no-create-info --complete-insert ... > prisma/data_with_columns.sql')
    process.exit(1)
  }

  const runSql = (conn, sqlContent) => {
    const statements = sqlContent
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--') && !s.match(/^\/\*!/))
    return statements
  }

  const dataSql = fs.readFileSync(dataPath, 'utf8')
  const config = parseUrl(TIDB_URL)

  console.log('连接 TiDB Cloud...')
  let conn
  try {
    conn = await mysql.createConnection(config)
    await conn.query('SET NAMES utf8mb4')
    await conn.query('SET FOREIGN_KEY_CHECKS=0')
    console.log('连接成功')

  // 清空现有数据（按依赖逆序）
  const tables = ['OrderItem','Payment','Refund','Complaint','CartItem','ProductReview','Comment','Order','Product','PostLike','PostShare','Post','PostCategory','Category','UserProfile','User','Collection','Favorite','Income','Expense','SystemLog']
  console.log('\n0. 清空现有表...')
  for (const t of tables) {
    try {
      await conn.query(`TRUNCATE TABLE \`${t}\``)
      process.stdout.write(`  ✓ ${t}\n`)
    } catch (e) {
      if (!e.message.includes("doesn't exist")) process.stdout.write(`  - ${t} (跳过)\n`)
    }
  }
  } catch (err) {
    console.error('连接失败:', err.message)
    if (err.message.includes('certificate')) {
      console.log('\n提示: 若遇 TLS 证书错误，可在 TiDB 控制台重新生成密码并复制完整连接字符串')
    }
    process.exit(1)
  }

  const execBatch = async (sqlContent) => {
    const statements = sqlContent
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => {
        if (s.length < 10 || s.startsWith('--') || s.match(/^\/\*!/)) return false
        return s.match(/^INSERT INTO/)
        return true
      })
    let ok = 0
    let fail = 0
    for (const stmt of statements) {
      if (!stmt) continue
      try {
        await conn.query(stmt)
        ok++
        const m = stmt.match(/INSERT INTO `?(\w+)`?/i)
        if (m) process.stdout.write(`  ✓ ${m[1]}\n`)
      } catch (err) {
        fail++
        if (fail <= 5) console.error(`  失败: ${stmt.slice(0, 60)}...`, err.message)
      }
    }
    return { ok, fail }
  }

  console.log('\n1. 导入数据...')
  const r2 = await execBatch(dataSql)
  console.log(`   成功 ${r2.ok}, 失败 ${r2.fail}`)

  await conn.end()
  console.log('\n迁移完成')
}

main().catch(console.error)
