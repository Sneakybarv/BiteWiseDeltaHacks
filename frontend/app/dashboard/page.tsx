'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiTrendingUp, FiAlertTriangle, FiShoppingBag, FiShoppingCart } from 'react-icons/fi'
import { getDashboardStats, getReceipts } from '@/lib/api'

// Mock dashboard data
const mockStats = {
  money_at_risk: 127.50,
  receipts_expiring_soon: 3,
  total_receipts: 12,
  allergen_alerts_this_week: 5,
  health_score_avg: 68,
  paper_saved_count: 12,
  health_score_trend: [62, 65, 68, 72, 70, 68, 71],
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [receipts, setReceipts] = useState<any[]>([])
  const [spendingByCategory, setSpendingByCategory] = useState<Record<string, number>>({})

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch dashboard stats
        const statsData = await getDashboardStats()
        setStats(statsData)

        // Fetch receipts for spending analysis
        const receiptsData = await getReceipts(100, 0)
        setReceipts(receiptsData.receipts || [])

        // Calculate spending by category
        const categoryTotals: Record<string, number> = {}
        receiptsData.receipts?.forEach((receipt: any) => {
          receipt.items?.forEach((item: any) => {
            const category = item.category || 'other'
            categoryTotals[category] = (categoryTotals[category] || 0) + (item.price || 0)
          })
        })
        setSpendingByCategory(categoryTotals)
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message)
        // Use mock data as fallback
        setStats(mockStats)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  const currentStats = stats || mockStats

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <Link href="/upload" className="btn-primary flex items-center gap-2">
            <FiShoppingBag size={20} />
            <span>Scan Receipt</span>
          </Link>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Money at Risk */}
          <div className="card bg-gradient-to-br !from-red-50 to-red-100 !border-red-200">
            <div className="flex items-center gap-4">
              <div className="p-3 !bg-red-200 rounded-lg">
                <FiAlertTriangle className="text-3xl !text-red-600" />
              </div>
              <div>
                <div className="text-3xl font-bold !text-red-700">
                  ${currentStats.money_at_risk.toFixed(2)}
                </div>
                <div className="text-sm !text-red-600 font-semibold">Money at Risk</div>
                <div className="text-xs !text-red-600">{currentStats.receipts_expiring_soon} receipts expiring soon</div>
              </div>
            </div>
          </div>

          {/* Health Score */}
          <div className="card bg-gradient-to-br !from-blue-50 to-blue-100 !border-blue-200">
            <div className="flex items-center gap-4">
              <div className="p-3 !bg-blue-200 rounded-lg">
                <FiTrendingUp className="text-3xl !text-blue-600" />
              </div>
              <div>
                <div className={`text-3xl font-bold ${getHealthScoreColor(currentStats.health_score_avg)}`}>
                  {currentStats.health_score_avg}
                </div>
                <div className="text-sm !text-blue-600 font-semibold">Avg Health Score</div>
                <div className="text-xs !text-blue-600">This week</div>
              </div>
            </div>
          </div>

          {/* Allergen Alerts */}
          <div className="card bg-gradient-to-br !from-yellow-50 to-yellow-100 !border-yellow-200">
            <div className="flex items-center gap-4">
              <div className="p-3 !bg-yellow-200 rounded-lg">
                <span className="text-3xl">⚠️</span>
              </div>
              <div>
                <div className="text-3xl font-bold !text-yellow-700">
                  {currentStats.allergen_alerts_this_week}
                </div>
                <div className="text-sm !text-yellow-600 font-semibold">Allergen Alerts</div>
                <div className="text-xs !text-yellow-600">This week</div>
              </div>
            </div>
          </div>

          {/* Sustainability */}
          <div className="card bg-gradient-to-br !from-green-50 to-green-100 !border-green-200">
            <div className="flex items-center gap-4">
              <div className="p-3 !bg-green-200 rounded-lg">
                <span className="text-3xl">🌿</span>
              </div>
              <div>
                <div className="text-3xl font-bold !text-green-700">
                  {currentStats.paper_saved_count}
                </div>
                <div className="text-sm !text-green-600 font-semibold">Receipts Digitized</div>
                <div className="text-xs !text-green-600">Paper saved!</div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Health Score Trend */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Health Score Trend</h2>
            <div className="flex items-end justify-between gap-2 h-48">
              {currentStats.health_score_trend.map((score: number, index: number) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${(score / 100) * 100}%` }}
                  role="img"
                  aria-label={`Day ${index + 1}: Score ${score}`}
                />
                <div className="text-xs text-gray-600">Day {index + 1}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center text-sm text-gray-600">
              <span className={`font-semibold ${getHealthScoreColor(currentStats.health_score_avg)}`}>
                Average: {currentStats.health_score_avg}
              </span>
              {' • '}
              <span className="text-green-600">
                Trend: {currentStats.health_score_trend[currentStats.health_score_trend.length - 1] > currentStats.health_score_trend[0] ? '↑ Improving' : '→ Stable'}
              </span>
            </div>
          </div>

          {/* Spending by Category */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Spending by Category</h2>
            {Object.keys(spendingByCategory).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(spendingByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([category, amount]) => {
                    const maxAmount = Math.max(...Object.values(spendingByCategory))
                    const percentage = (amount / maxAmount) * 100
                    const categoryIcons: Record<string, string> = {
                      'produce': '🥬',
                      'dairy': '🥛',
                      'meat': '🥩',
                      'bakery': '🍞',
                      'snacks': '🍿',
                      'beverages': '🥤',
                      'other': '🛒'
                    }
                    return (
                      <div key={category}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{categoryIcons[category] || '🛒'}</span>
                            <span className="font-semibold capitalize">{category}</span>
                          </div>
                          <span className="font-bold text-gray-900">${amount.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                            role="progressbar"
                            aria-valuenow={amount}
                            aria-valuemin={0}
                            aria-valuemax={maxAmount}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <FiShoppingCart className="mx-auto text-4xl mb-2 text-gray-400" />
                <p>No spending data yet</p>
                <p className="text-sm">Upload receipts to see your spending breakdown</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Receipts */}
        <div className="card">
          <div className="flex justify-between text-black items-center mb-6">
            <h2 className="text-2xl font-semibold">Recent Receipts</h2>
            <Link href="/receipts" className="btn-secondary text-sm">
              View All
            </Link>
          </div>

          <div className="space-y-4 text-black" role="list" aria-label="Recent receipts">
            {receipts.length > 0 ? (
              receipts.slice(0, 5).map((receipt: any) => (
                <div
                  key={receipt._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  role="listitem"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{receipt.merchant}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(receipt.date).toLocaleDateString()} • {receipt.items?.length || 0} items
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">${(receipt.total || 0).toFixed(2)}</div>
                      {receipt.health_score !== undefined && (
                        <div className={`text-sm font-semibold ${getHealthScoreColor(receipt.health_score)}`}>
                          Health: {receipt.health_score}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-600">
                <FiShoppingBag className="mx-auto text-4xl mb-2 text-gray-400" />
                <p>No receipts yet</p>
                <Link href="/upload" className="btn-primary mt-4 inline-flex items-center gap-2">
                  <FiShoppingBag size={20} />
                  <span>Scan Your First Receipt</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Link href="/profile" className="card hover:shadow-xl transition-shadow text-center">
            <div className="text-6xl">👤</div>
            <h3 className="font-semibold text-lg mt-5">Update Profile</h3>
            <p className="text-gray-600 text-sm">
              Set your allergen alerts and dietary preferences
            </p>
          </Link>

          <Link href="/insights" className="card hover:shadow-xl transition-shadow text-center">
            <div className="text-6xl">📊</div>
            <h3 className="font-semibold text-lg mt-5">Weekly Insights</h3>
            <p className="text-gray-600 text-sm">
              View detailed nutrition and spending analysis
            </p>
          </Link>

          <Link href="/upload" className="card hover:shadow-xl transition-shadow text-center">
            <div className="text-6xl">📸</div>
            <h3 className="font-semibold text-lg mt-5">Scan Receipt</h3>
            <p className="text-gray-600 text-sm">
              Add a new receipt to track your health
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
