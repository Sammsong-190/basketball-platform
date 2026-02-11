import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 获取所有分类（包括子分类）
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
        parent: {
          select: {
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // 如果没有任何分类，返回空数组
    if (categories.length === 0) {
      return NextResponse.json([])
    }

    // 分离父分类和子分类
    const parentCategories = categories.filter(cat => !cat.parentId)
    const childCategories = categories.filter(cat => cat.parentId)

    // 构建结构化的分类数据
    const structuredCategories = parentCategories.map(parent => ({
      id: parent.id,
      name: parent.name,
      parentId: null,
      children: childCategories
        .filter(child => child.parentId === parent.id)
        .map(child => ({
          id: child.id,
          name: child.name,
          parentId: child.parentId
        }))
    }))

    // 如果有独立的子分类（父分类不存在），也包含进来
    const orphanChildren = childCategories.filter(child => {
      return !parentCategories.some(parent => parent.id === child.parentId)
    })

    if (orphanChildren.length > 0) {
      structuredCategories.push({
        id: null,
        name: '其他',
        parentId: null,
        children: orphanChildren.map(child => ({
          id: child.id,
          name: child.name,
          parentId: child.parentId
        }))
      })
    }

    return NextResponse.json(structuredCategories)
  } catch (error: any) {
    console.error('获取分类列表失败:', error)
    return NextResponse.json({ error: '获取分类列表失败' }, { status: 500 })
  }
}
