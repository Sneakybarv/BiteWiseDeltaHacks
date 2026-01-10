'use client'

import { useState, useEffect } from 'react'
import { FiSun, FiMoon, FiType, FiHome, FiUpload, FiBarChart2, FiUser, FiFileText } from 'react-icons/fi'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AccessibilityToolbar() {
  const [largeText, setLargeText] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Load saved preferences
    const savedLargeText = localStorage.getItem('largeText') === 'true'
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'

    setLargeText(savedLargeText)
    setDarkMode(savedDarkMode)

    // Apply saved preferences
    applyPreferences(savedLargeText, savedDarkMode)
  }, [])

  const applyPreferences = (large: boolean, dark: boolean) => {
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

  const toggleLargeText = () => {
    const newValue = !largeText
    setLargeText(newValue)
    localStorage.setItem('largeText', String(newValue))
    applyPreferences(newValue, darkMode)
    announceToScreenReader(`Large text mode ${newValue ? 'enabled' : 'disabled'}`)
  }

  const toggleDarkMode = () => {
    const newValue = !darkMode
    setDarkMode(newValue)
    localStorage.setItem('darkMode', String(newValue))
    applyPreferences(largeText, newValue)
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

  const navLinks = [
    { href: '/', icon: FiHome, label: 'Home' },
    { href: '/upload', icon: FiUpload, label: 'Scan' },
    { href: '/receipts', icon: FiFileText, label: 'Receipts' },
    { href: '/dashboard', icon: FiBarChart2, label: 'Dashboard' },
    { href: '/profile', icon: FiUser, label: 'Profile' },
  ]

  return (
    <div
      className="bg-gray-800 text-white py-2 px-4 sticky top-0 z-50 shadow-md"
      role="toolbar"
      aria-label="Navigation and accessibility options"
    >
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="font-bold text-lg md:text-2xl no-underline hover:text-blue-300">
          BiteWise
        </Link>

        <nav className="flex flex-wrap gap-1 items-center" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                pathname === link.href
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              aria-label={link.label}
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              <link.icon size={18} />
              <span className="text-sm hidden sm:inline">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap gap-2">
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
