'use client'

import { useState } from 'react'

export interface ShippingForm {
  shippingName: string
  shippingPhone: string
  shippingAddress: string
}

interface CheckoutDrawerProps {
  open: boolean
  onClose: () => void
  onSubmit: (form: ShippingForm) => void | Promise<void>
  loading?: boolean
  totalAmount?: number
  itemCount?: number
}

export default function CheckoutDrawer({
  open,
  onClose,
  onSubmit,
  loading = false,
  totalAmount = 0,
  itemCount = 0
}: CheckoutDrawerProps) {
  const [form, setForm] = useState<ShippingForm>({
    shippingName: '',
    shippingPhone: '',
    shippingAddress: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.shippingName.trim() || !form.shippingPhone.trim() || !form.shippingAddress.trim()) {
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(form)
      setForm({ shippingName: '', shippingPhone: '', shippingAddress: '' })
      onClose()
    } catch (_err) {
      // Error handled by parent
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Shipping Information</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name *</label>
              <input
                type="text"
                value={form.shippingName}
                onChange={(e) => setForm({ ...form, shippingName: e.target.value })}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={form.shippingPhone}
                onChange={(e) => setForm({ ...form, shippingPhone: e.target.value })}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address *</label>
              <textarea
                value={form.shippingAddress}
                onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                placeholder="Enter your full shipping address"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none resize-none"
                required
              />
            </div>
          </div>

          {(totalAmount > 0 || itemCount > 0) && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              {itemCount > 0 && (
                <p className="text-sm text-gray-600">{itemCount} item(s)</p>
              )}
              {totalAmount > 0 && (
                <p className="text-xl font-bold text-gray-900 mt-1">Total: ¥{totalAmount.toFixed(2)}</p>
              )}
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting || loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
