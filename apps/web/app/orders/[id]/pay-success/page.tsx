'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

export default function PaySuccessPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchOrder()
  }, [params.id, router])

  const fetchOrder = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const paymentId = searchParams.get('paymentId')

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h1>
          <p className="text-gray-600 mb-6">
            Your order has been paid successfully. Thank you for your purchase!
          </p>
          {order && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600">Order No.: {order.orderNumber}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">¥{order.totalAmount?.toFixed(2)}</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Link
              href={`/orders/${params.id}`}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800"
            >
              View Order Details
            </Link>
            <Link
              href="/products"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
            >
              Continue Shopping
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
