export interface SuggestionItem {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  reason: string;
}

export interface TrackedSummary {
  name: string;
  weight: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export interface GoalTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Global target constants
export const TARGETS: GoalTargets = {
  calories: 2000,
  protein: 130,
  carbs: 220,
  fat: 70,
};

const SUGGESTION_POOL = [
  { id: 'def-chicken-breast', name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, category: 'protein' },
  { id: 'def-greek-yogurt', name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, category: 'protein' },
  { id: 'def-whey-protein', name: 'Whey Protein', calories: 400, protein: 80, carbs: 6, fat: 6, category: 'protein' },
  { id: 'def-oats', name: 'Oats', calories: 389, protein: 16.9, carbs: 66, fat: 6.9, category: 'carb' },
  { id: 'def-sweet-potato', name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, category: 'carb' },
  { id: 'def-banana', name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, category: 'carb' },
  { id: 'def-avocado', name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, category: 'fat' },
  { id: 'def-almonds', name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 49, category: 'fat' },
  { id: 'def-milk', name: 'Milk', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, category: 'dairy' },
  { id: 'def-honey', name: 'Honey', calories: 304, protein: 0.3, carbs: 82, fat: 0, category: 'sweetener' },
  { id: 'def-broccoli', name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, category: 'green' }
];

/**
 * Pure calculation logic for generating food suggestions based on currently
 * tracked ingredients and macronutrient deficits.
 */
export function getSuggestions(tracked: TrackedSummary[], targets: GoalTargets = TARGETS): SuggestionItem[] {
  if (tracked.length === 0) {
    // Standard onboarding suggestions
    return [
      { id: 'def-oats', name: 'Oats', caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66, fatPer100g: 6.9, reason: 'Great carbohydrate source to start your day.' },
      { id: 'def-chicken-breast', name: 'Chicken Breast', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, reason: 'Excellent low-fat protein option.' },
      { id: 'def-avocado', name: 'Avocado', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15, reason: 'Packed with healthy monounsaturated fats.' }
    ];
  }

  // 1. Calculate current totals
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  let hasOats = false;
  let hasChicken = false;
  let hasEggs = false;

  for (const item of tracked) {
    const wFactor = item.weight / 100;
    protein += item.proteinPer100g * wFactor;
    carbs += item.carbsPer100g * wFactor;
    fat += item.fatPer100g * wFactor;

    const lowerName = item.name.toLowerCase();
    if (lowerName.includes('oat')) hasOats = true;
    if (lowerName.includes('chicken')) hasChicken = true;
    if (lowerName.includes('egg')) hasEggs = true;
  }

  const suggestions: SuggestionItem[] = [];

  // 2. Combo-pairing suggestions (complementary rules)
  if (hasOats) {
    suggestions.push({
      id: 'def-banana',
      name: 'Banana',
      caloriesPer100g: 89,
      proteinPer100g: 1.1,
      carbsPer100g: 23,
      fatPer100g: 0.3,
      reason: 'Pairs perfectly with Oats for immediate energy.'
    });
    suggestions.push({
      id: 'def-milk',
      name: 'Milk',
      caloriesPer100g: 61,
      proteinPer100g: 3.2,
      carbsPer100g: 4.8,
      fatPer100g: 3.3,
      reason: 'Cook oats in Milk for extra creaminess and protein.'
    });
  }

  if (hasChicken) {
    suggestions.push({
      id: 'def-broccoli',
      name: 'Broccoli',
      caloriesPer100g: 34,
      proteinPer100g: 2.8,
      carbsPer100g: 7,
      fatPer100g: 0.4,
      reason: 'Broccoli provides dietary fiber and matches Chicken Breast.'
    });
  }

  if (hasEggs) {
    suggestions.push({
      id: 'def-avocado',
      name: 'Avocado',
      caloriesPer100g: 160,
      proteinPer100g: 2,
      carbsPer100g: 9,
      fatPer100g: 15,
      reason: 'Avocado adds healthy fats to complete an egg breakfast.'
    });
  }

  // 3. Deficit-based suggestions
  const pPct = protein / targets.protein;
  const cPct = carbs / targets.carbs;
  const fPct = fat / targets.fat;

  const minPct = Math.min(pPct, cPct, fPct);

  if (minPct === pPct && pPct < 1) {
    // Protein is the biggest deficit
    const pOptions = SUGGESTION_POOL.filter(f => f.category === 'protein');
    for (const opt of pOptions) {
      if (!suggestions.some(s => s.id === opt.id)) {
        suggestions.push({
          id: opt.id,
          name: opt.name,
          caloriesPer100g: opt.calories,
          proteinPer100g: opt.protein,
          carbsPer100g: opt.carbs,
          fatPer100g: opt.fat,
          reason: `High in Protein (${opt.protein}g/100g) to help hit your target.`
        });
      }
    }
  } else if (minPct === cPct && cPct < 1) {
    // Carbs is the biggest deficit
    const cOptions = SUGGESTION_POOL.filter(f => f.category === 'carb');
    for (const opt of cOptions) {
      if (!suggestions.some(s => s.id === opt.id)) {
        suggestions.push({
          id: opt.id,
          name: opt.name,
          caloriesPer100g: opt.calories,
          proteinPer100g: opt.protein,
          carbsPer100g: opt.carbs,
          fatPer100g: opt.fat,
          reason: `Good Carb source (${opt.carbs}g/100g) to replenish glycogen levels.`
        });
      }
    }
  } else if (minPct === fPct && fPct < 1) {
    // Fats is the biggest deficit
    const fOptions = SUGGESTION_POOL.filter(f => f.category === 'fat');
    for (const opt of fOptions) {
      if (!suggestions.some(s => s.id === opt.id)) {
        suggestions.push({
          id: opt.id,
          name: opt.name,
          caloriesPer100g: opt.calories,
          proteinPer100g: opt.protein,
          carbsPer100g: opt.carbs,
          fatPer100g: opt.fat,
          reason: `Rich in healthy fats (${opt.fat}g/100g) to balance your intake.`
        });
      }
    }
  }

  // Cap suggestions at 4 items
  return suggestions.slice(0, 4);
}
