'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface FlyToCartProps {
  active: boolean
  imageSrc: string
  fromRect: DOMRect | null
  onComplete: () => void
}

const CART_ICON_ID = 'header-cart-icon'

export default function FlyToCart({ active, imageSrc, fromRect, onComplete }: FlyToCartProps) {
  const [phase, setPhase] = useState<'start' | 'flying'>('start')
  const [mounted, setMounted] = useState(false)
  const elRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!active || !fromRect || typeof document === 'undefined') return

    const cartEl = document.getElementById(CART_ICON_ID)
    const toRect = cartEl?.getBoundingClientRect()

    if (!toRect) {
      onComplete()
      return
    }

    setPhase('start')
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase('flying'))
    })

    const duration = 600
    const timer = setTimeout(() => {
      onComplete()
    }, duration)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [active, fromRect, onComplete])

  if (!mounted || !active || !fromRect || !imageSrc) return null

  const cartEl = document.getElementById(CART_ICON_ID)
  const toRect = cartEl?.getBoundingClientRect()
  if (!toRect) return null

  const fromStyle: React.CSSProperties = {
    position: 'fixed',
    left: fromRect.left,
    top: fromRect.top,
    width: fromRect.width,
    height: fromRect.height,
    opacity: 1,
    zIndex: 9999,
    pointerEvents: 'none',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  }

  const toStyle: React.CSSProperties = {
    position: 'fixed',
    left: toRect.left + toRect.width / 2 - 20,
    top: toRect.top + toRect.height / 2 - 20,
    width: 40,
    height: 40,
    opacity: 0,
    zIndex: 9999,
    pointerEvents: 'none',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  }

  const style: React.CSSProperties = phase === 'start'
    ? { ...fromStyle, transition: 'none' }
    : { ...toStyle, transition: 'all 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' }

  const flyEl = (
    <div ref={elRef} style={style}>
      <img
        src={imageSrc}
        alt=""
        className="w-full h-full object-contain"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  )

  const portalRoot = typeof document !== 'undefined' ? document.getElementById('fly-to-cart-portal') : null
  return portalRoot ? createPortal(flyEl, portalRoot) : null
}
