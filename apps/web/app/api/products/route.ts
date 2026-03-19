import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, requireSeller } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId')
  const keyword = searchParams.get('keyword')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  try {
    const where: any = { status: 'ACTIVE' }
    if (categoryId) where.categoryId = categoryId
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
        // 按卖家名称搜索
        { seller: { username: { contains: keyword } } },
        // 按分类名称搜索
        { category: { name: { contains: keyword } } }
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          seller: { select: { id: true, username: true } },
          category: true,
          _count: { select: { reviews: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    return NextResponse.json({ products, total, page, limit })
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireSeller(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const userRole = (authResult as any).role

  try {
    const body = await request.json()
    const { name, description, price, stock, categoryId, images } = body

    // 验证必需字段
    if (!name || !description || !price || !categoryId) {
      return NextResponse.json({ 
        error: 'Required fields cannot be empty',
        details: `Missing: ${!name ? 'name, ' : ''}${!description ? 'description, ' : ''}${!price ? 'price, ' : ''}${!categoryId ? 'categoryId' : ''}`
      }, { status: 400 })
    }

    // 验证价格
    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    // 验证库存
    const parsedStock = parseInt(stock || '0')
    if (isNaN(parsedStock) || parsedStock < 0) {
      return NextResponse.json({ error: 'Invalid stock' }, { status: 400 })
    }

    // 验证分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 })
    }

    // 管理员发布的商品自动激活，普通卖家需要审核
    const productStatus = userRole === 'ADMIN' ? 'ACTIVE' : 'ACTIVE' // 目前所有商品都是ACTIVE，管理员可以撤回

    // 限制图片数量和大小，避免数据库字段过长
    let processedImages = images || []
    if (Array.isArray(processedImages)) {
      // 限制最多10张图片
      processedImages = processedImages.slice(0, 10)
      // 如果图片是 base64，限制每张图片的大小（例如只保留前500KB的base64数据）
      processedImages = processedImages.map((img: string) => {
        if (img.startsWith('data:image')) {
          // base64 图片，如果太长则截断或压缩提示
          if (img.length > 500000) { // 约500KB的base64
            console.warn('Image too large, truncating base64 data')
            // 返回一个占位符或错误提示
            return img.substring(0, 500000)
          }
        }
        return img
      })
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        stock: parsedStock,
        categoryId,
        images: JSON.stringify(processedImages),
        sellerId: userId,
        status: productStatus,
        sourceType: userRole === 'ADMIN' ? 'PLATFORM_MANAGED' : 'FREE_TRADE'
      } as any
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create product:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack
    })
    
    // 提供更详细的错误信息
    let errorMessage = 'Failed to create product'
    if (error?.code === 'P2002') {
      errorMessage = 'Product with this name already exists'
    } else if (error?.code === 'P2003') {
      errorMessage = 'Invalid category or seller ID'
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error?.message || 'Unknown error',
      code: error?.code
    }, { status: 500 })
  }
}
