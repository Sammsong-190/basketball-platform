import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">404</h2>
        <p className="text-gray-600 mb-6">页面未找到</p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}
