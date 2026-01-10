'use client'

import { useState, useEffect } from 'react'
import { FiSun, FiMoon, FiType, FiEye } from 'react-icons/fi'
import Link from 'next/link'

export default function AccessibilityToolbar() {
  const [highContrast, setHighContrast] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Load saved preferences
    const savedContrast = localStorage.getItem('highContrast') === 'true'
    const savedLargeText = localStorage.getItem('largeText') === 'true'
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'

    setHighContrast(savedContrast)
    setLargeText(savedLargeText)
    setDarkMode(savedDarkMode)

    // Apply saved preferences
    applyPreferences(savedContrast, savedLargeText, savedDarkMode)
  }, [])

  const applyPreferences = (contrast: boolean, large: boolean, dark: boolean) => {
    if (contrast) {
      document.body.classList.add('high-contrast')
    } else {
      document.body.classList.remove('high-contrast')
    }

    if (large) {
      document.body.classList.add('large-text')
    } else {
      document.body.classList.remove('large-text')
    }

    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleHighContrast = () => {
    const newValue = !highContrast
    setHighContrast(newValue)
    localStorage.setItem('highContrast', String(newValue))
    applyPreferences(newValue, largeText, darkMode)
    announceToScreenReader(`High contrast mode ${newValue ? 'enabled' : 'disabled'}`)
  }

  const toggleLargeText = () => {
    const newValue = !largeText
    setLargeText(newValue)
    localStorage.setItem('largeText', String(newValue))
    applyPreferences(highContrast, newValue, darkMode)
    announceToScreenReader(`Large text mode ${newValue ? 'enabled' : 'disabled'}`)
  }

  const toggleDarkMode = () => {
    const newValue = !darkMode
    setDarkMode(newValue)
    localStorage.setItem('darkMode', String(newValue))
    applyPreferences(highContrast, largeText, newValue)
    announceToScreenReader(`Dark mode ${newValue ? 'enabled' : 'disabled'}`)
  }

  const announceToScreenReader = (message: string) => {
    const announcer = document.getElementById('a11y-announcer')
    if (announcer) {
      announcer.textContent = message
      setTimeout(() => {
        announcer.textContent = ''
      }, 1000)
    }
  }

  return (
    <div
      className="bg-gray-800 text-white py-2 px-4 sticky top-0 z-50 shadow-md"
      role="toolbar"
      aria-label="Accessibility options"
    >
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="font-bold text-lg md:text-2xl no-underline">
          BiteWise
        </Link>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleHighContrast}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
              highContrast
                ? 'bg-white text-gray-800'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            aria-pressed={highContrast}
            aria-label="Toggle high contrast mode"
          >
            <FiEye size={18} />
            <span className="text-sm">High Contrast</span>
          </button>

          <button
            onClick={toggleLargeText}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
              largeText
                ? 'bg-white text-gray-800'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            aria-pressed={largeText}
            aria-label="Toggle large text"
          >
            <FiType size={18} />
            <span className="text-sm">Large Text</span>
          </button>

          <button
            onClick={toggleDarkMode}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
              darkMode
                ? 'bg-white text-gray-800'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            aria-pressed={darkMode}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            <span className="text-sm">{darkMode ? 'Light' : 'Dark'} Mode</span>
          </button>
        </div>
      </div>
    </div>
  )
}
