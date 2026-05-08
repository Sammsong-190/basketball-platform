'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import AdminNav from '@/components/AdminNav'

interface Log {
  id: string
  action: string
  module: string
  description?: string
  level: string
  createdAt: string
  user?: { username: string }
  isLegacy?: boolean
}

export default function AdminLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userData)
    if (user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    fetchLogs()
  }, [router, page, levelFilter, moduleFilter])

  const fetchLogs = async () => {
    const token = localStorage.getItem('token')
    setLoading(true)
    try {
      setLoadError(null)
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (levelFilter) params.set('level', levelFilter)
      if (moduleFilter) params.set('module', moduleFilter)
      const res = await fetch(`/api/admin/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setTotal(data.total || 0)
      } else {
        const body = await res.json().catch(() => ({}))
        setLogs([])
        setTotal(0)
        setLoadError((body as { error?: string }).error || `加载失败（HTTP ${res.status}）`)
      }
    } catch (e) {
      console.error(e)
      setLogs([])
      setTotal(0)
      setLoadError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

  const moduleLabel: Record<string, string> = {
    AUTH: '认证',
    ADMIN_POST: '帖子审核',
    ADMIN_USER: '用户管理',
    ADMIN_COMMENT: '评论审核',
    ADMIN_PRODUCT: '商品审核',
    USER_HISTORY: '用户（历史）',
    POST_HISTORY: '帖子（历史）',
    ORDER_HISTORY: '订单（历史）',
    PRODUCT_HISTORY: '商品（历史）',
    COMMENT_HISTORY: '评论（历史）',
    REFUND_HISTORY: '退款（历史）',
    PAYMENT_HISTORY: '支付（历史）',
    COMPLAINT_HISTORY: '投诉（历史）',
  }

  const levelLabel: Record<string, string> = {
    INFO: '信息',
    WARN: '警告',
    ERROR: '错误',
  }

  const getLevelBadge = (level: string) => {
    const map: Record<string, string> = {
      INFO: 'bg-blue-100 text-blue-800',
      WARN: 'bg-yellow-100 text-yellow-800',
      ERROR: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[level] || 'bg-gray-100'}`}>
        {levelLabel[level] || level}
      </span>
    )
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <>
      <Header />
      <AdminNav />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">系统日志</h1>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              返回管理后台
            </Link>
          </div>

          <div className="mb-4 flex gap-2 flex-wrap">
            <button
              onClick={() => setLevelFilter('')}
              className={`px-4 py-2 rounded-lg font-medium ${!levelFilter ? 'bg-gray-900 text-white' : 'bg-white border'}`}
            >
              全部级别
            </button>
            <button
              onClick={() => setLevelFilter('INFO')}
              className={`px-4 py-2 rounded-lg font-medium ${levelFilter === 'INFO' ? 'bg-gray-900 text-white' : 'bg-white border'}`}
            >
              信息
            </button>
            <button
              onClick={() => setLevelFilter('WARN')}
              className={`px-4 py-2 rounded-lg font-medium ${levelFilter === 'WARN' ? 'bg-gray-900 text-white' : 'bg-white border'}`}
            >
              警告
            </button>
            <button
              onClick={() => setLevelFilter('ERROR')}
              className={`px-4 py-2 rounded-lg font-medium ${levelFilter === 'ERROR' ? 'bg-gray-900 text-white' : 'bg-white border'}`}
            >
              错误
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600"></div>
            </div>
          ) : loadError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center text-red-800">
              <p className="font-medium">{loadError}</p>
              <p className="text-sm mt-2 text-red-600">若刚部署，请确认已执行 Prisma 迁移且数据库中存在 SystemLog 表。</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-500">
              <p>暂无日志记录</p>
              <p className="text-sm mt-3 text-gray-400">
                包含两类记录：① 实时写入的系统日志；② 根据用户 / 帖子 / 订单 / 商品 / 评论 / 支付 / 退款 / 投诉等业务数据<strong>按创建时间推断</strong>的历史条目（每种最多约 280 条最近记录）。筛选「警告 / 错误」时仅显示系统日志。URL 加参数 <code className="text-xs bg-gray-100 px-1 rounded">legacy=0</code> 可只查系统日志表。
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">时间</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">级别</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">模块</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">操作</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">用户</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">{getLevelBadge(log.level)}</td>
                        <td className="px-4 py-3 text-sm font-medium">
                          <span>{moduleLabel[log.module] || log.module}</span>
                          {log.isLegacy && (
                            <span className="ml-2 text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              数据推断
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">{log.action}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{log.user?.username || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{log.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 p-4 border-t">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <span className="px-4 py-2">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
