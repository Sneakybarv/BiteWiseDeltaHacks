'use client'

import { useState, useEffect } from 'react'
import { FiHeart, FiAlertTriangle, FiSettings, FiEdit3, FiTrendingUp } from 'react-icons/fi'

const mockProfile = {
  name: 'John Doe',
  email: 'johndoe@example.com',
  allergens: ['Peanuts', 'Dairy'],
  dietaryPrefs: ['Low Sugar', 'High Protein'],
  totalSpent: 412.34,
  totalReceipts: 34,
  healthScoreAvg: 70,
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(mockProfile)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Profile</h1>
          <button className="btn-primary flex items-center gap-2">
            <FiEdit3 size={20} />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Basic Info */}
        <div className="card mb-6 p-6 bg-white rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold text-black mb-4">Account Info</h2>
          <div className="text-gray-700 mb-1"><strong>Name:</strong> {profile.name}</div>
          <div className="text-gray-700"><strong>Email:</strong> {profile.email}</div>
        </div>

        {/* Allergens & Dietary Preferences */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card p-6 bg-red-50 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <FiAlertTriangle className="text-red-600 text-2xl" />
              <h3 className="text-xl font-semibold text-red-700">Allergens</h3>
            </div>
            <ul className="text-gray-700 space-y-1">
              {profile.allergens.map((a, i) => (
                <li key={i}>• {a}</li>
              ))}
            </ul>
          </div>

          <div className="card p-6 bg-green-50 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <FiHeart className="text-green-600 text-2xl" />
              <h3 className="text-xl font-semibold text-green-700">Dietary Preferences</h3>
            </div>
            <ul className="text-gray-700 space-y-1">
              {profile.dietaryPrefs.map((p, i) => (
                <li key={i}>• {p}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Spending & Health Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 bg-blue-50 rounded-lg shadow-sm text-center">
            <div className="text-3xl font-bold text-blue-700">${profile.totalSpent.toFixed(2)}</div>
            <div className="text-sm text-blue-600 font-semibold mt-1">Total Spent</div>
          </div>

          <div className="card p-6 bg-yellow-50 rounded-lg shadow-sm text-center">
            <div className="text-3xl font-bold text-yellow-700">{profile.totalReceipts}</div>
            <div className="text-sm text-yellow-600 font-semibold mt-1">Receipts Logged</div>
          </div>

          <div className="card p-6 bg-purple-50 rounded-lg shadow-sm text-center">
            <div className="text-3xl font-bold text-purple-700">{profile.healthScoreAvg}</div>
            <div className="text-sm text-purple-600 font-semibold mt-1">Avg Health Score</div>
          </div>
        </div>
      </div>
    </div>
  )
}
