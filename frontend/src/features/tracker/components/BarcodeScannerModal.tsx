import { useState } from 'react'
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

  const handleLookup = async (codeToSearch: string) => {
    const cleanCode = codeToSearch.trim()
    if (!cleanCode) return

    setIsSearching(true)
    setErrorMessage(null)
    setStatusMessage('Searching Open Food Facts API...')

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
          onFound(foodItem)
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
      onFound(foodItem)
    } else {
      setErrorMessage('Product not found in database. Please enter details manually as a custom food.')
      setStatusMessage(null)
      setIsSearching(false)
    }
  }

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
        @keyframes scanline {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.8; }
        }
        .scanner-glowing-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background-color: #ff3b30;
          box-shadow: 0 0 10px #ff3b30, 0 0 20px #ff3b30;
          animation: scanline 2.5s infinite linear;
          pointer-events: none;
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
            padding: '4px'
          }}
          aria-label="Close scanner modal"
        >
          ✕
        </button>

        <div>
          <h3 style={{ margin: '0 0 4px 0', color: 'var(--heading-color)', fontSize: '1.1rem' }}>Barcode Scanner Lookup</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Type a code or use test barcodes to fetch nutrition metrics</span>
        </div>

        {/* Mock Camera Viewfinder View */}
        <div style={{
          height: '180px',
          border: '1.5px dashed var(--border-color)',
          borderRadius: '12px',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'rgba(255, 255, 255, 0.01)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Glowing Animated Red Line */}
          <div className="scanner-glowing-line" />

          {/* Barcode Vector Graphic */}
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
            <path d="M3 5v14M21 5v14M7 5v14M17 5v14M11 5v14M14 5v14" />
          </svg>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
            Scanning viewport active
          </span>
        </div>

        {/* Input lookup form */}
        <form onSubmit={(e) => { e.preventDefault(); handleLookup(barcode); }} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="workout-text-input"
            style={{ flex: 1, margin: 0 }}
            placeholder="Enter numeric barcode..."
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
