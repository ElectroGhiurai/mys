import React from 'react'
import { FoodItem } from '../tracker.api'

interface CustomFoodsTabProps {
  customForm: {
    name: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  setCustomForm: React.Dispatch<React.SetStateAction<{
    name: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  }>>;
  formError: string | null;
  formSuccess: string | null;
  customFoods: FoodItem[];
  handleCreateCustomFood: (e: React.FormEvent) => void;
  handleSelectFood: (food: FoodItem) => void;
}

export function CustomFoodsTab({
  customForm,
  setCustomForm,
  formError,
  formSuccess,
  customFoods,
  handleCreateCustomFood,
  handleSelectFood,
}: CustomFoodsTabProps) {
  return (
    <div className="tab-custom-panel">
      {/* Create Form */}
      <form className="custom-food-form" onSubmit={handleCreateCustomFood}>
        <h3 className="form-sub-title">Create Custom Ingredient</h3>

        {formError && <div className="form-alert error">{formError}</div>}
        {formSuccess && <div className="form-alert success">{formSuccess}</div>}

        <div className="input-group">
          <label htmlFor="custom-name">Food Name</label>
          <input
            id="custom-name"
            type="text"
            className="field-input"
            placeholder="e.g. Grandma's Beef Stew"
            value={customForm.name}
            onChange={e => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className="macro-inputs-grid">
          <div className="input-group">
            <label htmlFor="custom-calories">Calories (kcal)</label>
            <input
              id="custom-calories"
              type="number"
              step="any"
              className="field-input"
              placeholder="per 100g"
              value={customForm.calories}
              onChange={e =>
                setCustomForm(prev => ({ ...prev, calories: e.target.value }))
              }
            />
          </div>
          <div className="input-group">
            <label htmlFor="custom-protein">Protein (g)</label>
            <input
              id="custom-protein"
              type="number"
              step="any"
              className="field-input"
              placeholder="per 100g"
              value={customForm.protein}
              onChange={e =>
                setCustomForm(prev => ({ ...prev, protein: e.target.value }))
              }
            />
          </div>
          <div className="input-group">
            <label htmlFor="custom-carbs">Carbs (g)</label>
            <input
              id="custom-carbs"
              type="number"
              step="any"
              className="field-input"
              placeholder="per 100g"
              value={customForm.carbs}
              onChange={e =>
                setCustomForm(prev => ({ ...prev, carbs: e.target.value }))
              }
            />
          </div>
          <div className="input-group">
            <label htmlFor="custom-fat">Fat (g)</label>
            <input
              id="custom-fat"
              type="number"
              step="any"
              className="field-input"
              placeholder="per 100g"
              value={customForm.fat}
              onChange={e => setCustomForm(prev => ({ ...prev, fat: e.target.value }))}
            />
          </div>
        </div>

        <button type="submit" className="btn-submit-custom">
          Save Food Item
        </button>
      </form>

      {/* List Custom items */}
      <div className="custom-foods-list-box">
        <h3 className="form-sub-title">Your Custom Foods</h3>
        {customFoods.length === 0 ? (
          <p className="no-items-text">No custom foods created yet.</p>
        ) : (
          <div className="custom-foods-list">
            {customFoods.map(food => (
              <div
                key={food.id}
                className="custom-food-row"
                onClick={() => handleSelectFood(food)}
              >
                <span className="custom-food-name">{food.name}</span>
                <span className="custom-food-macros">
                  {food.calories} kcal | P: {food.protein}g | C: {food.carbs}g | F:{' '}
                  {food.fat}g (per 100g)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
