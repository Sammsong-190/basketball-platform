import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, requireSeller } from '@/lib/middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    console.log('Fetching product with ID:', productId)
    
    // First, try to find the product with minimal includes to avoid relation errors
    let product: any = null
    try {
      product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          seller: { 
            select: { id: true, username: true, avatar: true } 
          },
          category: {
            select: { id: true, name: true }
          },
          _count: { 
            select: { reviews: true, orderItems: true } 
          }
        }
      })
    } catch (queryError: any) {
      console.error('Prisma query error:', queryError)
      // Try without includes if the query fails
      product = await prisma.product.findUnique({
        where: { id: productId }
      })
      if (product) {
        // Manually fetch related data
        try {
          const seller = await prisma.user.findUnique({
            where: { id: product.sellerId },
            select: { id: true, username: true, avatar: true }
          })
          const category = await prisma.category.findUnique({
            where: { id: product.categoryId },
            select: { id: true, name: true }
          })
          product.seller = seller
          product.category = category
          product._count = {
            reviews: await prisma.productReview.count({ where: { productId: productId } }),
            orderItems: await prisma.orderItem.count({ where: { productId: productId } })
          }
        } catch (relationError) {
          console.warn('Failed to fetch relations, continuing without them:', relationError)
        }
      }
    }

    if (!product) {
      console.error('Product not found in database:', productId)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.status === 'DELETED') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product is active (allow viewing inactive products but show warning)
    if (product.status !== 'ACTIVE') {
      console.warn('Product is not active:', productId, 'Status:', product.status)
    }

    // Calculate average rating from ProductReview (separate query to avoid relation issues)
    let avgRating = 0
    let reviewCount = 0
    let reviews: any[] = []
    
    try {
      reviews = await prisma.productReview.findMany({
        where: { productId: productId },
        include: {
          user: { select: { username: true, avatar: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      reviewCount = reviews.length
      if (reviews.length > 0) {
        avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      }
    } catch (reviewError: any) {
      console.warn('Failed to fetch reviews, using product defaults:', reviewError?.message)
      // Use product's default rating if review query fails
      avgRating = product.rating || 0
      reviewCount = product.reviewCount || product._count?.reviews || 0
    }

    return NextResponse.json({
      ...product,
      reviews: reviews,
      rating: avgRating,
      reviewCount: reviewCount
    })
  } catch (error: any) {
    console.error('Failed to fetch product:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta
    })
    return NextResponse.json({ 
      error: 'Failed to fetch product',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireSeller(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const userRole = (authResult as any).role

  try {
    const productId = params.id
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // 检查商品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // 严格检查权限：只有商品所有者或管理员可以编辑
    // 商品所有者：existingProduct.sellerId === userId
    // 管理员：userRole === 'ADMIN'
    if (userRole !== 'ADMIN' && existingProduct.sellerId !== userId) {
      console.warn(`Unauthorized edit attempt: User ${userId} tried to edit product ${productId} owned by ${existingProduct.sellerId}`)
      return NextResponse.json({ 
        error: 'You do not have permission to edit this product',
        details: 'You can only edit your own products'
      }, { status: 403 })
    }

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

    // 限制图片数量和大小
    let processedImages = images || []
    if (Array.isArray(processedImages)) {
      processedImages = processedImages.slice(0, 10)
      processedImages = processedImages.map((img: string) => {
        if (img.startsWith('data:image') && img.length > 500000) {
          console.warn('Image too large, truncating base64 data')
          return img.substring(0, 500000)
        }
        return img
      })
    }

    // 更新商品
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        stock: parsedStock,
        categoryId,
        images: JSON.stringify(processedImages),
        // 管理员可以修改状态，普通卖家不能
        ...(userRole === 'ADMIN' && body.status ? { status: body.status } : {})
      }
    })

    return NextResponse.json(updatedProduct)
  } catch (error: any) {
    console.error('Failed to update product:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta
    })
    
    let errorMessage = 'Failed to update product'
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
