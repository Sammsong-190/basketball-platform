/**
 * 初始化商品分类脚本
 * 使用方法: node init-categories.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const defaultCategories = [
    {
        name: '篮球鞋',
        description: '各种品牌和款式的篮球鞋',
        children: [
            { name: '高帮篮球鞋', description: '高帮设计，提供更好的脚踝保护' },
            { name: '低帮篮球鞋', description: '低帮设计，更灵活轻便' },
            { name: '中帮篮球鞋', description: '中帮设计，平衡保护与灵活性' }
        ]
    },
    {
        name: '球衣',
        description: 'NBA球队球衣和训练服',
        children: [
            { name: 'NBA球衣', description: 'NBA官方授权球衣' },
            { name: '训练服', description: '训练和日常穿着' },
            { name: '复古球衣', description: '经典复古款式' }
        ]
    },
    {
        name: '篮球',
        description: '各种规格的篮球',
        children: [
            { name: '室内篮球', description: '适合室内场地使用' },
            { name: '室外篮球', description: '适合室外场地使用' },
            { name: '比赛用球', description: '专业比赛级别' }
        ]
    },
    {
        name: '护具',
        description: '运动护具和保护装备',
        children: [
            { name: '护膝', description: '保护膝盖' },
            { name: '护肘', description: '保护手肘' },
            { name: '护踝', description: '保护脚踝' },
            { name: '护腕', description: '保护手腕' }
        ]
    },
    {
        name: '配件',
        description: '篮球相关配件',
        children: [
            { name: '球包', description: '篮球包和装备包' },
            { name: '水壶', description: '运动水壶' },
            { name: '毛巾', description: '运动毛巾' },
            { name: '头带', description: '运动头带' }
        ]
    },
    {
        name: '其他',
        description: '其他篮球相关商品'
    }
]

async function initCategories() {
    try {
        console.log('开始初始化商品分类...')

        // 检查是否已有分类
        const existingCategories = await prisma.category.count()
        if (existingCategories > 0) {
            console.log(`⚠️  数据库中已有 ${existingCategories} 个分类`)
            console.log('是否继续？这将添加新的分类（不会删除现有分类）')
            // 继续执行，添加新分类
        }

        let createdCount = 0

        for (const category of defaultCategories) {
            // 创建父分类
            const parent = await prisma.category.upsert({
                where: { name: category.name },
                update: {
                    description: category.description
                },
                create: {
                    name: category.name,
                    description: category.description
                }
            })

            console.log(`✓ 创建分类: ${parent.name}`)
            createdCount++

            // 创建子分类
            if (category.children && category.children.length > 0) {
                for (const child of category.children) {
                    await prisma.category.upsert({
                        where: { name: child.name },
                        update: {
                            description: child.description,
                            parentId: parent.id
                        },
                        create: {
                            name: child.name,
                            description: child.description,
                            parentId: parent.id
                        }
                    })
                    console.log(`  └─ 创建子分类: ${child.name}`)
                    createdCount++
                }
            }
        }

        console.log(`\n✅ 成功创建 ${createdCount} 个分类！`)
        console.log('\n分类列表:')
        const allCategories = await prisma.category.findMany({
            include: {
                parent: true,
                children: true
            },
            orderBy: [
                { parentId: 'asc' },
                { name: 'asc' }
            ]
        })

        const parentCategories = allCategories.filter(c => !c.parentId)
        parentCategories.forEach(parent => {
            console.log(`\n📁 ${parent.name}`)
            const children = allCategories.filter(c => c.parentId === parent.id)
            children.forEach(child => {
                console.log(`   └─ ${child.name}`)
            })
        })

    } catch (error) {
        console.error('❌ 初始化分类失败:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

initCategories()
