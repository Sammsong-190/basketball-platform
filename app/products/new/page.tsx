'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

interface Category {
  id: string | null
  name: string
  parentId: string | null
  children?: Category[]
}

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [subCategories, setSubCategories] = useState<Category[]>([])
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: ''
  })

  useEffect(() => {
    // 检查是否为卖家
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userData)
    if (!user.isSeller) {
      alert('You are not a seller, cannot add products')
      router.push('/products')
      return
    }

    // 获取分类列表
    fetchCategories()
  }, [router])

  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setCategories(data)
          if (data.length === 0) {
            console.warn('No product categories available, please contact administrator to add categories')
          }
        } else {
          console.error('Category data format error:', data)
          setCategories([])
        }
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch categories:', errorData.error || response.statusText)
        setCategories([])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleParentCategoryChange = (parentId: string) => {
    setSelectedParentId(parentId)
    setFormData({ ...formData, categoryId: '' }) // 清空子分类选择

    if (parentId) {
      // 找到选中的父分类，获取其子分类
      const parentCategory = categories.find(cat => cat.id === parentId)
      if (parentCategory && parentCategory.children && parentCategory.children.length > 0) {
        setSubCategories(parentCategory.children)
      } else {
        // 如果没有子分类，直接使用父分类ID
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

    // 限制最多10张图片
    const maxImages = 10
    const remainingSlots = maxImages - previewImages.length
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxImages} images allowed`)
      e.target.value = ''
      return
    }

    const filesToProcess = fileArray.slice(0, remainingSlots)
    const newImages: string[] = []
    let loadedCount = 0
    let errorCount = 0

    filesToProcess.forEach((file) => {
      // 限制文件大小（例如5MB）
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        alert(`Image "${file.name}" is too large (max 5MB). Please compress or use a smaller image.`)
        errorCount++
        if (errorCount === filesToProcess.length) {
          e.target.value = ''
        }
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        // 检查base64长度（约500KB的base64数据）
        if (result.length > 700000) {
          alert(`Image "${file.name}" is too large after encoding. Please use a smaller image.`)
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
        alert(`Failed to load image "${file.name}"`)
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
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please login first')
        router.push('/login')
        return
      }

      if (!formData.name || !formData.description || !formData.price || !formData.categoryId) {
        alert('Please fill in all required fields')
        setLoading(false)
        return
      }

      const response = await fetch('/api/products', {
        method: 'POST',
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
        alert('Product added successfully!')
        router.push('/products')
      } else {
        console.error('Failed to add product:', data)
        const errorMsg = data.error || data.details || 'Failed to add product'
        alert(`Failed to add product: ${errorMsg}`)
      }
    } catch (error: any) {
      console.error('Failed to add product:', error)
      alert(`Failed to add product: ${error.message || 'Please try again'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* 标题区域 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Add Product</h1>
            <p className="text-gray-600">Publish your basketball products</p>
          </div>

          {/* 表单卡片 */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  Product Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none resize-none"
                  placeholder="Enter detailed product description...&#10;&#10;Include product features, specifications, applicable scenarios, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    Price <span className="text-red-500">*</span>
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
                    Stock <span className="text-gray-400 text-xs font-normal">(Optional)</span>
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
                  Product Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 第一级：父分类 */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Select Main Category</label>
                    <select
                      required
                      value={selectedParentId}
                      onChange={(e) => handleParentCategoryChange(e.target.value)}
                      disabled={categoriesLoading || categories.length === 0}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {categoriesLoading ? (
                        <option value="">Loading categories...</option>
                      ) : categories.length === 0 ? (
                        <option value="">No categories available, please contact administrator</option>
                      ) : (
                        <>
                          <option value="">Select main category</option>
                          {categories
                            .filter(cat => cat.id) // 只显示有效的父分类
                            .map((category) => (
                              <option key={category.id} value={category.id!}>
                                {category.name}
                              </option>
                            ))}
                        </>
                      )}
                    </select>
                  </div>

                  {/* 第二级：子分类 */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Select Sub-category
                      {selectedParentId && subCategories.length === 0 && (
                        <span className="ml-2 text-xs text-gray-500">(This category has no sub-categories, main category selected automatically)</span>
                      )}
                    </label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      disabled={!selectedParentId || (subCategories.length === 0 && formData.categoryId === selectedParentId)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {!selectedParentId ? (
                        <option value="">Please select main category first</option>
                      ) : subCategories.length === 0 ? (
                        <option value={selectedParentId}>Use main category: {categories.find(c => c.id === selectedParentId)?.name}</option>
                      ) : (
                        <>
                          <option value="">Select sub-category</option>
                          {subCategories
                            .filter(child => child.id) // 只显示有效的子分类
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
                {categories.length === 0 && !categoriesLoading && (
                  <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    No product categories available in the system, please contact administrator to add categories before publishing products
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  Product Images <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                </label>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                  {/* 图片预览 */}
                  {previewImages.map((image, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
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

                  {/* 添加图片按钮 */}
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
                      <span className="text-xs text-gray-500 group-hover:text-gray-600">Add</span>
                    </div>
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">Supports multiple images, recommend uploading clear product photos (optional)</p>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </span>
                  ) : 'Publish Product'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-green-700">
                    <p className="font-semibold mb-1">Tip</p>
                    <p>Products will be displayed in the product list immediately after publishing. Administrators have the right to review products, and products with violations will be withdrawn.</p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
