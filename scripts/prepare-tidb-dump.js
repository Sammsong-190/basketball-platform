/**
 * 从 MySQL dump 生成 TiDB 兼容的 schema（移除外键约束）
 */
const fs = require('fs')
const path = require('path')

const dumpPath = path.join(__dirname, '..', 'prisma', 'dump.sql')
const outPath = path.join(__dirname, '..', 'prisma', 'tidb_schema.sql')

let content = fs.readFileSync(dumpPath, 'utf8')

// 移除 INSERT 及之后的数据部分，只保留 schema
const insertIdx = content.indexOf('INSERT INTO')
if (insertIdx > 0) {
  content = content.substring(0, insertIdx)
}

// 移除 CONSTRAINT ... FOREIGN KEY ... 整行
content = content.replace(/\n\s*,?\s*CONSTRAINT `[^`]+` FOREIGN KEY \([^)]+\) REFERENCES [^\n]+/g, '')

// 修正 trailing comma: ,\n) -> \n)
content = content.replace(/,(\s*)\)/g, '$1)')

fs.writeFileSync(outPath, content)
console.log('已生成 prisma/tidb_schema.sql（无外键，TiDB 兼容）')
