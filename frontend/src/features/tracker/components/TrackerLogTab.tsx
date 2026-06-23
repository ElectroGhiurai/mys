import { RefObject } from 'react'
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
}

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
}: TrackerLogTabProps) {
  return (
    <div className="tab-search-panel">
      <div className="search-autocomplete-box" ref={dropdownRef}>
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
            {searchResults.map(food => (
              <div
                key={food.id}
                className="dropdown-food-item"
                onClick={() => handleSelectFood(food)}
              >
                <div className="food-name-row">
                  <span className="food-name">{food.name}</span>
                  {food.isCustom && <span className="custom-badge">Custom</span>}
                </div>
                <span className="food-macros">
                  {food.calories} kcal | P: {food.protein}g | C: {food.carbs}g | F:{' '}
                  {food.fat}g (per 100g)
                </span>
              </div>
            ))}
          </div>
        )}
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
        <div className="search-instruction">
          <p>Type above to look up standard ingredients or foods you created.</p>
        </div>
      )}
    </div>
  )
}
