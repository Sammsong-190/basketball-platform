import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { name, description, parentId } = body

    if (!name) {
      return NextResponse.json({ error: '分类名称为必填项' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
        parentId: parentId || null
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: '分类名称已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建分类失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { id, name, description, parentId } = body

    if (!id) {
      return NextResponse.json({ error: '分类ID为必填项' }, { status: 400 })
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (parentId !== undefined) updateData.parentId = parentId

    const category = await prisma.category.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: '更新分类失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: '分类ID为必填项' }, { status: 400 })
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: true
      }
    })

    if (!category) {
      return NextResponse.json({ error: '分类不存在' }, { status: 404 })
    }

    if (category.children.length > 0) {
      return NextResponse.json({ error: '该分类下有子分类，无法删除' }, { status: 400 })
    }

    if (category.products.length > 0) {
      return NextResponse.json({ error: '该分类下有商品，无法删除' }, { status: 400 })
    }

    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除分类失败' }, { status: 500 })
  }
}
