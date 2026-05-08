'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { useToast } from '@/components/Toast'

interface Category {
  id: string | null
  name: string
  parentId: string | null
  children?: Category[]
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const productId = Array.isArray(params.id) ? params.id[0] : params.id
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [subCategories, setSubCategories] = useState<Category[]>([])
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: ''
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const userObj = JSON.parse(userData)
      setUser(userObj)
    }
    fetchCategories()
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`)
      if (response.ok) {
        const product = await response.json()
        
        // 检查权限：只有商品所有者或管理员可以编辑
        const userData = localStorage.getItem('user')
        if (!userData) {
          alert('请先登录')
          router.push('/login')
          return
        }
        
        const userObj = JSON.parse(userData)
        
        // 严格检查：只有商品的所有者（seller.id === user.id）或管理员可以编辑
        if (userObj.role !== 'ADMIN' && product.seller.id !== userObj.id) {
          alert('您无权编辑该商品，仅能编辑自己的商品。')
          router.push(`/products/${productId}`)
          return
        }
        
        // 确保用户是卖家
        if (userObj.role !== 'ADMIN' && !userObj.isSeller) {
          alert('您不是卖家，只有卖家可以编辑商品。')
          router.push(`/products/${productId}`)
          return
        }

        setFormData({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          stock: product.stock.toString(),
          categoryId: product.category.id
        })

        // 设置图片
        if (product.images) {
          try {
            const images = JSON.parse(product.images)
            if (Array.isArray(images)) {
              setPreviewImages(images)
            }
          } catch (e) {
            console.error('解析图片数据失败:', e)
          }
        }

        // 设置分类
        const category = product.category
        if (category) {
          // 查找父分类
          const parentCategory = categories.find(cat => 
            cat.id === category.id || (cat.children && cat.children.some(child => child.id === category.id))
          )
          if (parentCategory) {
            setSelectedParentId(parentCategory.id || '')
            if (parentCategory.children && parentCategory.children.length > 0) {
              setSubCategories(parentCategory.children)
            }
          } else {
            // 可能是子分类，需要找到父分类
            const foundParent = categories.find(cat => 
              cat.children && cat.children.some(child => child.id === category.id)
            )
            if (foundParent) {
              setSelectedParentId(foundParent.id || '')
              setSubCategories(foundParent.children || [])
            }
          }
        }
      } else {
        alert('加载商品失败')
        router.push('/products')
      }
    } catch (error) {
      console.error('获取商品失败:', error)
      alert('加载商品失败')
      router.push('/products')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setCategories(data)
        }
      }
    } catch (error) {
      console.error('获取分类失败:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleParentCategoryChange = (parentId: string) => {
    setSelectedParentId(parentId)
    setFormData({ ...formData, categoryId: '' })

    if (parentId) {
      const parentCategory = categories.find(cat => cat.id === parentId)
      if (parentCategory && parentCategory.children && parentCategory.children.length > 0) {
        setSubCategories(parentCategory.children)
      } else {
        setSubCategories([])
        setFormData({ ...formData, categoryId: parentId })
      }
    } else {
      setSubCategories([])
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'))
    if (fileArray.length === 0) return

    const maxImages = 10
    const remainingSlots = maxImages - previewImages.length
    if (remainingSlots <= 0) {
      alert(`最多只能上传 ${maxImages} 张图片`)
      e.target.value = ''
      return
    }

    const filesToProcess = fileArray.slice(0, remainingSlots)
    const newImages: string[] = []
    let loadedCount = 0
    let errorCount = 0

    filesToProcess.forEach((file) => {
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        alert(`图片「${file.name}」过大（最大 5MB）`)
        errorCount++
        if (errorCount === filesToProcess.length) {
          e.target.value = ''
        }
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (result.length > 700000) {
          alert(`图片「${file.name}」编码后仍过大，请换用更小的图片。`)
          errorCount++
        } else {
          newImages.push(result)
        }
        loadedCount++

        if (loadedCount === filesToProcess.length) {
          if (newImages.length > 0) {
            setPreviewImages((prev) => [...prev, ...newImages])
          }
          e.target.value = ''
        }
      }
      reader.onerror = () => {
        alert(`加载图片失败「${file.name}"`)
        errorCount++
        loadedCount++
        if (loadedCount === filesToProcess.length) {
          e.target.value = ''
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('请先登录')
        router.push('/login')
        return
      }

      if (!formData.name || !formData.description || !formData.price || !formData.categoryId) {
        alert('请填写所有必填项')
        setSubmitting(false)
        return
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock || '0'),
          categoryId: formData.categoryId,
          images: previewImages
        })
      })

      const data = await response.json()

      if (response.ok) {
        showToast('商品已更新')
        router.push(`/products/${productId}`)
      } else {
        console.error('更新商品失败:', data)
        const errorMsg = data.error || data.details || '更新商品失败'
        alert(`更新商品失败：${errorMsg}`)
      }
    } catch (error: any) {
      console.error('更新商品失败:', error)
      alert(`更新商品失败：${error.message || '请重试'}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
            <p className="mt-4 text-gray-600">加载中…</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">编辑商品</h1>
            <p className="text-gray-600">更新商品信息与展示内容</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  商品名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none"
                  placeholder="请输入商品名称"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  商品描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none resize-none"
                  placeholder={`请填写商品详情…`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    价格 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    库存 <span className="text-gray-400 text-xs font-normal">（选填）</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  商品分类 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">选择一级分类</label>
                    <select
                      required
                      value={selectedParentId}
                      onChange={(e) => handleParentCategoryChange(e.target.value)}
                      disabled={categoriesLoading || categories.length === 0}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {categoriesLoading ? (
                        <option value="">加载分类中…</option>
                      ) : categories.length === 0 ? (
                        <option value="">暂无可用分类</option>
                      ) : (
                        <>
                          <option value="">请选择一级分类</option>
                          {categories
                            .filter(cat => cat.id)
                            .map((category) => (
                              <option key={category.id} value={category.id!}>
                                {category.name}
                              </option>
                            ))}
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">选择子分类</label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      disabled={!selectedParentId || (subCategories.length === 0 && formData.categoryId === selectedParentId)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {!selectedParentId ? (
                        <option value="">请先选择主分类</option>
                      ) : subCategories.length === 0 ? (
                        <option value={selectedParentId}>使用一级分类：{categories.find(c => c.id === selectedParentId)?.name}</option>
                      ) : (
                        <>
                          <option value="">请选择子分类</option>
                          {subCategories
                            .filter(child => child.id)
                            .map((child) => (
                              <option key={child.id} value={child.id!}>
                                {child.name}
                              </option>
                            ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  商品图片 <span className="text-gray-400 text-xs font-normal">（选填）</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                  {previewImages.map((image, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={image}
                        alt={`预览图 ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-500 hover:bg-gray-50 transition-all group">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-400 group-hover:text-gray-600 mx-auto mb-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs text-gray-500 group-hover:text-gray-600">添加</span>
                    </div>
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">支持多张图片，建议上传清晰的商品实拍图（可选）</p>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      保存中…
                    </span>
                  ) : '保存修改'}
                </button>
                <Link
                  href={`/products/${productId}`}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-semibold"
                >
                  取消
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
