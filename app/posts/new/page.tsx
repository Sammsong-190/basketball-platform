'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

export default function NewPostPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [previewImages, setPreviewImages] = useState<string[]>([])
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        categoryId: '',
        images: ''
    })

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'))
        if (fileArray.length === 0) return

        const newImages: string[] = []
        let loadedCount = 0

        fileArray.forEach((file) => {
            const reader = new FileReader()
            reader.onloadend = () => {
                const result = reader.result as string
                newImages.push(result)
                loadedCount++

                if (loadedCount === fileArray.length) {
                    setPreviewImages((prev) => {
                        const updated = [...prev, ...newImages]
                        setFormData((prevData) => ({
                            ...prevData,
                            images: updated.join(',')
                        }))
                        return updated
                    })
                }
            }
            reader.readAsDataURL(file)
        })

        // 重置input，允许重复选择同一文件
        e.target.value = ''
    }

    const removeImage = (index: number) => {
        setPreviewImages((prev) => {
            const updated = prev.filter((_, i) => i !== index)
            setFormData((prevData) => ({
                ...prevData,
                images: updated.join(',')
            }))
            return updated
        })
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

            // 使用预览图片数组，如果为空则使用formData中的images（兼容URL格式）
            const images = previewImages.length > 0
                ? previewImages
                : (formData.images ? formData.images.split(',').map(url => url.trim()).filter(Boolean) : [])

            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.title,
                    content: formData.content,
                    categoryId: formData.categoryId || null,
                    images: images.length > 0 ? images : null
                })
            })

            const data = await response.json()

            if (response.ok) {
                alert('Post published successfully! Awaiting review')
                router.push('/posts')
            } else {
                alert(data.error || 'Failed to publish')
            }
        } catch (error) {
            console.error('Failed to publish post:', error)
            alert('Failed to publish, please try again')
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
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">New Post</h1>
                        <p className="text-gray-600">Share your basketball insights and experiences</p>
                    </div>

                    {/* 表单卡片 */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    Title <span className="text-red-500">*</span>
                                    <div className="group relative inline-flex items-center">
                                        <svg className="w-4 h-4 text-gray-400 hover:text-orange-500 cursor-help transition-colors" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                        </svg>
                                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none whitespace-normal">
                                            <p>Title should be concise and clear, summarizing the post content</p>
                                            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
                                        </div>
                                    </div>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                                    placeholder="Enter post title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    Content <span className="text-red-500">*</span>
                                    <div className="group relative inline-flex items-center">
                                        <svg className="w-4 h-4 text-gray-400 hover:text-orange-500 cursor-help transition-colors" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                        </svg>
                                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none whitespace-normal">
                                            <p>Content should be detailed and meaningful, helping other users understand your perspective</p>
                                            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
                                        </div>
                                    </div>
                                </label>
                                <textarea
                                    required
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={12}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none resize-none"
                                    placeholder="Enter post content...&#10;&#10;Supports multi-line text, you can share your thoughts, experiences, or questions."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    Images <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                    <div className="group relative inline-flex items-center">
                                        <svg className="w-4 h-4 text-gray-400 hover:text-orange-500 cursor-help transition-colors" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                        </svg>
                                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none whitespace-normal">
                                            <p>Click the plus icon to select images, supports multiple image uploads</p>
                                            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
                                        </div>
                                    </div>
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
                                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageSelect}
                                            className="hidden"
                                        />
                                        <div className="text-center">
                                            <svg className="w-8 h-8 text-gray-400 group-hover:text-orange-500 mx-auto mb-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            <span className="text-xs text-gray-500 group-hover:text-orange-500">Add</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Publishing...
                                        </span>
                                    ) : 'Publish Post'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>

                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm text-blue-700">
                                        <p className="font-semibold mb-1">Tip</p>
                                        <p>Posts need administrator review after publishing, and will only be displayed in the community after approval.</p>
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
