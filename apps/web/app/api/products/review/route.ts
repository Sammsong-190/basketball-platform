import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

// 获取待审核商品列表
export async function GET(request: NextRequest) {
    const authResult = await authenticate(request)
    if (authResult instanceof NextResponse) return authResult
    const user = authResult as any

    // 检查是否为管理员
    if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ACTIVE' // ACTIVE, INACTIVE, 或 all

    try {
        const where: any = {}
        if (status === 'all') {
            where.status = { not: 'DELETED' }
        } else {
            where.status = status
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                seller: { select: { id: true, username: true } },
                category: true,
                _count: { select: { reviews: true, orderItems: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ products })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to get products list' }, { status: 500 })
    }
}

// 审核商品（批准/拒绝）
export async function POST(request: NextRequest) {
    const authResult = await authenticate(request)
    if (authResult instanceof NextResponse) return authResult
    const user = authResult as any

    // 检查是否为管理员
    if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { productId, action, reason } = body // action: 'approve' 或 'reject'

        if (!productId || !action) {
            return NextResponse.json({ error: 'Incomplete parameters' }, { status: 400 })
        }

        if (action !== 'approve' && action !== 'reject' && action !== 'delete') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        if (action === 'delete') {
            await prisma.product.update({
                where: { id: productId },
                data: { status: 'DELETED' }
            })
            return NextResponse.json({ message: 'Product deleted', productId })
        }

        // 更新商品状态
        const product = await prisma.product.update({
            where: { id: productId },
            data: {
                status: action === 'approve' ? 'ACTIVE' : 'INACTIVE'
            },
            include: {
                seller: { select: { username: true } },
                category: true
            }
        })

        return NextResponse.json({
            message: action === 'approve' ? 'Product approved' : 'Product rejected',
            product
        })
    } catch (error) {
        return NextResponse.json({ error: 'Review failed' }, { status: 500 })
    }
}
