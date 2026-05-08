'use client'

import Link from 'next/link'
import { Cormorant_Garamond } from 'next/font/google'
import Header from '@/components/Header'
import NewsCarousel from '@/components/NewsCarousel'

const airySubtitleFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['italic', 'normal'],
})

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <section className="relative overflow-hidden bg-white text-gray-900 py-20">
          <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 basketball-smooth-wave"></div>
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
                <span className="inline-block text-gray-900 drop-shadow-sm">篮球电商与社交社区平台</span>
              </h1>
              <p
                className={`${airySubtitleFont.className} italic text-lg md:text-2xl mb-8 text-gray-600 leading-relaxed tracking-wider font-medium`}
              >
                融合购物、社群互动与内容分享，为篮球爱好者打造的一站式平台
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/products"
                  className="px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-50 border border-gray-300 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  浏览商品
                </Link>
                <Link
                  href="/posts"
                  className="px-8 py-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  加入社区
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="mb-6">
            <Link href="/events" className="inline-block">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center hover:text-gray-600 transition-all duration-200 cursor-pointer transform hover:scale-105">
                <span className="mr-3">🏀</span>
                <span>NBA 赛事资讯</span>
              </h2>
            </Link>
            <p className="text-gray-600">篮球赛事速递，抢先了解 NBA 动态</p>
          </div>
          <NewsCarousel />
        </section>

        <section className="container mx-auto px-4 py-12">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">核心亮点</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="text-5xl mb-4">🏀</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">装备购物</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                精选球鞋、球衣与配件等篮球好物，品类丰富，品质放心
              </p>
              <Link
                href="/products"
                className="inline-flex items-center text-gray-900 font-semibold hover:text-gray-700 transition-colors group-hover:translate-x-2 duration-200"
              >
                浏览商品
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">社区互动</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">与球友讨论战术与心得，分享观点，结识同好</p>
              <Link
                href="/posts"
                className="inline-flex items-center text-gray-900 font-semibold hover:text-gray-700 transition-colors group-hover:translate-x-2 duration-200"
              >
                进入社区
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="text-5xl mb-4">📰</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">赛事资讯</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                赛程与赛果、数据解读，第一时间掌握篮球场内外动态
              </p>
              <Link
                href="/events"
                className="inline-flex items-center text-gray-900 font-semibold hover:text-gray-700 transition-colors group-hover:translate-x-2 duration-200"
              >
                查看资讯
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">1000+</div>
                <div className="text-gray-600">优质商品</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">5000+</div>
                <div className="text-gray-600">活跃用户</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">10000+</div>
                <div className="text-gray-600">社区帖子</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">24/7</div>
                <div className="text-gray-600">在线服务</div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">平台功能一览</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-gray-400">
              <h3 className="font-bold text-lg mb-3 text-gray-900">用户管理</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  个人资料维护
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  帖子与评论收藏
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  评论管理
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-gray-500">
              <h3 className="font-bold text-lg mb-3 text-gray-900">社区互动</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  发帖与分享
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  评论与点赞
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  话题分类
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-gray-400">
              <h3 className="font-bold text-lg mb-3 text-gray-900">商品交易</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  商品浏览
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  购物车
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  订单管理
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-gray-500">
              <h3 className="font-bold text-lg mb-3 text-gray-900">售后服务</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  退换货
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  投诉与建议
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-gray-400">
              <h3 className="font-bold text-lg mb-3 text-gray-900">系统管理</h3>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  内容审核
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  权限管理
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  系统日志
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-400">© 2024 篮球电商与社区平台。保留所有权利。</p>
          </div>
        </div>
      </footer>
    </>
  )
}
