const path = require('path')

// Monorepo：合并仓库根目录与 apps/web 下的 .env。
// 若 JWT_SECRET、DATABASE_URL 等只写在仓库根 .env，Next 默认只读 apps/web，会导致签发与校验密钥不一致（表现为 Token invalid）。
try {
  const dotenv = require('dotenv')
  const webDir = __dirname
  const rootDir = path.join(webDir, '..', '..')
  const files = [
    path.join(rootDir, '.env'),
    path.join(rootDir, '.env.local'),
    path.join(webDir, '.env'),
    path.join(webDir, '.env.local'),
  ]
  for (const f of files) {
    dotenv.config({ path: f, override: true })
  }
} catch {
  // 无 dotenv 时仍由 Next 自行加载 apps/web 下环境变量
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig


