'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import AdminNav from '@/components/AdminNav'
import { useRouter } from 'next/navigation'

export default function ScrapeProductsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [user, setUser] = useState<any>(null)
    const [formData, setFormData] = useState({
        source: 'mock',
        limit: '10'
    })

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            const userObj = JSON.parse(userData)
            setUser(userObj)
            
            if (userObj.role !== 'ADMIN') {
                alert('You do not have permission to access this page')
                router.push('/dashboard')
            }
        } else {
            router.push('/login')
        }
    }, [router])

    const handleScrape = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setResult(null)

        try {
            const token = localStorage.getItem('token')
            if (!token) {
                setResult({
                    success: false,
                    error: 'Please login first'
                })
                setLoading(false)
                return
            }

            const response = await fetch('/api/products/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    source: formData.source,
                    limit: parseInt(formData.limit)
                })
            })

            const data = await response.json()

            if (response.ok) {
                setResult({
                    success: true,
                    message: data.message,
                    products: data.products,
                    total: data.total
                })
                // 3秒后跳转到商品列表
                setTimeout(() => {
                    router.push('/products')
                }, 3000)
            } else {
                setResult({
                    success: false,
                    error: data.error || data.details || '爬取失败',
                    errors: data.errors
                })
            }
        } catch (error: any) {
            setResult({
                success: false,
                error: error.message || '爬取失败，请重试'
            })
        } finally {
            setLoading(false)
        }
    }

    if (!user || user.role !== 'ADMIN') {
        return null
    }

    return (
        <>
            <Header />
            <AdminNav />
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                <div className="container mx-auto px-4 py-12">
                    <div className="mb-8">
                        <h1 className="text-5xl font-bold mb-4 text-gray-900 flex items-center">
                            <span className="mr-3">🕷️</span>
                            <span className="bg-gradient-to-r text-gray-900">商品爬虫</span>
                        </h1>
                        <p className="text-xl text-gray-600">从知名篮球用品网站爬取商品信息</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                        <form onSubmit={handleScrape} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    数据源
                                </label>
                                <select
                                    value={formData.source}
                                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none"
                                    required
                                >
                                    <option value="mock">模拟数据（推荐）</option>
                                    <option value="jd">京东商城</option>
                                    <option value="taobao">淘宝</option>
                                </select>
                                <p className="mt-2 text-sm text-gray-500">
                                    {formData.source === 'mock' && '使用内置的模拟商品数据，稳定可靠'}
                                    {formData.source === 'jd' && '从京东商城爬取篮球用品（可能受反爬虫限制）'}
                                    {formData.source === 'taobao' && '从淘宝爬取篮球用品（可能受反爬虫限制）'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    爬取数量
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={formData.limit}
                                    onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none"
                                    required
                                />
                                <p className="mt-2 text-sm text-gray-500">建议数量：10-20 个商品</p>
                            </div>

                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm text-blue-700">
                                        <p className="font-semibold mb-1">提示</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>爬取的商品将自动保存到数据库</li>
                                            <li>系统会自动创建商品分类（如果不存在）</li>
                                            <li>重复的商品将被跳过</li>
                                            <li>爬取完成后将自动跳转到商品列表页面</li>
                                        </ul>
                                    </div>
                                </div>
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
                                            爬取中...
                                        </span>
                                    ) : '开始爬取'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/products')}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-semibold"
                                >
                                    返回商品列表
                                </button>
                            </div>
                        </form>

                        {result && (
                            <div className={`mt-6 p-6 rounded-lg border-l-4 ${result.success
                                ? 'bg-green-50 border-green-500'
                                : 'bg-red-50 border-red-500'
                                }`}>
                                <div className="flex items-start">
                                    {result.success ? (
                                        <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    <div className="flex-1">
                                        <p className={`font-semibold mb-2 ${result.success ? 'text-green-700' : 'text-red-700'
                                            }`}>
                                            {result.success ? '爬取成功！' : '爬取失败'}
                                        </p>
                                        <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {result.message || result.error}
                                        </p>
                                        {result.errors && result.errors.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-xs font-semibold text-red-600 mb-1">Errors:</p>
                                                <ul className="text-xs text-red-600 space-y-1">
                                                    {result.errors.map((err: string, idx: number) => (
                                                        <li key={idx}>• {err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {result.success && result.products && (
                                            <div className="mt-4">
                                                <p className="text-sm text-green-600 mb-2">
                                                    成功保存 {result.products.length} 个商品，3秒后自动跳转到商品列表...
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                                    {result.products.slice(0, 4).map((product: any) => (
                                                        <div key={product.id} className="bg-white p-3 rounded-lg border border-green-200">
                                                            <p className="text-sm font-semibold text-gray-900 line-clamp-1">{product.name}</p>
                                                            <p className="text-xs text-gray-500 mt-1">¥{product.price.toFixed(2)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
