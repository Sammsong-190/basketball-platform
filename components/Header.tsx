'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setIsLoggedIn(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUser(null)
    window.location.href = '/'
  }

  return (
    <header className="bg-white text-gray-900 shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-3xl">🏀</span>
            <span className="text-xl font-bold group-hover:scale-105 transition-transform">
              Basketball Platform
            </span>
            <span className="ml-1 px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-md group-hover:text-gray-700 group-hover:bg-gray-200 transition-colors">
              Home
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link 
              href="/products" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                pathname === '/products' 
                  ? 'bg-gray-100 text-gray-900 font-semibold' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Products
            </Link>
            <Link 
              href="/posts" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                pathname === '/posts' 
                  ? 'bg-gray-100 text-gray-900 font-semibold' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Community
            </Link>
            <Link 
              href="/events" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                pathname === '/events' 
                  ? 'bg-gray-100 text-gray-900 font-semibold' 
                  : 'hover:bg-gray-100'
              }`}
            >
              📰 Events
            </Link>
            
            {isLoggedIn ? (
              <>
                {user?.role === 'ADMIN' && (
                  <Link 
                    href="/admin" 
                    className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                      pathname === '/admin' 
                        ? 'bg-gray-100 text-gray-900 font-semibold' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    Admin
                  </Link>
                )}
                <div className="ml-4 pl-4 border-l border-gray-200 flex items-center gap-3">
                  <Link
                    href="/cart"
                    className="relative p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                  >
                    <span className="text-2xl">🛒</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    className={`px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                      pathname === '/dashboard' ? 'bg-gray-100 text-gray-900 font-semibold' : 'hover:bg-gray-100'
                    }`}
                  >
                    👤 {user?.username}
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="ml-4 pl-4 border-l border-gray-200 flex items-center space-x-2">
                <Link
                  href="/cart"
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  <span className="text-2xl">🛒</span>
                </Link>
                <Link 
                  href="/login" 
                  className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              <Link 
                href="/products" 
                className={`px-4 py-2 rounded-lg ${
                  pathname === '/products' 
                    ? 'bg-gray-100 text-gray-900 font-semibold' 
                    : 'hover:bg-gray-100'
                }`}
              >
                Products
              </Link>
              <Link 
                href="/posts" 
                className={`px-4 py-2 rounded-lg ${
                  pathname === '/posts' 
                    ? 'bg-gray-100 text-gray-900 font-semibold' 
                    : 'hover:bg-gray-100'
                }`}
              >
                Community
              </Link>
              <Link 
                href="/events" 
                className={`px-4 py-2 rounded-lg ${
                  pathname === '/events' 
                    ? 'bg-gray-100 text-gray-900 font-semibold' 
                    : 'hover:bg-gray-100'
                }`}
              >
                📰 Events
              </Link>
              {isLoggedIn ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className={`px-4 py-2 rounded-lg ${
                      pathname === '/dashboard' 
                        ? 'bg-gray-100 text-gray-900 font-semibold' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    👤 {user?.username}
                  </Link>
                  <Link 
                    href="/cart" 
                    className="px-4 py-2 rounded-lg hover:bg-gray-100"
                  >
                    🛒 Cart
                  </Link>
                  <button onClick={handleLogout} className="px-4 py-2 rounded-lg hover:bg-gray-100 text-left">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/cart" className="px-4 py-2 rounded-lg hover:bg-gray-100">🛒 Cart</Link>
                  <Link href="/login" className="px-4 py-2 rounded-lg hover:bg-gray-100">Login</Link>
                  <Link href="/register" className="px-4 py-2 rounded-lg hover:bg-gray-100">Register</Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
