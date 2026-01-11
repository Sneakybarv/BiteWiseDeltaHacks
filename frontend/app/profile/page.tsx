'use client'

import { useState, useEffect } from 'react'
import { FiHeart, FiAlertTriangle, FiEdit3, FiPlus, FiX, FiSave } from 'react-icons/fi'
import { updateUserProfile, getDashboardStats, getReceipts, getUserProfile } from '@/lib/api'

export default function ProfilePage() {
  const [editing, setEditing] = useState(false)
  const [allergies, setAllergies] = useState<string[]>(['Peanuts', 'Dairy'])
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>(['Low Sugar', 'High Protein'])
  const [healthGoals, setHealthGoals] = useState<string[]>(['Eat more vegetables', 'Reduce sugar'])
  const [newAllergy, setNewAllergy] = useState('')
  const [newPref, setNewPref] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [totalSpent, setTotalSpent] = useState(0)
  const [totalReceipts, setTotalReceipts] = useState(0)
  const [healthScoreAvg, setHealthScoreAvg] = useState(0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, receiptsData, profileData] = await Promise.all([
          getDashboardStats(),
          getReceipts(100, 0),
          // load saved profile (if any)
          (async () => {
            try { return await getUserProfile() } catch { return null }
          })()
        ])

        setTotalReceipts(statsData.total_receipts)
        setHealthScoreAvg(statsData.health_score_avg)

        const total = receiptsData.receipts.reduce((sum, r: any) => sum + (r.total || 0), 0)
        setTotalSpent(total)

        // If profile exists on backend, populate fields
        if (profileData) {
          setAllergies(profileData.allergies || [])
          setDietaryPrefs(profileData.dietary_preferences || [])
          setHealthGoals(profileData.health_goals || [])
        }
      } catch (error) {
        console.error('Error fetching profile data:', error)
      }
    }
    fetchData()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await updateUserProfile({
        allergies,
        dietary_preferences: dietaryPrefs,
        health_goals: healthGoals
      })
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setEditing(false)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()])
      setNewAllergy('')
    }
  }

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index))
  }

  const addPref = () => {
    if (newPref.trim() && !dietaryPrefs.includes(newPref.trim())) {
      setDietaryPrefs([...dietaryPrefs, newPref.trim()])
      setNewPref('')
    }
  }

  const removePref = (index: number) => {
    setDietaryPrefs(dietaryPrefs.filter((_, i) => i !== index))
  }

  const addGoal = () => {
    if (newGoal.trim() && !healthGoals.includes(newGoal.trim())) {
      setHealthGoals([...healthGoals, newGoal.trim()])
      setNewGoal('')
    }
  }

  const removeGoal = (index: number) => {
    setHealthGoals(healthGoals.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Profile & Preferences</h1>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FiEdit3 size={20} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="btn-secondary flex items-center gap-2"
              >
                <FiX size={20} />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <FiSave size={20} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`card mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        )}

        {/* Allergens & Dietary Preferences */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Allergens */}
          <div className="card p-6 bg-red-50 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <FiAlertTriangle className="text-red-600 text-2xl" />
              <h3 className="text-xl font-semibold text-red-700">Allergens</h3>
            </div>
            <ul className="text-gray-700 space-y-2 mb-3">
              {allergies.map((a, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>• {a}</span>
                  {editing && (
                    <button
                      onClick={() => removeAllergy(i)}
                      className="text-red-600 hover:text-red-800"
                      aria-label={`Remove ${a}`}
                    >
                      <FiX size={18} />
                    </button>
                  )}
                </li>
              ))}
              {allergies.length === 0 && (
                <li className="text-gray-500 italic">No allergens listed</li>
              )}
            </ul>
            {editing && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                  placeholder="Add allergen..."
                  className="input flex-1 bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
                />
                <button onClick={addAllergy} className="btn-secondary">
                  <FiPlus size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Dietary Preferences */}
          <div className="card p-6 bg-green-50 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <FiHeart className="text-green-600 text-2xl" />
              <h3 className="text-xl font-semibold text-green-700">Dietary Preferences</h3>
            </div>
            <ul className="text-gray-700 space-y-2 mb-3">
              {dietaryPrefs.map((p, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>• {p}</span>
                  {editing && (
                    <button
                      onClick={() => removePref(i)}
                      className="text-red-600 hover:text-red-800"
                      aria-label={`Remove ${p}`}
                    >
                      <FiX size={18} />
                    </button>
                  )}
                </li>
              ))}
              {dietaryPrefs.length === 0 && (
                <li className="text-gray-500 italic">No preferences listed</li>
              )}
            </ul>
            {editing && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPref}
                  onChange={(e) => setNewPref(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPref()}
                  placeholder="Add preference..."
                  className="input flex-1 bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
                />
                <button onClick={addPref} className="btn-secondary">
                  <FiPlus size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Health Goals */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎯</span>
            <h3 className="text-xl font-semibold text-gray-900">Health Goals</h3>
          </div>
          <ul className="text-gray-700 space-y-2 mb-3">
            {healthGoals.map((g, i) => (
              <li key={i} className="flex items-center justify-between">
                <span>• {g}</span>
                {editing && (
                  <button
                    onClick={() => removeGoal(i)}
                    className="text-red-600 hover:text-red-800"
                    aria-label={`Remove ${g}`}
                  >
                    <FiX size={18} />
                  </button>
                )}
              </li>
            ))}
            {healthGoals.length === 0 && (
              <li className="text-gray-500 italic">No health goals set</li>
            )}
          </ul>
          {editing && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                placeholder="Add health goal..."
                className="input flex-1 bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
              />
              <button onClick={addGoal} className="btn-secondary">
                <FiPlus size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Spending & Health Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 bg-blue-50 rounded-lg shadow-sm text-center">
            <div className="text-3xl font-bold text-blue-700">${totalSpent.toFixed(2)}</div>
            <div className="text-sm text-blue-600 font-semibold mt-1">Total Spent</div>
          </div>

          <div className="card p-6 bg-yellow-50 rounded-lg shadow-sm text-center">
            <div className="text-3xl font-bold text-yellow-700">{totalReceipts}</div>
            <div className="text-sm text-yellow-600 font-semibold mt-1">Receipts Logged</div>
          </div>

          <div className="card p-6 bg-purple-50 rounded-lg shadow-sm text-center">
            <div className="text-3xl font-bold text-purple-700">{healthScoreAvg}</div>
            <div className="text-sm text-purple-600 font-semibold mt-1">Avg Health Score</div>
          </div>
        </div>
      </div>
    </div>
  )
}
