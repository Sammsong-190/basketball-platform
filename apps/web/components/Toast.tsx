'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ToastContextValue {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null)

  const showToast = useCallback((message: string) => {
    const id = Date.now()
    setToast({ message, id })
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev))
    }, 2500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div
            className="bg-gray-200 text-gray-800 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-toast-fade"
            key={toast.id}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}
