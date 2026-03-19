import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

// 模拟商品数据
const mockProducts = [
    {
        name: 'Nike LeBron 20 Basketball Shoes',
        description: 'High-performance basketball shoes with advanced cushioning technology. Perfect for indoor and outdoor courts.',
        price: 1299.00,
        stock: 50,
        images: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
            'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500'
        ],
        category: 'Basketball Shoes'
    },
    {
        name: 'Spalding NBA Official Basketball',
        description: 'Official size and weight NBA basketball. Premium composite leather for superior grip and durability.',
        price: 299.00,
        stock: 100,
        images: [
            'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500'
        ],
        category: 'Basketballs'
    },
    {
        name: 'Jordan Brand Jersey - Red',
        description: 'Authentic Jordan Brand basketball jersey. 100% polyester, moisture-wicking fabric.',
        price: 599.00,
        stock: 75,
        images: [
            'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500'
        ],
        category: 'Jerseys'
    },
    {
        name: 'Under Armour Basketball Shorts',
        description: 'Lightweight, breathable basketball shorts with moisture-wicking technology. Perfect for training and games.',
        price: 399.00,
        stock: 80,
        images: [
            'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500'
        ],
        category: 'Apparel'
    },
    {
        name: 'Wilson Evolution Basketball',
        description: 'Premium indoor basketball with superior grip and feel. Used by many professional players.',
        price: 349.00,
        stock: 60,
        images: [
            'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500'
        ],
        category: 'Basketballs'
    },
    {
        name: 'Adidas Harden Vol. 7 Basketball Shoes',
        description: 'Signature basketball shoes with Boost cushioning. Designed for quick cuts and explosive movements.',
        price: 1199.00,
        stock: 45,
        images: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'
        ],
        category: 'Basketball Shoes'
    },
    {
        name: 'Nike Dri-FIT Basketball Socks (3-Pack)',
        description: 'Moisture-wicking basketball socks with cushioning in key areas. 3-pack for value.',
        price: 99.00,
        stock: 200,
        images: [
            'https://images.unsplash.com/photo-1586350977772-b3b4bc4cd3d2?w=500'
        ],
        category: 'Accessories'
    },
    {
        name: 'Basketball Hoop Net - Heavy Duty',
        description: 'Heavy-duty basketball net that withstands outdoor weather. Easy to install and replace.',
        price: 49.00,
        stock: 150,
        images: [
            'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500'
        ],
        category: 'Accessories'
    },
    {
        name: 'Lakers #23 LeBron James Jersey',
        description: 'Authentic Los Angeles Lakers LeBron James jersey. Official NBA licensed product.',
        price: 699.00,
        stock: 55,
        images: [
            'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500'
        ],
        category: 'Jerseys'
    },
    {
        name: 'Basketball Wristbands (2-Pack)',
        description: 'Absorbent wristbands for sweat management. Comfortable and durable for intense games.',
        price: 39.00,
        stock: 180,
        images: [
            'https://images.unsplash.com/photo-1586350977772-b3b4bc4cd3d2?w=500'
        ],
        category: 'Accessories'
    },
    {
        name: 'Nike Kyrie 9 Basketball Shoes',
        description: 'Lightweight basketball shoes with responsive cushioning. Great for guards and quick players.',
        price: 1099.00,
        stock: 40,
        images: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'
        ],
        category: 'Basketball Shoes'
    },
    {
        name: 'Molten GG7X Basketball',
        description: 'Official FIBA basketball. Premium microfiber composite cover for superior grip.',
        price: 449.00,
        stock: 70,
        images: [
            'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500'
        ],
        category: 'Basketballs'
    },
    {
        name: 'Basketball Backpack',
        description: 'Spacious basketball backpack with separate shoe compartment. Perfect for carrying gear to games.',
        price: 249.00,
        stock: 90,
        images: [
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'
        ],
        category: 'Accessories'
    },
    {
        name: 'Warriors #30 Curry Jersey',
        description: 'Authentic Golden State Warriors Stephen Curry jersey. Official NBA licensed product.',
        price: 699.00,
        stock: 65,
        images: [
            'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500'
        ],
        category: 'Jerseys'
    },
    {
        name: 'Basketball Knee Pads',
        description: 'Protective knee pads for basketball. Comfortable fit with excellent protection.',
        price: 79.00,
        stock: 120,
        images: [
            'https://images.unsplash.com/photo-1586350977772-b3b4bc4cd3d2?w=500'
        ],
        category: 'Accessories'
    },
    {
        name: 'Nike Elite Basketball Socks',
        description: 'Premium basketball socks with targeted cushioning. Moisture-wicking and durable.',
        price: 89.00,
        stock: 160,
        images: [
            'https://images.unsplash.com/photo-1586350977772-b3b4bc4cd3d2?w=500'
        ],
        category: 'Accessories'
    },
    {
        name: 'Basketball Shooting Sleeve',
        description: 'Compression shooting sleeve for arm support. Improves circulation and reduces fatigue.',
        price: 59.00,
        stock: 140,
        images: [
            'https://images.unsplash.com/photo-1586350977772-b3b4bc4cd3d2?w=500'
        ],
        category: 'Accessories'
    },
    {
        name: 'Bulls #23 Michael Jordan Jersey',
        description: 'Classic Chicago Bulls Michael Jordan jersey. Retro style, official NBA licensed.',
        price: 799.00,
        stock: 50,
        images: [
            'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500'
        ],
        category: 'Jerseys'
    },
    {
        name: 'Basketball Ankle Braces (Pair)',
        description: 'Supportive ankle braces for injury prevention. Lightweight and comfortable design.',
        price: 129.00,
        stock: 100,
        images: [
            'https://images.unsplash.com/photo-1586350977772-b3b4bc4cd3d2?w=500'
        ],
        category: 'Accessories'
    },
    {
        name: 'Nike Air Max Basketball Shoes',
        description: 'Classic basketball shoes with Air Max cushioning. Timeless design with modern comfort.',
        price: 999.00,
        stock: 35,
        images: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'
        ],
        category: 'Basketball Shoes'
    }
]

export async function POST(request: NextRequest) {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) return authResult

    try {
        const body = await request.json()
        const { source, limit } = body

        if (!source) {
            return NextResponse.json({ error: 'Source is required' }, { status: 400 })
        }

        const scrapeLimit = Math.min(parseInt(limit) || 10, 50) // 最多50个

        // 获取或创建管理员用户作为卖家
        let adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        })

        if (!adminUser) {
            return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
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
                        errors.push(`Platform product "${productData.name}" already exists (skipped)`)
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
                    errors.push(`Failed to create "${productData.name}": ${error.message}`)
                }
            }
        } else if (source === 'jd' || source === 'taobao') {
            // 实际爬虫功能（需要实现）
            return NextResponse.json({
                error: 'Real scraping from JD/Taobao is not implemented yet. Please use mock data source.',
                message: 'Real scraping requires additional libraries and may be blocked by anti-scraping measures.'
            }, { status: 501 })
        } else {
            return NextResponse.json({ error: 'Invalid source' }, { status: 400 })
        }

        if (products.length === 0 && errors.length > 0) {
            return NextResponse.json({
                error: 'Failed to scrape any products',
                errors: errors
            }, { status: 400 })
        }

        return NextResponse.json({
            message: `Successfully scraped ${products.length} products${errors.length > 0 ? ` (${errors.length} errors)` : ''}`,
            products: products,
            total: products.length,
            errors: errors.length > 0 ? errors.slice(0, 5) : undefined // 只返回前5个错误
        })
    } catch (error: any) {
        console.error('Failed to scrape products:', error)
        return NextResponse.json({
            error: 'Failed to scrape products',
            details: error.message
        }, { status: 500 })
    }
}
