'use client'

import { useState, useRef } from 'react'
import { FiUpload, FiCamera, FiCheck, FiVolume2 } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { useReceipt } from '@/contexts/ReceiptContext'
import { uploadReceipt } from '@/lib/api'

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receiptType, setReceiptType] = useState<'grocery' | 'restaurant'>('grocery')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { setCurrentReceipt, setReceiptImage } = useReceipt()

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Announce to screen readers
      announceToScreenReader(`Image selected: ${file.name}`)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError(null)
    announceToScreenReader('Uploading and processing receipt with Gemini Vision AI...')

    try {
      // Upload to backend with Gemini Vision processing
      const response = await uploadReceipt(selectedFile, receiptType)
      
      if (response.status === 'success' && response.data) {
        // Store receipt data in context
        setCurrentReceipt(response.data)
        setReceiptImage(preview)
        
        announceToScreenReader(`Receipt processed successfully. Merchant: ${response.data.merchant}, Total: $${response.data.total}`)
        
        // Navigate to review page with real data
        router.push('/review')
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      const errorMessage = error.message || 'Error uploading receipt. Please try again.'
      setError(errorMessage)
      announceToScreenReader(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const speakInstructions = () => {
    const text = "Upload receipt page. You can drag and drop a receipt image or use the file picker button. After uploading, click Generate Health Insights to analyze the receipt."
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  const announceToScreenReader = (message: string) => {
    const announcer = document.getElementById('a11y-announcer')
    if (announcer) {
      announcer.textContent = message
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Upload Receipt</h1>
          <button
            onClick={speakInstructions}
            className="btn-secondary flex items-center gap-2"
            aria-label="Read page instructions"
          >
            <FiVolume2 size={20} />
            <span>Instructions</span>
          </button>
        </div>

        {/* Receipt type selector */}
        <div className="card mb-8">
          <label className="block text-lg text-black font-semibold mb-4">
            Receipt Type
          </label>
          <div className="flex gap-4" role="radiogroup" aria-label="Receipt type">
            <button
              onClick={() => setReceiptType('grocery')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                receiptType === 'grocery'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              role="radio"
              aria-checked={receiptType === 'grocery'}
            >
              <div className="text-3xl">🛒</div>
              <div className="font-semibold">Grocery</div>
              <div className="text-m text-gray-600">Supermarket, food store</div>
            </button>

            <button
              onClick={() => setReceiptType('restaurant')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                receiptType === 'restaurant'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              role="radio"
              aria-checked={receiptType === 'restaurant'}
            >
              <div className="text-3xl">🍽️</div>
              <div className="font-semibold">Restaurant</div>
              <div className="text-m text-gray-600">Dining, takeout, delivery</div>
            </button>
          </div>
        </div>

        {/* Upload area */}
        <div className="card mb-8">
          <h2 className="text-2xl font-semibold mb-6">Upload Image</h2>

          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-4 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors"
              role="button"
              tabIndex={0}
              aria-label="Drop receipt image here or click to browse"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click()
                }
              }}
            >
              <FiUpload className="mx-auto text-6xl text-gray-400 mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Drop receipt image here
              </p>
              <p className="text-gray-600 mb-4">or</p>
              <button
                className="btn-primary btn-large"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                <FiCamera className="inline mr-2" size={24} />
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
                className="hidden"
                aria-label="Choose receipt image file"
              />
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="max-w-full h-auto rounded-lg border-2 border-gray-300 mx-auto"
                  style={{ maxHeight: '500px' }}
                />
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setSelectedFile(null)
                    setPreview(null)
                    announceToScreenReader('Image removed')
                  }}
                  className="btn-secondary"
                >
                  Remove Image
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                >
                  <FiCamera className="inline mr-2" />
                  Choose Different Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Process button */}
        {selectedFile && (
          <div className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="card bg-red-50 border-red-200">
                <p className="text-red-800 font-semibold">❌ {error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Make sure the backend is running and GEMINI_API_KEY is set.
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn-primary btn-large inline-flex items-center gap-3"
                aria-busy={uploading}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    <span>Processing with Gemini Vision...</span>
                  </>
                ) : (
                  <>
                    <FiCheck size={24} />
                    <span>Generate Health Insights</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Accessibility notes */}
        <div className="mt-8 p-4 rounded-lg border-2 transition-all
            bg-blue-50 border-blue-200
            hover:bg-blue-100 hover:border-blue-300
            dark:bg-blue-900 dark:border-blue-700
            dark:hover:bg-blue-800 dark:hover:border-blue-600">
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <span>♿</span> Accessibility Tips
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Drag & drop or click the upload area to select a file</li>
            <li>• Screen readers will announce processing status</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
