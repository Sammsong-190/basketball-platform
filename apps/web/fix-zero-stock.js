/**
 * 将库存为 0 的自由交易商品更新为 1，使其可被购买
 * 使用方法: node fix-zero-stock.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.product.updateMany({
    where: {
      stock: 0,
      sourceType: 'FREE_TRADE',
      status: 'ACTIVE'
    },
    data: { stock: 1 }
  })
  console.log(`Updated ${result.count} FREE_TRADE product(s) from stock 0 to 1`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
