import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

// 模拟商品数据（平台自营 mock 入库：名称、分类、介绍均为中文）
const mockProducts = [
    {
        name: 'Nike LeBron 20 篮球鞋',
        description:
            '高性能篮球鞋，搭载先进缓震科技，脚感扎实，适合室内木地板与室外塑胶场地。',
        price: 1299.0,
        stock: 50,
        images: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
            'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
        ],
        category: '篮球鞋',
    },
    {
        name: '斯伯丁 NBA 官方比赛用球',
        description:
            '标准尺寸与重量，复合皮革表皮，握球感出色，耐磨损，适合日常训练与比赛。',
        price: 299.0,
        stock: 100,
        images: ['https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500'],
        category: '篮球',
    },
    {
        name: 'Jordan 品牌球衣（红色）',
        description: '乔丹品牌篮球球衣，100% 聚酯纤维面料，吸湿排汗，运动穿着干爽舒适。',
        price: 599.0,
        stock: 75,
        images: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500'],
        category: '球衣',
    },
    {
        name: 'Under Armour 篮球短裤',
        description: '轻量透气，排汗快干，剪裁利于跑动与起跳，适合训练与实战穿着。',
        price: 399.0,
        stock: 80,
        images: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500'],
        category: '运动服饰',
    },
    {
        name: 'Wilson Evolution 篮球',
        description: '高端室内用球，手感柔和、抓握稳定，许多职业球员与高校赛事选用。',
        price: 349.0,
        stock: 60,
        images: ['https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500'],
        category: '篮球',
    },
    {
        name: 'Adidas Harden Vol.7 篮球鞋',
        description:
            '哈登签名款，BOOST 缓震，强调变向与急停时的支撑，适合后卫与锋线打法。',
        price: 1199.0,
        stock: 45,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
        category: '篮球鞋',
    },
    {
        name: 'Nike Dri-FIT 篮球袜（3 双装）',
        description: '关键部位加厚缓冲，面料吸湿排汗，三双组合装，性价比高。',
        price: 99.0,
        stock: 200,
        images: ['https://images.unsplash.com/photo-1586350977772-b3b4bc4cd3d2?w=500'],
        category: '配件',
    },
    {
        name: '篮球网（加粗耐用款）',
        description: '加粗编织，耐候性好，户外长时间使用不易断裂，安装与更换简便。',
        price: 49.0,
        stock: 150,
        images: ['https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500'],
        category: '配件',
    },
    {
        name: '湖人队 23 号勒布朗·詹姆斯球衣',
        description: '洛杉矶湖人主题球迷球衣，NBA 正版授权元素设计，日常穿搭与看球皆可。',
        price: 699.0,
        stock: 55,
        images: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500'],
        category: '球衣',
    },
    {
        name: '篮球护腕（2 只装）',
        description: '吸汗透气，减少汗水下流影响手感，剧烈运动仍贴合舒适。',
        price: 39.0,
        stock: 180,
        images: ['https://images.unsplash.com/photo-1586350977772-b3b4bc4cd3d2?w=500'],
        category: '配件',
    },
    {
        name: 'Nike Kyrie 9 篮球鞋',
        description: '鞋身轻量，缓震反馈灵敏，适合小个子后卫与追求灵活的脚步移动。',
        price: 1099.0,
        stock: 40,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
        category: '篮球鞋',
    },
    {
        name: '摩腾 GG7X 篮球',
        description: '符合 FIBA 比赛用球规格的优质选择，超纤复合外皮，抓握与回弹均衡。',
        price: 449.0,
        stock: 70,
        images: ['https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500'],
        category: '篮球',
    },
    {
        name: '篮球专用双肩背包',
        description: '大容量主仓，独立鞋仓隔层，可收纳球、水壶与换洗衣物，去球场一包搞定。',
        price: 249.0,
        stock: 90,
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'],
        category: '配件',
    },
    {
        name: '勇士队 30 号斯蒂芬·库里球衣',
        description: '金州勇士主题球迷球衣，NBA 正版授权元素设计，经典配色耐看。',
        price: 699.0,
        stock: 65,
        images: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500'],
        category: '球衣',
    },
    {
        name: '篮球护膝',
        description: '缓冲减震、稳定髌骨，佩戴贴合不臃肿，适合跳跃与对抗较多的打法。',
        price: 79.0,
        stock: 120,
        images: ['https://images.unsplash.com/photo-1586350977772-b3b4bc4cd3d2?w=500'],
        category: '配件',
    },
    {
        name: 'Nike Elite 篮球袜',
        description: '分区加厚缓震，耐穿抗起球，长距离训练后仍能保持支撑感。',
        price: 89.0,
        stock: 160,
        images: ['https://images.unsplash.com/photo-1586350977772-b3b4bc4cd3d2?w=500'],
        category: '配件',
    },
    {
        name: '篮球投篮护臂',
        description: '适度压缩支撑前臂，促进手臂血液循环，长时投篮减轻肌肉疲劳感。',
        price: 59.0,
        stock: 140,
        images: ['https://images.unsplash.com/photo-1586350977772-b3b4bc4cd3d2?w=500'],
        category: '配件',
    },
    {
        name: '公牛队 23 号迈克尔·乔丹复古球衣',
        description: '芝加哥公牛经典复古款，NBA 正版授权元素设计，收藏与穿搭皆宜。',
        price: 799.0,
        stock: 50,
        images: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500'],
        category: '球衣',
    },
    {
        name: '篮球护踝（一副）',
        description: '提供侧向支撑，降低崴脚风险，轻量化设计，穿进鞋内不挤脚。',
        price: 129.0,
        stock: 100,
        images: ['https://images.unsplash.com/photo-1586350977772-b3b4bc4cd3d2?w=500'],
        category: '配件',
    },
    {
        name: 'Nike Air Max 篮球鞋',
        description: '经典 Air Max 气垫缓震，复古鞋型搭配现代舒适鞋垫，休闲与打球皆可。',
        price: 999.0,
        stock: 35,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
        category: '篮球鞋',
    },
]

export async function POST(request: NextRequest) {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) return authResult

    try {
        const body = await request.json()
        const { source, limit } = body

        if (!source) {
            return NextResponse.json({ error: '请指定数据来源' }, { status: 400 })
        }

        const scrapeLimit = Math.min(parseInt(limit) || 10, 50) // 最多50个

        // 获取或创建管理员用户作为卖家
        let adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        })

        if (!adminUser) {
            return NextResponse.json({ error: '未找到管理员账号' }, { status: 404 })
        }

        const products = []
        const errors = []

        if (source === 'mock') {
            // 使用模拟数据
            const productsToScrape = mockProducts.slice(0, scrapeLimit)

            for (const productData of productsToScrape) {
                try {
                    // 查找或创建分类
                    let category = await prisma.category.findFirst({
                        where: { name: productData.category }
                    })

                    if (!category) {
                        category = await prisma.category.create({
                            data: { name: productData.category }
                        })
                    }

                    // 检查商品是否已存在（只检查管理员爬取的商品，不影响卖家商品）
                    // 通过名称、卖家ID和来源类型来判断，确保不影响其他卖家的商品
                    const existingProduct = await prisma.product.findFirst({
                        where: {
                            name: productData.name,
                            sellerId: adminUser.id,
                            sourceType: 'PLATFORM_MANAGED' // 只检查平台管理的商品
                        }
                    })

                    if (existingProduct) {
                        errors.push(`平台商品「${productData.name}」已存在（已跳过）`)
                        continue
                    }

                    // 创建商品
                    const product = await prisma.product.create({
                        data: {
                            name: productData.name,
                            description: productData.description,
                            price: productData.price,
                            stock: productData.stock,
                            images: JSON.stringify(productData.images),
                            sellerId: adminUser.id,
                            categoryId: category.id,
                            status: 'ACTIVE',
                            sourceType: 'PLATFORM_MANAGED'
                        }
                    })

                    products.push({
                        id: product.id,
                        name: product.name,
                        price: product.price
                    })
                } catch (error: any) {
                    console.error(`Failed to create product "${productData.name}":`, error)
                    errors.push(`创建「${productData.name}」失败：${error.message}`)
                }
            }
        } else if (source === 'jd' || source === 'taobao') {
            // 实际爬虫功能（需要实现）
            return NextResponse.json({
                error: '尚未实现京东/淘宝真实抓取，请使用 mock 数据源。',
                message: '真实抓取需要额外依赖，且可能受反爬限制。'
            }, { status: 501 })
        } else {
            return NextResponse.json({ error: '数据来源无效' }, { status: 400 })
        }

        if (products.length === 0 && errors.length > 0) {
            return NextResponse.json({
                error: '未能抓取到任何商品',
                errors: errors
            }, { status: 400 })
        }

        return NextResponse.json({
            message: `成功抓取 ${products.length} 个商品${errors.length > 0 ? `（${errors.length} 条提示）` : ''}`,
            products: products,
            total: products.length,
            errors: errors.length > 0 ? errors.slice(0, 5) : undefined // 只返回前5个错误
        })
    } catch (error: any) {
        console.error('抓取商品失败:', error)
        return NextResponse.json({
            error: '抓取商品失败',
            details: error.message
        }, { status: 500 })
    }
}
