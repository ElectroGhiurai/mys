import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { FoodItem } from '../tracker.api'

interface BarcodeScannerModalProps {
  onClose: () => void;
  onFound: (food: FoodItem) => void;
}

const LOCAL_BARCODE_MOCKS: Record<string, Omit<FoodItem, 'id' | 'isCustom'>> = {
  '5449000000096': { name: 'Coca Cola Classic', calories: 37, protein: 0, carbs: 9, fat: 0 },
  '3017620422003': { name: 'Nutella', calories: 539, protein: 6.3, carbs: 57.5, fat: 30.9 },
  '7622300482813': { name: 'Oreo Cookies', calories: 489, protein: 5.2, carbs: 67, fat: 21 },
  '4008400401829': { name: 'Kinder Bueno', calories: 572, protein: 8.6, carbs: 52.6, fat: 37.3 }
}

export function BarcodeScannerModal({ onClose, onFound }: BarcodeScannerModalProps) {
  const [barcode, setBarcode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Use refs to avoid re-triggering scanner setup on state changes
  const onFoundRef = useRef(onFound)
  onFoundRef.current = onFound

  const handleLookup = async (codeToSearch: string) => {
    const cleanCode = codeToSearch.trim()
    if (!cleanCode) return

    setIsSearching(true)
    setErrorMessage(null)
    setStatusMessage(`Searching database for barcode: ${cleanCode}...`)

    try {
      // 1. Fetch from public token-free Open Food Facts API
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${cleanCode}.json`, {
        headers: {
          'User-Agent': 'ElectroGhiuraiMysApp - Web - Version 1.0 - https://github.com/ElectroGhiurai/mys'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === 1 && data.product) {
          const prod = data.product
          const foodItem: FoodItem = {
            id: `barcode-${cleanCode}-${Date.now()}`,
            name: prod.product_name || prod.generic_name || 'Scanned Food Item',
            calories: Number(prod.nutriments?.['energy-kcal_100g']) || 0,
            protein: Number(prod.nutriments?.proteins_100g) || 0,
            carbs: Number(prod.nutriments?.carbohydrates_100g) || 0,
            fat: Number(prod.nutriments?.fat_100g) || 0,
            isCustom: false
          }
          setStatusMessage('Product found!')
          onFoundRef.current(foodItem)
          return
        }
      }
    } catch (err) {
      console.warn('API lookup failed, falling back to local database mock...', err)
    }

    // 2. Fallback to high-fidelity mock database for robust tests
    const mock = LOCAL_BARCODE_MOCKS[cleanCode]
    if (mock) {
      const foodItem: FoodItem = {
        id: `barcode-${cleanCode}-${Date.now()}`,
        ...mock,
        isCustom: false
      }
      setStatusMessage('Product found in local database!')
      onFoundRef.current(foodItem)
    } else {
      setErrorMessage('Product not found in database. Please enter details manually as a custom food.')
      setStatusMessage(null)
      setIsSearching(false)
    }
  }

  // Set up camera-based html5-qrcode scanner
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 220, height: 130 },
        rememberLastUsedCamera: true
      },
      /* verbose= */ false
    )

    scanner.render(
      (decodedText) => {
        // On success: trigger lookup and clear scanner
        handleLookup(decodedText)
        scanner.clear().catch((err) => console.warn('Failed to clear scanner:', err))
      },
      () => {
        // Ignore error logs on each frame search to keep console clean
      }
    )

    return () => {
      scanner.clear().catch((err) => console.warn('Failed to clear scanner on unmount:', err))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleQuickTest = (code: string) => {
    setBarcode(code)
    handleLookup(code)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <style>{`
        #reader {
          border: none !important;
          background: rgba(255, 255, 255, 0.01) !important;
          border-radius: 12px;
          overflow: hidden;
          width: 100% !important;
          box-sizing: border-box;
        }
        #reader video {
          border-radius: 12px;
          object-fit: cover;
          width: 100% !important;
        }
        #reader__camera_permission_button,
        #reader__dashboard_section_csr button,
        .html5-qrcode-element {
          background-color: var(--accent-color) !important;
          border: none !important;
          color: #ffffff !important;
          padding: 8px 16px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          font-size: 0.8rem !important;
          transition: opacity 0.2s !important;
          margin: 6px 0 !important;
        }
        #reader__camera_permission_button:hover,
        #reader__dashboard_section_csr button:hover,
        .html5-qrcode-element:hover {
          opacity: 0.9 !important;
        }
        #reader__status_span {
          color: var(--text-color) !important;
          font-size: 0.85rem !important;
        }
        #reader a {
          color: var(--accent-color) !important;
          font-size: 0.8rem !important;
          text-decoration: none !important;
        }
        #reader img {
          display: none !important;
        }
      `}</style>

      <div style={{
        backgroundColor: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '4px',
            zIndex: 10
          }}
          aria-label="Close scanner modal"
        >
          ✕
        </button>

        <div>
          <h3 style={{ margin: '0 0 4px 0', color: 'var(--heading-color)', fontSize: '1.1rem' }}>Camera Barcode Scanner</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scan via live camera, take a photo, or enter the code manually</span>
        </div>

        {/* Live Camera Scanner Viewport */}
        <div style={{
          minHeight: '200px',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'rgba(255, 255, 255, 0.01)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div id="reader" style={{ width: '100%' }} />
        </div>

        {/* Manual lookup input */}
        <form onSubmit={(e) => { e.preventDefault(); handleLookup(barcode); }} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="workout-text-input"
            style={{ flex: 1, margin: 0 }}
            placeholder="Or type barcode manually..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            disabled={isSearching}
          />
          <button
            type="submit"
            className="bulk-log-btn"
            style={{ whiteSpace: 'nowrap', minWidth: '80px', margin: 0 }}
            disabled={isSearching}
          >
            {isSearching ? 'Fetching...' : 'Lookup'}
          </button>
        </form>

        {/* Status Indicators */}
        {statusMessage && (
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-color)' }} />
            {statusMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{ fontSize: '0.8rem', color: '#ff3b30' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Quick Test Section */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
            Quick-Test Sandbox Barcodes
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(LOCAL_BARCODE_MOCKS).map(([code, item]) => (
              <button
                key={code}
                type="button"
                onClick={() => handleQuickTest(code)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-color)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s'
                }}
              >
                <span>{item.name}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{code}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
