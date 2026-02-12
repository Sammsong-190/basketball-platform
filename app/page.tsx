'use client'

import Link from 'next/link'
import { Cormorant_Garamond } from 'next/font/google'
import Header from '@/components/Header'
import NewsCarousel from '@/components/NewsCarousel'

const airySubtitleFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['italic', 'normal']
})

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white text-gray-900 py-20">
          {/* Smooth basketball-themed wave background */}
          <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Main smooth wave layer - basketball themed */}
            <div className="absolute inset-0 basketball-smooth-wave"></div>
            {/* Sun: rise from left, set on right - transform-only for smooth motion */}
            <div className="absolute inset-0 sun-orbit-wrapper">
              <div className="sun-orbit">
                <div className="sun-glow"></div>
                <div className="sun-core"></div>
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in tracking-tight leading-[1.05]">
                <span className="inline-block text-gray-900 drop-shadow-sm">
                  Basketball E-commerce Social Platform
                </span>
              </h1>
              <p className={`${airySubtitleFont.className} italic text-lg md:text-2xl mb-8 text-gray-600 leading-relaxed tracking-wider font-medium`}>
                Integrating commerce, social interaction, and content to create a dedicated platform for basketball enthusiasts
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/products"
                  className="px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-50 border border-gray-300 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Browse Products
                </Link>
                <Link
                  href="/posts"
                  className="px-8 py-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Join Community
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* NBA News Carousel Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <span className="mr-3">🏀</span>
              <span className="text-gray-900">
                NBA Event News
              </span>
            </h2>
            <p className="text-gray-600">Latest basketball event updates, get NBA news first</p>
          </div>
          <NewsCarousel />
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="text-5xl mb-4">🏀</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Product Shopping</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Rich selection of basketball products, sneakers, jerseys, accessories all included, authentic guarantee, excellent quality
              </p>
              <Link
                href="/products"
                className="inline-flex items-center text-gray-900 font-semibold hover:text-gray-700 transition-colors group-hover:translate-x-2 duration-200"
              >
                Browse Products
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Community Interaction</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Exchange and discuss with basketball enthusiasts, share basketball insights, meet like-minded friends
              </p>
              <Link
                href="/posts"
                className="inline-flex items-center text-gray-900 font-semibold hover:text-gray-700 transition-colors group-hover:translate-x-2 duration-200"
              >
                Enter Community
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="text-5xl mb-4">📰</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Event News</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Latest basketball event news, score data analysis, get basketball updates first
              </p>
              <Link
                href="/events"
                className="inline-flex items-center text-gray-900 font-semibold hover:text-gray-700 transition-colors group-hover:translate-x-2 duration-200"
              >
                View News
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">1000+</div>
                <div className="text-gray-600">Quality Products</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">5000+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">10000+</div>
                <div className="text-gray-600">Community Posts</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">24/7</div>
                <div className="text-gray-600">Online Service</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-gray-400">
              <h3 className="font-bold text-lg mb-3 text-gray-900">User Management</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Personal Information Management
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Favorites Management
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Comments Management
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-gray-500">
              <h3 className="font-bold text-lg mb-3 text-gray-900">Community Interaction</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Post Publishing
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Comments & Likes
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Topic Categories
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-gray-400">
              <h3 className="font-bold text-lg mb-3 text-gray-900">Product Trading</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Product Browsing
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Shopping Cart
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Order Management
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-gray-500">
              <h3 className="font-bold text-lg mb-3 text-gray-900">After-sales Service</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Returns & Exchanges
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Complaints & Suggestions
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-gray-400">
              <h3 className="font-bold text-lg mb-3 text-gray-900">System Management</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Content Review
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Permission Management
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  System Logs
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-400">© 2024 Basketball E-commerce Social Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
