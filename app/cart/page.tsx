'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { useToast } from '@/components/Toast'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    images: string
    stock: number
  }
}

export default function CartPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(userData))
    fetchCart()
  }, [router])

  const fetchCart = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setCartItems(data.cartItems || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(cartItemId)
      return
    }

    const token = localStorage.getItem('token')
    const cartItem = cartItems.find(item => item.id === cartItemId)
    if (!cartItem) return

    if (newQuantity > cartItem.product.stock) {
      alert(`Only ${cartItem.product.stock} items available in stock`)
      return
    }

    try {
      // Remove old item
      await fetch(`/api/cart?id=${cartItemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Add with new quantity
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: cartItem.product.id,
          quantity: newQuantity
        })
      })

      if (response.ok) {
        fetchCart()
      }
    } catch (error) {
      console.error('Failed to update quantity:', error)
      alert('Failed to update quantity')
    }
  }

  const handleRemoveItem = async (cartItemId: string) => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`/api/cart?id=${cartItemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        fetchCart()
      }
    } catch (error) {
      console.error('Failed to remove item:', error)
      alert('Failed to remove item')
    }
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty')
      return
    }

    const shippingAddress = prompt('Please enter your shipping address:')
    const shippingName = prompt('Please enter your name:')
    const shippingPhone = prompt('Please enter your phone number:')

    if (!shippingAddress || !shippingName || !shippingPhone) {
      alert('Please fill in all shipping information')
      return
    }

    const token = localStorage.getItem('token')
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          })),
          shippingAddress,
          shippingName,
          shippingPhone
        })
      })

      if (response.ok) {
        const order = await response.json()
        showToast('Order created successfully!')
        router.push(`/orders/${order.id}`)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create order')
      }
    } catch (error) {
      console.error('Failed to create order:', error)
      alert('Failed to create order, please try again')
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

          {cartItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <span className="text-6xl mb-4 block">🛒</span>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Start shopping to add items to your cart</p>
              <Link
                href="/products"
                className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-semibold"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => {
                  const images = item.product.images ? JSON.parse(item.product.images) : []
                  return (
                    <div key={item.id} className="bg-white rounded-2xl shadow-lg p-6">
                      <div className="flex gap-6">
                        <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {images[0] ? (
                            <img
                              src={images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-4xl">🏀</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {item.product.name}
                              </h3>
                              <p className="text-2xl font-bold text-gray-900">
                                ¥{item.product.price.toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-gray-600 hover:text-gray-800 text-xl"
                            >
                              ×
                            </button>
                          </div>
                          <div className="flex items-center gap-4">
                            <label className="text-gray-700 font-semibold">Quantity:</label>
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                className="px-3 py-1 hover:bg-gray-100 transition-colors"
                              >
                                −
                              </button>
                              <span className="px-4 py-1 min-w-[3rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="px-3 py-1 hover:bg-gray-100 transition-colors"
                                disabled={item.quantity >= item.product.stock}
                              >
                                +
                              </button>
                            </div>
                            <span className="text-gray-500">
                              Stock: {item.product.stock}
                            </span>
                          </div>
                          <div className="mt-4 text-lg font-semibold text-gray-900">
                            Subtotal: ¥{(item.product.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                      <span>¥{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between text-2xl font-bold text-gray-900">
                        <span>Total</span>
                        <span>¥{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full px-6 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    Proceed to Checkout
                  </button>
                  <Link
                    href="/products"
                    className="block mt-4 text-center text-gray-900 hover:text-gray-700 font-semibold"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
