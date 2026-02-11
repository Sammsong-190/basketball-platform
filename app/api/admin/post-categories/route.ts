import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: '分类名称为必填项' }, { status: 400 })
    }

    const category = await prisma.postCategory.create({
      data: {
        name,
        description: description || null
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
    const { id, name, description } = body

    if (!id) {
      return NextResponse.json({ error: '分类ID为必填项' }, { status: 400 })
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description

    const category = await prisma.postCategory.update({
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
    const category = await prisma.postCategory.findUnique({
      where: { id },
      include: { posts: true }
    })

    if (!category) {
      return NextResponse.json({ error: '分类不存在' }, { status: 404 })
    }

    if (category.posts.length > 0) {
      return NextResponse.json({ error: '该分类下有帖子，无法删除' }, { status: 400 })
    }

    await prisma.postCategory.delete({ where: { id } })
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除分类失败' }, { status: 500 })
  }
}
