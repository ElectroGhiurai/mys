import { RefObject, useState } from 'react'
import { FoodItem } from '../tracker.api'

interface TrackerLogTabProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  showDropdown: boolean;
  setShowDropdown: (val: boolean) => void;
  searchResults: FoodItem[];
  dropdownRef: RefObject<HTMLDivElement | null>;
  selectedFood: FoodItem | null;
  setSelectedFood: (val: FoodItem | null) => void;
  addWeight: number;
  setAddWeight: (val: number) => void;
  handleSelectFood: (food: FoodItem) => void;
  handleAddFood: () => void;
  favourites: FoodItem[];
  frequentFoods: FoodItem[];
  handleToggleFavourite: (food: FoodItem) => void;
  setShowScannerModal: (show: boolean) => void;
}

const StarIcon = ({ filled, style }: { filled: boolean; style?: React.CSSProperties }) => (
  <svg
    className={`star-icon ${filled ? 'filled' : ''}`}
    viewBox="0 0 24 24"
    fill={filled ? '#ffb800' : 'none'}
    stroke={filled ? '#ffb800' : 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      width: '18px',
      height: '18px',
      cursor: 'pointer',
      transition: 'transform 0.2s, fill 0.2s, stroke 0.2s',
      flexShrink: 0,
      ...style
    }}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const ClockIcon = ({ style }: { style?: React.CSSProperties }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      width: '18px',
      height: '18px',
      flexShrink: 0,
      ...style
    }}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

export function TrackerLogTab({
  searchQuery,
  setSearchQuery,
  showDropdown,
  setShowDropdown,
  searchResults,
  dropdownRef,
  selectedFood,
  setSelectedFood,
  addWeight,
  setAddWeight,
  handleSelectFood,
  handleAddFood,
  favourites,
  frequentFoods,
  handleToggleFavourite,
  setShowScannerModal,
}: TrackerLogTabProps) {
  const [subTab, setSubTab] = useState<'favourites' | 'frequent'>('favourites')

  const isFavorited = (foodName: string) => {
    return favourites.some(fav => fav.name.toLowerCase() === foodName.toLowerCase())
  }

  return (
    <div className="tab-search-panel">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div className="search-autocomplete-box" ref={dropdownRef} style={{ flex: 1, marginBottom: 0 }}>
          <input
            type="text"
            className="search-input-field"
            placeholder="Search standard or custom foods..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
          />
        {showDropdown && searchResults.length > 0 && (
          <div className="autocomplete-dropdown">
            {searchResults.map(food => {
              const isFav = isFavorited(food.name)
              return (
                <div
                  key={food.id}
                  className="dropdown-food-item"
                  onClick={() => handleSelectFood(food)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <div className="food-name-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="food-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{food.name}</span>
                      {food.isCustom && <span className="custom-badge">Custom</span>}
                    </div>
                    <span className="food-macros">
                      {food.calories} kcal | P: {food.protein}g | C: {food.carbs}g | F:{' '}
                      {food.fat}g (per 100g)
                    </span>
                  </div>
                  <button
                    type="button"
                    className="fav-toggle-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavourite(food)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    aria-label={isFav ? `Remove ${food.name} from favorites` : `Add ${food.name} to favorites`}
                  >
                    <StarIcon filled={isFav} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => setShowScannerModal(true)}
        className="barcode-scan-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          backgroundColor: 'var(--surface-color-2)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-color)',
          padding: '10px 14px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.85rem',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap'
        }}
        title="Scan barcode to look up nutrition"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 5v14M21 5v14M7 5v14M17 5v14M11 5v14M14 5v14" />
        </svg>
        Scan
      </button>
    </div>

      {/* Add Form if food selected */}
      {selectedFood ? (
        <div className="selected-food-editor animate-slide-in">
          <div className="editor-header">
            <span className="editor-name">{selectedFood.name}</span>
            <button className="editor-close" onClick={() => setSelectedFood(null)}>
              ✕
            </button>
          </div>
          <div className="editor-macro-row">
            <span>{selectedFood.calories} kcal</span>
            <span>P: {selectedFood.protein}g</span>
            <span>C: {selectedFood.carbs}g</span>
            <span>F: {selectedFood.fat}g</span>
            <span className="per-label">per 100g</span>
          </div>
          <div className="editor-fields">
            <div className="input-group">
              <label htmlFor="log-weight">Weight to Add</label>
              <div className="input-with-suffix">
                <input
                  id="log-weight"
                  type="number"
                  className="field-input"
                  value={addWeight}
                  min="1"
                  onChange={e => setAddWeight(parseFloat(e.target.value) || 0)}
                />
                <span className="suffix">g</span>
              </div>
            </div>
            <button className="btn-log-food" onClick={handleAddFood}>
              Log Ingredient
            </button>
          </div>
        </div>
      ) : (
        <div className="quick-access-panel" style={{ marginTop: '20px' }}>
          <div className="quick-access-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '16px', marginBottom: '16px' }}>
            <button
              type="button"
              className={`quick-tab ${subTab === 'favourites' ? 'active' : ''}`}
              onClick={() => setSubTab('favourites')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: subTab === 'favourites' ? '2px solid var(--accent-color)' : '2px solid transparent',
                padding: '8px 4px',
                color: subTab === 'favourites' ? 'var(--accent-color)' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <StarIcon filled={subTab === 'favourites'} style={{ width: '16px', height: '16px' }} /> Favorites ({favourites.length})
            </button>
            <button
              type="button"
              className={`quick-tab ${subTab === 'frequent' ? 'active' : ''}`}
              onClick={() => setSubTab('frequent')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: subTab === 'frequent' ? '2px solid var(--accent-color)' : '2px solid transparent',
                padding: '8px 4px',
                color: subTab === 'frequent' ? 'var(--accent-color)' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ClockIcon style={{ width: '16px', height: '16px' }} /> Frequently Eaten ({frequentFoods.length})
            </button>
          </div>

          <div className="quick-list-container" style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {subTab === 'favourites' && (
              favourites.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '16px 0', textAlign: 'center' }}>
                  No favorite foods added yet. Search a food and tap the star icon to save it here!
                </div>
              ) : (
                favourites.map(food => (
                  <div
                    key={food.id}
                    className="dropdown-food-item"
                    onClick={() => handleSelectFood(food)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s, border-color 0.2s',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="food-name" style={{ display: 'block', fontWeight: 500, color: 'var(--heading-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{food.name}</span>
                      <span className="food-macros" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {food.calories} kcal | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g (per 100g)
                      </span>
                    </div>
                    <button
                      type="button"
                      className="fav-toggle-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleFavourite(food)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '6px',
                        cursor: 'pointer',
                      }}
                      aria-label="Remove from favorites"
                    >
                      <StarIcon filled={true} />
                    </button>
                  </div>
                ))
              )
            )}

            {subTab === 'frequent' && (
              frequentFoods.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '16px 0', textAlign: 'center' }}>
                  Frequently eaten foods will show up here as you log your meals over time.
                </div>
              ) : (
                frequentFoods.map(food => {
                  const isFav = isFavorited(food.name)
                  return (
                    <div
                      key={food.id}
                      className="dropdown-food-item"
                      onClick={() => handleSelectFood(food)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s, border-color 0.2s',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="food-name" style={{ display: 'block', fontWeight: 500, color: 'var(--heading-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{food.name}</span>
                        <span className="food-macros" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {food.calories} kcal | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g (per 100g)
                        </span>
                      </div>
                      <button
                        type="button"
                        className="fav-toggle-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleFavourite(food)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '6px',
                          cursor: 'pointer',
                        }}
                        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                      >
                        <StarIcon filled={isFav} />
                      </button>
                    </div>
                  )
                })
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
